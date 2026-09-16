import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Film, 
  Flame, 
  Sparkles, 
  SlidersHorizontal, 
  Plus, 
  Bookmark, 
  HardDrive,
  CheckCircle2,
  BookOpen,
  Zap,
  BarChart3,
  Search
} from 'lucide-react';
import { initializeDatabase } from '../utils/initDb';
import { Storage } from '../storage/db';
import RosterBrand from '../components/ui/RosterBrand';

export default function MainLayout() {
  const location = useLocation();
  const [stats, setStats] = useState({ totalVideos: 0, realCount: 0, watchlistCount: 0 });

  useEffect(() => {
    initializeDatabase().catch(console.error);
    loadQuickStats();
  }, [location.pathname]);

  async function loadQuickStats() {
    try {
      const [videos, watchlist] = await Promise.all([
        Storage.getVideos(),
        Storage.getWatchlist()
      ]);
      const real = videos.filter(v => v.datasetType === 'real').length;
      setStats({
        totalVideos: videos.length,
        realCount: real,
        watchlistCount: watchlist.length
      });
    } catch {
      // Ignore initial unready state
    }
  }

  // 5 Primary Navigation Pillars for ROSTER
  const primaryNavItems = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/collection', label: 'Roster', icon: Film, end: false },
    { to: '/sessions', label: 'Rotation', icon: Flame, end: false },
    { to: '/insight', label: 'Insight', icon: Sparkles, end: false, altPaths: ['/discovery', '/analytics'] },
    { to: '/more', label: 'Desk', icon: SlidersHorizontal, end: false },
  ];

  // Helper to determine if Insight is active when on /discovery or /analytics
  const isInsightActive = (item: typeof primaryNavItems[0]) => {
    if (item.to === '/insight') {
      return location.pathname.startsWith('/insight') || 
             location.pathname.startsWith('/discovery') || 
             location.pathname.startsWith('/analytics');
    }
    if (item.to === '/more') {
      return location.pathname.startsWith('/more') || location.pathname.startsWith('/settings');
    }
    return false;
  };

  return (
    <div className="flex flex-col h-screen bg-[#090a0f] text-zinc-100 font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Top Editorial Masthead */}
      <header className="flex-none px-4 sm:px-6 py-2.5 bg-[#0f1118]/95 backdrop-blur border-b border-zinc-800/80 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <RosterBrand variant="logo" size={30} className="group-hover:scale-105 transition-transform" />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <RosterBrand variant="wordmark" size={18} className="hidden xs:inline-block" />
                <span className="xs:hidden font-black tracking-tighter text-white text-base">ROSTER</span>
              </div>
              <span className="text-[9px] tracking-[0.2em] text-zinc-400 uppercase font-mono block">
                Registry &amp; Intelligence
              </span>
            </div>
          </Link>

          {/* Quick status pill */}
          <div className="hidden md:flex items-center gap-2 ml-4 px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-zinc-200">{stats.totalVideos}</span>
            <span className="text-zinc-500 uppercase text-[10px]">On Roster</span>
            {stats.realCount > 0 && (
              <span className="text-blue-400 font-medium">({stats.realCount} verified)</span>
            )}
          </div>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/watchlist"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/90 text-xs font-medium text-zinc-300 hover:text-white transition-all"
            title="Lineup Queue"
          >
            <Bookmark size={13} className="text-amber-400" />
            <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider">Queue</span>
            {stats.watchlistCount > 0 && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30 font-mono">
                {stats.watchlistCount}
              </span>
            )}
          </Link>

          <Link
            to="/quick-add"
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-bold text-xs tracking-wider uppercase font-mono shadow-md shadow-amber-950/40 transition-all"
          >
            <Plus size={14} strokeWidth={3} />
            <span className="hidden sm:inline">Intake</span>
          </Link>
        </div>
      </header>
      
      {/* Middle Content Area (Sidebar on md+, Main Content) */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Desktop Sidebar (5 Core Pillars + Curated utilities) */}
        <nav className="flex-none md:w-60 lg:w-64 bg-[#0c0e14] border-r border-zinc-800/80 overflow-y-auto hidden md:flex flex-col justify-between p-3.5">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-3 block mb-2 font-mono">
                Pillars
              </span>
              <ul className="space-y-1">
                {primaryNavItems.map(item => {
                  const active = isInsightActive(item);
                  return (
                    <li key={item.to}>
                      <NavLink 
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => {
                          const isCurrent = isActive || active;
                          return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            isCurrent 
                              ? 'bg-zinc-800/90 text-amber-300 border-l-2 border-amber-400 font-semibold shadow-sm' 
                              : 'text-zinc-400 hover:bg-zinc-900/70 hover:text-zinc-200'
                          }`;
                        }}
                      >
                        <item.icon size={17} />
                        <span className="tracking-wide">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Quick shortcuts / sub-destinations */}
            <div className="pt-3 border-t border-zinc-800/60">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-3 block mb-2 font-mono">
                Editorial Desks
              </span>
              <ul className="space-y-1">
                <li>
                  <NavLink
                    to="/discovery"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive ? 'bg-amber-500/10 text-amber-300 font-semibold' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                      }`
                    }
                  >
                    <Search size={14} className="text-amber-400" />
                    <span>Scout / Discovery</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/sessions/new"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                      }`
                    }
                  >
                    <Flame size={14} className="text-rose-400" />
                    <span>Log Rotation</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/analytics"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                      }`
                    }
                  >
                    <BarChart3 size={14} className="text-emerald-400" />
                    <span>The Ledger (Stats)</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/guide"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                      }`
                    }
                  >
                    <BookOpen size={14} className="text-indigo-400" />
                    <span>Field Playbook</span>
                  </NavLink>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer publication status */}
          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
            <div className="flex items-center justify-between font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
              <span>Status</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={11} /> Standalone PWA
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-tight">
              Media stays local on drive. Registry manages metadata &amp; playback.
            </p>
          </div>
        </nav>
        
        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#090a0f] max-w-7xl w-full mx-auto pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation (5 Pillars) */}
      <nav 
        aria-label="Mobile Navigation"
        className="flex-none md:hidden fixed bottom-0 left-0 right-0 bg-[#0c0e14]/95 backdrop-blur-lg border-t border-zinc-800/90 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-1.5 z-30 shadow-2xl"
      >
        <ul className="flex justify-around items-center px-1">
          {primaryNavItems.map(item => {
            const active = isInsightActive(item);
            return (
              <li key={item.to} className="flex-1">
                <NavLink 
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => {
                    const isCurrent = isActive || active;
                    return `flex flex-col items-center justify-center py-1 transition-all ${
                      isCurrent 
                        ? 'text-amber-400 font-semibold scale-105' 
                        : 'text-zinc-400 hover:text-zinc-300'
                    }`;
                  }}
                >
                  <div className="relative">
                    <item.icon size={20} strokeWidth={2} />
                  </div>
                  <span className="text-[10px] mt-1 tracking-tight font-medium">
                    {item.label}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
