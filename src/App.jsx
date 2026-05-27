import { createContext, useContext, useState, useEffect } from 'react';
import { loadGraph, loadProjects, loadNotes, loadResearch } from './utils.js';
import { NAV_ITEMS, THEME_DARK, THEME_LIGHT } from './constants.js';
import useViewport from './hooks/useViewport.js';
import Sidebar from './modules/Sidebar.jsx';
import TopBar from './modules/TopBar.jsx';
import ChatPanel from './modules/ChatPanel.jsx';
import HomeDashboard from './modules/HomeDashboard.jsx';
import LearningCenter from './modules/LearningCenter.jsx';
import ResearchHub from './modules/ResearchHub.jsx';
import ProjectsOS from './modules/ProjectsOS.jsx';
import MasteryVault from './modules/MasteryVault.jsx';
import GrowthTools from './modules/GrowthTools.jsx';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

function applyThemeVars(vars) {
  const root = document.documentElement.style;
  Object.entries(vars).forEach(([k, v]) => root.setProperty(k, v));
}

export default function App() {
  const [activeModule, setActiveModule] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [graph, setGraph] = useState(null);
  const [projects, setProjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [research, setResearch] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [theme, setTheme] = useState(() => localStorage.getItem('aether-theme') || 'dark');

  const { isMobile, isTablet } = useViewport();

  useEffect(() => {
    if (isTablet) setSidebarCollapsed(true);
  }, [isTablet]);

  useEffect(() => {
    const vars = theme === 'light' ? THEME_LIGHT : THEME_DARK;
    applyThemeVars(vars);
    localStorage.setItem('aether-theme', theme);
  }, [theme]);

  useEffect(() => {
    Promise.all([loadGraph(), loadProjects(), loadNotes(), loadResearch()]).then(([g, p, n, r]) => {
      setGraph(g);
      setProjects(p);
      setNotes(n);
      setResearch(r);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return <LoadingScreen />;

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const ctx = {
    activeModule, setActiveModule,
    sidebarCollapsed, setSidebarCollapsed,
    chatOpen, setChatOpen,
    searchQuery, setSearchQuery,
    graph, setGraph,
    projects, setProjects,
    notes, setNotes,
    research, setResearch,
    isMobile, isTablet,
    theme, toggleTheme,
  };

  const modules = {
    home:     <HomeDashboard />,
    learn:    <LearningCenter />,
    research: <ResearchHub />,
    projects: <ProjectsOS />,
    vault:    <MasteryVault />,
    growth:   <GrowthTools />,
  };

  return (
    <AppContext.Provider value={ctx}>
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
        {!isMobile && <Sidebar />}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <TopBar />
          <main style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: (!isMobile && chatOpen) ? 360 : 0,
            paddingBottom: isMobile ? 60 : 0,
            transition: 'padding-right 0.22s ease',
          }}>
            {modules[activeModule] || <HomeDashboard />}
          </main>
        </div>
        <ChatPanel />
        {isMobile && <BottomNav activeModule={activeModule} setActiveModule={setActiveModule} setChatOpen={setChatOpen} chatOpen={chatOpen} />}
      </div>
    </AppContext.Provider>
  );
}

function BottomNav({ activeModule, setActiveModule, setChatOpen, chatOpen }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
      background: 'var(--bg-nav)',
      borderTop: '1px solid var(--bord2)',
      display: 'flex',
      alignItems: 'center',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom, 0)',
    }}>
      {NAV_ITEMS.map(item => {
        const isActive = activeModule === item.id;
        return (
          <div
            key={item.id}
            onClick={() => setActiveModule(item.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              cursor: 'pointer',
              padding: '6px 0',
              position: 'relative',
            }}
          >
            {isActive && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 28,
                height: 2,
                background: item.accent,
                borderRadius: '0 0 2px 2px',
              }} />
            )}
            <div style={{ fontSize: 16, lineHeight: 1 }}>{item.icon}</div>
            <div style={{
              fontSize: 8,
              letterSpacing: 0.5,
              color: isActive ? item.accent : 'var(--dim)',
              fontWeight: isActive ? 700 : 400,
              textTransform: 'uppercase',
            }}>{item.label}</div>
          </div>
        );
      })}
      <div
        onClick={() => setChatOpen(o => !o)}
        style={{
          width: 48,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          cursor: 'pointer',
          padding: '6px 0',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: chatOpen ? 'linear-gradient(135deg, #00FFB2, #6366F1)' : 'var(--surface)',
          border: `1px solid ${chatOpen ? 'transparent' : 'var(--border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
        }}>💬</div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ height: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 28, fontFamily: "'Fraunces', serif", fontWeight: 800, color: 'var(--text)', letterSpacing: -1 }}>Aether</div>
      <div style={{ display: 'flex', gap: 5 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#00FFB2', animation: `pulse 1.2s ${i * 0.2}s infinite ease-in-out` }} />
        ))}
      </div>
      <div style={{ fontSize: 9, letterSpacing: 3, color: 'var(--dim)', textTransform: 'uppercase' }}>Loading intelligence hub</div>
    </div>
  );
}
