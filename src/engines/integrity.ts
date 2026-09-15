import { Video, Session, Performer, Tag, WatchlistItem, CollectionSettings } from '../types';
import { 
  VALID_RESOLUTIONS, 
  VALID_SESSION_RATINGS, 
  VALID_ORGASM_STATUSES, 
  VALID_VIBES,
  VALID_WATCHLIST_STATUSES,
  KNOWN_PHYSICAL_FOLDERS,
  matchCanonicalTag
} from '../data/canonicalTags';

export type IntegritySeverity = 'error' | 'warning' | 'info';
export type IntegrityCategory = 
  | 'identity' 
  | 'relationship' 
  | 'metadata' 
  | 'vocabulary' 
  | 'collection' 
  | 'analytics';

export interface IntegrityFinding {
  id: string;
  severity: IntegritySeverity;
  category: IntegrityCategory;
  message: string;
  entityId?: string;
  entityType?: 'video' | 'session' | 'performer' | 'tag' | 'watchlist' | 'settings';
  details?: Record<string, any>;
  safeFixAvailable?: boolean;
}

export interface IntegrityReport {
  timestamp: number;
  stats: {
    totalVideos: number;
    totalSessions: number;
    totalPerformers: number;
    totalTags: number;
    totalWatchlist: number;
  };
  summary: {
    errors: number;
    warnings: number;
    info: number;
    healthy: boolean;
  };
  findings: IntegrityFinding[];
}

export interface Dataset {
  videos: Video[];
  sessions: Session[];
  performers: Performer[];
  tags: Tag[];
  watchlist: WatchlistItem[];
  settings?: CollectionSettings[];
}

/**
 * Pure function that evaluates the relational, identity, metadata, and collection
 * integrity of the entire dataset. Never silently modifies data.
 */
export function auditDataIntegrity(data: Dataset): IntegrityReport {
  const findings: IntegrityFinding[] = [];
  let findingCounter = 1;

  const addFinding = (
    severity: IntegritySeverity,
    category: IntegrityCategory,
    message: string,
    entityType?: IntegrityFinding['entityType'],
    entityId?: string,
    details?: Record<string, any>,
    safeFixAvailable?: boolean
  ) => {
    findings.push({
      id: `FND-${findingCounter++}`,
      severity,
      category,
      message,
      entityType,
      entityId,
      details,
      safeFixAvailable
    });
  };

  const { videos, sessions, performers, tags, watchlist } = data;

  const videoIdMap = new Set<string>();
  const performerIdMap = new Set<string>();
  const tagIdMap = new Set<string>();
  const sessionIdMap = new Set<string>();
  const watchlistIdMap = new Set<string>();

  const seenFilenames = new Map<string, string>(); // filename -> first video id
  const seenPaths = new Map<string, string>(); // relativePath -> first video id

  // 1. Identity & Structure: Videos
  for (const v of videos) {
    if (!v.id || typeof v.id !== 'string' || v.id.trim() === '') {
      addFinding('error', 'identity', 'Video is missing a valid stable ID.', 'video', undefined, { video: v });
    } else if (videoIdMap.has(v.id)) {
      addFinding('error', 'identity', `Duplicate Video ID detected: "${v.id}".`, 'video', v.id);
    } else {
      videoIdMap.add(v.id);
    }

    if (!v.filename || v.filename.trim() === '') {
      addFinding('error', 'collection', 'Video has an empty or missing original filename.', 'video', v.id);
    } else {
      const lowerFile = v.filename.trim().toLowerCase();
      if (seenFilenames.has(lowerFile)) {
        addFinding(
          'warning',
          'collection',
          `Duplicate original filename: "${v.filename}" appears in multiple videos.`,
          'video',
          v.id,
          { collisionWith: seenFilenames.get(lowerFile) }
        );
      } else {
        seenFilenames.set(lowerFile, v.id);
      }
    }

    if (!v.relativePath || v.relativePath.trim() === '') {
      addFinding('warning', 'collection', 'Video is missing a physical relative path.', 'video', v.id);
    } else {
      const lowerPath = v.relativePath.trim().toLowerCase();
      if (seenPaths.has(lowerPath)) {
        addFinding(
          'warning',
          'collection',
          `Duplicate physical relative path: "${v.relativePath}".`,
          'video',
          v.id,
          { collisionWith: seenPaths.get(lowerPath) }
        );
      } else {
        seenPaths.set(lowerPath, v.id);
      }
    }

    // Metadata checks
    if (v.resolution && !VALID_RESOLUTIONS.includes(v.resolution as any)) {
      addFinding(
        'warning',
        'metadata',
        `Unrecognized resolution "${v.resolution}". Expected one of: ${VALID_RESOLUTIONS.join(', ')}.`,
        'video',
        v.id,
        { resolution: v.resolution },
        true
      );
    }

    if (v.personalRating !== null && v.personalRating !== undefined) {
      if (![1, 2, 3, 4, 5].includes(v.personalRating)) {
        addFinding(
          'error',
          'metadata',
          `Invalid personal rating: ${v.personalRating}. Expected integer 1-5 or null.`,
          'video',
          v.id
        );
      }
    }

    if (v.vibe && !VALID_VIBES.includes(v.vibe as any)) {
      addFinding(
        'warning',
        'metadata',
        `Video vibe "${v.vibe}" is outside approved vocabulary.`,
        'video',
        v.id
      );
    }

    // Folder vs participant count cross-check
    if (v.folder && v.participantCount && v.folder !== 'Unknown' && v.participantCount !== 'Unknown') {
      if (v.folder.startsWith('1 Solo') && v.participantCount !== '1') {
        addFinding(
          'warning',
          'collection',
          `Folder indicates Solo ("${v.folder}") but participantCount is "${v.participantCount}".`,
          'video',
          v.id
        );
      } else if (v.folder.startsWith('2 Duo') && v.participantCount !== '2') {
        addFinding(
          'warning',
          'collection',
          `Folder indicates Duo ("${v.folder}") but participantCount is "${v.participantCount}".`,
          'video',
          v.id
        );
      }
    }

    // Vocabulary & Tag inspection
    if (v.originalTags) {
      const parts = v.originalTags.split(',').map(t => t.trim()).filter(Boolean);
      const seenOnVideo = new Set<string>();
      for (const t of parts) {
        const lower = t.toLowerCase();
        if (seenOnVideo.has(lower)) {
          addFinding('info', 'vocabulary', `Duplicate tag "${t}" in originalTags on video.`, 'video', v.id);
        }
        seenOnVideo.add(lower);

        const canonical = matchCanonicalTag(t);
        if (!canonical) {
          addFinding(
            'info',
            'vocabulary',
            `Tag "${t}" is an extensible custom tag (not in canonical 30 vocabulary).`,
            'video',
            v.id,
            { tag: t }
          );
        }
      }
    }
  }

  // 2. Performers Identity & Indexing
  for (const p of performers) {
    if (!p.id || p.id.trim() === '') {
      addFinding('error', 'identity', 'Performer is missing a valid stable ID.', 'performer');
    } else if (performerIdMap.has(p.id)) {
      addFinding('error', 'identity', `Duplicate Performer ID: "${p.id}".`, 'performer', p.id);
    } else {
      performerIdMap.add(p.id);
    }

    if (!p.name || p.name.trim() === '') {
      addFinding('warning', 'metadata', 'Performer entity has an empty name.', 'performer', p.id);
    }
  }

  // 3. Tags Identity & Indexing
  for (const t of tags) {
    if (!t.id || t.id.trim() === '') {
      addFinding('error', 'identity', 'Tag is missing a valid stable ID.', 'tag');
    } else if (tagIdMap.has(t.id)) {
      addFinding('error', 'identity', `Duplicate Tag ID: "${t.id}".`, 'tag', t.id);
    } else {
      tagIdMap.add(t.id);
    }

    if (!t.name || t.name.trim() === '') {
      addFinding('warning', 'metadata', 'Tag entity has an empty name.', 'tag', t.id);
    }
  }

  // 4. Relational Integrity: Video -> Performer & Video -> Tag
  for (const v of videos) {
    if (Array.isArray(v.performerIds)) {
      for (const pId of v.performerIds) {
        if (!performerIdMap.has(pId)) {
          addFinding(
            'error',
            'relationship',
            `Video references nonexistent performer ID "${pId}".`,
            'video',
            v.id,
            { missingPerformerId: pId }
          );
        }
      }
    }

    if (Array.isArray(v.tagIds)) {
      for (const tId of v.tagIds) {
        if (!tagIdMap.has(tId)) {
          addFinding(
            'error',
            'relationship',
            `Video references nonexistent tag ID "${tId}".`,
            'video',
            v.id,
            { missingTagId: tId }
          );
        }
      }
    }
  }

  // 5. Sessions Identity & Relational Integrity
  const now = Date.now();
  const futureThreshold = now + (24 * 60 * 60 * 1000); // 1 day in future max

  for (const s of sessions) {
    if (!s.id || s.id.trim() === '') {
      addFinding('error', 'identity', 'Session is missing a valid stable ID.', 'session');
    } else if (sessionIdMap.has(s.id)) {
      addFinding('error', 'identity', `Duplicate Session ID: "${s.id}".`, 'session', s.id);
    } else {
      sessionIdMap.add(s.id);
    }

    // Date checks
    if (!s.date || isNaN(new Date(s.date).getTime())) {
      addFinding('error', 'metadata', `Session has invalid date: "${s.date}".`, 'session', s.id);
    } else {
      const sTime = new Date(s.date).getTime();
      if (sTime > futureThreshold) {
        addFinding(
          'warning',
          'analytics',
          `Session date "${s.date}" is in the future.`,
          'session',
          s.id
        );
      }
    }

    // Rating checks
    if (s.rating !== null && s.rating !== undefined) {
      if (!VALID_SESSION_RATINGS.includes(s.rating as any)) {
        addFinding(
          'error',
          'metadata',
          `Session rating ${s.rating} is invalid. Expected 1-5 or null.`,
          'session',
          s.id
        );
      }
    }

    // Orgasm status checks
    if (s.orgasmStatus && !VALID_ORGASM_STATUSES.includes(s.orgasmStatus as any)) {
      addFinding(
        'warning',
        'metadata',
        `Session orgasm status "${s.orgasmStatus}" is outside approved vocabulary.`,
        'session',
        s.id
      );
    }

    // Vibe checks
    if (s.vibe && !VALID_VIBES.includes(s.vibe as any)) {
      addFinding(
        'warning',
        'metadata',
        `Session vibe "${s.vibe}" is outside approved vocabulary.`,
        'session',
        s.id
      );
    }

    // Duration checks
    if (s.duration !== null && s.duration !== undefined && s.duration <= 0) {
      addFinding(
        'warning',
        'metadata',
        `Session duration ${s.duration} should be a positive number of minutes.`,
        'session',
        s.id
      );
    }

    // Relational video checks
    if (!Array.isArray(s.videoIds) || s.videoIds.length === 0) {
      addFinding(
        'info',
        'relationship',
        'Session has no associated videos logged.',
        'session',
        s.id
      );
    } else {
      for (const vId of s.videoIds) {
        if (!videoIdMap.has(vId)) {
          addFinding(
            'error',
            'relationship',
            `Session references nonexistent video ID "${vId}".`,
            'session',
            s.id,
            { missingVideoId: vId }
          );
        }
      }
    }
  }

  // 6. Watchlist Identity & Relational Integrity
  for (const w of watchlist) {
    if (!w.id || w.id.trim() === '') {
      addFinding('error', 'identity', 'Watchlist item is missing a valid stable ID.', 'watchlist');
    } else if (watchlistIdMap.has(w.id)) {
      addFinding('error', 'identity', `Duplicate Watchlist ID: "${w.id}".`, 'watchlist', w.id);
    } else {
      watchlistIdMap.add(w.id);
    }

    if (!w.videoId || !videoIdMap.has(w.videoId)) {
      addFinding(
        'error',
        'relationship',
        `Watchlist item references nonexistent video ID "${w.videoId}".`,
        'watchlist',
        w.id,
        { missingVideoId: w.videoId }
      );
    }

    if (w.status && !VALID_WATCHLIST_STATUSES.includes(w.status as any)) {
      addFinding(
        'warning',
        'metadata',
        `Watchlist item status "${w.status}" is outside approved vocabulary (${VALID_WATCHLIST_STATUSES.join(', ')}).`,
        'watchlist',
        w.id
      );
    }
  }

  const errors = findings.filter(f => f.severity === 'error').length;
  const warnings = findings.filter(f => f.severity === 'warning').length;
  const info = findings.filter(f => f.severity === 'info').length;

  return {
    timestamp: Date.now(),
    stats: {
      totalVideos: videos.length,
      totalSessions: sessions.length,
      totalPerformers: performers.length,
      totalTags: tags.length,
      totalWatchlist: watchlist.length
    },
    summary: {
      errors,
      warnings,
      info,
      healthy: errors === 0
    },
    findings
  };
}
