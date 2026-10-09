// React binding for the live-scores store (I1). A component that calls useScores()
// subscribes ONLY to the scores slice — a score tick re-renders it and nothing above it.
import { useSyncExternalStore } from 'react';
import { subscribeScores, getScoresSnapshot } from './scoresStore';

// Returns { scores, loading }. getServerSnapshot === getSnapshot (SSR-safe: empty store).
export function useScores() {
  return useSyncExternalStore(subscribeScores, getScoresSnapshot, getScoresSnapshot);
}
