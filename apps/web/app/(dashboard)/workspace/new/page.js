'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '../../../../stores/workspaceStore';
import { Card, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Layout, Palette, Loader2, Plus, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../../../lib/errors';

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#6366f1', // indigo
];

export default function NewWorkspacePage() {
  const router = useRouter();
  const { createWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const [name, setName] = useState('');
  const [accentColour, setAccentColour] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Workspace name is required');

    setCreating(true);
    try {
      const workspace = await createWorkspace({ name, accentColour });
      await setActiveWorkspace(workspace);
      toast.success('Workspace created!');
      router.push(`/workspace/${workspace.id}/goals`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create workspace'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="rounded-full hover:bg-slate-800 p-2"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Create Workspace</h1>
          <p className="text-slate-400">Set up a new space for your team to collaborate.</p>
        </div>
      </div>

      <Card className="border-slate-800/50 bg-slate-900/30">
        <CardContent className="pt-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Workspace Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Layout className="w-3 h-3" />
                Workspace Name
              </label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-950/50 border-slate-800 h-12 text-lg focus-visible:ring-offset-0"
                placeholder="e.g. Engineering Team, Marketing Ops"
                style={{ borderColor: accentColour + '44' }}
              />
            </div>

            {/* Accent Colour Picker */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Palette className="w-3 h-3" />
                Brand Colour
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccentColour(color)}
                    className={`
                      h-10 rounded-lg transition-all duration-200 flex items-center justify-center
                      ${accentColour === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 shadow-lg shadow-white/10' : 'hover:scale-105'}
                    `}
                    style={{ backgroundColor: color }}
                  >
                    {accentColour === color && (
                      <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div 
                  className="w-10 h-10 rounded-lg border border-slate-700 flex-shrink-0"
                  style={{ backgroundColor: accentColour }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-300">Preview</p>
                  <p className="text-xs text-slate-500">This colour will be used for buttons, badges, and highlights in your workspace.</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full h-12 gap-2 text-base transition-all duration-300" 
                disabled={creating || !name.trim()}
                style={{ 
                  backgroundColor: accentColour,
                  color: '#fff',
                  boxShadow: creating ? 'none' : `0 8px 16px -4px ${accentColour}33`
                }}
              >
                {creating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Workspace
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Workspace Preview Card */}
      <div className="mt-12 space-y-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-600">Appearance Preview</p>
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg"
            style={{ backgroundColor: accentColour }}
          >
            {name ? name.substring(0, 1).toUpperCase() : '?'}
          </div>
          <div>
            <h3 className="font-semibold text-slate-200">{name || 'Your Workspace'}</h3>
            <p className="text-sm text-slate-500">Active now</p>
          </div>
          <div className="ml-auto flex gap-2">
            <div className="h-2 w-16 rounded-full bg-slate-800" />
            <div className="h-2 w-8 rounded-full" style={{ backgroundColor: accentColour }} />
          </div>
        </div>
      </div>
    </div>
  );
}
