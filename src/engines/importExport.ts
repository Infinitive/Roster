import { Video, Session, Performer, Tag, WatchlistItem, CollectionSettings } from '../types';
import { Storage } from '../storage/db';

export interface ExportData {
  schemaVersion: number;
  videos: Video[];
  sessions: Session[];
  performers: Performer[];
  tags: Tag[];
  watchlist: WatchlistItem[];
  settings: CollectionSettings[];
}

export const ImportExport = {
  async exportData(): Promise<string> {
    const db = await (await import('../storage/db')).getDB();
    const data: ExportData = {
      schemaVersion: 1,
      videos: await db.getAll('videos'),
      sessions: await db.getAll('sessions'),
      performers: await db.getAll('performers'),
      tags: await db.getAll('tags'),
      watchlist: await db.getAll('watchlist'),
      settings: await db.getAll('settings'),
    };
    return JSON.stringify(data, null, 2);
  },
  
  async importData(jsonData: string, mode: 'replace' | 'merge'): Promise<void> {
    const data: ExportData = JSON.parse(jsonData);
    
    // In Phase 1, we just do replace for simplicity and robustness
    if (mode === 'replace') {
      await Storage.clearAll();
      
      const db = await (await import('../storage/db')).getDB();
      const tx = db.transaction(['videos', 'sessions', 'performers', 'tags', 'watchlist', 'settings'], 'readwrite');
      
      if (data.videos) data.videos.forEach(v => tx.objectStore('videos').put(v));
      if (data.sessions) data.sessions.forEach(s => tx.objectStore('sessions').put(s));
      if (data.performers) data.performers.forEach(p => tx.objectStore('performers').put(p));
      if (data.tags) data.tags.forEach(t => tx.objectStore('tags').put(t));
      if (data.watchlist) data.watchlist.forEach(w => tx.objectStore('watchlist').put(w));
      if (data.settings) data.settings.forEach(s => tx.objectStore('settings').put(s));
      
      await tx.done;
    }
  }
}
