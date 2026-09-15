import { Video, Session } from '../types';
import { 
  FullAnalytics, 
  CollectionSummary, 
  ActivitySummary, 
  MetadataHealth,
  VideoAnalytics,
  TagAnalytics,
  PerformerAnalytics,
  FolderAnalytics,
  RepresentationBreakdown,
  RepresentationLevel,
  LifecycleClassification,
  DataConfidence,
  MismatchSignal,
  OpportunitySignal,
  CombinationAnalytics
} from '../types/analytics';

function calculateRepresentationLevel(percentage: number, distinctCount: number): RepresentationLevel {
  // Dynamic thresholding based on cardinality could go here.
  // For Phase 3, we use a straightforward heuristic.
  if (percentage >= 20) return 'Highly represented';
  if (percentage >= 5) return 'Moderately represented';
  if (percentage >= 1) return 'Lightly represented';
  return 'Rare';
}

function getConfidence(samples: number): DataConfidence {
  if (samples >= 5) return 'Observed';
  if (samples >= 2) return 'Emerging';
  return 'Insufficient Data';
}

export function calculateAnalytics(videos: Video[], sessions: Session[]): FullAnalytics {
  const totalVideos = videos.length;
  
  // 1. Health
  const health: MetadataHealth = {
    missingPerformer: 0,
    missingTitle: 0,
    missingTags: 0,
    missingParticipantCount: 0,
    unknownResolution: 0,
    unrecognizedFolder: 0,
    totalAffected: 0,
    percentageAffected: 0
  };

  const tagCounts: Record<string, number> = {};
  const performerCounts: Record<string, number> = {};
  const folderCounts: Record<string, number> = {};
  const resolutionCounts: Record<string, number> = {};
  const vibeCounts: Record<string, number> = {};

  const knownFolders = ['0 Favorites', '1 Solo', '2 Duo', '3 Threesome', '4(+) Group'];

  videos.forEach(v => {
    let affected = false;
    if (!v.performerDisplay) { health.missingPerformer++; affected = true; }
    if (!v.title || v.title === v.filename) { health.missingTitle++; affected = true; }
    if (!v.originalTags) { health.missingTags++; affected = true; }
    if (v.participantCount === 'Unknown') { health.missingParticipantCount++; affected = true; }
    if (v.resolution === 'Unknown') { health.unknownResolution++; affected = true; }
    if (!knownFolders.includes(v.folder)) { health.unrecognizedFolder++; affected = true; }
    if (affected) health.totalAffected++;

    const tags = v.originalTags ? v.originalTags.split(',').map(t => t.trim()).filter(Boolean) : [];
    tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);

    const perfs = v.performerDisplay ? v.performerDisplay.split(',').map(p => p.trim()).filter(Boolean) : [];
    perfs.forEach(p => performerCounts[p] = (performerCounts[p] || 0) + 1);

    folderCounts[v.folder] = (folderCounts[v.folder] || 0) + 1;
    resolutionCounts[v.resolution] = (resolutionCounts[v.resolution] || 0) + 1;
    if (v.vibe) vibeCounts[v.vibe] = (vibeCounts[v.vibe] || 0) + 1;
  });

  health.percentageAffected = totalVideos > 0 ? (health.totalAffected / totalVideos) * 100 : 0;

  // Helpers for Breakdown
  const makeBreakdown = (counts: Record<string, number>): RepresentationBreakdown[] => {
    const keys = Object.keys(counts);
    return keys.map(k => {
      const count = counts[k];
      const percentage = totalVideos > 0 ? (count / totalVideos) * 100 : 0;
      return {
        label: k,
        count,
        percentage,
        level: calculateRepresentationLevel(percentage, keys.length)
      };
    }).sort((a, b) => b.count - a.count);
  };

  const collection: CollectionSummary = {
    totalVideos,
    totalPerformers: Object.keys(performerCounts).length,
    totalTags: Object.keys(tagCounts).length,
    participantDistribution: makeBreakdown(videos.reduce((acc, v) => { acc[v.participantCount] = (acc[v.participantCount] || 0) + 1; return acc; }, {} as Record<string, number>)),
    folderDistribution: makeBreakdown(folderCounts),
    resolutionDistribution: makeBreakdown(resolutionCounts),
    vibeDistribution: makeBreakdown(vibeCounts)
  };

  // Activity
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  const validSessions = sessions.filter(s => s.videoIds && s.videoIds.length > 0);
  
  let totalRating = 0;
  let ratedCount = 0;
  let recent30 = 0;
  let recent90 = 0;
  let totalDuration = 0;

  const videoUsageCount: Record<string, number> = {};
  const videoFirstWatch: Record<string, number> = {};
  const videoLastWatch: Record<string, number> = {};
  const videoSessionRatings: Record<string, number[]> = {};
  const videoStrongSessions: Record<string, number> = {};

  // Sort sessions chronological
  const sortedSessions = [...validSessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedSessions.forEach(s => {
    const sTime = new Date(s.date).getTime();
    if (now - sTime <= thirtyDaysMs) recent30++;
    if (now - sTime <= ninetyDaysMs) recent90++;
    if (s.rating) {
      totalRating += s.rating;
      ratedCount++;
    }
    if (s.duration) totalDuration += s.duration;

    s.videoIds.forEach(vid => {
      videoUsageCount[vid] = (videoUsageCount[vid] || 0) + 1;
      if (!videoFirstWatch[vid]) videoFirstWatch[vid] = sTime;
      videoLastWatch[vid] = sTime;
      
      if (s.rating) {
        if (!videoSessionRatings[vid]) videoSessionRatings[vid] = [];
        videoSessionRatings[vid].push(s.rating);
      }
      
      if (s.strongCombination) {
        videoStrongSessions[vid] = (videoStrongSessions[vid] || 0) + 1;
      }
    });
  });

  const uniqueVideosUsed = Object.keys(videoUsageCount).length;

  const activity: ActivitySummary = {
    totalSessions: validSessions.length,
    totalDuration,
    averageSessionRating: ratedCount > 0 ? totalRating / ratedCount : null,
    uniqueVideosUsed,
    collectionUtilization: totalVideos > 0 ? (uniqueVideosUsed / totalVideos) * 100 : 0,
    recent30DaysSessions: recent30,
    recent90DaysSessions: recent90
  };

  // Video Analytics
  const videoAnalytics: VideoAnalytics[] = videos.map(v => {
    const usages = videoUsageCount[v.id] || 0;
    const first = videoFirstWatch[v.id] || null;
    const last = videoLastWatch[v.id] || null;
    
    let lifecycle: LifecycleClassification = 'Unexplored';
    if (usages === 1) lifecycle = 'Discovered';
    else if (usages === 2) lifecycle = 'Retested';
    else if (usages > 2) lifecycle = 'Proven';

    if (v.personalRating && v.personalRating >= 4 && usages >= 2) {
      lifecycle = 'Favorite / High Signal';
    }

    const ratings = videoSessionRatings[v.id] || [];
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    const strongCount = videoStrongSessions[v.id] || 0;
    
    if (usages >= 3 && avgRating && avgRating >= 4) {
      lifecycle = 'Favorite / High Signal';
    }

    const daysSince = last ? Math.max(0, Math.floor((now - last) / (1000 * 60 * 60 * 24))) : null;

    return {
      video: v,
      timesWatched: usages,
      firstWatched: first ? new Date(first).toISOString().split('T')[0] : null,
      lastWatched: last ? new Date(last).toISOString().split('T')[0] : null,
      daysSinceLastWatched: daysSince,
      averageSessionRating: avgRating,
      strongSessionAppearances: strongCount,
      lifecycle,
      isDiscovery: usages === 1
    };
  });

  // Folder Analytics
  const folders: FolderAnalytics[] = Object.keys(folderCounts).map(folder => {
    const vids = videoAnalytics.filter(v => v.video.folder === folder);
    const count = vids.length;
    const watched = vids.filter(v => v.timesWatched > 0).length;
    
    let fTotalR = 0;
    let fCountR = 0;
    vids.forEach(v => {
      if (v.averageSessionRating) {
        fTotalR += v.averageSessionRating;
        fCountR++;
      }
    });

    return {
      folder,
      videoCount: count,
      collectionPercentage: totalVideos > 0 ? (count / totalVideos) * 100 : 0,
      watchedCount: watched,
      unwatchedCount: count - watched,
      utilization: count > 0 ? (watched / count) * 100 : 0,
      averageSessionRating: fCountR > 0 ? fTotalR / fCountR : null
    };
  });

  // Tag Analytics
  const tags: TagAnalytics[] = Object.keys(tagCounts).map(tag => {
    const vids = videoAnalytics.filter(v => v.video.originalTags && v.video.originalTags.includes(tag));
    const count = vids.length;
    
    let sessionCount = 0;
    let strongCount = 0;
    let tTotalR = 0;
    let tCountR = 0;
    let latestE = 0;

    vids.forEach(v => {
      sessionCount += v.timesWatched;
      strongCount += v.strongSessionAppearances;
      if (v.averageSessionRating) {
        tTotalR += v.averageSessionRating * v.timesWatched; // weight by watch
        tCountR += v.timesWatched;
      }
      if (v.lastWatched) {
        const t = new Date(v.lastWatched).getTime();
        if (t > latestE) latestE = t;
      }
    });

    return {
      tag,
      videoCount: count,
      collectionPercentage: totalVideos > 0 ? (count / totalVideos) * 100 : 0,
      sessionCount,
      strongSessionCount: strongCount,
      averageSessionRating: tCountR > 0 ? tTotalR / tCountR : null,
      lastEncountered: latestE > 0 ? new Date(latestE).toISOString().split('T')[0] : null,
      confidence: getConfidence(sessionCount)
    };
  });

  // Performer Analytics
  const performers: PerformerAnalytics[] = Object.keys(performerCounts).map(perf => {
    const vids = videoAnalytics.filter(v => v.video.performerDisplay && v.video.performerDisplay.includes(perf));
    const count = vids.length;
    
    let sessionCount = 0;
    let strongCount = 0;
    let tTotalR = 0;
    let tCountR = 0;
    let vTotalR = 0;
    let vCountR = 0;
    let latestE = 0;
    let uniqueEnc = 0;

    vids.forEach(v => {
      if (v.timesWatched > 0) uniqueEnc++;
      sessionCount += v.timesWatched;
      strongCount += v.strongSessionAppearances;
      
      if (v.averageSessionRating) {
        tTotalR += v.averageSessionRating * v.timesWatched;
        tCountR += v.timesWatched;
      }
      if (v.video.personalRating) {
        vTotalR += v.video.personalRating;
        vCountR++;
      }
      if (v.lastWatched) {
        const t = new Date(v.lastWatched).getTime();
        if (t > latestE) latestE = t;
      }
    });

    return {
      performer: perf,
      videoCount: count,
      collectionPercentage: totalVideos > 0 ? (count / totalVideos) * 100 : 0,
      sessionCount,
      uniqueVideosEncountered: uniqueEnc,
      averageVideoRating: vCountR > 0 ? vTotalR / vCountR : null,
      averageSessionRating: tCountR > 0 ? tTotalR / tCountR : null,
      strongSessionAppearances: strongCount,
      lastEncountered: latestE > 0 ? new Date(latestE).toISOString().split('T')[0] : null
    };
  });

  // Mismatches and Opportunities
  const mismatches: MismatchSignal[] = [];
  const opportunities: OpportunitySignal[] = [];

  // Mismatch evaluations for Tags
  tags.forEach(t => {
    if (t.collectionPercentage > 10 && t.sessionCount <= 1) {
      mismatches.push({
        type: 'High Ownership / Low Activity',
        label: t.tag,
        category: 'Tag',
        evidence: `${t.videoCount} videos owned, but only ${t.sessionCount} sessions.`
      });
    }
    if (t.collectionPercentage < 3 && t.sessionCount > 5) {
      mismatches.push({
        type: 'Low Ownership / High Activity',
        label: t.tag,
        category: 'Tag',
        evidence: `Only ${t.videoCount} videos, but ${t.sessionCount} sessions observed.`
      });
    }
    if (t.collectionPercentage < 5 && t.confidence !== 'Insufficient Data' && t.averageSessionRating && t.averageSessionRating >= 4.0) {
      mismatches.push({
        type: 'Low Ownership / High Success',
        label: t.tag,
        category: 'Tag',
        evidence: `High average rating (${t.averageSessionRating.toFixed(1)}) on a small set of videos (${t.videoCount}).`
      });
      opportunities.push({
        label: t.tag,
        category: 'Tag',
        score: t.averageSessionRating * (100 / Math.max(1, t.collectionPercentage)),
        evidence: `Rarely represented (${t.videoCount} videos) but highly successful (★ ${t.averageSessionRating.toFixed(1)}).`
      });
    }
  });

  // Combinations
  const combos: Record<string, CombinationAnalytics> = {};
  sortedSessions.forEach(s => {
    if (s.videoIds.length > 1) {
      const key = [...s.videoIds].sort().join(',');
      if (!combos[key]) {
        combos[key] = {
          videoIds: [...s.videoIds].sort(),
          occurrences: 0,
          averageRating: null,
          strongOccurrences: 0,
          lastEncountered: null
        };
      }
      const c = combos[key];
      c.occurrences++;
      if (s.strongCombination) c.strongOccurrences++;
      if (s.rating) {
        c.averageRating = c.averageRating ? ((c.averageRating * (c.occurrences - 1)) + s.rating) / c.occurrences : s.rating;
      }
      const sTime = new Date(s.date).getTime();
      if (!c.lastEncountered || sTime > new Date(c.lastEncountered).getTime()) {
        c.lastEncountered = s.date;
      }
    }
  });

  const combinations = Object.values(combos)
    .filter(c => c.occurrences > 1 || c.strongOccurrences > 0)
    .sort((a, b) => b.occurrences - a.occurrences);

  return {
    collection,
    activity,
    health,
    videos: videoAnalytics,
    tags: tags.sort((a, b) => b.videoCount - a.videoCount),
    performers: performers.sort((a, b) => b.videoCount - a.videoCount),
    folders: folders.sort((a, b) => b.videoCount - a.videoCount),
    mismatches,
    opportunities: opportunities.sort((a, b) => b.score - a.score),
    combinations
  };
}
