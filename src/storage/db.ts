import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Video, Session, Performer, Tag, WatchlistItem, CollectionSettings } from '../types';
import { 
  CURRENT_DB_VERSION, 
  handleDBUpgrade, 
  seedCanonicalTagsInTx, 
  reconcileVideoRelationsInTx 
} from './migrations';

export interface T9RegistryDB extends DBSchema {
  videos: {
    key: string;
    value: Video;
    indexes: {
      'by-folder': string;
      'by-rating': number;
      'by-added': string;
    };
  };
  sessions: {
    key: string;
    value: Session;
    indexes: {
      'by-date': string;
    };
  };
  performers: {
    key: string;
    value: Performer;
    indexes: {
      'by-normalized': string;
    };
  };
  tags: {
    key: string;
    value: Tag;
    indexes: {
      'by-normalized': string;
      'by-category': string;
    };
  };
  watchlist: {
    key: string;
    value: WatchlistItem;
    indexes: {
      'by-video': string;
    };
  };
  settings: {
    key: string;
    value: CollectionSettings;
  };
}

const DB_NAME = 't9-registry';

let dbPromise: Promise<IDBPDatabase<T9RegistryDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<T9RegistryDB>> {
  if (!dbPromise) {
    dbPromise = openDB<T9RegistryDB>(DB_NAME, CURRENT_DB_VERSION, {
      upgrade(db, oldVersion, newVersion, tx) {
        handleDBUpgrade(db, oldVersion, newVersion, tx);
      },
    }).then(async (db) => {
      // Ensure canonical tags and relationship reconciliation
      try {
        const tx = db.transaction(['tags', 'performers', 'videos'], 'readwrite');
        const tagMap = await seedCanonicalTagsInTx(tx);
        await reconcileVideoRelationsInTx(tx, tagMap);
        await tx.done;
      } catch (err) {
        console.warn('Initial tag/performer seeding check completed with notice:', err);
      }
      return db;
    });
  }
  return dbPromise;
}

export const Storage = {
  // --- Videos ---
  async getVideos(): Promise<Video[]> {
    const db = await getDB();
    return db.getAll('videos');
  },
  async saveVideo(video: Video): Promise<void> {
    const db = await getDB();
    await db.put('videos', video);
  },
  async saveVideos(videos: Video[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('videos', 'readwrite');
    for (const v of videos) {
      await tx.store.put(v);
    }
    await tx.done;
  },
  async deleteVideo(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('videos', id);
  },
  async getVideo(id: string): Promise<Video | undefined> {
    const db = await getDB();
    return db.get('videos', id);
  },

  // --- Sessions ---
  async getSessions(): Promise<Session[]> {
    const db = await getDB();
    return db.getAll('sessions');
  },
  async getSession(id: string): Promise<Session | undefined> {
    const db = await getDB();
    return db.get('sessions', id);
  },
  async saveSession(session: Session): Promise<void> {
    const db = await getDB();
    await db.put('sessions', session);
  },
  async saveSessions(sessions: Session[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('sessions', 'readwrite');
    for (const s of sessions) {
      await tx.store.put(s);
    }
    await tx.done;
  },
  async deleteSession(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('sessions', id);
  },

  // --- Performers ---
  async getPerformers(): Promise<Performer[]> {
    const db = await getDB();
    return db.getAll('performers');
  },
  async getPerformer(id: string): Promise<Performer | undefined> {
    const db = await getDB();
    return db.get('performers', id);
  },
  async savePerformer(performer: Performer): Promise<void> {
    const db = await getDB();
    await db.put('performers', performer);
  },
  async savePerformers(performers: Performer[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('performers', 'readwrite');
    for (const p of performers) {
      await tx.store.put(p);
    }
    await tx.done;
  },
  async deletePerformer(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('performers', id);
  },

  // --- Tags ---
  async getTags(): Promise<Tag[]> {
    const db = await getDB();
    return db.getAll('tags');
  },
  async getTag(id: string): Promise<Tag | undefined> {
    const db = await getDB();
    return db.get('tags', id);
  },
  async saveTag(tag: Tag): Promise<void> {
    const db = await getDB();
    await db.put('tags', tag);
  },
  async saveTags(tags: Tag[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('tags', 'readwrite');
    for (const t of tags) {
      await tx.store.put(t);
    }
    await tx.done;
  },
  async deleteTag(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('tags', id);
  },

  // --- Watchlist ---
  async getWatchlist(): Promise<WatchlistItem[]> {
    const db = await getDB();
    return db.getAll('watchlist');
  },
  async saveWatchlistItem(item: WatchlistItem): Promise<void> {
    const db = await getDB();
    await db.put('watchlist', item);
  },
  async saveWatchlist(items: WatchlistItem[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('watchlist', 'readwrite');
    for (const item of items) {
      await tx.store.put(item);
    }
    await tx.done;
  },
  async deleteWatchlistItem(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('watchlist', id);
  },

  // --- Settings ---
  async getSettings(): Promise<CollectionSettings[]> {
    const db = await getDB();
    return db.getAll('settings');
  },
  async saveSettings(settings: CollectionSettings): Promise<void> {
    const db = await getDB();
    await db.put('settings', settings);
  },

  // --- Bulk & Integrity Operations ---
  async getAllData() {
    const db = await getDB();
    const [videos, sessions, performers, tags, watchlist, settings] = await Promise.all([
      db.getAll('videos'),
      db.getAll('sessions'),
      db.getAll('performers'),
      db.getAll('tags'),
      db.getAll('watchlist'),
      db.getAll('settings'),
    ]);
    return { videos, sessions, performers, tags, watchlist, settings };
  },

  async clearAll(): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(
      ['videos', 'sessions', 'performers', 'tags', 'watchlist', 'settings'],
      'readwrite'
    );
    await tx.objectStore('videos').clear();
    await tx.objectStore('sessions').clear();
    await tx.objectStore('performers').clear();
    await tx.objectStore('tags').clear();
    await tx.objectStore('watchlist').clear();
    await tx.objectStore('settings').clear();
    await tx.done;
  }
};
