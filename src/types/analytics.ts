import { Video, Session } from './index';

export type DataConfidence = 'Observed' | 'Emerging' | 'Insufficient Data';
export type RepresentationLevel = 'Highly represented' | 'Moderately represented' | 'Lightly represented' | 'Rare';
export type LifecycleClassification = 'Unexplored' | 'Discovered' | 'Retested' | 'Proven' | 'Favorite / High Signal';

export interface MetadataHealth {
  missingPerformer: number;
  missingTitle: number;
  missingTags: number;
  missingParticipantCount: number;
  unknownResolution: number;
  unrecognizedFolder: number;
  totalAffected: number;
  percentageAffected: number;
}

export interface RepresentationBreakdown {
  label: string;
  count: number;
  percentage: number;
  level: RepresentationLevel;
}

export interface CollectionSummary {
  totalVideos: number;
  totalPerformers: number;
  totalTags: number;
  participantDistribution: RepresentationBreakdown[];
  folderDistribution: RepresentationBreakdown[];
  resolutionDistribution: RepresentationBreakdown[];
  vibeDistribution: RepresentationBreakdown[];
}

export interface ActivitySummary {
  totalSessions: number;
  totalDuration: number;
  averageSessionRating: number | null;
  uniqueVideosUsed: number;
  collectionUtilization: number; // percentage
  recent30DaysSessions: number;
  recent90DaysSessions: number;
}

export interface VideoAnalytics {
  video: Video;
  timesWatched: number;
  firstWatched: string | null;
  lastWatched: string | null;
  daysSinceLastWatched: number | null;
  averageSessionRating: number | null;
  strongSessionAppearances: number;
  lifecycle: LifecycleClassification;
  isDiscovery: boolean;
}

export interface TagAnalytics {
  tag: string;
  videoCount: number;
  collectionPercentage: number;
  sessionCount: number;
  strongSessionCount: number;
  averageSessionRating: number | null;
  lastEncountered: string | null;
  confidence: DataConfidence;
}

export interface PerformerAnalytics {
  performer: string;
  videoCount: number;
  collectionPercentage: number;
  sessionCount: number;
  uniqueVideosEncountered: number;
  averageVideoRating: number | null;
  averageSessionRating: number | null;
  strongSessionAppearances: number;
  lastEncountered: string | null;
}

export interface FolderAnalytics {
  folder: string;
  videoCount: number;
  collectionPercentage: number;
  watchedCount: number;
  unwatchedCount: number;
  utilization: number;
  averageSessionRating: number | null;
}

export interface MismatchSignal {
  type: 'High Ownership / Low Activity' | 'Low Ownership / High Activity' | 'Low Ownership / High Success' | 'High Ownership / High Success' | 'High Ownership / Low Success';
  label: string;
  category: 'Tag' | 'Folder' | 'Performer';
  evidence: string;
}

export interface OpportunitySignal {
  label: string;
  category: 'Tag' | 'Folder' | 'Performer';
  score: number;
  evidence: string;
}

export interface CombinationAnalytics {
  videoIds: string[];
  occurrences: number;
  averageRating: number | null;
  strongOccurrences: number;
  lastEncountered: string | null;
}

export interface FullAnalytics {
  collection: CollectionSummary;
  activity: ActivitySummary;
  health: MetadataHealth;
  videos: VideoAnalytics[];
  tags: TagAnalytics[];
  performers: PerformerAnalytics[];
  folders: FolderAnalytics[];
  mismatches: MismatchSignal[];
  opportunities: OpportunitySignal[];
  combinations: CombinationAnalytics[];
}
