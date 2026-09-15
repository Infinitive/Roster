export interface CanonicalTagDefinition {
  name: string;
  category: 'Archetype & Identity' | 'Sexual Dynamic & Vibe' | 'Acts & Mechanics' | 'Context & Setting';
  synonyms?: string[];
}

export const CANONICAL_30_TAGS: CanonicalTagDefinition[] = [
  // Archetype & Identity (1-9)
  { name: 'XL', category: 'Archetype & Identity', synonyms: ['xxl', 'monster', 'monster cock', 'monsterdick', 'huge cock', 'big cock'] },
  { name: 'Muscle', category: 'Archetype & Identity', synonyms: ['muscular', 'muscle hunk', 'hunk', 'bodybuilder'] },
  { name: 'Twink', category: 'Archetype & Identity', synonyms: ['twinks'] },
  { name: 'Latino', category: 'Archetype & Identity', synonyms: ['latin', 'hispanic', 'spanish', 'brazilian'] },
  { name: 'DILF', category: 'Archetype & Identity', synonyms: ['dad', 'daddy', 'nastydaddy', 'stepdaddy'] },
  { name: 'Uncut', category: 'Archetype & Identity', synonyms: ['foreskin', 'intact'] },
  { name: 'Jock', category: 'Archetype & Identity', synonyms: ['jocks', 'athlete', 'athletic', 'bro'] },
  { name: 'Chav', category: 'Archetype & Identity', synonyms: ['lad', 'scally'] },
  { name: 'Interracial', category: 'Archetype & Identity', synonyms: ['bwc', 'bbc'] },

  // Sexual Dynamic & Vibe (10-17)
  { name: 'Rough', category: 'Sexual Dynamic & Vibe', synonyms: ['hardcore', 'intense', 'hard & rough', 'bully'] },
  { name: 'Domination', category: 'Sexual Dynamic & Vibe', synonyms: ['dom', 'dominant', 'submissive', 'obey'] },
  { name: 'Breeding', category: 'Sexual Dynamic & Vibe', synonyms: ['breed', 'bareback'] },
  { name: 'Power', category: 'Sexual Dynamic & Vibe', synonyms: ['power dynamic', 'control'] },
  { name: 'Taboo', category: 'Sexual Dynamic & Vibe', synonyms: ['forbidden', 'stepbrother', 'brother-in-law', 'workplace'] },
  { name: 'Straight', category: 'Sexual Dynamic & Vibe', synonyms: ['str8', 'straight guy', 'curious', 'say uncle'] },
  { name: 'Worship', category: 'Sexual Dynamic & Vibe', synonyms: ['body worship', 'cock worship'] },
  { name: 'Kinky', category: 'Sexual Dynamic & Vibe', synonyms: ['kink', 'fetish', 'bondage'] },

  // Acts & Mechanics (18-24)
  { name: 'DP', category: 'Acts & Mechanics', synonyms: ['double penetration', 'dp scene'] },
  { name: 'Deepthroat', category: 'Acts & Mechanics', synonyms: ['face fuck', 'throat', 'deep throat'] },
  { name: 'Blowjob', category: 'Acts & Mechanics', synonyms: ['bj', 'oral', 'sucking', 'suck'] },
  { name: 'Rimming', category: 'Acts & Mechanics', synonyms: ['rim', 'eating ass', 'ass licking'] },
  { name: 'Cumshot', category: 'Acts & Mechanics', synonyms: ['load', 'facial', 'internal'] },
  { name: 'Edging', category: 'Acts & Mechanics', synonyms: ['edge', 'ruined orgasm', 'denial'] },
  { name: 'POV', category: 'Acts & Mechanics', synonyms: ['point of view'] },

  // Context & Setting (25-30)
  { name: 'Public', category: 'Context & Setting', synonyms: ['outdoor', 'outdoors', 'exhibition', 'cruising'] },
  { name: 'Uniform', category: 'Context & Setting', synonyms: ['cops', 'military', 'gear'] },
  { name: 'Amateur', category: 'Context & Setting', synonyms: ['homemade', 'real', 'bedroom'] },
  { name: 'Undercover', category: 'Context & Setting', synonyms: ['hidden camera', 'spy', 'voyeur'] },
  { name: 'Group', category: 'Context & Setting', synonyms: ['gangbang', 'orgy', 'threeway', 'tag-team', 'cumdump'] },
  { name: 'Party', category: 'Context & Setting', synonyms: ['sex party', 'chill'] }
];

/**
 * Generic / ambiguous single-word terms that must NOT be aggressively mapped to canonical tags.
 * Preserved as raw/custom or marked uncertain.
 */
export const AMBIGUOUS_GENERIC_TERMS: Record<string, string> = {
  size: 'Ambiguous: could refer to XL, body size, or format. Kept as raw term.',
  young: 'Ambiguous: could refer to Twink, legal adult age, or general description. Kept as raw term.',
  raw: 'Ambiguous: could refer to Breeding/bareback or unedited footage. Kept as raw term.',
  cum: 'Ambiguous: could refer to Cumshot, verb, or generic fluid mention. Kept as raw term.',
  stroke: 'Ambiguous: could refer to Edging or simple action. Kept as raw term.'
};

export const VALID_RESOLUTIONS = ['Unknown', '480p', '720p', '1080p', '1440p', '2160p'] as const;
export type ResolutionType = typeof VALID_RESOLUTIONS[number];

export const VALID_SESSION_RATINGS = [1, 2, 3, 4, 5] as const;
export const VALID_ORGASM_STATUSES = ['Came', 'Edged Only', 'Both', 'Neither'] as const;
export const VALID_VIBES = [
  'Aggressive',
  'Worship',
  'Filthy',
  'Degrading',
  'Tender',
  'Chaotic',
  'Power',
  'Size-focused'
] as const;

export const VALID_WATCHLIST_STATUSES = ['Next', 'Queue', 'Rediscover', 'Research', 'Maybe'] as const;

export const KNOWN_PHYSICAL_FOLDERS = [
  '0 Favorites',
  '1 Solo',
  '2 Duo',
  '3 Threesome',
  '4(+) Group'
] as const;

export type TagClassificationType = 'explicit' | 'strongly-inferred' | 'uncertain' | 'none';

export interface TagClassification {
  matchType: TagClassificationType;
  canonicalTag?: CanonicalTagDefinition;
  reason: string;
}

/**
 * Conservative tag classifier adhering to Phase 6 Section 20 guidelines.
 */
export function classifyTagMatch(rawTag: string): TagClassification {
  const cleaned = rawTag.trim().toLowerCase();
  if (!cleaned) {
    return { matchType: 'none', reason: 'Empty tag' };
  }

  // Check if it is a dangerous ambiguous generic term
  if (AMBIGUOUS_GENERIC_TERMS[cleaned]) {
    return {
      matchType: 'uncertain',
      reason: AMBIGUOUS_GENERIC_TERMS[cleaned]
    };
  }

  // 1. Direct match (Explicit)
  const direct = CANONICAL_30_TAGS.find(t => t.name.toLowerCase() === cleaned);
  if (direct) {
    return {
      matchType: 'explicit',
      canonicalTag: direct,
      reason: `Exact match for canonical tag "${direct.name}"`
    };
  }

  // 2. High-confidence synonym match (Strongly inferred)
  const syn = CANONICAL_30_TAGS.find(t => t.synonyms?.some(s => s.toLowerCase() === cleaned));
  if (syn) {
    return {
      matchType: 'strongly-inferred',
      canonicalTag: syn,
      reason: `Specific synonym match for canonical tag "${syn.name}"`
    };
  }

  return {
    matchType: 'none',
    reason: 'Not a canonical tag (preserved as custom/raw)'
  };
}

/**
 * Normalizes a tag string to a canonical tag if conservatively matched.
 */
export function matchCanonicalTag(rawTag: string): CanonicalTagDefinition | undefined {
  const classification = classifyTagMatch(rawTag);
  if (classification.matchType === 'explicit' || classification.matchType === 'strongly-inferred') {
    return classification.canonicalTag;
  }
  return undefined;
}
