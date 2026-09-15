import { Storage } from '../storage/db';
import { createNewVideo, extractTagsFromText, extractPerformersFromText } from '../engines/parser';
import { SEED_FILE_LIST } from '../data/seedList';
import { CANONICAL_30_TAGS } from '../data/canonicalTags';
import { Tag, Performer } from '../types';

export async function initializeDatabase() {
  const videos = await Storage.getVideos();
  if (videos.length === 0) {
    console.log('Database empty, seeding canonical tags and parsing seed list...');

    // 1. Seed canonical 30 tags
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

    const tagMap = new Map<string, Tag>();
    canonicalTags.forEach(t => tagMap.set(t.normalizedName, t));

    const performerMap = new Map<string, Performer>();

    // 2. Parse seed videos and extract relational entities
    const seedVideos = SEED_FILE_LIST.map(path => {
      const filename = path.split('/').pop() || '';
      const video = createNewVideo(filename, path);

      // Collect any custom tags
      const { tags: extractedTags } = extractTagsFromText(video.originalTags);
      for (const t of extractedTags) {
        if (!tagMap.has(t.normalizedName)) {
          tagMap.set(t.normalizedName, t);
        }
      }

      // Collect performers
      const { performers: extractedPerfs } = extractPerformersFromText(video.performerDisplay);
      for (const p of extractedPerfs) {
        if (!performerMap.has(p.normalizedName)) {
          performerMap.set(p.normalizedName, p);
        }
      }

      return video;
    });

    await Storage.saveTags(Array.from(tagMap.values()));
    await Storage.savePerformers(Array.from(performerMap.values()));
    await Storage.saveVideos(seedVideos);

    console.log(`Seeded ${seedVideos.length} videos, ${tagMap.size} tags, ${performerMap.size} performers.`);
  } else {
    console.log(`Database has ${videos.length} videos. Skipping seed.`);
  }
}
