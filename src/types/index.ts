export type ProvenanceLevel = 'raw' | 'parsed' | 'research-confirmed' | 'user-confirmed';

export interface FieldProvenance {
  level: ProvenanceLevel;
  source?: string;
  confidence?: 'high' | 'medium' | 'low';
  confirmedAt?: number;
  notes?: string;
}

export interface VideoProvenance {
  performers?: FieldProvenance;
  title?: FieldProvenance;
  tags?: FieldProvenance;
  resolution?: FieldProvenance;
}

export interface Video {
  id: string;
  filename: string;
  relativePath: string;
  participantCount: string;
  folder: string;
  performerIds: string[];
  performerDisplay: string;
  title: string;
  tagIds: string[];
  originalTags: string;
  resolution: string;
  originalResolution: string;
  source: string;
  duration: number | null;
  dateAdded: string;
  personalRating: number | null;
  vibe: string;
  status: 'Active' | 'Archived';
  notes: string;
  createdAt: number;
  updatedAt: number;

  // Phase 6 Provenance, Research & Dataset metadata
  provenance?: VideoProvenance;
  researchTitle?: string;
  alternateTitle?: string;
  productionStudio?: string;
  releaseYear?: number | null;
  datasetType?: 'seed' | 'real' | 'user';
  flags?: string[];
}

export interface Session {
  id: string;
  date: string;
  startTime: string | null;
  duration: number | null;
  videoIds: string[];
  rating: number | null;
  orgasmStatus: string;
  vibe: string;
  strongCombination: boolean;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface Performer {
  id: string;
  name: string;
  normalizedName: string;
  aliases?: string[];
  createdAt?: number;
}

export interface Tag {
  id: string;
  name: string;
  normalizedName: string;
  category: string;
  isCanonical?: boolean;
  synonyms?: string[];
  createdAt?: number;
}

export interface WatchlistItem {
  id: string;
  videoId: string;
  status: string;
  addedDate: string;
  notes: string;
}

export interface CollectionSettings {
  id: string;
  schemaVersion?: number;
  vocabularies: Record<string, string[]>;
  thresholds: Record<string, number>;
  preferences: Record<string, any>;
  updatedAt?: number;
}
