// v26b: Supabase — real implementation, replaces the no-op stub.
// Same exported names as before (isCloudSyncEnabled, loadProfileFromCloud,
// saveProfileToCloud, emitEvent) so nothing else in App.jsx has to change.
// New exports (getUserId, signInWithEmail, onAuthStateChange) are additive.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else if (typeof window !== 'undefined') {
  console.warn('[cloudSync] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — cloud sync disabled, running local-only.');
}

export const isCloudSyncEnabled = () => !!supabase;

// ─── PROFILE SYNC ──────────────────────────────────────────────────────
export async function loadProfileFromCloud(userId) {
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
  if (!supabase || !userId) return;
  const { error } = await supabase
    .from('newshub_events')
    .insert({ user_id: userId, event_type: eventType, payload });
  if (error) console.error('[cloudSync] emitEvent failed:', error.message);
}

// ─── AUTH ──────────────────────────────────────────────────────────────
export async function getUserId() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

export async function signInWithEmail(email) {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  return supabase.auth.signInWithOtp({ email });
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export function onAuthStateChange(callback) {
  if (!supabase) return () => {};
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return () => sub.subscription.unsubscribe();
}

// ─── SHARED EXTRACT CACHE ────────────────────────────────────────────────
export async function getCachedExtract(url) {
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
  if (!supabase || !url) return;
  const { error } = await supabase
    .from('newshub_cached_extracts')
    .upsert({ url, title, text_content, source, extracted_via }, { onConflict: 'url' });
  if (error) console.error('[cloudSync] setCachedExtract failed:', error.message);
}
