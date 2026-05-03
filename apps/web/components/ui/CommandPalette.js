'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { 
  LayoutDashboard, Target, Megaphone, CheckSquare, Users, BarChart3,
  Search, Command
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const iconMap = {
  dashboard: LayoutDashboard,
  goals: Target,
  announcements: Megaphone,
  actionItems: CheckSquare,
  members: Users,
  analytics: BarChart3,
};

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const { activeWorkspace } = useWorkspaceStore();
  const inputRef = useRef(null);

  const commands = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: iconMap.dashboard },
    { id: 'goals', label: 'Goals', href: `/workspace/${activeWorkspace?.id}/goals`, icon: iconMap.goals, disabled: !activeWorkspace },
    { id: 'announcements', label: 'Announcements', href: `/workspace/${activeWorkspace?.id}/announcements`, icon: iconMap.announcements, disabled: !activeWorkspace },
    { id: 'actionItems', label: 'Action Items', href: `/workspace/${activeWorkspace?.id}/action-items`, icon: iconMap.actionItems, disabled: !activeWorkspace },
    { id: 'members', label: 'Members', href: `/workspace/${activeWorkspace?.id}/members`, icon: iconMap.members, disabled: !activeWorkspace },
    { id: 'analytics', label: 'Analytics', href: `/workspace/${activeWorkspace?.id}/analytics`, icon: iconMap.analytics, disabled: !activeWorkspace },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) && !cmd.disabled
  );

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? close() : open();
      }
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, open, close]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (href) => {
    router.push(href);
    close();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      handleSelect(filteredCommands[selectedIndex].href);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-500 bg-slate-800/50 border border-slate-700/50 rounded-md hover:bg-slate-700/50 transition-colors"
        aria-label="Open command palette"
      >
        <Command className="w-3 h-3" />
        <span className="hidden lg:inline">Search...</span>
        <kbd className="hidden lg:inline px-1 py-0.5 text-[10px] bg-slate-700 rounded">⌘K</kbd>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-slate-950/60 backdrop-blur-sm"
            onClick={close}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden"
              role="dialog"
              aria-label="Search commands"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Navigate to..."
                  className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  aria-label="Search commands"
                />
                <kbd className="px-1.5 py-0.5 text-xs text-slate-500 bg-slate-800 rounded">ESC</kbd>
              </div>

              <div className="max-h-72 overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">No results found</div>
                ) : (
                  filteredCommands.map((cmd, i) => {
                    const Icon = cmd.icon;
                    const isActive = pathname === cmd.href;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => handleSelect(cmd.href)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                          isActive 
                            ? 'bg-blue-600/10 text-blue-500' 
                            : i === selectedIndex 
                              ? 'bg-slate-800 text-slate-100' 
                              : 'text-slate-400 hover:bg-slate-800/50'
                        )}
                        role="option"
                        aria-selected={i === selectedIndex}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{cmd.label}</span>
                        {isActive && <span className="text-xs text-blue-500 font-medium">Active</span>}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-2 border-t border-slate-800 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-slate-800 rounded">↑↓</kbd> Navigate</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-slate-800 rounded">↵</kbd> Select</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
