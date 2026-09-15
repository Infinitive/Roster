import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Video, Session, Performer, Tag, WatchlistItem, CollectionSettings } from '../types';

interface T9RegistryDB extends DBSchema {
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
  };
  tags: {
    key: string;
    value: Tag;
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
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<T9RegistryDB>> | null = null;

export async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<T9RegistryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const videoStore = db.createObjectStore('videos', { keyPath: 'id' });
        videoStore.createIndex('by-folder', 'folder');
        videoStore.createIndex('by-rating', 'personalRating');
        videoStore.createIndex('by-added', 'dateAdded');

        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('by-date', 'date');

        db.createObjectStore('performers', { keyPath: 'id' });
        db.createObjectStore('tags', { keyPath: 'id' });
        
        const watchlistStore = db.createObjectStore('watchlist', { keyPath: 'id' });
        watchlistStore.createIndex('by-video', 'videoId');

        db.createObjectStore('settings', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export const Storage = {
  async getVideos(): Promise<Video[]> {
    const db = await getDB();
    return db.getAll('videos');
  },
  async saveVideo(video: Video): Promise<void> {
    const db = await getDB();
    await db.put('videos', video);
  },
  async deleteVideo(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('videos', id);
  },
  async getVideo(id: string): Promise<Video | undefined> {
    const db = await getDB();
    return db.get('videos', id);
  },
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
  async deleteSession(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('sessions', id);
  },
  async getWatchlist(): Promise<WatchlistItem[]> {
    const db = await getDB();
    return db.getAll('watchlist');
  },
  async saveWatchlistItem(item: WatchlistItem): Promise<void> {
    const db = await getDB();
    await db.put('watchlist', item);
  },
  async deleteWatchlistItem(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('watchlist', id);
  },
  async saveVideos(videos: Video[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('videos', 'readwrite');
    for (const v of videos) {
      tx.store.put(v);
    }
    await tx.done;
  },
  async clearAll(): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['videos', 'sessions', 'performers', 'tags', 'watchlist', 'settings'], 'readwrite');
    await tx.objectStore('videos').clear();
    await tx.objectStore('sessions').clear();
    await tx.objectStore('performers').clear();
    await tx.objectStore('tags').clear();
    await tx.objectStore('watchlist').clear();
    await tx.objectStore('settings').clear();
    await tx.done;
  }
};
