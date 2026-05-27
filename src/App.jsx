import { createContext, useContext, useState, useEffect } from 'react';
import { loadGraph, loadProjects, loadNotes, loadResearch } from './utils.js';
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

  // boot: load all state from storage
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

  const ctx = {
    activeModule, setActiveModule,
    sidebarCollapsed, setSidebarCollapsed,
    chatOpen, setChatOpen,
    searchQuery, setSearchQuery,
    graph, setGraph,
    projects, setProjects,
    notes, setNotes,
    research, setResearch,
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
      <div style={{ display: 'flex', height: '100vh', background: '#08080f', overflow: 'hidden' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <TopBar />
          <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: chatOpen ? 360 : 0, transition: 'padding-right 0.22s ease' }}>
            {modules[activeModule] || <HomeDashboard />}
          </main>
        </div>
        <ChatPanel />
      </div>
    </AppContext.Provider>
  );
}

function LoadingScreen() {
  return (
    <div style={{ height: '100vh', background: '#08080f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 28, fontFamily: "'Fraunces', serif", fontWeight: 800, color: '#fff', letterSpacing: -1 }}>Aether</div>
      <div style={{ display: 'flex', gap: 5 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#00FFB2', animation: `pulse 1.2s ${i * 0.2}s infinite ease-in-out` }} />
        ))}
      </div>
      <div style={{ fontSize: 9, letterSpacing: 3, color: '#334', textTransform: 'uppercase' }}>Loading intelligence hub</div>
    </div>
  );
}
