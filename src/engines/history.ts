import { Session } from '../types';

export interface WatchHistory {
  timesWatched: number;
  firstWatched: string | null;
  lastWatched: string | null;
  daysSinceLastWatched: number | null;
  sessionsInvolved: Session[];
  averageSessionRating: number | null;
}

export function calculateVideoHistory(videoId: string, sessions: Session[]): WatchHistory {
  const involved = sessions.filter(s => s.videoIds.includes(videoId));
  
  if (involved.length === 0) {
    return {
      timesWatched: 0,
      firstWatched: null,
      lastWatched: null,
      daysSinceLastWatched: null,
      sessionsInvolved: [],
      averageSessionRating: null
    };
  }

  const sorted = [...involved].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const firstWatched = sorted[0].date;
  const lastWatched = sorted[sorted.length - 1].date;
  
  const now = new Date();
  const lastDate = new Date(lastWatched);
  const diffTime = now.getTime() - lastDate.getTime();
  const daysSinceLastWatched = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  
  let totalRating = 0;
  let ratedCount = 0;
  involved.forEach(s => {
    if (s.rating !== null && s.rating !== undefined) {
      totalRating += s.rating;
      ratedCount++;
    }
  });

  return {
    timesWatched: involved.length,
    firstWatched,
    lastWatched,
    daysSinceLastWatched,
    sessionsInvolved: involved,
    averageSessionRating: ratedCount > 0 ? Number((totalRating / ratedCount).toFixed(1)) : null
  };
}
