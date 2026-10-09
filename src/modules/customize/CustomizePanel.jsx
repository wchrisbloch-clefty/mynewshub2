// ─── CUSTOMIZE PANEL ──────────────────────────────────────────────────────────
// Extracted from App.jsx (I2). Was already a fully props-driven top-level component —
// moving it out is a file move. The four data constants it read from App module scope
// (CATS, INDICES, DEFAULT_WEATHER_CITIES, DEFAULT_SOCIAL) are now passed as props to
// avoid a circular import; VOICE_PLATFORMS is imported from the voices model. Styles are
// the global .cp-* rules. Lazy-loaded + idle/hover-prefetched by App (fallback null — a
// prefetched overlay, same convention as the other lazy modals).
import { useState } from 'react';
import { ChevronDown, X as XIcon } from 'lucide-react';
import { VOICE_PLATFORMS } from '../voices/model';

// Moved from App with the panel (its only consumer).
const CAT_LABELS = { general: 'News', sports: 'Sports', business: 'Business', finance: 'Markets', bloom: 'Energy', tech: 'AI & Tech', popculture: 'Pop Culture', comedy: 'Comedy' };
const PLAT_LABELS = { twitter: '𝕏', linkedin: 'in', instagram: 'IG', youtube: '▶' };

export function CustomizePanel({feeds, kw, alerts, urgent, social, watchlist, teams, health, arts, weatherCities, hiddenIndices, briefingExclude, briefingSources, initialTab, initialCat, onClose, onSave,
  voices, onAddVoice, removeVoiceById, reorderVoice, onResolveVoice, onTestVoices, voicesTest, searchKeyPresent,
  seedQueue, onAcceptSeed, onSkipSeed,
  CATS, INDICES, DEFAULT_WEATHER_CITIES, DEFAULT_SOCIAL, BRIEFING_PRIORITY_SOURCES, SOCIAL_META}) {
  const [lf, setLf] = useState(JSON.parse(JSON.stringify(feeds)));
  const [lk, setLk] = useState(JSON.parse(JSON.stringify(kw)));
  const [la, setLa] = useState([...alerts]);
  const [lu, setLu] = useState([...(urgent||[])]);
  const [lw, setLw] = useState(JSON.parse(JSON.stringify(watchlist||[])));
  const [lbe, setLbe] = useState([...(briefingExclude||['comedy'])]);
  const [lbs, setLbs] = useState([...(briefingSources||[])]);
  const [newSym, setNewSym] = useState('');
  const [newSymName, setNewSymName] = useState('');
  const [ls, setLs] = useState(JSON.parse(JSON.stringify(social)));
  const [lwx, setLwx] = useState(JSON.parse(JSON.stringify(weatherCities||DEFAULT_WEATHER_CITIES)));
  const [lhi, setLhi] = useState([...(hiddenIndices||[])]);
  const [newCityName, setNewCityName] = useState('');
  const [newCityLat, setNewCityLat] = useState('');
  const [newCityLon, setNewCityLon] = useState('');
  // v23: editable favorite teams
  const [lt, setLt] = useState(JSON.parse(JSON.stringify(teams||[])));
  const [newTeam, setNewTeam] = useState({team:'',match:'',sport:'football',league:'nfl',emoji:'',espnUrl:'',teamUrl:''});
  const [secTab, setSecTab] = useState(initialTab||'keywords');
  const [kwTab, setKwTab] = useState(initialCat||'general');
  const [srcTab, setSrcTab] = useState(initialCat||'general');
  const [socCat, setSocCat] = useState(initialCat||'general');
  const [socPlat, setSocPlat] = useState('twitter');
  const [newKw, setNewKw] = useState('');
  const [newAlert, setNewAlert] = useState('');
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [testState, setTestState] = useState({});
  // E1: Voices tab state
  const [voiceCat, setVoiceCat] = useState(initialCat||'general');
  const [vName, setVName] = useState('');
  const [vType, setVType] = useState('person');
  const [editVoiceId, setEditVoiceId] = useState(null);
  const [showSeeds, setShowSeeds] = useState(false);
  const VOICE_CATS = ['general','business','bloom','tech','sports','health','popculture'];

  const testFeed = async (url, key) => {
    setTestState(s=>({...s,[key]:'loading'}));
    const {items,reason} = await fetchRSS(url);
    setTestState(s=>({...s,[key]:items.length>0?`ok:${items.length} articles`:`fail:${reason||'empty'}`}));
  };
  const addSource = () => {
    if (!newName.trim()||!newUrl.trim()) return;
    setLf(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[srcTab])n[srcTab]=[];n[srcTab].push({name:newName.trim(),url:newUrl.trim(),on:true});return n;});
    setNewName(''); setNewUrl('');
  };
  const addHandle = () => {
    const h=newHandle.trim(); if (!h) return;
    setLs(prev=>{
      const n=JSON.parse(JSON.stringify(prev));
      if(!n[socCat])n[socCat]={twitter:[],linkedin:[],instagram:[],youtube:[]};
      if(!n[socCat][socPlat])n[socCat][socPlat]=[];
      const formatted=socPlat==='linkedin'?h:(h.startsWith('@')?h:'@'+h);
      if(!n[socCat][socPlat].includes(formatted))n[socCat][socPlat].push(formatted);
      return n;
    });
    setNewHandle('');
  };
  const removeHandle = idx => {
    setLs(prev=>{const n=JSON.parse(JSON.stringify(prev));n[socCat][socPlat].splice(idx,1);return n;});
  };
  const countBySource = (cat,name) => (arts[cat]||[]).filter(a=>a.source===name).length;

  const TestResult = ({tkey}) => {
    const ts=testState[tkey]; if(!ts) return null;
    const isOk=ts.startsWith('ok'), isLoad=ts==='loading';
    const msg=isLoad?'Testing…':isOk?`✓ ${ts.replace('ok:','')}`:`✗ ${ts.replace('fail:','Failed — ')}`;
    return <div className={`cp-test-result ${isLoad?'cp-test-load':isOk?'cp-test-ok':'cp-test-fail'}`}>{msg}</div>;
  };

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-panel" onClick={e=>e.stopPropagation()}>
        <div className="cp-head"><span className="cp-title">Customize</span><button className="cp-x" onClick={onClose}><XIcon size={13} aria-hidden="true"/></button></div>
        <div className="cp-body">
          <div className="cp-sec-tabs">
            {['keywords','alerts','sources','social','voices','watchlist','teams','datastrip','briefing'].map(t=>(
              <button key={t} className={`cp-sec-tab ${secTab===t?'active':''}`} onClick={()=>setSecTab(t)}>
                {t==='keywords'?'Keywords':t==='alerts'?'Alerts':t==='sources'?'Sources':t==='social'?'Social':t==='voices'?'Voices':t==='watchlist'?'Watchlist':t==='teams'?'Teams':t==='briefing'?'Briefing':'Data Strip'}
              </button>
            ))}
          </div>

          {secTab==='keywords' && (
            <div className="cp-sec">
              <div className="cp-lbl">Keywords by Category</div>
              <div className="cp-desc">Keywords boost matching articles to the top and appear as clickable topic chips in the sidebar.</div>
              <div className="cp-cat-tabs">{Object.keys(CAT_LABELS).map(c=><button key={c} className={`cp-cat-tab ${kwTab===c?'active':''}`} onClick={()=>setKwTab(c)}>{CAT_LABELS[c]}</button>)}</div>
              <div className="cp-chips">
                {(lk[kwTab]||[]).map((k,i)=><span key={i} className="cp-chip cp-chip-kw">{k}<button className="cp-chip-x" onClick={()=>setLk(p=>{const n={...p};n[kwTab]=n[kwTab].filter((_,j)=>j!==i);return n;})}><XIcon size={13} aria-hidden="true"/></button></span>)}
                {(lk[kwTab]||[]).length===0&&<span style={{fontSize:'11px',color:'var(--text3)'}}>No keywords yet</span>}
              </div>
              <div className="cp-add">
                <input className="cp-input" placeholder={`Add ${kwTab} keyword…`} value={newKw} onChange={e=>setNewKw(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&newKw.trim()){setLk(p=>{const n={...p};n[kwTab]=[...(n[kwTab]||[]),newKw.trim()];return n;});setNewKw('');}}}/>
                <button className="cp-btn" onClick={()=>{if(newKw.trim()){setLk(p=>{const n={...p};n[kwTab]=[...(n[kwTab]||[]),newKw.trim()];return n;});setNewKw('');}}} >Add</button>
              </div>
            </div>
          )}

          {secTab==='alerts' && (
            <div className="cp-sec">
              <div className="cp-lbl">Breaking News Ticker Words</div>
              <div className="cp-desc">Red scrolling ticker fires only on these words. Keep short and urgent-only — disasters, major incidents, crashes. Routine words create noise.</div>
              <div className="cp-chips">
                {lu.map((u,i)=><span key={i} className="cp-chip cp-chip-alert">{u}<button className="cp-chip-x" onClick={()=>setLu(x=>x.filter((_,j)=>j!==i))}><XIcon size={13} aria-hidden="true"/></button></span>)}
                {lu.length===0&&<span style={{fontSize:'11px',color:'var(--text3)'}}>No urgent words — ticker off</span>}
              </div>
              <div className="cp-add">
                <input className="cp-input" placeholder="Add urgent word (e.g. hurricane)…" value={newAlert} onChange={e=>setNewAlert(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&newAlert.trim()){setLu(x=>[...x,newAlert.trim()]);setNewAlert('');}}}/>
                <button className="cp-btn cp-btn-red" onClick={()=>{if(newAlert.trim()){setLu(x=>[...x,newAlert.trim()]);setNewAlert('');}}}>Add</button>
              </div>
              <div style={{marginTop:'18px'}}>
                <div className="cp-lbl">Keyword Highlights</div>
                <div className="cp-desc">Articles matching these show a badge but don't trigger the ticker. Use for routine tracking: team names, company names, etc.</div>
                <div className="cp-chips">
                  {la.map((a,i)=><span key={i} className="cp-chip cp-chip-kw">{a}<button className="cp-chip-x" onClick={()=>setLa(x=>x.filter((_,j)=>j!==i))}><XIcon size={13} aria-hidden="true"/></button></span>)}
                </div>
              </div>
            </div>
          )}

          {secTab==='sources' && (
            <div className="cp-sec">
              <div className="cp-lbl">Sources</div>
              <div className="cp-cat-tabs">{Object.keys(CAT_LABELS).map(c=><button key={c} className={`cp-cat-tab ${srcTab===c?'active':''}`} onClick={()=>setSrcTab(c)}>{CAT_LABELS[c]}</button>)}</div>
              <div className="cp-legend">
                <span className="cp-legend-item"><span className="cp-health cp-h-green"/>Loaded</span>
                <span className="cp-legend-item"><span className="cp-health cp-h-yellow"/>Slow</span>
                <span className="cp-legend-item"><span className="cp-health cp-h-red"/>Failed</span>
                <span className="cp-legend-item"><span className="cp-health cp-h-gray"/>Pending</span>
              </div>
              {(lf[srcTab]||[]).map((f,i)=>{
                const h=health[f.name];
                const hcls=h==='green'?'cp-h-green':h==='yellow'?'cp-h-yellow':h==='red'?'cp-h-red':'cp-h-gray';
                const cnt=countBySource(srcTab,f.name); const tk=`${srcTab}_${i}`;
                return (
                  <div key={i}>
                    <div className="cp-src-row">
                      <span className={`cp-health ${hcls}`} title={h||'Pending'}/>
                      <span className="cp-src-name">{f.name}</span>
                      {cnt>0&&<span className="cp-src-count">{cnt}</span>}
                      <button className="cp-test-btn" onClick={()=>testFeed(f.url,tk)}>Test</button>
                      <button className={`cp-tog ${f.on?'on':'off'}`} onClick={()=>setLf(prev=>{const n=JSON.parse(JSON.stringify(prev));n[srcTab][i].on=!n[srcTab][i].on;return n;})}/>
                      <button className="cp-del" onClick={()=>setLf(prev=>{const n=JSON.parse(JSON.stringify(prev));n[srcTab].splice(i,1);return n;})}><XIcon size={13} aria-hidden="true"/></button>
                    </div>
                    <TestResult tkey={tk}/>
                  </div>
                );
              })}
              <div className="cp-add-src">
                <div className="cp-add-src-title">+ Add custom source to {CAT_LABELS[srcTab]}</div>
                <input className="cp-input-sm" placeholder="Source name" value={newName} onChange={e=>setNewName(e.target.value)}/>
                <input className="cp-input-sm" placeholder="RSS URL (https://…)" value={newUrl} onChange={e=>setNewUrl(e.target.value)}/>
                <div style={{display:'flex',gap:'6px'}}>
                  <button className="cp-test-btn" style={{flex:1,padding:'5px'}} onClick={()=>newUrl.trim()&&testFeed(newUrl.trim(),`new_${srcTab}`)}>Test URL</button>
                  <button className="cp-btn" style={{flex:1}} onClick={addSource}>Add Source</button>
                </div>
                <TestResult tkey={`new_${srcTab}`}/>
              </div>
            </div>
          )}

          {secTab==='social' && (
            <div className="cp-sec">
              <div className="cp-lbl">Social Follows by Category</div>
              <div className="cp-desc">Accounts you want one-tap access to. These are links — click opens the account on the platform.</div>
              <div className="cp-cat-tabs">{Object.keys(CAT_LABELS).map(c=><button key={c} className={`cp-cat-tab ${socCat===c?'active':''}`} onClick={()=>setSocCat(c)}>{CAT_LABELS[c]}</button>)}</div>
              <div className="cp-plat-tabs">
                {['twitter','linkedin','instagram','youtube'].map(p=>(
                  <button key={p} className={`cp-plat-tab ${socPlat===p?'active':''}`} onClick={()=>setSocPlat(p)}>
                    {PLAT_LABELS[p]} {SOCIAL_META[p].label}
                  </button>
                ))}
              </div>
              <div className="cp-chips">
                {(ls[socCat]?.[socPlat]||[]).map((h,i)=>(
                  <span key={i} className="cp-chip cp-chip-social">{h}<button className="cp-chip-x" onClick={()=>removeHandle(i)}><XIcon size={13} aria-hidden="true"/></button></span>
                ))}
                {(ls[socCat]?.[socPlat]||[]).length===0&&<span style={{fontSize:'11px',color:'var(--text3)'}}>No accounts yet</span>}
              </div>
              <div className="cp-add">
                <input className="cp-input" placeholder={socPlat==='linkedin'?'Company or person name…':'Handle (e.g. HoustonTexans)'} value={newHandle}
                  onChange={e=>setNewHandle(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addHandle();}}/>
                <button className="cp-btn" onClick={addHandle}>Add</button>
              </div>
            </div>
          )}

          {secTab==='voices' && (
            <div className="cp-sec">
              <div className="cp-lbl">Voices</div>
              <div className="cp-desc">People, businesses and teams whose posts across X, Instagram, LinkedIn, TikTok and YouTube get flagged in the matching category. Voices are always labeled <strong>inferred</strong>; clicking a tile opens the platform — nothing is read in-app.{!searchKeyPresent && <> <strong>Add a search key (SEARCH_API_KEY) to enable discovery</strong> — you can still add handles manually.</>} <span style={{color:'var(--text4)'}}>Default provider: Serper (free tier). Brave is paid/metered.</span></div>
              {/* Add a voice */}
              <div className="cp-src-add">
                <input className="cp-input" placeholder="Name (person, business or team)…" value={vName} onChange={e=>setVName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&vName.trim()){(onResolveVoice||onAddVoice)({name:vName.trim(),type:vType,category:voiceCat});setVName('');}}}/>
                <select className="cp-input" value={vType} onChange={e=>setVType(e.target.value)} aria-label="Type">
                  <option value="person">Person</option><option value="org">Business / Org</option><option value="team">Team</option>
                </select>
                <select className="cp-input" value={voiceCat} onChange={e=>setVoiceCat(e.target.value)} aria-label="Category">
                  {VOICE_CATS.map(c=><option key={c} value={c}>{(CATS[c]||{}).label||c}</option>)}
                </select>
                <button className="cp-btn" onClick={()=>{ if(vName.trim()){ (onResolveVoice||onAddVoice)({name:vName.trim(),type:vType,category:voiceCat}); setVName(''); } }}>Add</button>
              </div>
              {onTestVoices && (
                <div style={{margin:'4px 0 10px'}}>
                  <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    <button className="cp-btn-sec" onClick={onTestVoices} disabled={voicesTest&&voicesTest.loading}>Test voices</button>
                    {voicesTest && <span className="cp-desc" style={{margin:0}}>{voicesTest.summary}</span>}
                  </div>
                  {voicesTest && voicesTest.results && voicesTest.results.length>0 && (
                    <div className="cp-vtest">
                      {voicesTest.results.map((r,i)=>(
                        <div key={i} className="cp-vtest-row">
                          <span className={`cp-vtest-dot ${r.ok===true?'ok':r.ok===false?'fail':'unk'}`}/>
                          <span className="cp-vtest-name">{r.name}</span>
                          <span className="cp-voice-type">{r.platform}</span>
                          <span className="cp-vtest-reason">{r.ok===true?'ok':(r.reason||'failed')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* E4: seed review queue — suggestions + migrated DEFAULT_SOCIAL, Accept/Skip.
                  Accept runs the E2 confirm flow (no handle saved until confirmed); Skip
                  tombstones it so it won't re-suggest. */}
              {seedQueue && seedQueue.length > 0 && (
                <div className="cp-seed-wrap">
                  <button className="cp-seed-toggle" onClick={()=>setShowSeeds(s=>!s)}>
                    <ChevronDown size={12} aria-hidden="true" style={{transform:showSeeds?"none":"rotate(-90deg)",verticalAlign:"-2px"}}/> Suggested voices ({seedQueue.length})
                  </button>
                  {showSeeds && (
                    <div className="cp-seed-list">
                      {seedQueue.map(s => (
                        <div key={s.id} className="cp-seed-row">
                          <span className="cp-seed-name">{s.name}</span>
                          <span className="cp-voice-type">{s.type}</span>
                          <span className="cp-seed-cat">{(CATS[s.category]||{}).label||s.category}</span>
                          {s._parkedFrom && <span className="cp-voice-flag" title="Parked here pending your category decision">parked: {s._parkedFrom}</span>}
                          {s.handles && Object.keys(s.handles).length>0 && <span className="cp-voice-handles">{VOICE_PLATFORMS.filter(p=>s.handles[p]).join(' · ')}</span>}
                          <span className="cp-seed-actions">
                            <button className="cp-btn" onClick={()=>onAcceptSeed&&onAcceptSeed(s)}>Accept</button>
                            <button className="cp-btn-sec" onClick={()=>onSkipSeed&&onSkipSeed(s.id)}>Skip</button>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Grouped by category */}
              {VOICE_CATS.map(cat => {
                const inCat = (voices||[]).filter(v=>v.category===cat);
                if(!inCat.length) return null;
                return (
                  <div key={cat} className="cp-voice-group">
                    <div className="cp-voice-cat">{(CATS[cat]||{}).label||cat}</div>
                    {inCat.map((v,i)=>(
                      <div key={v.id} className="cp-voice-row">
                        <div className="cp-voice-main">
                          <span className="cp-voice-name">{v.name}</span>
                          <span className="cp-voice-type">{v.type}</span>
                          {v.status!=='confirmed' && <span className={`cp-voice-status cp-vs-${v.status}`}>{v.status}</span>}
                          {v._parkedFrom && <span className="cp-voice-flag" title="Parked here pending your category decision">parked: {v._parkedFrom}</span>}
                          <span className="cp-voice-handles">{VOICE_PLATFORMS.filter(p=>v.handles&&v.handles[p]).join(' · ')||'no handles yet'}</span>
                        </div>
                        <div className="cp-voice-actions">
                          {onResolveVoice && <button className="cp-voice-btn" title="Find handles" onClick={()=>onResolveVoice(v)}>Find</button>}
                          <button className="cp-voice-btn" title="Edit handles" onClick={()=>setEditVoiceId(editVoiceId===v.id?null:v.id)}>Edit</button>
                          <button className="cp-voice-btn" aria-label="Move up" disabled={i===0} onClick={()=>reorderVoice(v.id,-1)}>↑</button>
                          <button className="cp-voice-btn" aria-label="Move down" disabled={i===inCat.length-1} onClick={()=>reorderVoice(v.id,1)}>↓</button>
                          <button className="cp-voice-btn cp-voice-rm" aria-label="Remove" onClick={()=>removeVoiceById(v.id)}><XIcon size={13} aria-hidden="true"/></button>
                        </div>
                        {editVoiceId===v.id && (
                          <div className="cp-voice-edit">
                            {VOICE_PLATFORMS.map(p=>(
                              <label key={p} className="cp-voice-hl">
                                <span>{p}</span>
                                <input className="cp-input" defaultValue={(v.handles&&v.handles[p])||''} placeholder={p==='linkedin'?'company/… or in/…':'@handle'}
                                  onBlur={e=>{ const val=e.target.value.trim(); const handles={...(v.handles||{})}; if(val) handles[p]=val; else delete handles[p]; onAddVoice&&onAddVoice({...v, handles, status: Object.keys(handles).length?'confirmed':v.status, confirmedAt: Object.keys(handles).length?Date.now():v.confirmedAt, _manual:true}); }}/>
                              </label>
                            ))}
                            <div className="cp-desc" style={{margin:'2px 0 0'}}>Manual handles are saved on blur. Prefer “Find” to confirm from search.</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
              {(!voices||!voices.length) && <div className="cp-desc">No voices yet. Add one above, or accept suggestions from the seed list.</div>}
            </div>
          )}

          {secTab==='watchlist' && (
            <div className="cp-sec">
              <div className="cp-lbl">Watchlist Symbols</div>
              <div className="cp-desc">Stocks shown on the Finance page. Click any row to open Yahoo Finance.</div>
              {lw.map((w,i)=>(
                <div key={i} className="cp-src-row">
                  <span style={{fontWeight:700,fontFamily:'monospace',color:'var(--accent)',fontSize:'12px',minWidth:'50px'}}>{w.sym}</span>
                  <span className="cp-src-name">{w.name}</span>
                  <button className="cp-del" onClick={()=>setLw(prev=>prev.filter((_,j)=>j!==i))}><XIcon size={13} aria-hidden="true"/></button>
                </div>
              ))}
              {lw.length===0&&<div style={{fontSize:'11px',color:'var(--text3)',padding:'10px 0'}}>No symbols yet</div>}
              <div className="cp-add-src" style={{marginTop:'10px'}}>
                <div className="cp-add-src-title">+ Add symbol</div>
                <input className="cp-input-sm" placeholder="Symbol (e.g. AAPL)" value={newSym} onChange={e=>setNewSym(e.target.value.toUpperCase())}/>
                <input className="cp-input-sm" placeholder="Name (e.g. Apple Inc)" value={newSymName} onChange={e=>setNewSymName(e.target.value)}/>
                <button className="cp-btn" style={{width:'100%'}} onClick={()=>{
                  if(newSym.trim()&&newSymName.trim()){setLw(prev=>[...prev,{sym:newSym.trim(),name:newSymName.trim()}]);setNewSym('');setNewSymName('');}
                }}>Add to Watchlist</button>
              </div>
            </div>
          )}

          {secTab==='teams' && (
            <div className="cp-sec">
              <div className="cp-lbl">Favorite Teams</div>
              <div className="cp-desc">Teams shown as pills on the Sports page. Match terms are used to filter articles. ESPN/Team URLs power the external links on each pill.</div>
              {lt.map((t,i)=>(
                <div key={i} className="cp-team-row">
                  <div className="cp-team-row-head">
                    <span className="cp-reorder-group">
                      <button className="cp-reorder" disabled={i===0} aria-label={`Move ${t.team} up`}
                        onClick={()=>setLt(prev=>{ if(i===0) return prev; const n=[...prev]; [n[i-1],n[i]]=[n[i],n[i-1]]; return n; })}>↑</button>
                      <button className="cp-reorder" disabled={i===lt.length-1} aria-label={`Move ${t.team} down`}
                        onClick={()=>setLt(prev=>{ if(i===prev.length-1) return prev; const n=[...prev]; [n[i+1],n[i]]=[n[i],n[i+1]]; return n; })}>↓</button>
                    </span>
                    <span style={{fontSize:'18px'}}>{t.emoji}</span>
                    <strong style={{fontSize:'12px',color:'var(--text)',flex:1}}>{t.team}</strong>
                    <span style={{fontSize:'10px',color:'var(--text3)'}}>{(t.sport||'').toUpperCase()} · {(t.league||'').toUpperCase()}</span>
                    <button className="cp-del" onClick={()=>setLt(prev=>prev.filter((_,j)=>j!==i))}><XIcon size={13} aria-hidden="true"/></button>
                  </div>
                  <div className="cp-team-row-body">
                    <div style={{fontSize:'10px',color:'var(--text3)'}}>Match: <span style={{color:'var(--text2)'}}>{t.match||'(none)'}</span></div>
                    {t.espnUrl && <div style={{fontSize:'10px',color:'var(--text3)'}}>ESPN: <a href={t.espnUrl} target="_blank" rel="noreferrer" style={{color:'var(--accent)'}}>{t.espnUrl.length>50?t.espnUrl.slice(0,50)+'…':t.espnUrl}</a></div>}
                    {t.teamUrl && <div style={{fontSize:'10px',color:'var(--text3)'}}>Team: <a href={t.teamUrl} target="_blank" rel="noreferrer" style={{color:'var(--accent)'}}>{t.teamUrl.length>50?t.teamUrl.slice(0,50)+'…':t.teamUrl}</a></div>}
                  </div>
                </div>
              ))}
              {lt.length===0 && <div style={{fontSize:'11px',color:'var(--text3)',padding:'10px 0'}}>No teams yet</div>}
              <div className="cp-add-src" style={{marginTop:'14px'}}>
                <div className="cp-add-src-title">+ Add team</div>
                <input className="cp-input-sm" placeholder="Display name (e.g. Houston Texans)" value={newTeam.team} onChange={e=>setNewTeam(t=>({...t,team:e.target.value}))}/>
                <input className="cp-input-sm" placeholder="Match term used to find articles (e.g. Houston Texans)" value={newTeam.match} onChange={e=>setNewTeam(t=>({...t,match:e.target.value}))}/>
                <div style={{display:'flex',gap:'6px'}}>
                  <select className="cp-input-sm" style={{flex:1}} value={newTeam.sport} onChange={e=>setNewTeam(t=>({...t,sport:e.target.value}))}>
                    <option value="football">Football</option>
                    <option value="basketball">Basketball</option>
                    <option value="baseball">Baseball</option>
                    <option value="hockey">Hockey</option>
                    <option value="soccer">Soccer</option>
                  </select>
                  <select className="cp-input-sm" style={{flex:1}} value={newTeam.league} onChange={e=>setNewTeam(t=>({...t,league:e.target.value}))}>
                    <option value="nfl">NFL</option>
                    <option value="nba">NBA</option>
                    <option value="mlb">MLB</option>
                    <option value="nhl">NHL</option>
                    <option value="college-football">College Football</option>
                    <option value="mens-college-basketball">College Basketball</option>
                    <option value="womens-college-basketball">Women's College Basketball</option>
                  </select>
                  <input className="cp-input-sm" style={{width:'60px'}} placeholder="" value={newTeam.emoji} onChange={e=>setNewTeam(t=>({...t,emoji:e.target.value}))}/>
                </div>
                <input className="cp-input-sm" placeholder="ESPN URL (optional)" value={newTeam.espnUrl} onChange={e=>setNewTeam(t=>({...t,espnUrl:e.target.value}))}/>
                <input className="cp-input-sm" placeholder="Official team URL (optional)" value={newTeam.teamUrl} onChange={e=>setNewTeam(t=>({...t,teamUrl:e.target.value}))}/>
                <button className="cp-btn" style={{width:'100%'}} onClick={()=>{
                  if (newTeam.team.trim() && newTeam.match.trim()) {
                    setLt(prev=>[...prev, {...newTeam, team:newTeam.team.trim(), match:newTeam.match.trim()}]);
                    setNewTeam({team:'',match:'',sport:'football',league:'nfl',emoji:'',espnUrl:'',teamUrl:''});
                  }
                }}>Add Team</button>
              </div>
            </div>
          )}

          {secTab==='datastrip' && (
            <div className="cp-sec">
              <div className="cp-lbl">Weather Cities</div>
              <div className="cp-desc">Choose which cities appear in the top data strip. Uses open-meteo.com (no API key needed).</div>
              {lwx.map((city, i) => (
                <div key={i} className="cp-src-row">
                  <span className="cp-src-name">{city.name} ({city.lat.toFixed(2)}, {city.lon.toFixed(2)})</span>
                  <button className="cp-del" onClick={() => setLwx(prev => prev.filter((_,j) => j !== i))}><XIcon size={13} aria-hidden="true"/></button>
                </div>
              ))}
              <div className="cp-add-src" style={{marginTop:'8px'}}>
                <div className="cp-add-src-title">Add a city</div>
                <input className="cp-input-sm" placeholder="City name (e.g. Austin)" value={newCityName} onChange={e=>setNewCityName(e.target.value)}/>
                <div style={{display:'flex',gap:'6px'}}>
                  <input className="cp-input-sm" placeholder="Latitude (e.g. 30.27)" value={newCityLat} onChange={e=>setNewCityLat(e.target.value)}/>
                  <input className="cp-input-sm" placeholder="Longitude (e.g. -97.74)" value={newCityLon} onChange={e=>setNewCityLon(e.target.value)}/>
                </div>
                <button className="cp-btn" style={{width:'100%'}} onClick={()=>{
                  const name=newCityName.trim();
                  const lat=parseFloat(newCityLat);
                  const lon=parseFloat(newCityLon);
                  if (name && !isNaN(lat) && !isNaN(lon)) {
                    const tz = lat > 0 ? (lon > -90 ? 'America/New_York' : 'America/Chicago') : 'UTC';
                    const slug = name.replace(/\s+/g,'+');
                    setLwx(prev=>[...prev,{name,lat,lon,tz,slug}]);
                    setNewCityName(''); setNewCityLat(''); setNewCityLon('');
                  }
                }}>Add City</button>
              </div>
              <div className="cp-lbl" style={{marginTop:'16px'}}>Market Indices in Strip</div>
              <div className="cp-desc">Toggle which indices appear in the data strip. Uncheck any to hide.</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px',margin:'8px 0'}}>
                {INDICES.map(idx => (
                  <label key={idx.sym} style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'12px',cursor:'pointer'}}>
                    <input type="checkbox"
                      checked={!lhi.includes(idx.sym)}
                      onChange={e => setLhi(prev => e.target.checked ? prev.filter(s=>s!==idx.sym) : [...prev,idx.sym])}
                    />
                    {idx.label} ({idx.short})
                  </label>
                ))}
              </div>
              <div className="cp-lbl" style={{marginTop:'12px'}}>Watchlist Tickers in Strip</div>
              <div className="cp-desc">Your watchlist tickers also appear — manage them in the Watchlist tab.</div>
              <div style={{fontSize:'11px',color:'var(--text2)',background:'var(--surface2)',borderRadius:'6px',padding:'8px 10px'}}>
                Current watchlist: {lw.map(w=>w.sym).join(' · ') || 'none'}
              </div>
            </div>
          )}

          {secTab==='briefing' && (
            <div className="cp-sec">
              <div className="cp-lbl">Briefing anchor sources</div>
              <div className="cp-desc">Pick the specific sources that anchor your Morning Briefing. Leave all unchecked to use the defaults ({BRIEFING_PRIORITY_SOURCES.join(', ')}).</div>
              <div className="cp-briefing-src-grid">
                {[...new Set(Object.values(lf).flat().map(f=>f.name))].sort((a,b)=>a.localeCompare(b)).map(name=>{
                  const on = lbs.includes(name);
                  return (
                    <label key={name} className={`cp-briefing-src${on?' on':''}`}>
                      <input type="checkbox" style={{accentColor:'var(--accent)'}} checked={on}
                        onChange={()=>setLbs(prev=>on?prev.filter(s=>s!==name):[...prev,name])}/>
                      <span>{name}</span>
                    </label>
                  );
                })}
              </div>
              <div style={{marginTop:'8px',fontSize:'11px',color:'var(--text3)'}}>
                {lbs.length ? `${lbs.length} source${lbs.length===1?'':'s'} selected` : `Using defaults: ${BRIEFING_PRIORITY_SOURCES.join(', ')}`}
              </div>
              <div className="cp-lbl" style={{marginTop:'14px'}}>Categories included in briefing</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginTop:'8px'}}>
                {Object.entries(CAT_LABELS).map(([cat,label])=>{
                  const excluded = lbe.includes(cat);
                  return (
                    <label key={cat} style={{display:'flex',alignItems:'center',gap:'6px',cursor:'pointer',
                      background:excluded?'var(--surface2)':'var(--surface)',
                      border:`1px solid ${excluded?'var(--border)':'var(--accent)'}`,
                      borderRadius:'20px',padding:'5px 12px',fontSize:'12px',fontWeight:600,
                      color:excluded?'var(--text3)':'var(--text)',transition:'all 0.15s'}}>
                      <input type="checkbox" style={{accentColor:'var(--accent)'}}
                        checked={!excluded}
                        onChange={()=>setLbe(prev=>excluded?prev.filter(c=>c!==cat):[...prev,cat])}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
              <div style={{marginTop:'12px',fontSize:'11px',color:'var(--text3)'}}>
                Currently excluded: {lbe.length===0?'none':lbe.map(c=>CAT_LABELS[c]||c).join(', ')}
              </div>
            </div>
          )}

          <button className="cp-save" onClick={()=>onSave({feeds:lf,kw:lk,alerts:la,urgent:lu,social:ls,watchlist:lw,teams:lt,weatherCities:lwx,hiddenIndices:lhi,briefingExclude:lbe,briefingSources:lbs})}>Save & Refresh</button>
        </div>
      </div>
    </div>
  );
}
