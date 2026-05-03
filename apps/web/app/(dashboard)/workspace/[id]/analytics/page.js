'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { LoadingState } from '../../../../../components/ui/LoadingState';
import { StatCard } from '../../../../../components/ui/StatCard';
import { 
  Download, 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import api from '../../../../../lib/api';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../../../../lib/errors';

export default function AnalyticsPage() {
  const { id: workspaceId } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get(`/workspaces/${workspaceId}/analytics`);
        setStats(res.data);
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load analytics'));
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [workspaceId]);

  const handleExport = async () => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `workspace-${workspaceId}-export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export started!');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Export failed'));
    }
  };

  if (loading) return <LoadingState label="Loading analytics" />;

  const chartData = stats?.goalsByStatus?.map(s => ({
    name: s.status,
    count: s._count
  })) || [];

  const COLORS = {
    COMPLETED: '#10b981',
    IN_PROGRESS: '#3b82f6',
    NOT_STARTED: '#64748b',
    OVERDUE: '#f43f5e'
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Analytics</h1>
          <p className="text-slate-400">Data-driven insights into team performance.</p>
        </div>
        <Button onClick={handleExport} variant="secondary" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Goals" value={stats?.totalGoals} icon={BarChart3} iconClassName="text-slate-400" />
        <StatCard label="Completed This Week" value={stats?.completedThisWeek} icon={CheckCircle2} valueClassName="text-emerald-500" iconBgClassName="bg-emerald-500/10" iconClassName="text-emerald-500" />
        <StatCard
          label="Completion Rate"
          value={`${stats?.totalGoals > 0 ? Math.round((stats.completedThisWeek / stats.totalGoals) * 100) : 0}%`}
          icon={TrendingUp}
          valueClassName="text-blue-500"
          iconBgClassName="bg-blue-500/10"
          iconClassName="text-blue-500"
        />
        <StatCard label="Overdue Items" value={stats?.overdueCount} icon={Clock} valueClassName="text-rose-500" iconBgClassName="bg-rose-500/10" iconClassName="text-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-slate-800/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Goal Distribution by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center">
            {chartData.length === 0 ? (
              <p className="text-slate-500 text-sm">No goal data available yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} 
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Weekly Goal Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {stats?.chartData?.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-400">{item.name}</span>
                  <span className="font-bold">{item.completed} completed</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000" 
                    style={{ 
                      width: `${stats?.totalGoals > 0 ? Math.min((item.completed / stats.totalGoals) * 100, 100) : 0}%` 
                    }} 
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
