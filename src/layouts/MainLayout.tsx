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
  Menu,
  X
} from 'lucide-react';
import { initializeDatabase } from '../utils/initDb';
import { Storage } from '../storage/db';
import T9Mark from '../components/ui/T9Mark';

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

  // 5 Primary Navigation Pillars for Phase 7
  const primaryNavItems = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/collection', label: 'Library', icon: Film, end: false },
    { to: '/sessions', label: 'Play', icon: Flame, end: false },
    { to: '/insight', label: 'Insight', icon: Sparkles, end: false, altPaths: ['/discovery', '/analytics'] },
    { to: '/more', label: 'More', icon: SlidersHorizontal, end: false },
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
    <div className="flex flex-col h-screen bg-[#0c0e14] text-zinc-100 font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Top Header */}
      <header className="flex-none px-4 sm:px-6 py-3 bg-[#10131d]/95 backdrop-blur border-b border-zinc-800/80 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <T9Mark size={28} variant="signature" className="group-hover:scale-105 transition-transform" />
            <div>
              <span className="font-extrabold tracking-tight text-zinc-100 text-base sm:text-lg block leading-none">
                T9 <span className="font-medium text-zinc-400">Registry</span>
              </span>
              <span className="text-[10px] tracking-widest text-zinc-400 uppercase font-mono block mt-0.5">
                Personal Archive
              </span>
            </div>
          </Link>

          {/* Quick status pill */}
          <div className="hidden sm:flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400">
            <HardDrive size={12} className="text-amber-400" />
            <span>{stats.totalVideos} Videos</span>
            {stats.realCount > 0 && (
              <span className="text-blue-400 font-mono">({stats.realCount} real)</span>
            )}
          </div>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/watchlist"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-all"
            title="Watchlist Queue"
          >
            <Bookmark size={14} className="text-amber-400" />
            <span className="hidden sm:inline font-medium">Queue</span>
            {stats.watchlistCount > 0 && (
              <span className="text-[10px] bg-amber-950 text-amber-300 font-bold px-1.5 py-0.2 rounded-full border border-amber-800/60">
                {stats.watchlistCount}
              </span>
            )}
          </Link>

          <Link
            to="/quick-add"
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-semibold text-xs tracking-wide shadow-md shadow-amber-950/30 transition-all"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Quick Add</span>
          </Link>
        </div>
      </header>
      
      {/* Middle Content Area (Sidebar on md+, Main Content) */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Desktop Sidebar (5 Core Pillars + Curated utilities) */}
        <nav className="flex-none md:w-60 lg:w-64 bg-[#0f121b] border-r border-zinc-800/80 overflow-y-auto hidden md:flex flex-col justify-between p-3.5">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 block mb-2 font-mono">
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
                          return `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            isCurrent 
                              ? 'bg-zinc-800/90 text-amber-300 shadow-sm shadow-black/30 font-semibold' 
                              : 'text-zinc-400 hover:bg-zinc-900/70 hover:text-zinc-200'
                          }`;
                        }}
                      >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Quick shortcuts / sub-destinations */}
            <div className="pt-3 border-t border-zinc-800/60">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 block mb-2 font-mono">
                Curated
              </span>
              <ul className="space-y-1">
                <li>
                  <NavLink
                    to="/guide"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isActive ? 'bg-amber-500/15 text-amber-300 font-semibold' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                      }`
                    }
                  >
                    <BookOpen size={15} className="text-amber-400" />
                    <span>Field Guide</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/sessions/new"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                      }`
                    }
                  >
                    <Flame size={15} className="text-rose-400" />
                    <span>Log New Session</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/discovery"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                      }`
                    }
                  >
                    <Sparkles size={15} className="text-indigo-400" />
                    <span>10 Discovery Modes</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/analytics"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                      }`
                    }
                  >
                    <HardDrive size={15} className="text-emerald-400" />
                    <span>Patterns & Gaps</span>
                  </NavLink>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer note */}
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60 text-[11px] text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
              <CheckCircle2 size={12} className="text-emerald-500" />
              <span>Offline Ready · PWA</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-tight">
              T9 Media remains safe on drive.
            </p>
          </div>
        </nav>
        
        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0b0d14] max-w-7xl w-full mx-auto pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation (Strictly 5 Elegant Pillars) */}
      <nav 
        aria-label="Mobile Navigation"
        className="flex-none md:hidden fixed bottom-0 left-0 right-0 bg-[#0f121b]/95 backdrop-blur-lg border-t border-zinc-800/90 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-1.5 z-30 shadow-2xl"
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
                    <item.icon size={21} strokeWidth={2} />
                  </div>
                  <span className="text-[10px] mt-1 tracking-tight">
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
