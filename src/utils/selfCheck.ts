/**
 * Self-Check / Unit Validation Script for T9 Collection Registry
 * Run via: npm test
 */

import { CANONICAL_30_TAGS, matchCanonicalTag, classifyTagMatch } from '../data/canonicalTags';
import { CURRENT_SCHEMA_VERSION, migrateDataset } from '../storage/migrations';
import { parseFilename, createNewVideo, extractTagsFromText, extractPerformersFromText } from '../engines/parser';
import { auditDataIntegrity } from '../engines/integrity';
import { ImportExport, ExportData } from '../engines/importExport';
import { calculateAnalytics } from '../engines/analytics';
import { generateDiscovery } from '../engines/discovery';
import { 
  parseInventoryEntry, 
  detectDuplicates, 
  previewIngestion 
} from '../engines/reconciliation';
import { SEED_FILE_LIST } from '../data/seedList';
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
  console.log('\n=== T9 REGISTRY PHASE 5 & 6 INTEGRITY & RECONCILIATION SUITE ===\n');

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

  // Test 2: Phase 6 Conservative Tag Reconciliation
  console.log('\n2. Phase 6 Conservative Tag Reconciliation:');
  const sizeClass = classifyTagMatch('size');
  assert(sizeClass.matchType === 'uncertain', 'Generic word "size" is held as uncertain, not forced to XL');
  const youngClass = classifyTagMatch('young');
  assert(youngClass.matchType === 'uncertain', 'Generic word "young" is held as uncertain, not forced to Twink');
  const rawClass = classifyTagMatch('raw');
  assert(rawClass.matchType === 'uncertain', 'Generic word "raw" is held as uncertain, not forced to Breeding');
  const cumClass = classifyTagMatch('cum');
  assert(cumClass.matchType === 'uncertain', 'Generic word "cum" is held as uncertain, not forced to Cumshot');
  const strokeClass = classifyTagMatch('stroke');
  assert(strokeClass.matchType === 'uncertain', 'Generic word "stroke" is held as uncertain, not forced to Edging');

  const directTwink = classifyTagMatch('Twink');
  assert(directTwink.matchType === 'explicit' && directTwink.canonicalTag?.name === 'Twink', 'Explicit tag "Twink" maps directly');
  const barebackMatch = classifyTagMatch('bareback');
  assert(barebackMatch.matchType === 'strongly-inferred' && barebackMatch.canonicalTag?.name === 'Breeding', 'High-confidence synonym "bareback" maps to Breeding');

  // Test 3: Schema Migration & Versioning
  console.log('\n3. Schema Migration & Version Verification:');
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

  // Test 4: Physical Inventory Ingestion & Provenance Model
  console.log('\n4. Physical Inventory Ingestion & Provenance Model:');
  const testLine = "John's T9/XXX/2/Hard & Rough / Intense/Clay Maverick | White Trash Rough | Rough, Hunk [HD]";
  const { video: parsedVideo } = parseInventoryEntry(testLine, 'real');
  assert(!!parsedVideo, 'Parsed valid physical inventory line');
  assert(parsedVideo?.filename === 'Clay Maverick | White Trash Rough | Rough, Hunk [HD]', 'Preserved exact filename');
  assert(parsedVideo?.relativePath === 'XXX/2/Hard & Rough / Intense/Clay Maverick | White Trash Rough | Rough, Hunk [HD]', 'Preserved canonical relativePath starting at XXX');
  assert(parsedVideo?.performerDisplay === 'Clay Maverick', 'Extracted performerDisplay correctly');
  assert(parsedVideo?.title === 'White Trash Rough', 'Extracted descriptive title correctly');
  assert(parsedVideo?.resolution === '720p', 'Normalized HD resolution to 720p');
  assert(parsedVideo?.datasetType === 'real', 'Dataset type recorded as "real"');
  assert(parsedVideo?.provenance?.performers?.level === 'parsed', 'Provenance level is "parsed"');
  assert(parsedVideo?.provenance?.performers?.source === 'filename', 'Provenance source is "filename"');

  // Test 5: Mismatch Detection (Participant count vs Folder / Performers)
  console.log('\n5. Participant Count vs Physical Folder Mismatch:');
  const mismatchLine = "John's T9/XXX/1 Solo/John & Alex | Two Guys Doing Solo | XL [1080p]";
  const { video: mismatchVideo } = parseInventoryEntry(mismatchLine, 'real');
  assert(
    mismatchVideo?.flags?.includes('participant-folder-mismatch') === true,
    'Flagged participant-folder-mismatch when Solo folder contains multiple performers'
  );

  // Test 6: Duplicate Candidate Detection
  console.log('\n6. Duplicate Candidate Detection:');
  const dup1 = parseInventoryEntry("John's T9/XXX/2 Duo/A | Title 1 | Tag [1080p]").video!;
  const dup2 = parseInventoryEntry("John's T9/XXX/2 Duo/A | Title 1 | Tag [1080p]").video!;
  const dup3 = parseInventoryEntry("John's T9/XXX/0 Favorites/A | Title 1 | Tag [1080p]").video!;
  const dup4 = parseInventoryEntry("John's T9/XXX/3 Threesome/Other | Title 1 | Tag [1080p]").video!;

  const dups = detectDuplicates([dup1, dup2, dup3, dup4]);
  assert(dups.some(d => d.type === 'exact-path'), 'Detected exact relative path duplicate');
  assert(dups.some(d => d.type === 'exact-filename'), 'Detected identical filename across different folders');

  // Test 7: Pre-Commit Reconciliation Report Generator
  console.log('\n7. Pre-Commit Reconciliation Report Generator:');
  const preview = previewIngestion(SEED_FILE_LIST, 'real');
  assert(preview.videos.length === SEED_FILE_LIST.length, `Previewed all ${SEED_FILE_LIST.length} representative fixture records`);
  assert(preview.report.collection.sourceRecordCount === SEED_FILE_LIST.length, 'Report recorded correct source count');
  assert(preview.report.performers.uniqueNormalizedPerformers > 0, `Deduplicated ${preview.report.performers.uniqueNormalizedPerformers} unique normalized performers`);
  assert(Object.keys(preview.report.physical.folderDistribution).length > 0, 'Physical folder distribution calculated');
  assert(preview.report.dataQuality.provenanceCounts.parsed === SEED_FILE_LIST.length, 'All records assigned provenance: parsed');

  // Test 8: Parser & Relational Entity Extraction
  console.log('\n8. Parser & Relational Entity Extraction:');
  const parsedLegacy = parseFilename('John & Alex | Hard Scene | XL, Rough, CustomTag [1080p]', 'XXX/2 Duo/video.mp4');
  assert(parsedLegacy.performerDisplay === 'John & Alex', 'Parsed performerDisplay: John & Alex');
  assert(parsedLegacy.resolution === '1080p', 'Normalized resolution is 1080p');
  assert(parsedLegacy.participantCount === '2', 'Derived participantCount is 2 from Duo folder');

  const { tagIds, tags } = extractTagsFromText('XL, Rough, CustomTag');
  assert(tagIds.length === 3, 'Extracted 3 tag IDs');
  assert(tags.some(t => t.isCanonical && t.name === 'XL'), 'Canonical XL tag entity generated');
  assert(tags.some(t => !t.isCanonical && t.name === 'CustomTag'), 'Custom tag entity generated');

  const { performerIds, performers } = extractPerformersFromText('John & Alex');
  assert(performerIds.length === 2, 'Extracted 2 performer IDs from "John & Alex"');
  assert(performers[0].name === 'John' && performers[1].name === 'Alex', 'Parsed individual performers');

  // Test 9: Integrity Engine Audit
  console.log('\n9. Data Integrity Audit Engine:');
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
    notes: 'Test note',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const dummyPerf: Performer = {
    id: 'PERF-john',
    name: 'John',
    normalizedName: 'john',
    createdAt: Date.now()
  };

  const dummyTag: Tag = {
    id: 'TAG-xl',
    name: 'XL',
    normalizedName: 'xl',
    category: 'Archetype & Identity',
    isCanonical: true,
    createdAt: Date.now()
  };

  const dummySession: Session = {
    id: 'SES-1',
    date: '2026-01-02',
    startTime: '14:00',
    duration: 20,
    videoIds: ['T9-vid-1'],
    rating: 4,
    orgasmStatus: 'Came',
    vibe: 'Aggressive',
    strongCombination: false,
    notes: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const dummyWl: WatchlistItem = {
    id: 'WL-1',
    videoId: 'T9-vid-1',
    status: 'Queue',
    addedDate: '2026-01-02',
    notes: ''
  };

  const cleanAudit = auditDataIntegrity({
    videos: [dummyVideo],
    sessions: [dummySession],
    performers: [dummyPerf],
    tags: [dummyTag],
    watchlist: [dummyWl]
  });
  assert(cleanAudit.summary.healthy === true && cleanAudit.summary.errors === 0, 'Clean dataset reports healthy: true with 0 errors');

  const corruptedAudit = auditDataIntegrity({
    videos: [dummyVideo],
    performers: [dummyPerf],
    tags: [dummyTag],
    sessions: [{
      ...dummySession,
      videoIds: ['NON-EXISTENT-VIDEO-ID']
    }],
    watchlist: [dummyWl]
  });
  assert(corruptedAudit.summary.errors > 0, 'Integrity audit catches session referencing nonexistent video');
  assert(corruptedAudit.summary.healthy === false, 'Corrupted dataset correctly reports healthy: false');

  // Test 10: Import Validation
  console.log('\n10. Import/Export Validation:');
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

  // Test 11: Analytics Engine
  console.log('\n11. Analytics Engine:');
  const emptyAnalytics = calculateAnalytics([], []);
  assert(emptyAnalytics.collection.totalVideos === 0, 'Analytics handles empty dataset gracefully without error');

  const popAnalytics = calculateAnalytics([dummyVideo], [dummySession], [dummyTag], [dummyPerf]);
  assert(popAnalytics.collection.totalVideos === 1, 'Analytics totalVideos is 1');
  assert(popAnalytics.activity.totalSessions === 1, 'Analytics totalSessions is 1');
  assert(popAnalytics.activity.collectionUtilization === 100, 'Utilization is 100% for 1 watched video out of 1');

  // Test 12: Discovery Engine (All 10 modes)
  console.log('\n12. Discovery Engine (10 Modes):');
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
