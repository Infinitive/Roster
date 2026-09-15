import { Storage } from '../storage/db';
import { createNewVideo } from '../engines/parser';
import { SEED_FILE_LIST } from '../data/seedList';

export async function initializeDatabase() {
  const videos = await Storage.getVideos();
  if (videos.length === 0) {
    console.log('Database empty, parsing seed list...');
    const seedVideos = SEED_FILE_LIST.map(path => {
      // Extract the filename portion (everything after the last slash)
      const filename = path.split('/').pop() || '';
      return createNewVideo(filename, path);
    });
    
    await Storage.saveVideos(seedVideos);
    console.log(`Seeded ${seedVideos.length} videos.`);
  } else {
    console.log(`Database has ${videos.length} videos. Skipping seed.`);
  }
}
