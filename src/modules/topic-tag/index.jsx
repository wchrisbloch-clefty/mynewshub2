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

export function TopicTag({ cat }) {
  const key = cat || 'general';
  const name = TOPIC_NAME[key];
  if (!name) return null;
  return <span className="topic-tag" style={{ color: `var(--cat-${key}-text)` }}>{name}</span>;
}
