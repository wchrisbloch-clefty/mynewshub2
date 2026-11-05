// S13: the TOPIC of a story, shown as the first token of an existing meta line so a reader can
// tell which section a headline belongs to on mixed-topic surfaces (Home Top Stories, State of
// Play, breaking, Connections, Trending, search, Briefing, Saved, Voices). It uses the article's
// own feed category (never an inferred label) and the category's identity colour (P1 token). It
// lives INSIDE the meta line, so it adds no new row. Omit it on single-category pages (redundant).
import './topic-tag.css';

// Nav-facing names (CB's list). finance folds into Business & Markets.
const TOPIC_NAME = {
  general: 'News', business: 'Business & Markets', finance: 'Business & Markets', bloom: 'Energy',
  tech: 'AI & Tech', sports: 'Sports', health: 'Health', popculture: 'Pop Culture',
  comedy: 'Comedy', local: 'Houston',
};

// U3: this is the ONE category label component. It renders --fs-label / --fw-semibold / uppercase
// / --tracking-label (tokens, not one-off px) in the category's identity colour (>=4.5:1 on
// --surface in both themes — see docs/design/contrast-U3.md). When it sits ON a photo (e.g. the
// Top Stories hero lead, over the dark scrim) pass onMedia so it switches to the full-opacity
// --on-media white instead of the dark category colour, which would be low-contrast there.
export function TopicLabel({ cat, onMedia }) {
  const key = cat || 'general';
  const name = TOPIC_NAME[key];
  if (!name) return null;
  const color = onMedia ? 'var(--on-media)' : `var(--cat-${key}-text)`;
  return <span className="topic-tag" style={{ color }}>{name}</span>;
}
// Back-compat alias: existing call sites import { TopicTag }. Same component, one definition.
export const TopicTag = TopicLabel;
