import { v4 as uuidv4 } from 'uuid';
import { Video, Tag, Performer } from '../types';
import { matchCanonicalTag, CANONICAL_30_TAGS } from '../data/canonicalTags';

export function parseFilename(filename: string, relativePath: string): Partial<Video> {
  let performerDisplay = '';
  let title = '';
  let originalTags = '';
  let originalResolution = 'Unknown';
  let resolution = 'Unknown';
  
  // Example filename: Performers | Descriptive Title | Key Tags [Resolution]
  const bracketMatch = filename.match(/\[(.*?)\]/);
  if (bracketMatch) {
    originalResolution = bracketMatch[1];
    resolution = normalizeResolution(originalResolution);
  }
  
  const withoutResolution = filename.replace(/\[.*?\]/, '').trim();
  const parts = withoutResolution.split('|').map(p => p.trim());
  
  if (parts.length >= 1) {
    performerDisplay = parts[0];
  }
  if (parts.length >= 2) {
    title = parts[1];
  }
  if (parts.length >= 3) {
    originalTags = parts[2];
  }

  // Derive participant count from path
  let participantCount = 'Unknown';
  const pathParts = relativePath.split('/');
  for (const part of pathParts) {
    if (part.startsWith('0 ') || part === '0 Favorites') participantCount = 'Favorites';
    else if (part === '1' || part === '1 Solo') participantCount = '1';
    else if (part === '2' || part === '2 Duo') participantCount = '2';
    else if (part === '3' || part === '3 Threesome') participantCount = '3';
    else if (part === '4(+)' || part.startsWith('4(+)')) participantCount = '4(+)';
  }

  // Derive folder (the immediate parent folder in the relative path)
  let folder = 'Unknown';
  if (pathParts.length >= 2) {
    folder = pathParts[pathParts.length - 2];
  }

  return {
    performerDisplay,
    title,
    originalTags,
    originalResolution,
    resolution,
    participantCount,
    folder,
  };
}

export function normalizeResolution(res: string): string {
  const lower = res.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (lower.includes('480')) return '480p';
  if (lower.includes('720') || lower === 'hd') return '720p';
  if (lower.includes('1080') || lower === 'fhd') return '1080p';
  if (lower.includes('1440') || lower === '2k') return '1440p';
  if (lower.includes('2160') || lower === '4k') return '2160p';
  return 'Unknown';
}

/**
 * Extracts normalized Tag entities and their IDs from raw tag text.
 */
export function extractTagsFromText(originalTags: string): { tagIds: string[]; tags: Tag[] } {
  if (!originalTags || !originalTags.trim()) {
    return { tagIds: [], tags: [] };
  }

  const parts = originalTags.split(',').map(p => p.trim()).filter(Boolean);
  const tagIds: string[] = [];
  const tags: Tag[] = [];
  const seenNorms = new Set<string>();

  for (const raw of parts) {
    const canonical = matchCanonicalTag(raw);
    const displayName = canonical ? canonical.name : raw;
    const norm = displayName.toLowerCase();

    if (seenNorms.has(norm)) continue;
    seenNorms.add(norm);

    const id = canonical 
      ? `TAG-${norm.replace(/[^a-z0-9]/g, '-')}`
      : `TAG-custom-${norm.replace(/[^a-z0-9]/g, '-')}`;

    tagIds.push(id);
    tags.push({
      id,
      name: displayName,
      normalizedName: norm,
      category: canonical ? canonical.category : 'General',
      isCanonical: !!canonical,
      synonyms: canonical?.synonyms,
      createdAt: Date.now()
    });
  }

  return { tagIds, tags };
}

/**
 * Extracts normalized Performer entities and their IDs from raw performer display text.
 */
export function extractPerformersFromText(performerDisplay: string): { performerIds: string[]; performers: Performer[] } {
  if (!performerDisplay || !performerDisplay.trim()) {
    return { performerIds: [], performers: [] };
  }

  const parts = performerDisplay
    .split(/[,&/]| and /i)
    .map(p => p.trim())
    .filter(p => p && p.toLowerCase() !== 'unknown');

  const performerIds: string[] = [];
  const performers: Performer[] = [];
  const seenNorms = new Set<string>();

  for (const raw of parts) {
    const norm = raw.toLowerCase();
    if (seenNorms.has(norm)) continue;
    seenNorms.add(norm);

    const id = `PERF-${norm.replace(/[^a-z0-9]/g, '-')}`;
    performerIds.push(id);
    performers.push({
      id,
      name: raw,
      normalizedName: norm,
      createdAt: Date.now()
    });
  }

  return { performerIds, performers };
}

export function createNewVideo(filename: string, relativePath: string, overrides: Partial<Video> = {}): Video {
  const parsed = parseFilename(filename, relativePath);
  const now = Date.now();
  
  const rawTags = overrides.originalTags !== undefined ? overrides.originalTags : (parsed.originalTags || '');
  const rawPerfs = overrides.performerDisplay !== undefined ? overrides.performerDisplay : (parsed.performerDisplay || '');

  const extractedTags = extractTagsFromText(rawTags);
  const extractedPerfs = extractPerformersFromText(rawPerfs);

  return {
    id: `T9-${uuidv4()}`,
    filename,
    relativePath,
    participantCount: parsed.participantCount || 'Unknown',
    folder: parsed.folder || 'Unknown',
    performerIds: overrides.performerIds || extractedPerfs.performerIds,
    performerDisplay: rawPerfs,
    title: parsed.title || filename,
    tagIds: overrides.tagIds || extractedTags.tagIds,
    originalTags: rawTags,
    resolution: parsed.resolution || 'Unknown',
    originalResolution: parsed.originalResolution || 'Unknown',
    source: 'Unknown',
    duration: null,
    dateAdded: new Date().toISOString().split('T')[0],
    personalRating: null,
    vibe: '',
    status: 'Active',
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}
