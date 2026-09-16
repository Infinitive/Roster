import { IDBPDatabase, IDBPTransaction } from 'idb';
import { Video, Session, Performer, Tag, WatchlistItem, CollectionSettings } from '../types';
import { CANONICAL_30_TAGS, matchCanonicalTag } from '../data/canonicalTags';

export const CURRENT_SCHEMA_VERSION = 2;
export const CURRENT_DB_VERSION = 2;

/**
 * Ensures all canonical 30 tags exist in the tags store with stable, deterministic IDs.
 */
export async function seedCanonicalTagsInTx(tx: IDBPTransaction<any, any, 'readwrite'>): Promise<Map<string, Tag>> {
  const tagStore = tx.objectStore('tags');
  const existingTags: Tag[] = await tagStore.getAll();
  const tagMap = new Map<string, Tag>();

  for (const t of existingTags) {
    tagMap.set(t.normalizedName, t);
  }

  for (const def of CANONICAL_30_TAGS) {
    const norm = def.name.toLowerCase();
    if (!tagMap.has(norm)) {
      const newTag: Tag = {
        id: `TAG-${norm.replace(/[^a-z0-9]/g, '-')}`,
        name: def.name,
        normalizedName: norm,
        category: def.category,
        isCanonical: true,
        synonyms: def.synonyms,
        createdAt: Date.now()
      };
      await tagStore.put(newTag);
      tagMap.set(norm, newTag);
    }
  }

  return tagMap;
}

/**
 * Reconciles video relationships for tags and performers inside a transaction.
 */
export async function reconcileVideoRelationsInTx(tx: IDBPTransaction<any, any, 'readwrite'>, tagMap: Map<string, Tag>) {
  const videoStore = tx.objectStore('videos');
  const performerStore = tx.objectStore('performers');
  
  const existingPerformers: Performer[] = await performerStore.getAll();
  const performerMap = new Map<string, Performer>();
  for (const p of existingPerformers) {
    performerMap.set(p.normalizedName, p);
  }

  const videos: Video[] = await videoStore.getAll();

  for (const video of videos) {
    let updated = false;

    // 1. Reconcile tags
    if ((!video.tagIds || video.tagIds.length === 0) && video.originalTags) {
      const rawTagParts = video.originalTags.split(',').map(t => t.trim()).filter(Boolean);
      const matchedTagIds: string[] = [];

      for (const raw of rawTagParts) {
        const canonical = matchCanonicalTag(raw);
        const norm = (canonical ? canonical.name : raw).toLowerCase();

        let tagObj = tagMap.get(norm);
        if (!tagObj) {
          // Create custom tag entity
          const newTag: Tag = {
            id: `TAG-custom-${norm.replace(/[^a-z0-9]/g, '-')}`,
            name: raw,
            normalizedName: norm,
            category: canonical?.category || 'General',
            isCanonical: false,
            createdAt: Date.now()
          };
          await tx.objectStore('tags').put(newTag);
          tagMap.set(norm, newTag);
          tagObj = newTag;
        }
        if (!matchedTagIds.includes(tagObj.id)) {
          matchedTagIds.push(tagObj.id);
        }
      }

      if (matchedTagIds.length > 0) {
        video.tagIds = matchedTagIds;
        updated = true;
      }
    }

    // 2. Reconcile performers
    if ((!video.performerIds || video.performerIds.length === 0) && video.performerDisplay) {
      const rawPerfs = video.performerDisplay
        .split(/[,&/]| and /i)
        .map(p => p.trim())
        .filter(p => p && p.toLowerCase() !== 'unknown');

      const matchedPerfIds: string[] = [];
      for (const raw of rawPerfs) {
        const norm = raw.toLowerCase();
        let perfObj = performerMap.get(norm);
        if (!perfObj) {
          perfObj = {
            id: `PERF-${norm.replace(/[^a-z0-9]/g, '-')}`,
            name: raw,
            normalizedName: norm,
            createdAt: Date.now()
          };
          await performerStore.put(perfObj);
          performerMap.set(norm, perfObj);
        }
        if (!matchedPerfIds.includes(perfObj.id)) {
          matchedPerfIds.push(perfObj.id);
        }
      }

      if (matchedPerfIds.length > 0) {
        video.performerIds = matchedPerfIds;
        updated = true;
      }
    }

    // 3. Ensure defaults
    if (!video.source) { video.source = 'Unknown'; updated = true; }
    if (video.notes === undefined) { video.notes = ''; updated = true; }

    if (updated) {
      await videoStore.put(video);
    }
  }
}

/**
 * Handles IndexedDB upgrade callback across database versions safely and idempotently.
 */
export async function handleDBUpgrade(
  db: IDBPDatabase<any>,
  oldVersion: number,
  newVersion: number | null,
  transaction: IDBPTransaction<any, any, 'versionchange'>
) {
  // Version 1 setup
  if (oldVersion < 1) {
    const videoStore = db.createObjectStore('videos', { keyPath: 'id' });
    videoStore.createIndex('by-folder', 'folder');
    videoStore.createIndex('by-rating', 'personalRating');
    videoStore.createIndex('by-added', 'dateAdded');

    const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
    sessionStore.createIndex('by-date', 'date');

    const perfStore = db.createObjectStore('performers', { keyPath: 'id' });
    perfStore.createIndex('by-normalized', 'normalizedName');

    const tagStore = db.createObjectStore('tags', { keyPath: 'id' });
    tagStore.createIndex('by-normalized', 'normalizedName');
    tagStore.createIndex('by-category', 'category');

    const watchlistStore = db.createObjectStore('watchlist', { keyPath: 'id' });
    watchlistStore.createIndex('by-video', 'videoId');

    db.createObjectStore('settings', { keyPath: 'id' });
  }

  // Version 2 additions
  if (oldVersion >= 1 && oldVersion < 2) {
    const perfStore = transaction.objectStore('performers');
    if (!perfStore.indexNames.contains('by-normalized')) {
      perfStore.createIndex('by-normalized', 'normalizedName');
    }

    const tagStore = transaction.objectStore('tags');
    if (!tagStore.indexNames.contains('by-normalized')) {
      tagStore.createIndex('by-normalized', 'normalizedName');
    }
    if (!tagStore.indexNames.contains('by-category')) {
      tagStore.createIndex('by-category', 'category');
    }
  }
}

/**
 * Migrates older schema export files (e.g. v1) to the canonical CURRENT_SCHEMA_VERSION.
 * Never silently invents substantive user data. Rejects unsupported future versions.
 */
export function migrateDataset(data: any): { data: any; originalVersion: number; migrated: boolean } {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid dataset: root must be a JSON object.');
  }

  const rawVersion = typeof data.schemaVersion === 'number'
    ? data.schemaVersion
    : (typeof data.version === 'number' ? data.version : 1);

  if (rawVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported future schema version: ${rawVersion}. This version of T9 Collection Registry only supports up to schema version ${CURRENT_SCHEMA_VERSION}.`
    );
  }

  if (rawVersion === CURRENT_SCHEMA_VERSION) {
    return { data, originalVersion: rawVersion, migrated: false };
  }

  // Deep clone data to avoid mutating caller object
  const migrated = JSON.parse(JSON.stringify(data));
  migrated.schemaVersion = CURRENT_SCHEMA_VERSION;

  // Ensure top-level arrays
  migrated.videos = Array.isArray(migrated.videos) ? migrated.videos : [];
  migrated.sessions = Array.isArray(migrated.sessions) ? migrated.sessions : [];
  migrated.performers = Array.isArray(migrated.performers) ? migrated.performers : [];
  migrated.tags = Array.isArray(migrated.tags) ? migrated.tags : [];
  migrated.watchlist = Array.isArray(migrated.watchlist) ? migrated.watchlist : [];
  migrated.settings = Array.isArray(migrated.settings) ? migrated.settings : [];

  // Migration rules from v1 -> v2:
  // Ensure every video has required structural fields
  for (const v of migrated.videos) {
    if (!Array.isArray(v.tagIds)) v.tagIds = [];
    if (!Array.isArray(v.performerIds)) v.performerIds = [];
    if (v.status !== 'Active' && v.status !== 'Archived') v.status = 'Active';
    if (v.notes === undefined) v.notes = '';
    if (v.source === undefined) v.source = 'Unknown';
    if (v.duration === undefined) v.duration = null;
    if (v.personalRating === undefined) v.personalRating = null;
    if (v.createdAt === undefined) v.createdAt = Date.now();
    if (v.updatedAt === undefined) v.updatedAt = Date.now();
  }

  // Ensure every session has required fields
  for (const s of migrated.sessions) {
    if (!Array.isArray(s.videoIds)) s.videoIds = [];
    if (s.rating === undefined) s.rating = null;
    if (s.duration === undefined) s.duration = null;
    if (s.startTime === undefined) s.startTime = null;
    if (s.strongCombination === undefined) s.strongCombination = false;
    if (s.orgasmStatus === undefined) s.orgasmStatus = '';
    if (s.vibe === undefined) s.vibe = '';
    if (s.notes === undefined) s.notes = '';
    if (s.createdAt === undefined) s.createdAt = Date.now();
    if (s.updatedAt === undefined) s.updatedAt = Date.now();
  }

  return { data: migrated, originalVersion: rawVersion, migrated: true };
}
