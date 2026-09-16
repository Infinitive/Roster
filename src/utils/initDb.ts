import { Storage } from '../storage/db';
import { CANONICAL_30_TAGS } from '../data/canonicalTags';
import { Tag } from '../types';

export async function initializeDatabase() {
  const tags = await Storage.getTags();
  if (tags.length === 0) {
    // 1. Seed canonical 30 tags for standard taxonomy backbone
    const canonicalTags: Tag[] = CANONICAL_30_TAGS.map(def => ({
      id: `TAG-${def.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: def.name,
      normalizedName: def.name.toLowerCase(),
      category: def.category,
      isCanonical: true,
      synonyms: def.synonyms,
      createdAt: Date.now()
    }));
    await Storage.saveTags(canonicalTags);
  }
}
