// Thin identity — used in Research Hub and truth-first contexts.
// No teaching style, no forced connections — lets the analysis breathe.
export const CB_IDENTITY = `You are CB's Intelligence System — research analyst, truth-seeker, and knowledge hub.

WHO CB IS:
Mid-to-late 30s, Houston TX. BD professional. Family-first, long-game operator. Stoic philosophy, systems thinker. Always hunting tipping points, compounding effects, Blue Ocean opportunities.

CB'S GOALS:
- Financial: $10K+/mo passive income (dividends, real estate, business revenue)
- Health: performance + longevity (Attia, Huberman frameworks)
- Building: scalable, sellable, modular businesses
- Priority: W2 protection → passive income → business building

DECISIVENESS RULE: Every output ends with a clear recommendation, action, or bet. No vagueness.`;

// Full learning spine — used in Learn, Chat, and Growth modules.
// Adds teaching style, mental model library, and cross-reference rules.
export const CB_LEARNING_SPINE = CB_IDENTITY + `

HOW CB LEARNS:
- Big picture FIRST — thesis then details. Never build to the point.
- Lead with: #1 insight → supporting evidence → so-what implication
- Sports analogies first, everyday life second. Simple and sticky.
- Blunt on hard truths — no cushioning
- Systems thinker — tipping points, compounding, inflection moments
- Blue Ocean default — uncontested space over competing harder
- Stoic: adversity is data, not crisis

CB'S MENTAL MODEL LIBRARY (connect automatically):
Extreme Ownership (Willink) — radical accountability
Chip War (Miller) — semiconductor geopolitics, chokepoints
The New Map (Yergin) — energy geopolitics
Winning (Welch) — candor, differentiation, people-first
Never Split the Difference (Voss) — tactical empathy, negotiation
The Tipping Point (Gladwell) — contagion, connectors
Greenlights (McConaughey) — memoir, resilience
Fortitude (Crenshaw) — mental toughness
Coffee Bean (Gordon) — mindset, environment vs. response
Essays of Warren Buffett — compounding, moats, long-term value
7 Habits (Covey) — character ethics, interdependence
Tools of Titans (Ferriss) — systems of high performers
Transfluence (Rakowich) — Humility, Honesty, Heart
Influence (Cialdini) — persuasion, reciprocity, social proof
The Snowball Effect — compounding, patience
Power of Positive Leadership (Gordon) — energy, vision, culture
A Life Well Played (Palmer) — integrity, legacy
Laws of Human Nature (Greene) — human behavior, motivations
Man's Search for Meaning (Frankl) — purpose, suffering, resilience
Thinking Fast and Slow (Kahneman) — System 1/2, cognitive bias

MASTER EXPERT RULE: For every topic, book, document, or video — become world-class in all surrounding subject matter automatically. Go deep without being asked.
CROSS-REFERENCE RULE: Always connect to CB's mental model library. Make connections explicit.`;

// Alias for any references not yet migrated
export const CB_SPINE = CB_LEARNING_SPINE;

export const KNOWN_BOOKS = [
  { title: "Extreme Ownership", author: "Jocko Willink", type: "leadership", color: "#ff6644" },
  { title: "Chip War", author: "Chris Miller", type: "systems", color: "#00FFB2" },
  { title: "The New Map", author: "Daniel Yergin", type: "systems", color: "#4488ff" },
  { title: "Winning", author: "Jack Welch", type: "business", color: "#ffcc44" },
  { title: "Never Split the Difference", author: "Chris Voss", type: "negotiation", color: "#ff4488" },
  { title: "The Tipping Point", author: "Malcolm Gladwell", type: "systems", color: "#44ffcc" },
  { title: "Greenlights", author: "Matthew McConaughey", type: "memoir", color: "#88ff44" },
  { title: "Fortitude", author: "Dan Crenshaw", type: "stoic", color: "#ff8844" },
  { title: "Coffee Bean", author: "Jon Gordon", type: "stoic", color: "#cc8844" },
  { title: "Essays of Warren Buffett", author: "Warren Buffett", type: "business", color: "#ffaa00" },
  { title: "7 Habits of Highly Effective People", author: "Stephen Covey", type: "leadership", color: "#4466ff" },
  { title: "Tools of Titans", author: "Tim Ferriss", type: "business", color: "#ff44cc" },
  { title: "Transfluence", author: "Walt Rakowich", type: "leadership", color: "#44ccff" },
  { title: "Influence", author: "Robert Cialdini", type: "negotiation", color: "#ff4466" },
  { title: "The Snowball Effect", author: "Alice Schroeder", type: "business", color: "#ffdd44" },
  { title: "Power of Positive Leadership", author: "Jon Gordon", type: "leadership", color: "#44ff88" },
  { title: "A Life Well Played", author: "Arnold Palmer", type: "memoir", color: "#88ccff" },
  { title: "Laws of Human Nature", author: "Robert Greene", type: "negotiation", color: "#cc44ff" },
  { title: "Man's Search for Meaning", author: "Viktor Frankl", type: "stoic", color: "#ffccaa" },
  { title: "Thinking Fast and Slow", author: "Daniel Kahneman", type: "systems", color: "#44ffff" },
];

export const TYPE_META = {
  leadership: { icon: "🎯", label: "Leadership", color: "#ff6644" },
  systems:    { icon: "⚙️", label: "Systems/Macro", color: "#00FFB2" },
  business:   { icon: "📈", label: "Business", color: "#ffcc44" },
  negotiation:{ icon: "🤝", label: "Negotiation", color: "#ff4488" },
  memoir:     { icon: "📖", label: "Memoir", color: "#88ff44" },
  stoic:      { icon: "🪨", label: "Stoic/Character", color: "#ff8844" },
  fiction:    { icon: "🎭", label: "Fiction", color: "#aa88ff" },
  other:      { icon: "📚", label: "General", color: "#4488ff" },
};

export const ENTRY_MODES = [
  { id: "book",     icon: "📚", label: "Book",          desc: "Full package, read-along, reference, or open discussion.", color: "#00FFB2" },
  { id: "document", icon: "📄", label: "Document",      desc: "PDF, Word, Excel, PowerPoint, image, or web link.",       color: "#4488ff" },
  { id: "topic",    icon: "🎓", label: "Topic / Course", desc: "Name any subject. I build a structured course.",          color: "#ff8844" },
  { id: "youtube",  icon: "▶️", label: "YouTube",       desc: "Paste a URL. I extract the transcript and teach you.",    color: "#ff4444" },
];

export const SESSION_MODES = [
  { id: "package",   icon: "📦", label: "Full Package",   desc: "Complete intelligence brief. Format negotiated first." },
  { id: "readalong", icon: "📍", label: "Read Along",     desc: "Mid-book. I pre-map everything, work section by section." },
  { id: "reference", icon: "🔍", label: "Deep Reference", desc: "Master-expert depth on specific concepts or frameworks." },
  { id: "socratic",  icon: "🧠", label: "Socratic Mode",  desc: "I quiz you. You answer. I correct and build. Active recall." },
  { id: "chat",      icon: "💬", label: "Open Discussion", desc: "Explore ideas, make connections. Most flexible." },
];

export const NAV_ITEMS = [
  { id: "home",     icon: "⌂",  label: "Home",     accent: "#00FFB2" },
  { id: "learn",    icon: "📚", label: "Learn",    accent: "#00FFB2" },
  { id: "research", icon: "🔭", label: "Research", accent: "#6366F1" },
  { id: "projects", icon: "🚀", label: "Projects", accent: "#ff8844" },
  { id: "vault",    icon: "🏛", label: "Vault",    accent: "#ffcc44" },
  { id: "growth",   icon: "📈", label: "Growth",   accent: "#44ffcc" },
];

export const CHAT_MODES = [
  { id: "synthesis", label: "Synthesis",       icon: "⚡", desc: "Connect ideas across everything you know" },
  { id: "socratic",  label: "Socratic",        icon: "🧠", desc: "Question-driven active recall" },
  { id: "reference", label: "Reference",       icon: "🔍", desc: "Master-expert depth on demand" },
  { id: "advisor",   label: "Project Advisor", icon: "🚀", desc: "Apply your knowledge to active projects" },
  { id: "truth",     label: "Truth Seeker",    icon: "🎯", desc: "Cut through noise, find the signal" },
];

export const PROJECT_CATEGORIES = {
  finance:  { label: "Finance",  color: "#00FFB2", icon: "💰" },
  business: { label: "Business", color: "#6366F1", icon: "📊" },
  health:   { label: "Health",   color: "#ff8844", icon: "⚡" },
  learning: { label: "Learning", color: "#ffcc44", icon: "📚" },
  other:    { label: "Other",    color: "#4488ff", icon: "🎯" },
};

export const PROJECT_STATUSES = [
  { id: "planning",    label: "Planning",    color: "#6366F1" },
  { id: "active",      label: "Active",      color: "#00FFB2" },
  { id: "review",      label: "Review",      color: "#ffcc44" },
  { id: "done",        label: "Done",        color: "#44ff88" },
];

export const ACCEPT_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.heic";
export const STORAGE_KEY  = "aether_hub_v1";
export const GRAPH_KEY    = "aether_graph_v1";
export const PROJECTS_KEY = "aether_projects_v1";
export const NOTES_KEY    = "aether_notes_v1";
export const RESEARCH_KEY = "aether_research_v1";

export const CONTENT_TYPES = [
  { id: 'nonfiction',  label: 'Non-Fiction / Business', icon: '📊', color: '#00FFB2', examples: 'Business, finance, science, self-help' },
  { id: 'fiction',     label: 'Literary Fiction',       icon: '📖', color: '#ff8844', examples: 'Novels, short stories, literary works' },
  { id: 'scifi',       label: 'Sci-Fi / Fantasy',       icon: '🚀', color: '#6366F1', examples: 'Science fiction, fantasy, speculative' },
  { id: 'history',     label: 'History / Biography',    icon: '🏛', color: '#ffcc44', examples: 'History, biography, memoir' },
  { id: 'academic',    label: 'Academic / Textbook',    icon: '🎓', color: '#4488ff', examples: 'Textbooks, research papers, higher ed' },
  { id: 'reference',   label: 'Reference / Technical',  icon: '📋', color: '#ff4488', examples: 'Legal, medical, technical manuals' },
  { id: 'training',    label: 'Training / Professional',icon: '💼', color: '#44ffcc', examples: 'Corporate training, certifications' },
  { id: 'philosophy',  label: 'Philosophy / Theory',    icon: '🧠', color: '#aa88ff', examples: 'Philosophy, critical theory, ethics' },
];

export const READER_GOALS = [
  { id: 'master',  label: 'Master Deeply',    icon: '🎯', desc: 'Full comprehension and long-term retention' },
  { id: 'exam',    label: 'Exam / Cert Prep', icon: '📝', desc: 'Test readiness, key concepts, likely questions' },
  { id: 'apply',   label: 'Apply to Work',    icon: '⚡', desc: 'Extract frameworks for immediate application' },
  { id: 'discuss', label: 'Discuss & Explore',icon: '💬', desc: 'Think out loud, debate, explore ideas' },
  { id: 'quick',   label: 'Quick Take',       icon: '🔍', desc: 'Core ideas fast, no deep dive needed' },
];

export const DEPTH_LEVELS = [
  { id: 'surface',  label: 'Surface',   desc: 'Key ideas, brief answers' },
  { id: 'standard', label: 'Standard',  desc: 'Full explanation with examples' },
  { id: 'deep',     label: 'Deep Dive', desc: 'Full reasoning, multiple perspectives' },
  { id: 'expert',   label: 'Expert',    desc: 'Peer-level discourse, challenge everything' },
];

export const READING_PROGRESS_OPTIONS = [
  { id: 'start',     label: 'Just Starting',    icon: '📖' },
  { id: 'mid',       label: 'Mid-Way',          icon: '🔖' },
  { id: 'done',      label: 'Finished',         icon: '✓' },
  { id: 'reference', label: 'Reference Lookup', icon: '🔍' },
];

export const THEME_DARK = {
  '--bg':            '#08080f',
  '--bg-alt':        '#060610',
  '--bg-nav':        '#080812',
  '--surface':       '#0c0c18',
  '--surf2':         '#12122a',
  '--border':        '#1e2a38',
  '--bord2':         '#1a1a2e',
  '--border-dim':    'rgba(30,42,56,0.25)',
  '--overlay':       'rgba(7,13,20,0.82)',
  '--text':          '#ffffff',
  '--text-b':        '#c8d4e0',
  '--text-c':        '#b0c0d0',
  '--muted':         '#6a7890',
  '--subtle':        '#5a6880',
  '--dim':           '#4a5870',
  '--u-bubble':      '#12122a',
  '--u-bubble-b':    '#2a2a45',
  '--u-bubble-text': '#c0d0e0',
  '--scrollbar':     '#2a3548',
  '--scrollbar-h':   '#3a4558',
};

export const THEME_LIGHT = {
  '--bg':            '#f3f5f9',
  '--bg-alt':        '#eef1f7',
  '--bg-nav':        '#f0f2f8',
  '--surface':       '#ffffff',
  '--surf2':         '#e8f0ff',
  '--border':        '#dde3ee',
  '--bord2':         '#e5e9f4',
  '--border-dim':    'rgba(180,190,210,0.4)',
  '--overlay':       'rgba(30,41,59,0.45)',
  '--text':          '#0f172a',
  '--text-b':        '#1e293b',
  '--text-c':        '#334155',
  '--muted':         '#64748b',
  '--subtle':        '#64748b',
  '--dim':           '#94a3b8',
  '--u-bubble':      '#e8f0ff',
  '--u-bubble-b':    '#bfd4f0',
  '--u-bubble-text': '#1e3a5f',
  '--scrollbar':     '#c5d0df',
  '--scrollbar-h':   '#b0bccf',
};
