import { FullAnalytics, VideoAnalytics } from '../types/analytics';
import { DiscoveryMode, DiscoveryResult, DiscoveryOptions } from '../types/discovery';

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateDiscovery(
  mode: DiscoveryMode,
  analytics: FullAnalytics,
  options?: DiscoveryOptions
): DiscoveryResult[] {
  const { videos } = analytics;
  let results: DiscoveryResult[] = [];
  const now = Date.now();

  const toResult = (va: VideoAnalytics, score: number, reasonType: string, reasonText: string, supportingSignals: string[]): DiscoveryResult => ({
    videoId: va.video.id,
    video: va.video,
    mode,
    score,
    reasonType,
    reasonText,
    supportingSignals,
    generatedAt: now
  });

  if (mode === 'Random') {
    const shuffled = shuffle(videos);
    results = shuffled.map(va => toResult(va, 1, 'Random', 'Pure random selection.', []));
  } 
  else if (mode === 'Unwatched') {
    const unwatched = videos.filter(v => v.timesWatched === 0);
    const shuffled = shuffle(unwatched);
    results = shuffled.map(va => toResult(va, 1, 'Unwatched', 'Video has never been logged in a session.', []));
  }
  else if (mode === 'Blind Pull') {
    // Favor novelty, avoid recent repeats
    const scored = videos.map(va => {
      let score = 100;
      score -= va.timesWatched * 10;
      if (va.daysSinceLastWatched !== null) {
        if (va.daysSinceLastWatched < 14) score -= 50;
        else if (va.daysSinceLastWatched < 30) score -= 20;
        else score += 10;
      }
      return { va, score: score + Math.random() * 20 }; // Add randomness
    }).sort((a, b) => b.score - a.score);
    
    results = scored.map(s => toResult(s.va, s.score, 'Novelty', 'Selected to prioritize variety and reduce repetition.', [
      `Watched ${s.va.timesWatched} times`,
      s.va.daysSinceLastWatched !== null ? `${s.va.daysSinceLastWatched} days since last watch` : 'Never watched'
    ]));
  }
  else if (mode === 'Rediscover') {
    // Strong past sessions, not used recently (> 60 days)
    const eligible = videos.filter(v => v.timesWatched > 0 && v.daysSinceLastWatched !== null && v.daysSinceLastWatched > 45);
    const scored = eligible.map(va => {
      let score = va.daysSinceLastWatched || 0;
      if (va.averageSessionRating) score += va.averageSessionRating * 10;
      if (va.video.personalRating) score += va.video.personalRating * 10;
      return { va, score };
    }).sort((a, b) => b.score - a.score);

    results = scored.map(s => toResult(s.va, s.score, 'Rediscover', 'Strong past performance, but has not been seen recently.', [
      `Last watched ${s.va.daysSinceLastWatched} days ago`,
      s.va.averageSessionRating ? `Avg Session: ★ ${s.va.averageSessionRating.toFixed(1)}` : 'No rating'
    ]));
  }
  else if (mode === 'High Signal') {
    const eligible = videos.filter(v => v.timesWatched > 0 && (v.averageSessionRating !== null || v.video.personalRating !== null || v.strongSessionAppearances > 0));
    const scored = eligible.map(va => {
      let score = 0;
      if (va.averageSessionRating) score += va.averageSessionRating * 15;
      if (va.video.personalRating) score += va.video.personalRating * 10;
      score += va.strongSessionAppearances * 20;
      score += Math.min(va.timesWatched, 5) * 5; // Reward some repeat usage, cap at 5
      return { va, score: score + (Math.random() * 10) }; // slight random variation
    }).sort((a, b) => b.score - a.score);

    results = scored.map(s => toResult(s.va, s.score, 'High Signal', 'Strong observed behavioral evidence.', [
      `Watched ${s.va.timesWatched} times`,
      `${s.va.strongSessionAppearances} strong session appearances`
    ]));
  }
  else if (mode === 'Deep Cut') {
    // Low usage, older records, uncommon tags
    const scored = videos.map(va => {
      let score = 50;
      if (va.timesWatched === 0) score += 30;
      else if (va.timesWatched === 1) score += 15;
      else score -= va.timesWatched * 10;

      if (va.daysSinceLastWatched && va.daysSinceLastWatched > 90) score += 20;
      
      // Calculate tag rarity
      if (va.video.originalTags) {
        const tags = va.video.originalTags.split(',').map(t => t.trim());
        let rarityBonus = 0;
        tags.forEach(t => {
          const tStat = analytics.tags.find(ta => ta.tag === t);
          if (tStat && tStat.collectionPercentage < 5) rarityBonus += 5;
        });
        score += rarityBonus;
      }
      return { va, score: score + Math.random() * 20 };
    }).sort((a, b) => b.score - a.score);

    results = scored.map(s => toResult(s.va, s.score, 'Deep Cut', 'Overlooked or lightly represented area of the collection.', [
      `Watched ${s.va.timesWatched} times`,
      s.va.video.originalTags ? 'Contains rare tags' : ''
    ].filter(Boolean)));
  }
  else if (mode === 'Old Favorite') {
    const eligible = videos.filter(v => 
      (v.lifecycle === 'Favorite / High Signal' || v.lifecycle === 'Proven') && 
      v.daysSinceLastWatched !== null && 
      v.daysSinceLastWatched > 60
    );
    const scored = eligible.map(va => ({ va, score: va.daysSinceLastWatched || 0 })).sort((a, b) => b.score - a.score);
    results = scored.map(s => toResult(s.va, s.score, 'Old Favorite', 'Established personal favorite that has been stale.', [
      s.va.lifecycle,
      `${s.va.daysSinceLastWatched} days since last watch`
    ]));
  }
  else if (mode === 'Category Explorer') {
    const type = options?.categoryType;
    const val = options?.categoryValue;
    if (type && val) {
      let filtered = videos;
      if (type === 'Folder') filtered = videos.filter(v => v.video.folder === val);
      if (type === 'Participant Count') filtered = videos.filter(v => v.video.participantCount === val);
      if (type === 'Tag') filtered = videos.filter(v => v.video.originalTags && v.video.originalTags.includes(val));
      if (type === 'Performer') filtered = videos.filter(v => v.video.performerDisplay && v.video.performerDisplay.includes(val));
      if (type === 'Resolution') filtered = videos.filter(v => v.video.resolution === val);
      if (type === 'Vibe') filtered = videos.filter(v => v.video.vibe === val);
      if (type === 'Source') filtered = videos.filter(v => v.video.source === val);
      
      const shuffled = shuffle(filtered);
      results = shuffled.map(va => toResult(va, 1, 'Category', `Exploring category: ${type} = ${val}`, [
        `Matches ${type}`
      ]));
    }
  }
  else if (mode === 'Gap Explorer') {
    const opps = analytics.opportunities;
    const matched = new Set<string>();
    const eligible: {va: VideoAnalytics, opp: typeof opps[0]}[] = [];
    
    opps.forEach(opp => {
      const vids = videos.filter(va => {
        if (matched.has(va.video.id)) return false;
        if (opp.category === 'Tag') return va.video.originalTags?.includes(opp.label);
        if (opp.category === 'Folder') return va.video.folder === opp.label;
        if (opp.category === 'Performer') return va.video.performerDisplay?.includes(opp.label);
        return false;
      });
      vids.forEach(va => {
        eligible.push({ va, opp });
        matched.add(va.video.id);
      });
    });

    const shuffled = shuffle(eligible);
    results = shuffled.map(e => toResult(e.va, e.opp.score, 'Opportunity Signal', e.opp.evidence, [
      `Area: ${e.opp.label} (${e.opp.category})`
    ]));
  }
  else if (mode === 'Surprise Me') {
    const scored = videos.map(va => {
      let score = 50;
      if (va.averageSessionRating) score += va.averageSessionRating * 10;
      if (va.timesWatched === 1) score += 20;
      if (va.timesWatched === 0) score += 10;
      if (va.video.folder === 'Unknown' || va.video.participantCount === 'Unknown') score -= 10;
      if (va.daysSinceLastWatched !== null && va.daysSinceLastWatched < 14) score -= 40;
      
      return { va, score: score + Math.random() * 30 };
    }).sort((a, b) => b.score - a.score);

    results = scored.map(s => toResult(s.va, s.score, 'Surprise', 'A balanced combination of novelty, rarity, and positive signals.', [
      `Lifecycle: ${s.va.lifecycle}`,
      s.va.timesWatched > 0 ? `Watched ${s.va.timesWatched}x` : 'Never watched'
    ]));
  }

  return results;
}
