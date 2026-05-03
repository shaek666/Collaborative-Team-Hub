'use client';

import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../../../stores/workspaceStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { LoadingState } from '../../../components/ui/LoadingState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  Activity,
  LayoutDashboard
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../../lib/errors';

export default function DashboardPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const [stats, setStats] = useState({
    totalGoals: 0,
    completedThisWeek: 0,
    overdueCount: 0,
    chartData: []
  });

  useEffect(() => {
    if (activeWorkspace) {
      const fetchStats = async () => {
        try {
          const res = await api.get(`/workspaces/${activeWorkspace.id}/analytics`);
          setStats(res.data);
        } catch (error) {
          toast.error(getApiErrorMessage(error, 'Failed to load dashboard stats'));
        }
      };
      fetchStats();
    }
  }, [activeWorkspace]);

  const statCards = [
    { 
      label: 'Total Goals', 
      value: stats.totalGoals, 
      icon: Target, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10' 
    },
    { 
      label: 'Completed This Week', 
      value: stats.completedThisWeek, 
      icon: CheckCircle2, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10' 
    },
    { 
      label: 'Overdue Goals', 
      value: stats.overdueCount, 
      icon: AlertCircle, 
      color: 'text-rose-500', 
      bg: 'bg-rose-500/10' 
    }
  ];

  if (!activeWorkspace) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="No workspace selected"
        description="Choose a workspace from the sidebar or create a new one to get started."
      />
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Welcome back, {activeWorkspace.name}
        </h1>
        <p className="text-slate-400">Here is what is happening in your team today.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <StatCard
                label={stat.label}
                value={stat.value}
                icon={Icon}
                iconBgClassName={stat.bg}
                iconClassName={stat.color}
              />
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-800/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Goal Completion Trends
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] mt-4 flex items-center justify-center">
            {stats.chartData.length === 0 ? (
              <p className="text-slate-500 text-sm">No activity data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== 2 && (
                    <div className="absolute left-2.5 top-6 bottom-0 w-px bg-slate-800" />
                  )}
                  <div className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/50 flex items-center justify-center flex-shrink-0 z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Goal Updated</p>
                    <p className="text-xs text-slate-500 mt-0.5">2 hours ago • Marketing Campaign</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
