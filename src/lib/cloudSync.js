// v26: Supabase placeholder — no-op stub until v26b
export const isCloudSyncEnabled = () => false;
export async function loadProfileFromCloud() { return null; }
export async function saveProfileToCloud() { return null; }
export async function emitEvent(eventType, payload = {}) {
  if (typeof window !== 'undefined' && window.__newshub_debug__) {
    console.log('[event-bus stub]', eventType, payload);
  }
}
