export interface CanonicalTagDefinition {
  name: string;
  category: 'Archetype & Identity' | 'Sexual Dynamic & Vibe' | 'Acts & Mechanics' | 'Context & Setting';
  description?: string;
  synonyms?: string[];
}

export const CANONICAL_30_TAGS: CanonicalTagDefinition[] = [
  // Archetype & Identity (1-9)
  { name: 'XL', category: 'Archetype & Identity', description: 'Prominent anatomical size, heavy endowment, or monster scale.', synonyms: ['xxl', 'monster', 'monster cock', 'monsterdick', 'huge cock', 'big cock'] },
  { name: 'Muscle', category: 'Archetype & Identity', description: 'Bodybuilders, defined muscular physiques, athletic mass, and strength.', synonyms: ['muscular', 'muscle hunk', 'hunk', 'bodybuilder'] },
  { name: 'Twink', category: 'Archetype & Identity', description: 'Slender, youthful, smooth, lean or boyish aesthetic.', synonyms: ['twinks'] },
  { name: 'Latino', category: 'Archetype & Identity', description: 'Performers of Hispanic, Latin American, Brazilian, or Iberian heritage.', synonyms: ['latin', 'hispanic', 'spanish', 'brazilian'] },
  { name: 'DILF', category: 'Archetype & Identity', description: 'Mature masculine performers, silver-fox, paternal authority figures.', synonyms: ['dad', 'daddy', 'nastydaddy', 'stepdaddy'] },
  { name: 'Uncut', category: 'Archetype & Identity', description: 'Intact foreskin anatomical feature highlighted in performance.', synonyms: ['foreskin', 'intact'] },
  { name: 'Jock', category: 'Archetype & Identity', description: 'Athletic, collegiate, team sport aesthetic, baseball caps, gym bro vibe.', synonyms: ['jocks', 'athlete', 'athletic', 'bro'] },
  { name: 'Chav', category: 'Archetype & Identity', description: 'UK/European street subculture, tracksuits, caps, rough street lad demeanor.', synonyms: ['lad', 'scally'] },
  { name: 'Interracial', category: 'Archetype & Identity', description: 'Cross-racial pairings, contrasting skin tones, multicultural scenes.', synonyms: ['bwc', 'bbc'] },

  // Sexual Dynamic & Vibe (10-17)
  { name: 'Rough', category: 'Sexual Dynamic & Vibe', description: 'High physical intensity, slap, force, aggressive pace, heavy friction.', synonyms: ['hardcore', 'intense', 'hard & rough', 'bully'] },
  { name: 'Domination', category: 'Sexual Dynamic & Vibe', description: 'Explicit master/sub dynamic, obedience, submission, commanding control.', synonyms: ['dom', 'dominant', 'submissive', 'obey'] },
  { name: 'Breeding', category: 'Sexual Dynamic & Vibe', description: 'Primal, bareback, internal finish obsession, animalistic drive.', synonyms: ['breed', 'bareback'] },
  { name: 'Power', category: 'Sexual Dynamic & Vibe', description: 'Clear hierarchical contrast, psychological dominance, confidence.', synonyms: ['power dynamic', 'control'] },
  { name: 'Taboo', category: 'Sexual Dynamic & Vibe', description: 'Forbidden psychological themes, illicit settings, transgressive roles.', synonyms: ['forbidden', 'stepbrother', 'brother-in-law', 'workplace'] },
  { name: 'Straight', category: 'Sexual Dynamic & Vibe', description: 'Curious, seduced, first-time, reluctant, or identified straight male scenes.', synonyms: ['str8', 'straight guy', 'curious', 'say uncle'] },
  { name: 'Worship', category: 'Sexual Dynamic & Vibe', description: 'Physical adoration, kissing, devotion, body and cock reverence.', synonyms: ['body worship', 'cock worship'] },
  { name: 'Kinky', category: 'Sexual Dynamic & Vibe', description: 'Fetish gear, leather, rubber, restraints, breath play, sensory focus.', synonyms: ['kink', 'fetish', 'bondage'] },

  // Acts & Mechanics (18-24)
  { name: 'DP', category: 'Acts & Mechanics', description: 'Double penetration, shared penetration by multiple performers.', synonyms: ['double penetration', 'dp scene'] },
  { name: 'Deepthroat', category: 'Acts & Mechanics', description: 'Oral penetration past the throat barrier, gagging, throat hold.', synonyms: ['face fuck', 'throat', 'deep throat'] },
  { name: 'Blowjob', category: 'Acts & Mechanics', description: 'Focused fellatio, oral sex as central act or extended sequence.', synonyms: ['bj', 'oral', 'sucking', 'suck'] },
  { name: 'Rimming', category: 'Acts & Mechanics', description: 'Analingus, oral-anal stimulation as prelude or featured act.', synonyms: ['rim', 'eating ass', 'ass licking'] },
  { name: 'Cumshot', category: 'Acts & Mechanics', description: 'Prominent ejaculation scene, facial, chest, internal or heavy volume.', synonyms: ['load', 'facial', 'internal'] },
  { name: 'Edging', category: 'Acts & Mechanics', description: 'Prolonged arousal maintenance near climax, delay, orgasm control.', synonyms: ['edge', 'ruined orgasm', 'denial'] },
  { name: 'POV', category: 'Acts & Mechanics', description: 'First-person camera angle simulating viewer direct involvement.', synonyms: ['point of view'] },

  // Context & Setting (25-30)
  { name: 'Public', category: 'Context & Setting', description: 'Outdoor, semi-public, risk of discovery, balconies, cars, cruising.', synonyms: ['outdoor', 'outdoors', 'exhibition', 'cruising'] },
  { name: 'Uniform', category: 'Context & Setting', description: 'Police, military, medical, work uniforms, sports kits, tactical gear.', synonyms: ['cops', 'military', 'gear'] },
  { name: 'Amateur', category: 'Context & Setting', description: 'Unproduced aesthetic, handheld phones, real couples, raw authentic look.', synonyms: ['homemade', 'real', 'bedroom'] },
  { name: 'Undercover', category: 'Context & Setting', description: 'Concealed cameras, voyeuristic angles, spy cam framing.', synonyms: ['hidden camera', 'spy', 'voyeur'] },
  { name: 'Group', category: 'Context & Setting', description: 'Three or more performers engaged together, orgy, multi-scene gangbang.', synonyms: ['gangbang', 'orgy', 'threeway', 'tag-team', 'cumdump'] },
  { name: 'Party', category: 'Context & Setting', description: 'Gathering, social atmosphere, group celebration or chill setting.', synonyms: ['sex party', 'chill'] }
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
