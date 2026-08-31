import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FilePlus2,
  FolderOpen,
  Scissors,
  Settings,
  BookOpen,
  Shield,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  LayoutDashboard,
  Users
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabaseClient';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { useIsMobile } from '../hooks/use-mobile';

const BASE_NAV = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Nuovo Preventivo', path: '/preventivi', icon: FilePlus2 },
  { name: 'Rubrica Clienti', path: '/rubrica', icon: Users },
  { name: 'Archivio Ordini', path: '/ordini', icon: FolderOpen },
  { name: 'Archivio Sistemi', path: '/archivio', icon: Settings },
  { name: 'Distinta Taglio', path: '/distinta', icon: Scissors },
  { name: 'Impostazioni', path: '/settings', icon: Settings },
  { name: 'Guida', path: '/guida', icon: BookOpen },
];

function NavItem({ item, isActive, isCollapsed, onClick }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`
        group flex items-center gap-3 py-2.5 px-4 rounded-lg
        transition-all duration-200 relative
        ${
          isActive
            ? 'bg-[hsl(var(--sidebar-accent))] text-white font-semibold'
            : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))/0.5] hover:text-white'
        }
      `}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[hsl(var(--sidebar-primary))]" />
      )}
      <Icon size={20} className="shrink-0" />
      {!isCollapsed && <span className="truncate">{item.name}</span>}
    </Link>
  );
}

function SidebarContent({ navItems, location, isCollapsed, onLogout, userProfile, userEmail, onNavClick }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--sidebar-primary))] flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          {!isCollapsed && (
            <span className="text-white font-bold text-xl tracking-tight">SerraDesk</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
            isCollapsed={isCollapsed}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="shrink-0 px-3 pb-4 space-y-2">
        {/* Separator */}
        <div className="border-t border-[hsl(var(--sidebar-border))] my-2" />

        {/* User info or Guest Login */}
        {!isCollapsed && (
          <div className="px-4 py-2">
            <p className="text-xs text-[hsl(var(--sidebar-foreground))/0.6] truncate">
              {userProfile ? (userEmail || 'Utente') : 'Modalità Ospite'}
            </p>
          </div>
        )}

        {userProfile ? (
          <button
            onClick={onLogout}
            className="flex items-center gap-3 py-2.5 px-4 rounded-lg w-full text-[hsl(var(--sidebar-foreground))] hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && <span>Esci</span>}
          </button>
        ) : (
          <Link
            to="/login?mode=signup"
            className="flex items-center gap-3 py-2.5 px-4 rounded-lg w-full bg-blue-600 text-white hover:bg-blue-500 transition-all duration-200 justify-center"
          >
            {!isCollapsed && <span className="font-bold">Salva il lavoro</span>}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { session, userProfile, userSettings, isLoadingSettings } = useUser();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Dipendiamo dalla sessione (Auth) che è immediata, non dal profilo (DB trigger) per evitare race condition
    if (session?.user && !isLoadingSettings && !userSettings?.company_name) {
      navigate('/onboarding');
    }
  }, [session, userSettings, isLoadingSettings, navigate]);

  const baseFilteredNav = userProfile 
    ? BASE_NAV 
    : BASE_NAV.filter(n => n.name === 'Preventivatore' || n.name === 'Guida');

  const navItems = [
    ...baseFilteredNav,
    ...(userProfile?.role === 'admin'
      ? [{ name: 'Admin', path: '/admin', icon: Shield }]
      : []),
  ];

  const handleLogout = async () => {
    localStorage.removeItem('sd_draft_preventivo');
    sessionStorage.removeItem('df_load_ordine');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const userEmail = userProfile?.email;

  // ─── Mobile Layout ───
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))]">
        {/* Top header bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-[hsl(var(--sidebar-background))] border-b border-[hsl(var(--sidebar-border))]">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <PanelLeft size={22} />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[280px] p-0 bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))]"
            >
              <SidebarContent
                navItems={navItems}
                location={location}
                isCollapsed={false}
                onLogout={handleLogout}
                userProfile={userProfile}
                userEmail={userEmail}
                onNavClick={() => setSheetOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <span className="text-white font-bold text-lg tracking-tight">SerraDesk</span>

          <div className="w-8 h-8 rounded-full bg-[hsl(var(--sidebar-primary))] flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {(userEmail || 'U')[0].toUpperCase()}
            </span>
          </div>
        </header>

        {/* Main content */}
        <main className="p-4">
          {children}
        </main>
      </div>
    );
  }

  // ─── Desktop Layout ───
  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))]">
      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 h-screen z-30
          bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]
          border-r border-[hsl(var(--sidebar-border))]
          transition-all duration-300 flex flex-col"
        style={{ width: isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)' }}
      >
        <SidebarContent
          navItems={navItems}
          location={location}
          isCollapsed={isCollapsed}
          onLogout={handleLogout}
          userProfile={userProfile}
          userEmail={userEmail}
        />

        {/* Collapse toggle */}
        <div className="shrink-0 px-3 pb-3">
          <button
            onClick={() => setIsCollapsed((c) => !c)}
            className="flex items-center justify-center w-full py-2 rounded-lg
              text-[hsl(var(--sidebar-foreground))/0.6] hover:text-white hover:bg-[hsl(var(--sidebar-accent))/0.5]
              transition-all duration-200"
            title={isCollapsed ? 'Espandi' : 'Comprimi'}
          >
            {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
      </aside>

      <main
        className="flex-1 min-h-screen transition-all duration-300 p-6 lg:p-8"
        style={{ marginLeft: isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)' }}
      >
        {children}
      </main>
    </div>
  );
}
