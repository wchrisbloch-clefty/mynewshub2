// src/state — the enabling state layer (I1). High-frequency, change-rate-isolated
// slices live here as external stores with selector hooks, so a fast update (a live
// score tick) re-renders only its subscribers, never App or the feed pages.
//
// Current slices:
//   scores — live sports scores (polled). Hook: useScores(). Controls: configureScores,
//            loadScores, anyLiveGame. Readers: ActiveScoresBar, Scoreboard, SportsPage.
export { useScores } from './useScores';
export { configureScores, loadScores, anyLiveGame, subscribeScores, getScoresSnapshot } from './scoresStore';
