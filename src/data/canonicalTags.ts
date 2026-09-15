export interface CanonicalTagDefinition {
  name: string;
  category: 'Archetype & Identity' | 'Sexual Dynamic & Vibe' | 'Acts & Mechanics' | 'Context & Setting';
  synonyms?: string[];
}

export const CANONICAL_30_TAGS: CanonicalTagDefinition[] = [
  // Archetype & Identity (1-9)
  { name: 'XL', category: 'Archetype & Identity', synonyms: ['xxl', 'monster', 'monster cock', 'monsterdick', 'huge cock', 'big cock', 'size'] },
  { name: 'Muscle', category: 'Archetype & Identity', synonyms: ['muscular', 'muscle hunk', 'hunk', 'bodybuilder'] },
  { name: 'Twink', category: 'Archetype & Identity', synonyms: ['twinks', 'young'] },
  { name: 'Latino', category: 'Archetype & Identity', synonyms: ['latin', 'hispanic', 'spanish', 'brazilian'] },
  { name: 'DILF', category: 'Archetype & Identity', synonyms: ['dad', 'daddy', 'nastydaddy', 'stepdaddy'] },
  { name: 'Uncut', category: 'Archetype & Identity', synonyms: ['foreskin', 'intact'] },
  { name: 'Jock', category: 'Archetype & Identity', synonyms: ['jocks', 'athlete', 'athletic', 'bro'] },
  { name: 'Chav', category: 'Archetype & Identity', synonyms: ['lad', 'scally'] },
  { name: 'Interracial', category: 'Archetype & Identity', synonyms: ['bwc', 'bbc'] },

  // Sexual Dynamic & Vibe (10-17)
  { name: 'Rough', category: 'Sexual Dynamic & Vibe', synonyms: ['hardcore', 'intense', 'hard & rough', 'bully'] },
  { name: 'Domination', category: 'Sexual Dynamic & Vibe', synonyms: ['dom', 'dominant', 'submissive', 'obey'] },
  { name: 'Breeding', category: 'Sexual Dynamic & Vibe', synonyms: ['breed', 'raw', 'bareback'] },
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
  { name: 'Cumshot', category: 'Acts & Mechanics', synonyms: ['cum', 'load', 'facial', 'internal'] },
  { name: 'Edging', category: 'Acts & Mechanics', synonyms: ['edge', 'ruined orgasm', 'denial', 'stroke'] },
  { name: 'POV', category: 'Acts & Mechanics', synonyms: ['point of view'] },

  // Context & Setting (25-30)
  { name: 'Public', category: 'Context & Setting', synonyms: ['outdoor', 'outdoors', 'exhibition', 'cruising'] },
  { name: 'Uniform', category: 'Context & Setting', synonyms: ['cops', 'military', 'gear'] },
  { name: 'Amateur', category: 'Context & Setting', synonyms: ['homemade', 'real', 'bedroom'] },
  { name: 'Undercover', category: 'Context & Setting', synonyms: ['hidden camera', 'spy', 'voyeur'] },
  { name: 'Group', category: 'Context & Setting', synonyms: ['gangbang', 'orgy', 'threeway', 'tag-team', 'cumdump'] },
  { name: 'Party', category: 'Context & Setting', synonyms: ['sex party', 'chill'] }
];

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

/**
 * Normalizes a tag string to a canonical tag if matched, preserving case sensitivity for canonical names.
 */
export function matchCanonicalTag(rawTag: string): CanonicalTagDefinition | undefined {
  const cleaned = rawTag.trim().toLowerCase();
  if (!cleaned) return undefined;

  // Direct match
  const direct = CANONICAL_30_TAGS.find(t => t.name.toLowerCase() === cleaned);
  if (direct) return direct;

  // Synonym match
  const syn = CANONICAL_30_TAGS.find(t => t.synonyms?.some(s => s.toLowerCase() === cleaned));
  if (syn) return syn;

  return undefined;
}
