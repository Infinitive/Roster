import { useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Database, PlusCircle, Settings, PlaySquare, Bookmark, PieChart, Sparkles } from 'lucide-react';
import { initializeDatabase } from '../utils/initDb';

export default function MainLayout() {
  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, []);

  const navItems = [
    { to: '/', label: 'Overview', icon: Home },
    { to: '/analytics', label: 'Analytics', icon: PieChart },
    { to: '/discovery', label: 'Discovery', icon: Sparkles },
    { to: '/collection', label: 'Collection', icon: Database },
    { to: '/sessions', label: 'Sessions', icon: PlaySquare },
    { to: '/watchlist', label: 'Watchlist', icon: Bookmark },
    { to: '/quick-add', label: 'Quick Add', icon: PlusCircle },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100 font-sans">
      <header className="flex-none p-4 bg-neutral-900 border-b border-neutral-800">
        <h1 className="text-xl font-bold tracking-tight text-white">T9 Collection Registry</h1>
      </header>
      
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <nav className="flex-none md:w-64 bg-neutral-900 border-r border-neutral-800 overflow-y-auto hidden md:block">
          <ul className="p-4 space-y-2">
            {navItems.map(item => (
              <li key={item.to}>
                <NavLink 
                  to={item.to}
                  className={({ isActive }) => 
                    `flex items-center space-x-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'}`
                  }
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-950">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation */}
      <nav className="flex-none md:hidden bg-neutral-900 border-t border-neutral-800 pb-[env(safe-area-inset-bottom)]">
        <ul className="flex justify-around p-2">
          {navItems.map(item => (
            <li key={item.to} className="flex-1">
              <NavLink 
                to={item.to}
                className={({ isActive }) => 
                  `flex flex-col items-center justify-center py-2 transition-colors ${isActive ? 'text-white' : 'text-neutral-500'}`
                }
              >
                <item.icon size={24} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
