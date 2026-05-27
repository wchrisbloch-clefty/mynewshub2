import { useState } from 'react';
import { useApp } from '../App.jsx';
import { saveNotes, uid } from '../utils.js';
import { Card, Label, Badge, Modal, Btn } from './shared/Common.jsx';

const NOTE_COLORS = ['#00FFB2', '#6366F1', '#ff8844', '#ffcc44', '#ff4488', '#4488ff'];

export default function MasteryVault() {
  const { notes, setNotes, graph, isMobile } = useApp();
  const [activeNote, setActiveNote] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [filterTag, setFilterTag] = useState('all');
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: [], connections: [], color: '#00FFB2' });
  const [tagInput, setTagInput] = useState('');

  const updateNotes = async (updated) => {
    setNotes(updated);
    await saveNotes(updated);
  };

  const createNote = async () => {
    if (!newNote.title.trim()) return;
    const note = { id: uid(), ...newNote, createdAt: Date.now() };
    await updateNotes([note, ...notes]);
    setNewNote({ title: '', content: '', tags: [], connections: [], color: '#00FFB2' });
    setTagInput('');
    setShowNew(false);
  };

  const deleteNote = async (id) => {
    await updateNotes(notes.filter(n => n.id !== id));
    setActiveNote(null);
  };

  const allTags = [...new Set(notes.flatMap(n => n.tags || []))];

  const filtered = filterTag === 'all' ? notes : notes.filter(n => n.tags?.includes(filterTag));

  const topics = Object.values(graph?.topics || {}).map(t => t.title);

  if (activeNote) {
    const note = notes.find(n => n.id === activeNote);
    if (!note) { setActiveNote(null); return null; }
    return (
      <div style={{ padding: '24px 28px 80px', maxWidth: 760, margin: '0 auto' }}>
        <div onClick={() => setActiveNote(null)} style={{ fontSize: 11, color: '#445', cursor: 'pointer', marginBottom: 20 }}>← Vault</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: "'Fraunces', serif", marginBottom: 8 }}>{note.title}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {note.tags?.map(t => <Badge key={t} color={note.color}>{t}</Badge>)}
            </div>
          </div>
          <div onClick={() => deleteNote(note.id)} style={{ fontSize: 10, color: '#ff4444', padding: '5px 10px', border: '1px solid #ff444440', borderRadius: 6, cursor: 'pointer' }}>Delete</div>
        </div>

        <div style={{ fontSize: 13, lineHeight: 1.85, color: '#b0c0d0', whiteSpace: 'pre-wrap', marginBottom: 24 }}>{note.content}</div>

        {note.connections?.length > 0 && (
          <div>
            <Label>Knowledge Connections</Label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {note.connections.map(c => (
                <div key={c} style={{ fontSize: 10, padding: '5px 12px', background: '#0c0c18', border: `1px solid ${note.color}25`, color: note.color, borderRadius: 20 }}>📚 {c}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '16px 16px 60px' : '24px 28px 60px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 4, color: '#ffcc44', textTransform: 'uppercase', marginBottom: 6 }}>Mastery Vault</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: "'Fraunces', serif", marginBottom: 4 }}>Your Knowledge Base</div>
          <div style={{ fontSize: 11, color: '#445' }}>{notes.length} notes · synthesized insights, cross-references, and breakthroughs</div>
        </div>
        <div onClick={() => setShowNew(true)} style={{ padding: '8px 16px', background: '#ffcc44', borderRadius: 10, fontSize: 11, fontWeight: 700, color: '#000', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ New Note</div>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {['all', ...allTags].map(t => (
            <div key={t} onClick={() => setFilterTag(t)}
              style={{ padding: '4px 12px', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', border: `1px solid ${filterTag === t ? '#ffcc44' : '#1a1a2e'}`, color: filterTag === t ? '#ffcc44' : '#445', borderRadius: 20, cursor: 'pointer', background: filterTag === t ? '#ffcc4418' : 'transparent' }}>
              {t}
            </div>
          ))}
        </div>
      )}

      {/* Notes grid */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏛</div>
          <div style={{ fontSize: 13, color: '#fff', marginBottom: 6 }}>Your Mastery Vault is empty</div>
          <div style={{ fontSize: 11, color: '#334', marginBottom: 20 }}>Save synthesized insights and cross-references here. These are the notes that compound over time.</div>
          <div onClick={() => setShowNew(true)} style={{ display: 'inline-block', padding: '10px 20px', background: '#ffcc44', borderRadius: 10, fontSize: 11, fontWeight: 700, color: '#000', cursor: 'pointer' }}>Add First Note →</div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filtered.map(note => (
          <Card key={note.id} color={note.color} onClick={() => setActiveNote(note.id)} style={{ cursor: 'pointer', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: note.color, flexShrink: 0, marginTop: 4 }} />
              <div style={{ fontSize: 9, color: '#334' }}>{new Date(note.createdAt).toLocaleDateString()}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.35 }}>{note.title}</div>
            <div style={{ fontSize: 11, color: '#556', lineHeight: 1.65, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', marginBottom: 12 }}>
              {note.content}
            </div>
            {note.connections?.length > 0 && (
              <div style={{ fontSize: 9, color: note.color, opacity: 0.7 }}>📚 {note.connections.slice(0, 2).join(' · ')}{note.connections.length > 2 ? ` +${note.connections.length - 2}` : ''}</div>
            )}
            {note.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                {note.tags.slice(0, 3).map(t => <span key={t} style={{ fontSize: 8, color: '#445', background: '#1e2a38', padding: '2px 6px', borderRadius: 3 }}>{t}</span>)}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* New note modal */}
      {showNew && (
        <Modal title="New Note" accent="#ffcc44" onClose={() => setShowNew(false)} width={560}>
          <div>
            <input value={newNote.title} onChange={e => setNewNote(p => ({ ...p, title: e.target.value }))} placeholder="Note title..."
              style={{ width: '100%', background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 8, padding: '10px 14px', color: '#c8d4e0', fontSize: 14, outline: 'none', fontFamily: 'inherit', fontWeight: 700, boxSizing: 'border-box', marginBottom: 12 }} />
            <textarea value={newNote.content} onChange={e => setNewNote(p => ({ ...p, content: e.target.value }))} placeholder="Your insight, synthesis, or breakthrough..." rows={5}
              style={{ width: '100%', background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 8, padding: '10px 14px', color: '#c8d4e0', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.7, boxSizing: 'border-box', marginBottom: 12 }} />

            <Label>Tags</Label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {newNote.tags.map(t => (
                <div key={t} onClick={() => setNewNote(p => ({ ...p, tags: p.tags.filter(x => x !== t) }))}
                  style={{ fontSize: 10, padding: '3px 9px', background: '#ffcc4415', border: '1px solid #ffcc4440', color: '#ffcc44', borderRadius: 14, cursor: 'pointer' }}>
                  {t} ✕
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && tagInput.trim() && (setNewNote(p => ({ ...p, tags: [...new Set([...p.tags, tagInput.trim()])] })), setTagInput(''))}
                placeholder="Add tag, press Enter..."
                style={{ flex: 1, background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 8, padding: '8px 12px', color: '#c8d4e0', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
            </div>

            <Label>Connect to Books/Topics</Label>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
              {topics.slice(0, 10).map(t => (
                <div key={t} onClick={() => setNewNote(p => ({ ...p, connections: p.connections.includes(t) ? p.connections.filter(x => x !== t) : [...p.connections, t] }))}
                  style={{ fontSize: 9, padding: '3px 9px', border: `1px solid ${newNote.connections.includes(t) ? '#00FFB2' : '#1e2a38'}`, color: newNote.connections.includes(t) ? '#00FFB2' : '#445', borderRadius: 14, cursor: 'pointer', background: newNote.connections.includes(t) ? '#00FFB215' : 'transparent' }}>
                  {t}
                </div>
              ))}
            </div>

            <Label>Color</Label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {NOTE_COLORS.map(c => (
                <div key={c} onClick={() => setNewNote(p => ({ ...p, color: c }))}
                  style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', border: `2px solid ${newNote.color === c ? '#fff' : 'transparent'}` }} />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <div onClick={() => setShowNew(false)} style={{ flex: 1, padding: '11px', border: '1px solid #1e2a38', borderRadius: 10, textAlign: 'center', fontSize: 12, color: '#445', cursor: 'pointer' }}>Cancel</div>
              <div onClick={createNote} style={{ flex: 2, padding: '11px', background: '#ffcc44', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#000', cursor: 'pointer' }}>Save to Vault →</div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
