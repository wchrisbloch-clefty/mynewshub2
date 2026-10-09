// v26b: Supabase — real implementation, replaces the no-op stub.
// Same exported names as before (isCloudSyncEnabled, loadProfileFromCloud,
// saveProfileToCloud, emitEvent) so nothing else in App.jsx has to change.
// New exports (getUserId, signInWithEmail, onAuthStateChange) are additive.

// H4: the @supabase/supabase-js client is ~800 KB of the bundle but is only needed once
// the reader signs in (or returns with a stored session). It is now DYNAMICALLY imported
// on first use, so logged-out/first-paint visitors never download it.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const CONFIGURED = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

let supabase = null;
let _loading = null;
async function getClient() {
  if (!CONFIGURED) return null;
  if (supabase) return supabase;
  if (!_loading) {
    _loading = import('@supabase/supabase-js')
      .then(m => { supabase = m.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); return supabase; })
      .catch(err => { console.error('[cloudSync] failed to load client:', err); _loading = null; return null; });
  }
  return _loading;
}

export const isCloudSyncEnabled = () => CONFIGURED;

// Sync hint used by the app at mount: only auto-init cloud (and thus load the heavy
// client) when there is already a stored Supabase session OR a magic-link token in the
// URL. Everyone else defers the client until they actively sign in.
export function hasCloudSession() {
  try {
    if (typeof window === 'undefined') return false;
    if (/[#&]access_token=/.test(window.location.hash)) return true;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && /^sb-.*-auth-token$/.test(k)) return true;
    }
  } catch {}
  return false;
}

// ─── PROFILE SYNC ──────────────────────────────────────────────────────
export async function loadProfileFromCloud(userId) {
  const supabase = await getClient();
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('newshub_profiles')
    .select('config, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('[cloudSync] loadProfileFromCloud failed:', error.message);
    return null;
  }
  return data ? data.config : null;
}

export async function saveProfileToCloud(userId, config) {
  const supabase = await getClient();
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('newshub_profiles')
    .upsert(
      { user_id: userId, config, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select()
    .maybeSingle();
  if (error) {
    console.error('[cloudSync] saveProfileToCloud failed:', error.message);
    return null;
  }
  return data;
}

// ─── EVENT LOG ─────────────────────────────────────────────────────────
export async function emitEvent(eventType, payload = {}, userId = null) {
  if (typeof window !== 'undefined' && window.__newshub_debug__) {
    console.log('[event-bus]', eventType, payload);
  }
  const supabase = await getClient();
  if (!supabase || !userId) return;
  const { error } = await supabase
    .from('newshub_events')
    .insert({ user_id: userId, event_type: eventType, payload });
  if (error) console.error('[cloudSync] emitEvent failed:', error.message);
}

// ─── AUTH ──────────────────────────────────────────────────────────────
export async function getUserId() {
  const supabase = await getClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

export async function signInWithEmail(email) {
  const supabase = await getClient();
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  return supabase.auth.signInWithOtp({ email });
}

export async function signOut() {
  const supabase = await getClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export function onAuthStateChange(callback) {
  if (!CONFIGURED) return () => {};
  let unsub = () => {};
  let cancelled = false;
  getClient().then(sb => {
    if (cancelled || !sb) return;
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => callback(session?.user || null));
    unsub = () => sub.subscription.unsubscribe();
  });
  return () => { cancelled = true; unsub(); };
}

// ─── SHARED EXTRACT CACHE ────────────────────────────────────────────────
export async function getCachedExtract(url) {
  const supabase = await getClient();
  if (!supabase || !url) return null;
  const { data, error } = await supabase
    .from('newshub_cached_extracts')
    .select('title, text_content, source, extracted_via')
    .eq('url', url)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function setCachedExtract(url, { title, text_content, source, extracted_via }) {
  const supabase = await getClient();
  if (!supabase || !url) return;
  const { error } = await supabase
    .from('newshub_cached_extracts')
    .upsert({ url, title, text_content, source, extracted_via }, { onConflict: 'url' });
  if (error) console.error('[cloudSync] setCachedExtract failed:', error.message);
}
