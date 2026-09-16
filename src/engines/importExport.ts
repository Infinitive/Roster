import { Video, Session, Performer, Tag, WatchlistItem, CollectionSettings } from '../types';
import { Storage } from '../storage/db';
import { CURRENT_SCHEMA_VERSION, migrateDataset } from '../storage/migrations';
import { auditDataIntegrity, IntegrityFinding, IntegrityReport } from './integrity';
import { CANONICAL_30_TAGS } from '../data/canonicalTags';

export interface ExportData {
  schemaVersion: number;
  exportedAt: string;
  app: string;
  videos: Video[];
  sessions: Session[];
  performers: Performer[];
  tags: Tag[];
  watchlist: WatchlistItem[];
  settings: CollectionSettings[];
}

export interface ImportValidationResult {
  isValid: boolean;
  canProceed: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    videos: number;
    sessions: number;
    performers: number;
    tags: number;
    watchlist: number;
  };
  report?: IntegrityReport;
  normalizedData?: ExportData;
  originalVersion?: number;
  schemaVersion?: number;
}

export interface ImportResult {
  success: boolean;
  mode: 'replace' | 'merge';
  stats: {
    videosAdded: number;
    videosUpdated: number;
    sessionsAdded: number;
    sessionsUpdated: number;
    performersAdded: number;
    tagsAdded: number;
    watchlistAdded: number;
  };
  errors: string[];
  warnings: string[];
}

export const ImportExport = {
  /**
   * Generates a complete, canonical, portable JSON export of the entire registry state.
   */
  async exportData(): Promise<string> {
    const all = await Storage.getAllData();
    const data: ExportData = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      app: 'T9 Collection Registry',
      videos: all.videos,
      sessions: all.sessions,
      performers: all.performers,
      tags: all.tags,
      watchlist: all.watchlist,
      settings: all.settings
    };
    return JSON.stringify(data, null, 2);
  },

  /**
   * Step 1-3: Parses, migrates, and validates imported JSON data before any commit.
   */
  validateImportData(rawJson: string): ImportValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Parse JSON
    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch (err: any) {
      return {
        isValid: false,
        canProceed: false,
        errors: [`JSON syntax error: ${err?.message || 'Malformed JSON string'}`],
        warnings: [],
        stats: { videos: 0, sessions: 0, performers: 0, tags: 0, watchlist: 0 }
      };
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        isValid: false,
        canProceed: false,
        errors: ['Import root must be a valid JSON object.'],
        warnings: [],
        stats: { videos: 0, sessions: 0, performers: 0, tags: 0, watchlist: 0 }
      };
    }

    // 2. Migration & Schema Version verification
    let migratedData: any;
    let originalVersion = 1;
    try {
      const migrationResult = migrateDataset(parsed);
      migratedData = migrationResult.data;
      originalVersion = migrationResult.originalVersion;
      if (migrationResult.migrated) {
        warnings.push(`Dataset migrated from schema version ${originalVersion} to version ${CURRENT_SCHEMA_VERSION}.`);
      }
    } catch (err: any) {
      return {
        isValid: false,
        canProceed: false,
        errors: [err.message || 'Schema version migration failed.'],
        warnings,
        stats: { videos: 0, sessions: 0, performers: 0, tags: 0, watchlist: 0 }
      };
    }

    // 3. Top-level array assertions and normalization
    migratedData.videos = Array.isArray(migratedData.videos) ? migratedData.videos : [];
    migratedData.sessions = Array.isArray(migratedData.sessions) ? migratedData.sessions : [];
    migratedData.performers = Array.isArray(migratedData.performers) ? migratedData.performers : [];
    migratedData.tags = Array.isArray(migratedData.tags) ? migratedData.tags : [];
    migratedData.watchlist = Array.isArray(migratedData.watchlist) ? migratedData.watchlist : [];
    migratedData.settings = Array.isArray(migratedData.settings) ? migratedData.settings : [];

    // Ensure all canonical tags exist in the tag list
    const existingTagIds = new Set(migratedData.tags.map((t: Tag) => t?.id).filter(Boolean));
    for (const def of CANONICAL_30_TAGS) {
      const tagId = `TAG-${def.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      if (!existingTagIds.has(tagId)) {
        migratedData.tags.push({
          id: tagId,
          name: def.name,
          normalizedName: def.name.toLowerCase(),
          category: def.category,
          isCanonical: true,
          synonyms: def.synonyms,
          createdAt: Date.now()
        });
        existingTagIds.add(tagId);
      }
    }

    // Auto-heal any missing performer or tag entities referenced in videos
    const existingPerfIds = new Set(migratedData.performers.map((p: Performer) => p?.id).filter(Boolean));
    for (const v of migratedData.videos) {
      if (Array.isArray(v.performerIds)) {
        for (const pId of v.performerIds) {
          if (pId && !existingPerfIds.has(pId)) {
            const rawName = pId.replace(/^PERF-/, '').replace(/-/g, ' ');
            const capName = rawName.replace(/\b\w/g, (c: string) => c.toUpperCase());
            migratedData.performers.push({
              id: pId,
              name: v.performerDisplay || capName,
              normalizedName: (v.performerDisplay || capName).toLowerCase(),
              createdAt: Date.now()
            });
            existingPerfIds.add(pId);
          }
        }
      }
      if (Array.isArray(v.tagIds)) {
        for (const tId of v.tagIds) {
          if (tId && !existingTagIds.has(tId)) {
            const rawName = tId.replace(/^TAG-/, '').replace(/-/g, ' ');
            const capName = rawName.replace(/\b\w/g, (c: string) => c.toUpperCase());
            migratedData.tags.push({
              id: tId,
              name: capName,
              normalizedName: capName.toLowerCase(),
              category: 'General',
              isCanonical: false,
              createdAt: Date.now()
            });
            existingTagIds.add(tId);
          }
        }
      }
    }

    // 4. Relational & Identity Integrity Audit
    const audit = auditDataIntegrity({
      videos: migratedData.videos,
      sessions: migratedData.sessions,
      performers: migratedData.performers,
      tags: migratedData.tags,
      watchlist: migratedData.watchlist,
      settings: migratedData.settings
    });

    const criticalErrors = audit.findings
      .filter(f => f.severity === 'error')
      .map(f => f.message);

    const auditWarnings = audit.findings
      .filter(f => f.severity === 'warning')
      .map(f => f.message);

    warnings.push(...auditWarnings.slice(0, 10));
    if (auditWarnings.length > 10) {
      warnings.push(`...and ${auditWarnings.length - 10} additional warnings.`);
    }

    if (criticalErrors.length > 0) {
      warnings.push(...criticalErrors.slice(0, 10));
    }

    const canProceed = migratedData.videos.length > 0 || parsed.counts?.videos > 0 || errors.length === 0;

    const stats = {
      videos: migratedData.videos.length,
      sessions: migratedData.sessions.length,
      performers: migratedData.performers.length,
      tags: migratedData.tags.length,
      watchlist: migratedData.watchlist.length
    };

    const normalized: ExportData = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: migratedData.exportedAt || new Date().toISOString(),
      app: 'ROSTER Registry',
      videos: migratedData.videos,
      sessions: migratedData.sessions,
      performers: migratedData.performers,
      tags: migratedData.tags,
      watchlist: migratedData.watchlist,
      settings: Array.isArray(migratedData.settings) ? migratedData.settings : []
    };

    return {
      isValid: errors.length === 0,
      canProceed,
      errors,
      warnings,
      stats,
      report: audit,
      normalizedData: normalized,
      originalVersion,
      schemaVersion: CURRENT_SCHEMA_VERSION
    };
  },

  /**
   * Commits the validated dataset in REPLACE mode.
   * Atomically replaces all local data.
   */
  async importReplace(data: ExportData): Promise<ImportResult> {
    const stats = {
      videosAdded: data.videos.length,
      videosUpdated: 0,
      sessionsAdded: data.sessions.length,
      sessionsUpdated: 0,
      performersAdded: data.performers.length,
      tagsAdded: data.tags.length,
      watchlistAdded: data.watchlist.length
    };

    await Storage.clearAll();

    const db = await (await import('../storage/db')).getDB();
    const tx = db.transaction(
      ['videos', 'sessions', 'performers', 'tags', 'watchlist', 'settings'],
      'readwrite'
    );

    for (const v of data.videos) await tx.objectStore('videos').put(v);
    for (const s of data.sessions) await tx.objectStore('sessions').put(s);
    for (const p of data.performers) await tx.objectStore('performers').put(p);
    for (const t of data.tags) await tx.objectStore('tags').put(t);
    for (const w of data.watchlist) await tx.objectStore('watchlist').put(w);
    for (const s of data.settings) await tx.objectStore('settings').put(s);

    await tx.done;

    return {
      success: true,
      mode: 'replace',
      stats,
      errors: [],
      warnings: []
    };
  },

  /**
   * Commits the validated dataset in MERGE mode.
   * Non-destructively merges records while preserving stable IDs and relationship coherence.
   */
  async importMerge(incoming: ExportData): Promise<ImportResult> {
    const existing = await Storage.getAllData();
    const stats = {
      videosAdded: 0,
      videosUpdated: 0,
      sessionsAdded: 0,
      sessionsUpdated: 0,
      performersAdded: 0,
      tagsAdded: 0,
      watchlistAdded: 0
    };

    const db = await (await import('../storage/db')).getDB();
    const tx = db.transaction(
      ['videos', 'sessions', 'performers', 'tags', 'watchlist', 'settings'],
      'readwrite'
    );

    // 1. Merge Performers (match by normalizedName or ID)
    const existingPerfByNorm = new Map<string, Performer>();
    const existingPerfById = new Map<string, Performer>();
    for (const p of existing.performers) {
      existingPerfByNorm.set(p.normalizedName, p);
      existingPerfById.set(p.id, p);
    }

    const incomingPerfIdRemap = new Map<string, string>(); // incomingId -> targetId
    for (const incP of incoming.performers) {
      const match = existingPerfByNorm.get(incP.normalizedName) || existingPerfById.get(incP.id);
      if (match) {
        incomingPerfIdRemap.set(incP.id, match.id);
      } else {
        await tx.objectStore('performers').put(incP);
        existingPerfByNorm.set(incP.normalizedName, incP);
        existingPerfById.set(incP.id, incP);
        incomingPerfIdRemap.set(incP.id, incP.id);
        stats.performersAdded++;
      }
    }

    // 2. Merge Tags (match by normalizedName or ID)
    const existingTagByNorm = new Map<string, Tag>();
    const existingTagById = new Map<string, Tag>();
    for (const t of existing.tags) {
      existingTagByNorm.set(t.normalizedName, t);
      existingTagById.set(t.id, t);
    }

    const incomingTagIdRemap = new Map<string, string>();
    for (const incT of incoming.tags) {
      const match = existingTagByNorm.get(incT.normalizedName) || existingTagById.get(incT.id);
      if (match) {
        incomingTagIdRemap.set(incT.id, match.id);
      } else {
        await tx.objectStore('tags').put(incT);
        existingTagByNorm.set(incT.normalizedName, incT);
        existingTagById.set(incT.id, incT);
        incomingTagIdRemap.set(incT.id, incT.id);
        stats.tagsAdded++;
      }
    }

    // 3. Merge Videos (match by stable ID, fallback to exact filename/path match)
    const existingVideoById = new Map<string, Video>();
    const existingVideoByPath = new Map<string, Video>();
    for (const v of existing.videos) {
      existingVideoById.set(v.id, v);
      if (v.relativePath) existingVideoByPath.set(v.relativePath.toLowerCase(), v);
      else if (v.filename) existingVideoByPath.set(v.filename.toLowerCase(), v);
    }

    const incomingVideoIdRemap = new Map<string, string>();

    for (const incV of incoming.videos) {
      // Re-map performer and tag IDs
      const remappedPerformerIds = (incV.performerIds || []).map(pId => incomingPerfIdRemap.get(pId) || pId);
      const remappedTagIds = (incV.tagIds || []).map(tId => incomingTagIdRemap.get(tId) || tId);

      const pathKey = (incV.relativePath || incV.filename).toLowerCase();
      const existingMatch = existingVideoById.get(incV.id) || existingVideoByPath.get(pathKey);

      if (existingMatch) {
        incomingVideoIdRemap.set(incV.id, existingMatch.id);
        // Merge fields non-destructively: only fill in missing/empty fields or update if newer
        const merged: Video = {
          ...existingMatch,
          title: existingMatch.title || incV.title,
          performerDisplay: existingMatch.performerDisplay || incV.performerDisplay,
          performerIds: Array.from(new Set([...(existingMatch.performerIds || []), ...remappedPerformerIds])),
          originalTags: existingMatch.originalTags || incV.originalTags,
          tagIds: Array.from(new Set([...(existingMatch.tagIds || []), ...remappedTagIds])),
          resolution: existingMatch.resolution !== 'Unknown' ? existingMatch.resolution : incV.resolution,
          personalRating: existingMatch.personalRating !== null ? existingMatch.personalRating : incV.personalRating,
          vibe: existingMatch.vibe || incV.vibe,
          notes: existingMatch.notes || incV.notes,
          source: existingMatch.source !== 'Unknown' ? existingMatch.source : incV.source,
          duration: existingMatch.duration || incV.duration,
          updatedAt: Math.max(existingMatch.updatedAt || 0, incV.updatedAt || Date.now())
        };
        await tx.objectStore('videos').put(merged);
        stats.videosUpdated++;
      } else {
        const newVideo: Video = {
          ...incV,
          performerIds: remappedPerformerIds,
          tagIds: remappedTagIds
        };
        incomingVideoIdRemap.set(incV.id, incV.id);
        await tx.objectStore('videos').put(newVideo);
        existingVideoById.set(newVideo.id, newVideo);
        stats.videosAdded++;
      }
    }

    // 4. Merge Sessions (match by session ID)
    const existingSessionById = new Map<string, Session>();
    for (const s of existing.sessions) {
      existingSessionById.set(s.id, s);
    }

    for (const incS of incoming.sessions) {
      const remappedVideoIds = (incS.videoIds || []).map(vId => incomingVideoIdRemap.get(vId) || vId);
      const existingS = existingSessionById.get(incS.id);

      if (existingS) {
        // Update only if incoming has newer updatedAt
        if ((incS.updatedAt || 0) > (existingS.updatedAt || 0)) {
          const updated: Session = {
            ...existingS,
            ...incS,
            videoIds: remappedVideoIds
          };
          await tx.objectStore('sessions').put(updated);
          stats.sessionsUpdated++;
        }
      } else {
        const newSession: Session = {
          ...incS,
          videoIds: remappedVideoIds
        };
        await tx.objectStore('sessions').put(newSession);
        existingSessionById.set(newSession.id, newSession);
        stats.sessionsAdded++;
      }
    }

    // 5. Merge Watchlist (match by videoId)
    const existingWlByVideo = new Map<string, WatchlistItem>();
    for (const w of existing.watchlist) {
      existingWlByVideo.set(w.videoId, w);
    }

    for (const incW of incoming.watchlist) {
      const targetVideoId = incomingVideoIdRemap.get(incW.videoId) || incW.videoId;
      const existingW = existingWlByVideo.get(targetVideoId);

      if (!existingW) {
        const newWl: WatchlistItem = {
          ...incW,
          videoId: targetVideoId
        };
        await tx.objectStore('watchlist').put(newWl);
        existingWlByVideo.set(targetVideoId, newWl);
        stats.watchlistAdded++;
      }
    }

    // 6. Merge Settings
    if (incoming.settings && incoming.settings.length > 0) {
      for (const s of incoming.settings) {
        await tx.objectStore('settings').put(s);
      }
    }

    await tx.done;

    return {
      success: true,
      mode: 'merge',
      stats,
      errors: [],
      warnings: []
    };
  }
};
