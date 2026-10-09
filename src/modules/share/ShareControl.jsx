// ─── SHARE CONTROL (G2) ───────────────────────────────────────────────────────
// ONE share control used everywhere a share icon already existed (cards, reader,
// briefing). One tap opens a small popover (desktop) / bottom sheet (mobile) with:
// Copy link, Email, Text message, and Share… (native, only when navigator.share exists).
// Everything is URL-encoded. No AI, no network. Co-located CSS + design tokens.
import { useState, useRef, useEffect } from 'react';
import { buildShareStrings, buildBriefingExcerpt } from './share-utils.js';
import './ShareControl.css';

export { buildShareStrings, buildBriefingExcerpt };

const I = {
  share: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5"/></svg>,
  copy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>,
  mail: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>,
  msg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
};

export function ShareControl({ title, url, source, text = null, label = 'Share', className = '' }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const btnRef = useRef(null);
  const sheetRef = useRef(null);
  const fallbackRef = useRef(null);
  const { mailto, sms } = buildShareStrings({ title, url, source, text });
  const canNative = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const copyPayload = text != null ? text : url;

  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus(); } };
    const onDown = e => { if (sheetRef.current && !sheetRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    const t = setTimeout(() => sheetRef.current?.querySelector('button,a')?.focus(), 0);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); clearTimeout(t); };
  }, [open]);

  const flash = () => { setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const copy = async (e) => {
    e?.stopPropagation();
    try { await navigator.clipboard.writeText(copyPayload); flash(); setOpen(false); return; } catch {}
    // Fallback: select the text in a field so the reader can copy manually.
    const f = fallbackRef.current;
    if (f) { f.style.display = 'block'; f.value = copyPayload; f.focus(); f.select();
      try { document.execCommand('copy'); flash(); } catch {}
      setTimeout(() => { f.style.display = 'none'; }, 2500); }
    setOpen(false);
  };
  const native = async (e) => { e?.stopPropagation(); try { await navigator.share(text != null ? { title, text, url } : { title, url }); } catch {} setOpen(false); };
  const close = () => { setOpen(false); btnRef.current?.focus(); };

  return (
    <span className={`share ${className}`} onClick={e => e.stopPropagation()}>
      <button ref={btnRef} type="button" className="share-btn" aria-haspopup="menu" aria-expanded={open}
        aria-label={label} title={label} onClick={e => { e.stopPropagation(); setOpen(o => !o); }}>
        {I.share}
      </button>
      {open && (
        <>
          <div className="share-backdrop" onClick={close} aria-hidden="true"/>
          <div className="share-sheet" role="menu" aria-label="Share" ref={sheetRef}>
            <div className="share-sheet-handle" aria-hidden="true"/>
            <button role="menuitem" type="button" className="share-row" onClick={copy}>{I.copy}<span>Copy link</span></button>
            <a role="menuitem" className="share-row" href={mailto} onClick={close}>{I.mail}<span>Email</span></a>
            <a role="menuitem" className="share-row" href={sms} onClick={close}>{I.msg}<span>Text message</span></a>
            {canNative && <button role="menuitem" type="button" className="share-row" onClick={native}>{I.share}<span>Share…</span></button>}
          </div>
        </>
      )}
      <span className="share-live" role="status" aria-live="polite">{copied ? 'Link copied' : ''}</span>
      <input ref={fallbackRef} className="share-fallback" readOnly tabIndex={-1} aria-hidden="true"/>
    </span>
  );
}
