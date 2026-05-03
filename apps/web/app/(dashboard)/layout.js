'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useThemeStore } from '../../stores/themeStore';
import { getSocket } from '../../lib/socket';
import { CommandPalette } from '../../components/ui/CommandPalette';
import { 
  LayoutDashboard, 
  Target, 
  Megaphone, 
  CheckSquare, 
  Users, 
  BarChart3, 
  LogOut, 
  Bell, 
  Plus,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, fetchMe } = useAuthStore();
  const { workspaces, activeWorkspace, fetchWorkspaces, setActiveWorkspace, setOnlineMembers } = useWorkspaceStore();
  const { notifications, fetchNotifications, addNotification, markAllAsRead } = useNotificationStore();
  const { theme, initTheme, toggleTheme } = useThemeStore();
  const unreadCount = notifications.length;
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = React.useState(false);

  // Auth guard - fetch user on mount and redirect if not authenticated
  useEffect(() => {
    // Don't overwrite state if we already have a user (e.g., just logged in)
    if (user) {
      setHasCheckedAuth(true);
      return;
    }
    // Add a small delay to allow Zustand state updates from login to propagate
    // before overwriting them with fetchMe()
    const timer = setTimeout(async () => {
      try {
        await fetchMe();
      } catch (error) {
        // fetchMe doesn't throw, but just in case
      } finally {
        setHasCheckedAuth(true);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchMe, user]);

  useEffect(() => {
    if (hasCheckedAuth && !isAuthenticated) {
      router.push('/login');
    }
  }, [hasCheckedAuth, isAuthenticated, router]);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    const loadShellData = async () => {
      try {
        await Promise.all([fetchWorkspaces(), fetchNotifications()]);
      } catch (error) {
        toast.error('Failed to load workspace data');
      }
    };
    loadShellData();
  }, [fetchWorkspaces, fetchNotifications]);

  // Close workspace dropdown on outside click
  useEffect(() => {
    if (!workspaceDropdownOpen && !notificationsOpen) return;
    const handleClick = () => {
      setWorkspaceDropdownOpen(false);
      setNotificationsOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [workspaceDropdownOpen, notificationsOpen]);

  useEffect(() => {
    if (activeWorkspace) {
      const socket = getSocket();
      socket.emit('workspace:join', activeWorkspace.id);
      
      socket.on('members:online', (userIds) => {
        setOnlineMembers(userIds);
      });

      socket.on('notification:new', (notification) => {
        addNotification(notification);
        toast(notification.message, { icon: '🔔' });
      });

      return () => {
        socket.emit('workspace:leave', activeWorkspace.id);
        socket.off('members:online');
        socket.off('notification:new');
      };
    }
  }, [activeWorkspace, setOnlineMembers, addNotification]);

  // Show loading or redirecting state
  if (!hasCheckedAuth || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Goals', href: `/workspace/${activeWorkspace?.id}/goals`, icon: Target, disabled: !activeWorkspace },
    { name: 'Announcements', href: `/workspace/${activeWorkspace?.id}/announcements`, icon: Megaphone, disabled: !activeWorkspace },
    { name: 'Action Items', href: `/workspace/${activeWorkspace?.id}/action-items`, icon: CheckSquare, disabled: !activeWorkspace },
    { name: 'Members', href: `/workspace/${activeWorkspace?.id}/members`, icon: Users, disabled: !activeWorkspace },
    { name: 'Analytics', href: `/workspace/${activeWorkspace?.id}/analytics`, icon: BarChart3, disabled: !activeWorkspace },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col fixed inset-y-0 z-50 transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                C
              </div>
              <span className="font-bold tracking-tight text-lg">TeamHub</span>
            </div>
            {/* Close button — mobile only */}
            <button
              type="button"
              className="lg:hidden p-1 rounded-lg hover:bg-slate-800 transition-colors"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Workspace Switcher */}
          <div className="relative">
            <button 
              type="button"
              className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all"
              onClick={(e) => { e.stopPropagation(); setWorkspaceDropdownOpen(!workspaceDropdownOpen); }}
              aria-expanded={workspaceDropdownOpen}
              aria-haspopup="listbox"
              aria-label="Switch workspace"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div 
                  className="w-5 h-5 rounded flex-shrink-0" 
                  style={{ backgroundColor: activeWorkspace?.accentColour || '#3b82f6' }} 
                />
                <span className="truncate text-sm font-medium">
                  {activeWorkspace?.name || 'Select Workspace'}
                </span>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", workspaceDropdownOpen && "rotate-180")} />
            </button>
            
            {/* Dropdown */}
            {workspaceDropdownOpen && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50" 
                role="listbox"
                onClick={(e) => e.stopPropagation()}
              >
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    role="option"
                    aria-selected={activeWorkspace?.id === ws.id}
                    onClick={() => { setActiveWorkspace(ws); setWorkspaceDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-800 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {ws.name}
                  </button>
                ))}
                <Link 
                  href="/workspace/new" 
                  onClick={() => setWorkspaceDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-blue-500 hover:bg-slate-800 transition-colors border-t border-slate-800"
                >
                  <Plus className="w-4 h-4" />
                  New Workspace
                </Link>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.disabled ? '#' : link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive 
                    ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20 shadow-[0_0_10px_rgba(37,99,235,0.1)]' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                  link.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive && 'text-blue-500')} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  aria-label="Notifications"
                  onClick={(e) => { e.stopPropagation(); setNotificationsOpen(!notificationsOpen); }}
                  className="relative"
                >
                  <Bell className="w-5 h-5 text-slate-400 hover:text-slate-100 cursor-pointer transition-colors" />
                  {unreadCount > 0 && (
                    <span
                      role="status"
                      aria-label={`${unreadCount} unread notifications`}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-slate-950"
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-80 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50" onClick={(e) => e.stopPropagation()}>
                    <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-xs text-blue-500 hover:text-blue-400"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-slate-500 text-center">No notifications</p>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div key={n.id} className="p-3 border-b border-slate-800/50 hover:bg-slate-800/50">
                            <p className="text-sm">{n.message}</p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={toggleTheme}
                className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-slate-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
              </button>
              <button 
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <Link href="/profile" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-all group">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 group-hover:border-blue-500/50 transition-colors">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                  {user?.name?.charAt(0)}
                </div>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate group-hover:text-blue-400 transition-colors">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-x-hidden relative lg:ml-64">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded" 
              style={{ backgroundColor: activeWorkspace?.accentColour || '#3b82f6' }} 
            />
            <span className="font-semibold text-sm truncate">{activeWorkspace?.name || 'TeamHub'}</span>
          </div>
        </div>

        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
}
