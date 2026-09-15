import { v4 as uuidv4 } from 'uuid';
import { Video, Performer, Tag } from '../types';
import { 
  CANONICAL_30_TAGS, 
  classifyTagMatch, 
  VALID_RESOLUTIONS, 
  KNOWN_PHYSICAL_FOLDERS 
} from '../data/canonicalTags';
import { normalizeResolution } from './parser';
import { Storage } from '../storage/db';

export interface DuplicateCandidate {
  type: 'exact-path' | 'exact-filename' | 'performer-title-collision';
  severity: 'critical' | 'warning';
  message: string;
  indices: [number, number];
  records: [Partial<Video>, Partial<Video>];
}

export interface MismatchFinding {
  id: string;
  filename: string;
  folder: string;
  participantCount: string;
  performerCount: number;
  performerDisplay: string;
  reason: string;
}

export interface ResearchNeededItem {
  id: string;
  filename: string;
  reason: string;
  missingFields: string[];
}

export interface ReconciliationReport {
  collection: {
    sourceRecordCount: number;
    candidateCount: number;
    duplicateCandidateCount: number;
    unparseableCount: number;
  };
  physical: {
    folderDistribution: Record<string, number>;
    participantCountDistribution: Record<string, number>;
    resolutionDistribution: Record<string, number>;
    unknownResolutionCount: number;
    missingPathCount: number;
  };
  performers: {
    uniqueRawPerformerStrings: number;
    uniqueNormalizedPerformers: number;
    unknownPerformerCount: number;
    performers: Performer[];
  };
  tags: {
    totalRawTagOccurrences: number;
    canonicalTagMatches: Record<string, number>;
    customTagCount: number;
    customTags: Tag[];
    uncertainTagCount: number;
    uncertainTags: { raw: string; reason: string }[];
  };
  titles: {
    totalTitles: number;
    researchNeededCount: number;
    researchNeededList: ResearchNeededItem[];
  };
  dataQuality: {
    participantFolderMismatches: MismatchFinding[];
    duplicateCandidates: DuplicateCandidate[];
    provenanceCounts: {
      raw: number;
      parsed: number;
      researchConfirmed: number;
      userConfirmed: number;
    };
  };
}

export interface ReconciliationResult {
  videos: Video[];
  performers: Performer[];
  tags: Tag[];
  report: ReconciliationReport;
  datasetType: 'real' | 'seed';
}

/**
 * Parses a single raw physical file path entry from the T9 file inventory.
 * Preserves exact filename and relativePath without mutation.
 */
export function parseInventoryEntry(
  rawLine: string, 
  datasetType: 'real' | 'seed' = 'real'
): { video?: Video; error?: string } {
  const line = rawLine.trim();
  if (!line || line.startsWith('#') || line.startsWith('//')) {
    return { error: 'Empty or commented line' };
  }

  // Preserve original relative path starting from XXX if prefixed with drive name
  let relativePath = line;
  const xxxIndex = line.indexOf('XXX/');
  if (xxxIndex !== -1) {
    relativePath = line.substring(xxxIndex);
  }

  // Filename is the terminal path segment
  const pathSegments = relativePath.split('/');
  const filename = pathSegments[pathSegments.length - 1];
  if (!filename) {
    return { error: 'No filename found in path' };
  }

  // Resolution parsing: extract text inside trailing square brackets
  let originalResolution = 'Unknown';
  let resolution = 'Unknown';
  const bracketMatch = filename.match(/\[(.*?)\]/);
  if (bracketMatch) {
    originalResolution = bracketMatch[1].trim();
    resolution = normalizeResolution(originalResolution);
  }

  // Split convention: Performers | Descriptive Title | Key Tags [Resolution]
  const withoutResolution = filename.replace(/\[.*?\]/, '').trim();
  const parts = withoutResolution.split('|').map(p => p.trim());

  let performerDisplay = 'Unknown';
  let title = filename;
  let originalTags = '';

  if (parts.length >= 3) {
    performerDisplay = parts[0] || 'Unknown';
    title = parts[1] || filename;
    originalTags = parts[2] || '';
  } else if (parts.length === 2) {
    performerDisplay = parts[0] || 'Unknown';
    title = parts[1] || filename;
  } else if (parts.length === 1) {
    title = parts[0] || filename;
  }

  // Derive participant count and physical folder from path segments
  let participantCount = 'Unknown';
  let folder = 'Unknown';

  for (const seg of pathSegments) {
    if (seg.startsWith('0 ') || seg === '0 Favorites') participantCount = 'Favorites';
    else if (seg === '1' || seg === '1 Solo' || seg.startsWith('1/')) participantCount = '1';
    else if (seg === '2' || seg === '2 Duo' || seg.startsWith('2/')) participantCount = '2';
    else if (seg === '3' || seg === '3 Threesome' || seg.startsWith('3/')) participantCount = '3';
    else if (seg.startsWith('4(+)') || seg === '4(+)' || seg.startsWith('4(+) Group')) participantCount = '4(+)';
  }

  // Immediate parent folder
  if (pathSegments.length >= 2) {
    folder = pathSegments[pathSegments.length - 2];
  }

  // Conservative tag extraction
  const tagParts = originalTags ? originalTags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const tagIds: string[] = [];
  const flags: string[] = [];

  for (const rawTag of tagParts) {
    const classification = classifyTagMatch(rawTag);
    if (classification.matchType === 'explicit' || classification.matchType === 'strongly-inferred') {
      const norm = classification.canonicalTag!.name.toLowerCase();
      const id = `TAG-${norm.replace(/[^a-z0-9]/g, '-')}`;
      if (!tagIds.includes(id)) tagIds.push(id);
    } else if (classification.matchType === 'uncertain') {
      flags.push(`uncertain-tag:${rawTag}`);
    } else {
      // Custom tag
      const norm = rawTag.toLowerCase();
      const id = `TAG-custom-${norm.replace(/[^a-z0-9]/g, '-')}`;
      if (!tagIds.includes(id)) tagIds.push(id);
    }
  }

  // Performers extraction
  const performerIds: string[] = [];
  if (performerDisplay && performerDisplay.toLowerCase() !== 'unknown') {
    const rawPerfs = performerDisplay
      .split(/[,&/]| and /i)
      .map(p => p.trim())
      .filter(p => p && p.toLowerCase() !== 'unknown');

    for (const rawP of rawPerfs) {
      const norm = rawP.toLowerCase();
      const id = `PERF-${norm.replace(/[^a-z0-9]/g, '-')}`;
      if (!performerIds.includes(id)) performerIds.push(id);
    }
  } else {
    flags.push('unknown-performer');
  }

  // Mismatch detection: participant count vs folder or performer count
  const perfCount = performerIds.length;
  if (participantCount === '1' && perfCount > 1) {
    flags.push('participant-folder-mismatch');
  } else if (participantCount === '2' && perfCount > 2) {
    flags.push('participant-folder-mismatch');
  } else if (participantCount === '3' && perfCount > 3) {
    flags.push('participant-folder-mismatch');
  }

  if (performerDisplay === 'Unknown' || !performerDisplay) {
    flags.push('research-needed');
  }

  const now = Date.now();
  const stableId = `T9-${uuidv4()}`;

  const video: Video = {
    id: stableId,
    filename,
    relativePath,
    participantCount,
    folder,
    performerIds,
    performerDisplay,
    title,
    tagIds,
    originalTags,
    resolution,
    originalResolution,
    source: 'Unknown',
    duration: null,
    dateAdded: new Date().toISOString().split('T')[0],
    personalRating: null,
    vibe: '',
    status: 'Active',
    notes: '',
    createdAt: now,
    updatedAt: now,
    datasetType,
    flags,
    provenance: {
      performers: {
        level: 'parsed',
        source: 'filename',
        confidence: performerDisplay === 'Unknown' ? 'low' : 'medium'
      },
      title: {
        level: 'parsed',
        source: 'filename',
        confidence: 'medium'
      },
      tags: {
        level: 'parsed',
        source: 'filename',
        confidence: 'medium'
      },
      resolution: {
        level: 'parsed',
        source: 'filename',
        confidence: resolution === 'Unknown' ? 'low' : 'high'
      }
    }
  };

  return { video };
}

/**
 * Analyzes candidate videos to detect exact duplicate paths, filenames, or performer/title collisions.
 */
export function detectDuplicates(videos: Video[]): DuplicateCandidate[] {
  const duplicates: DuplicateCandidate[] = [];
  const pathMap = new Map<string, number>();
  const filenameMap = new Map<string, number>();
  const collisionMap = new Map<string, number>();

  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];

    // 1. Exact relative path duplicate
    if (v.relativePath) {
      const normPath = v.relativePath.toLowerCase();
      if (pathMap.has(normPath)) {
        const prevIdx = pathMap.get(normPath)!;
        duplicates.push({
          type: 'exact-path',
          severity: 'critical',
          message: `Exact relative path duplicate: "${v.relativePath}"`,
          indices: [prevIdx, i],
          records: [videos[prevIdx], v]
        });
      } else {
        pathMap.set(normPath, i);
      }
    }

    // 2. Exact filename duplicate in different folders
    if (v.filename) {
      const normFn = v.filename.toLowerCase();
      if (filenameMap.has(normFn)) {
        const prevIdx = filenameMap.get(normFn)!;
        // If not already flagged as exact path duplicate
        if (videos[prevIdx].relativePath !== v.relativePath) {
          duplicates.push({
            type: 'exact-filename',
            severity: 'warning',
            message: `Identical filename across different folders: "${v.filename}"`,
            indices: [prevIdx, i],
            records: [videos[prevIdx], v]
          });
        }
      } else {
        filenameMap.set(normFn, i);
      }
    }

    // 3. Performer + Title collision
    if (v.title && v.performerDisplay && v.performerDisplay !== 'Unknown') {
      const collisionKey = `${v.performerDisplay.toLowerCase()}|${v.title.toLowerCase()}`;
      if (collisionMap.has(collisionKey)) {
        const prevIdx = collisionMap.get(collisionKey)!;
        if (videos[prevIdx].relativePath !== v.relativePath && videos[prevIdx].filename !== v.filename) {
          duplicates.push({
            type: 'performer-title-collision',
            severity: 'warning',
            message: `Same performers and descriptive title: "${v.performerDisplay} | ${v.title}"`,
            indices: [prevIdx, i],
            records: [videos[prevIdx], v]
          });
        }
      } else {
        collisionMap.set(collisionKey, i);
      }
    }
  }

  return duplicates;
}

/**
 * Previews ingestion of raw inventory lines without committing to storage.
 * Generates the authoritative Pre-Commit Reconciliation Report.
 */
export function previewIngestion(
  rawInput: string | string[], 
  datasetType: 'real' | 'seed' = 'real'
): ReconciliationResult {
  const lines = Array.isArray(rawInput) 
    ? rawInput 
    : rawInput.split('\n');

  const candidateVideos: Video[] = [];
  let unparseableCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const { video, error } = parseInventoryEntry(trimmed, datasetType);
    if (video) {
      candidateVideos.push(video);
    } else {
      unparseableCount++;
    }
  }

  // Detect duplicate candidates
  const duplicateCandidates = detectDuplicates(candidateVideos);

  // Build performer entities and deduplicate
  const performerMap = new Map<string, Performer>();
  let uniqueRawPerformerStrings = 0;
  const seenRawPerfs = new Set<string>();

  for (const v of candidateVideos) {
    if (v.performerDisplay) {
      if (!seenRawPerfs.has(v.performerDisplay)) {
        seenRawPerfs.add(v.performerDisplay);
        uniqueRawPerformerStrings++;
      }
      const rawPerfs = v.performerDisplay
        .split(/[,&/]| and /i)
        .map(p => p.trim())
        .filter(p => p && p.toLowerCase() !== 'unknown');

      for (const raw of rawPerfs) {
        const norm = raw.toLowerCase();
        if (!performerMap.has(norm)) {
          performerMap.set(norm, {
            id: `PERF-${norm.replace(/[^a-z0-9]/g, '-')}`,
            name: raw,
            normalizedName: norm,
            createdAt: Date.now()
          });
        }
      }
    }
  }

  // Build tags (canonical + custom)
  const canonicalTagMatches: Record<string, number> = {};
  const customTagMap = new Map<string, Tag>();
  const uncertainTagsList: { raw: string; reason: string }[] = [];
  let totalRawTagOccurrences = 0;

  for (const v of candidateVideos) {
    if (v.originalTags) {
      const parts = v.originalTags.split(',').map(t => t.trim()).filter(Boolean);
      totalRawTagOccurrences += parts.length;

      for (const raw of parts) {
        const classification = classifyTagMatch(raw);
        if (classification.matchType === 'explicit' || classification.matchType === 'strongly-inferred') {
          const cName = classification.canonicalTag!.name;
          canonicalTagMatches[cName] = (canonicalTagMatches[cName] || 0) + 1;
        } else if (classification.matchType === 'uncertain') {
          uncertainTagsList.push({ raw, reason: classification.reason });
        } else {
          const norm = raw.toLowerCase();
          if (!customTagMap.has(norm)) {
            customTagMap.set(norm, {
              id: `TAG-custom-${norm.replace(/[^a-z0-9]/g, '-')}`,
              name: raw,
              normalizedName: norm,
              category: 'General',
              isCanonical: false,
              createdAt: Date.now()
            });
          }
        }
      }
    }
  }

  // Physical distributions
  const folderDistribution: Record<string, number> = {};
  const participantCountDistribution: Record<string, number> = {};
  const resolutionDistribution: Record<string, number> = {};
  let unknownResolutionCount = 0;
  let missingPathCount = 0;

  // Research needed and mismatch findings
  const researchNeededList: ResearchNeededItem[] = [];
  const participantFolderMismatches: MismatchFinding[] = [];

  for (const v of candidateVideos) {
    folderDistribution[v.folder] = (folderDistribution[v.folder] || 0) + 1;
    participantCountDistribution[v.participantCount] = (participantCountDistribution[v.participantCount] || 0) + 1;
    resolutionDistribution[v.resolution] = (resolutionDistribution[v.resolution] || 0) + 1;

    if (v.resolution === 'Unknown') unknownResolutionCount++;
    if (!v.relativePath || v.relativePath === 'Unknown') missingPathCount++;

    if (v.flags?.includes('research-needed') || v.flags?.includes('unknown-performer')) {
      researchNeededList.push({
        id: v.id,
        filename: v.filename,
        reason: v.performerDisplay === 'Unknown' ? 'Performer identity unknown' : 'Incomplete metadata',
        missingFields: v.performerDisplay === 'Unknown' ? ['performer'] : []
      });
    }

    if (v.flags?.includes('participant-folder-mismatch')) {
      participantFolderMismatches.push({
        id: v.id,
        filename: v.filename,
        folder: v.folder,
        participantCount: v.participantCount,
        performerCount: v.performerIds.length,
        performerDisplay: v.performerDisplay,
        reason: `Folder indicates ${v.folder} / ${v.participantCount} participant(s), but ${v.performerIds.length} performer(s) parsed.`
      });
    }
  }

  const report: ReconciliationReport = {
    collection: {
      sourceRecordCount: lines.length,
      candidateCount: candidateVideos.length,
      duplicateCandidateCount: duplicateCandidates.length,
      unparseableCount
    },
    physical: {
      folderDistribution,
      participantCountDistribution,
      resolutionDistribution,
      unknownResolutionCount,
      missingPathCount
    },
    performers: {
      uniqueRawPerformerStrings,
      uniqueNormalizedPerformers: performerMap.size,
      unknownPerformerCount: candidateVideos.filter(v => v.performerDisplay === 'Unknown').length,
      performers: Array.from(performerMap.values())
    },
    tags: {
      totalRawTagOccurrences,
      canonicalTagMatches,
      customTagCount: customTagMap.size,
      customTags: Array.from(customTagMap.values()),
      uncertainTagCount: uncertainTagsList.length,
      uncertainTags: uncertainTagsList
    },
    titles: {
      totalTitles: candidateVideos.length,
      researchNeededCount: researchNeededList.length,
      researchNeededList
    },
    dataQuality: {
      participantFolderMismatches,
      duplicateCandidates,
      provenanceCounts: {
        raw: candidateVideos.length,
        parsed: candidateVideos.length,
        researchConfirmed: 0,
        userConfirmed: 0
      }
    }
  };

  return {
    videos: candidateVideos,
    performers: Array.from(performerMap.values()),
    tags: Array.from(customTagMap.values()),
    report,
    datasetType
  };
}

/**
 * Commits a reconciled dataset into IndexedDB.
 * Preserves existing sessions, watchlist, and custom user notes.
 */
export async function commitReconciledDataset(
  result: ReconciliationResult
): Promise<{ videosSaved: number; performersSaved: number; tagsSaved: number }> {
  // Ensure canonical tags exist first
  const existingTags = await Storage.getTags();
  const existingTagMap = new Map<string, Tag>();
  for (const t of existingTags) existingTagMap.set(t.normalizedName, t);

  // Save new custom tags
  let tagsSaved = 0;
  for (const t of result.tags) {
    if (!existingTagMap.has(t.normalizedName)) {
      await Storage.saveTag(t);
      existingTagMap.set(t.normalizedName, t);
      tagsSaved++;
    }
  }

  // Save performers
  const existingPerformers = await Storage.getPerformers();
  const existingPerfMap = new Map<string, Performer>();
  for (const p of existingPerformers) existingPerfMap.set(p.normalizedName, p);

  let performersSaved = 0;
  for (const p of result.performers) {
    if (!existingPerfMap.has(p.normalizedName)) {
      await Storage.savePerformer(p);
      existingPerfMap.set(p.normalizedName, p);
      performersSaved++;
    }
  }

  // Save videos
  let videosSaved = 0;
  for (const v of result.videos) {
    await Storage.saveVideo(v);
    videosSaved++;
  }

  return { videosSaved, performersSaved, tagsSaved };
}
