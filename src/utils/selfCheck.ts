/**
 * Self-Check / Unit Validation Script for T9 Collection Registry
 * Run via: npx tsx src/utils/selfCheck.ts
 */

import { CANONICAL_30_TAGS, matchCanonicalTag } from '../data/canonicalTags';
import { CURRENT_SCHEMA_VERSION, migrateDataset } from '../storage/migrations';
import { parseFilename, createNewVideo, extractTagsFromText, extractPerformersFromText } from '../engines/parser';
import { auditDataIntegrity } from '../engines/integrity';
import { ImportExport, ExportData } from '../engines/importExport';
import { calculateAnalytics } from '../engines/analytics';
import { generateDiscovery } from '../engines/discovery';
import { Video, Session, Performer, Tag, WatchlistItem } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${description}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${description}`);
  }
}

async function runAllChecks() {
  console.log('\n=== T9 REGISTRY PHASE 5 SELF-CHECK ===\n');

  // Test 1: Canonical 30 Tags
  console.log('1. Canonical 30 Tags Vocabulary:');
  assert(CANONICAL_30_TAGS.length === 30, `Exactly 30 canonical tags defined (found ${CANONICAL_30_TAGS.length})`);
  const categories = Array.from(new Set(CANONICAL_30_TAGS.map(t => t.category)));
  assert(categories.length === 4, `All 4 categories present: ${categories.join(', ')}`);
  
  const xlMatch = matchCanonicalTag('xxl');
  assert(xlMatch?.name === 'XL', 'Synonym "xxl" maps to canonical tag "XL"');
  const dpMatch = matchCanonicalTag('Double Penetration');
  assert(dpMatch?.name === 'DP', 'Synonym "Double Penetration" maps to canonical tag "DP"');
  const roughMatch = matchCanonicalTag('rough');
  assert(roughMatch?.name === 'Rough', 'Case-insensitive "rough" maps to "Rough"');

  // Test 2: Schema Migration & Versioning
  console.log('\n2. Schema Migration & Version Verification:');
  assert(CURRENT_SCHEMA_VERSION === 2, `Current schema version is 2 (got ${CURRENT_SCHEMA_VERSION})`);

  const v1Data = {
    schemaVersion: 1,
    videos: [{ id: 'T9-1', filename: 'A | B | C [1080p]', originalTags: 'XL, Muscle', performerDisplay: 'John' }],
    sessions: [{ id: 'SES-1', date: '2026-01-01', videoIds: ['T9-1'] }]
  };
  const migrationResult = migrateDataset(v1Data);
  assert(migrationResult.migrated === true, 'v1 dataset successfully flagged as migrated');
  assert(migrationResult.data.schemaVersion === 2, 'Migrated dataset has schemaVersion 2');
  assert(migrationResult.data.videos[0].status === 'Active', 'Default status "Active" populated on v1 video');

  let futureBlocked = false;
  try {
    migrateDataset({ schemaVersion: 99, videos: [] });
  } catch (err) {
    futureBlocked = true;
  }
  assert(futureBlocked, 'Future schema version 99 is rejected safely');

  // Test 3: Parser & Relational Entity Extraction
  console.log('\n3. Parser & Relational Entity Extraction:');
  const parsed = parseFilename('John & Alex | Hard Scene | XL, Rough, CustomTag [1080p]', 'XXX/2 Duo/video.mp4');
  assert(parsed.performerDisplay === 'John & Alex', 'Parsed performerDisplay: John & Alex');
  assert(parsed.resolution === '1080p', 'Normalized resolution is 1080p');
  assert(parsed.participantCount === '2', 'Derived participantCount is 2 from Duo folder');

  const { tagIds, tags } = extractTagsFromText('XL, Rough, CustomTag');
  assert(tagIds.length === 3, 'Extracted 3 tag IDs');
  assert(tags.some(t => t.isCanonical && t.name === 'XL'), 'Canonical XL tag entity generated');
  assert(tags.some(t => !t.isCanonical && t.name === 'CustomTag'), 'Custom tag entity generated');

  const { performerIds, performers } = extractPerformersFromText('John & Alex');
  assert(performerIds.length === 2, 'Extracted 2 performer IDs from "John & Alex"');
  assert(performers[0].name === 'John' && performers[1].name === 'Alex', 'Parsed individual performers');

  // Test 4: Integrity Engine Audit
  console.log('\n4. Data Integrity Audit Engine:');
  const dummyVideo: Video = {
    id: 'T9-vid-1',
    filename: 'Test | Video | XL [1080p]',
    relativePath: 'XXX/1 Solo/test.mp4',
    participantCount: '1',
    folder: '1 Solo',
    performerIds: ['PERF-john'],
    performerDisplay: 'John',
    title: 'Video',
    tagIds: ['TAG-xl'],
    originalTags: 'XL',
    resolution: '1080p',
    originalResolution: '1080p',
    source: 'Studio',
    duration: 30,
    dateAdded: '2026-01-01',
    personalRating: 5,
    vibe: 'Aggressive',
    status: 'Active',
    notes: '',
    createdAt: 1000,
    updatedAt: 1000
  };

  const dummyPerf: Performer = { id: 'PERF-john', name: 'John', normalizedName: 'john' };
  const dummyTag: Tag = { id: 'TAG-xl', name: 'XL', normalizedName: 'xl', category: 'Archetype & Identity', isCanonical: true };
  const dummySession: Session = {
    id: 'SES-1',
    date: '2026-02-01',
    startTime: '20:00',
    duration: 45,
    videoIds: ['T9-vid-1'],
    rating: 5,
    orgasmStatus: 'Came',
    vibe: 'Aggressive',
    strongCombination: false,
    notes: '',
    createdAt: 2000,
    updatedAt: 2000
  };
  const dummyWl: WatchlistItem = {
    id: 'WL-1',
    videoId: 'T9-vid-1',
    status: 'Queue',
    addedDate: '2026-02-01',
    notes: ''
  };

  // Clean dataset audit
  const cleanAudit = auditDataIntegrity({
    videos: [dummyVideo],
    performers: [dummyPerf],
    tags: [dummyTag],
    sessions: [dummySession],
    watchlist: [dummyWl]
  });
  assert(cleanAudit.summary.healthy === true, 'Clean dataset reports healthy: true with 0 errors');

  // Corrupted dataset with missing video reference in session
  const corruptedAudit = auditDataIntegrity({
    videos: [dummyVideo],
    performers: [dummyPerf],
    tags: [dummyTag],
    sessions: [{
      ...dummySession,
      id: 'SES-broken',
      videoIds: ['NON-EXISTENT-VIDEO-ID']
    }],
    watchlist: [dummyWl]
  });
  assert(corruptedAudit.summary.errors > 0, 'Integrity audit catches session referencing nonexistent video');
  assert(corruptedAudit.summary.healthy === false, 'Corrupted dataset correctly reports healthy: false');

  // Test 5: Import Validation
  console.log('\n5. Import/Export Validation:');
  const validExport: ExportData = {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    app: 'T9 Collection Registry',
    videos: [dummyVideo],
    sessions: [dummySession],
    performers: [dummyPerf],
    tags: [dummyTag],
    watchlist: [dummyWl],
    settings: []
  };
  const validResult = ImportExport.validateImportData(JSON.stringify(validExport));
  assert(validResult.isValid === true && validResult.canProceed === true, 'Valid JSON passes pre-flight validation');

  const malformedResult = ImportExport.validateImportData('{ "schemaVersion": 2, invalid json ');
  assert(malformedResult.isValid === false && malformedResult.canProceed === false, 'Malformed JSON syntax caught cleanly');

  // Test 6: Analytics Engine
  console.log('\n6. Analytics Engine:');
  // Empty dataset test
  const emptyAnalytics = calculateAnalytics([], []);
  assert(emptyAnalytics.collection.totalVideos === 0, 'Analytics handles empty dataset gracefully without error');

  // Populated dataset test
  const popAnalytics = calculateAnalytics([dummyVideo], [dummySession], [dummyTag], [dummyPerf]);
  assert(popAnalytics.collection.totalVideos === 1, 'Analytics totalVideos is 1');
  assert(popAnalytics.activity.totalSessions === 1, 'Analytics totalSessions is 1');
  assert(popAnalytics.activity.collectionUtilization === 100, 'Utilization is 100% for 1 watched video out of 1');

  // Test 7: Discovery Engine (All 10 modes)
  console.log('\n7. Discovery Engine (10 Modes):');
  const modes = [
    'Random',
    'Blind Pull',
    'Rediscover',
    'Unwatched',
    'High Signal',
    'Deep Cut',
    'Old Favorite',
    'Category Explorer',
    'Gap Explorer',
    'Surprise Me'
  ] as const;

  for (const mode of modes) {
    const results = generateDiscovery(mode, popAnalytics, { categoryType: 'Tag', categoryValue: 'XL' });
    assert(Array.isArray(results), `Mode "${mode}" executed and returned result array`);
  }

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) {
    throw new Error(`Self check failed with ${failed} failure(s)`);
  }
}

runAllChecks().catch((err) => {
  console.error('Fatal self-check error:', err);
  process.exit(1);
});
