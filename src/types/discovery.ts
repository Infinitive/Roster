import { Video } from './index';

export type DiscoveryMode = 
  | 'Random'
  | 'Blind Pull'
  | 'Rediscover'
  | 'Unwatched'
  | 'High Signal'
  | 'Deep Cut'
  | 'Old Favorite'
  | 'Category Explorer'
  | 'Gap Explorer'
  | 'Surprise Me';

export interface DiscoveryResult {
  videoId: string;
  video: Video;
  mode: DiscoveryMode;
  score: number;
  reasonType: string;
  reasonText: string;
  supportingSignals: string[];
  generatedAt: number;
}

export interface DiscoveryOptions {
  categoryType?: 'Folder' | 'Participant Count' | 'Tag' | 'Performer' | 'Resolution' | 'Vibe' | 'Source';
  categoryValue?: string;
}
