import { createContext, useContext, useState, useEffect } from 'react';
import { loadGraph, loadProjects, loadNotes, loadResearch } from './utils.js';
import { NAV_ITEMS, THEME_DARK, THEME_LIGHT } from './constants.js';
import useViewport from './hooks/useViewport.js';
import TopBar from './modules/TopBar.jsx';
import ChatPanel from './modules/ChatPanel.jsx';
import HomeDashboard from './modules/HomeDashboard.jsx';
import LearningCenter from './modules/LearningCenter.jsx';
import ResearchHub from './modules/ResearchHub.jsx';
import ProjectsOS from './modules/ProjectsOS.jsx';
import MasteryVault from './modules/MasteryVault.jsx';
import GrowthTools from './modules/GrowthTools.jsx';
import PodcastHub from './modules/PodcastHub.jsx';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

function applyThemeVars(vars) {
  const root = document.documentElement.style;
  Object.entries(vars).forEach(([k, v]) => root.setProperty(k, v));
}

export default function App() {
  const [activeModule, setActiveModule] = useState('home');
  const [chatOpen, setChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatPrefill, setChatPrefill] = useState('');

  const [graph, setGraph] = useState(null);
  const [projects, setProjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [research, setResearch] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [theme, setTheme] = useState(() => localStorage.getItem('aether-theme') || 'dark');

  const { isMobile, isTablet, isPhone, isDesktop } = useViewport();

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
    chatOpen, setChatOpen,
    searchQuery, setSearchQuery,
    chatPrefill, setChatPrefill,
    graph, setGraph,
    projects, setProjects,
    notes, setNotes,
    research, setResearch,
    isMobile, isTablet, isPhone, isDesktop,
    theme, toggleTheme,
  };

  const modules = {
    home:     <HomeDashboard />,
    learn:    <LearningCenter />,
    research: <ResearchHub />,
    projects: <ProjectsOS />,
    podcast:  <PodcastHub />,
    vault:    <MasteryVault />,
    growth:   <GrowthTools />,
  };

  return (
    <AppContext.Provider value={ctx}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
        <TopBar />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: (!isMobile && chatOpen) ? 360 : 0,
          transition: 'padding-right 0.22s ease',
        }}>
          {modules[activeModule] || <HomeDashboard />}
        </main>
        <ChatPanel />
      </div>
    </AppContext.Provider>
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
