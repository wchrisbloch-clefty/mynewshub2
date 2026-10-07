// src/modules/voices/seeds.js — E4 seed review queue (SUGGESTIONS, never auto-followed).
//
// These are names only. Per E4 + E2, handles are NOT stored here: every seed must go
// through the add+confirm flow (api/voices-resolve) before any handle is saved, so we
// never ship a guessed handle. The UI shows each as "suggested" with Accept / Skip.
//
// Category keys map to the app's categories: general, business, bloom (Energy),
// tech (AI & Tech), sports, health, popculture.
//
// Ancient Mysteries: the category does not exist yet. Per E4 ("add the category only if
// I confirm; otherwise park these in Pop Culture and flag it") these are parked in
// popculture with _parkedFrom:'ancient-mysteries' so the UI can flag them and you can
// decide. DEFAULT_SOCIAL handles migrate separately in App as status:'seed'.

const seed = (name, type, category, extra = {}) => ({ name, type, category, status: 'seed', ...extra });

export const SEED_VOICES = [
  // General
  seed('Peter Zeihan', 'person', 'general'),
  seed('Ian Bremmer', 'person', 'general'),
  seed('Reuters', 'org', 'general'),
  seed('Associated Press', 'org', 'general'),
  seed('Axios', 'org', 'general'),
  seed('Council on Foreign Relations', 'org', 'general'),

  // Business
  seed('Howard Marks', 'person', 'business'),
  seed('Liz Ann Sonders', 'person', 'business'),
  seed('Harry Stebbings', 'person', 'business'),
  seed('Jeff Immelt', 'person', 'business'),
  seed('Federal Reserve', 'org', 'business'),
  seed('CNBC', 'org', 'business'),
  seed('Bloomberg Markets', 'org', 'business'),

  // Energy (bloom)
  seed('Daniel Yergin', 'person', 'bloom'),
  seed('Javier Blas', 'person', 'bloom'),
  seed('Alex Epstein', 'person', 'bloom'),
  seed('Jeff Krimmel', 'person', 'bloom'),
  seed('Doug Sheridan', 'person', 'bloom'),
  seed('EIA', 'org', 'bloom'),
  seed('IEA', 'org', 'bloom'),
  seed('Rystad Energy', 'org', 'bloom'),
  seed('Constellation', 'org', 'bloom'),
  seed('Vistra', 'org', 'bloom'),
  seed('NRG', 'org', 'bloom'),
  seed('Bloom Energy', 'org', 'bloom'),

  // AI & Tech (tech)
  seed('Sam Altman', 'person', 'tech'),
  seed('Andrej Karpathy', 'person', 'tech'),
  seed('Demis Hassabis', 'person', 'tech'),
  seed('Andrew Ng', 'person', 'tech'),
  seed('Ben Thompson', 'person', 'tech'),
  seed('OpenAI', 'org', 'tech'),
  seed('Anthropic', 'org', 'tech'),
  seed('Google DeepMind', 'org', 'tech'),
  seed('NVIDIA', 'org', 'tech'),
  seed('CoreWeave', 'org', 'tech'),
  seed('Equinix', 'org', 'tech'),
  seed('John Chambers', 'person', 'tech'), // AetherHub verified list

  // Sports — people (teams come from followedTeams; ESPN added as an org)
  seed('Adam Schefter', 'person', 'sports'),
  seed('Ian Rapoport', 'person', 'sports'),
  seed('Shams Charania', 'person', 'sports'),
  seed('Jeff Passan', 'person', 'sports'),
  seed('Pete Thamel', 'person', 'sports'),
  seed('ESPN', 'org', 'sports'),

  // Health
  seed('Peter Attia', 'person', 'health'),
  seed('Andrew Huberman', 'person', 'health'),
  seed('Rhonda Patrick', 'person', 'health'),
  seed('David Sinclair', 'person', 'health'),
  seed('NIH', 'org', 'health'),
  seed('CDC', 'org', 'health'),
  seed('Oura', 'org', 'health'),
  seed('Whoop', 'org', 'health'),

  // Pop Culture
  seed('Deadline', 'org', 'popculture'),
  seed('Variety', 'org', 'popculture'),
  seed('The Hollywood Reporter', 'org', 'popculture'),
  seed('Pitchfork', 'org', 'popculture'),
  seed('Rolling Stone', 'org', 'popculture'),

  // AetherHub verified people not already listed
  seed('Jocko Willink', 'person', 'general'),
  seed('Chris Voss', 'person', 'business'),

  // Ancient Mysteries — parked in Pop Culture, flagged (category pending your confirm)
  seed('Jesse Michels', 'person', 'popculture', { _parkedFrom: 'ancient-mysteries' }),
  seed('MrBallen', 'person', 'popculture', { _parkedFrom: 'ancient-mysteries' }),
  seed('Annie Jacobsen', 'person', 'popculture', { _parkedFrom: 'ancient-mysteries' }),
  seed('Graham Hancock', 'person', 'popculture', { _parkedFrom: 'ancient-mysteries' }),
];
