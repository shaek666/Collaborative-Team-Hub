'use client';

import React, { useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Camera, User, Loader2, Save } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../../lib/errors';

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      await api.post('/users/me/avatar', formData);
      await fetchMe();
      toast.success('Avatar updated!');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to upload avatar'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/users/me', { name });
      await fetchMe();
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Profile Settings</h1>
        <p className="text-slate-400">Manage your personal information and avatar.</p>
      </div>

      <Card className="border-slate-800/50 bg-slate-900/30">
        <CardContent className="pt-8">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden group-hover:border-blue-500/50 transition-colors">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-12 h-12 text-slate-600" />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20">
                <Camera className="w-4 h-4 text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>

            <form onSubmit={handleSave} className="w-full space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Display Name</label>
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-950/50 border-slate-800 h-12 text-lg"
                  placeholder="Your Name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email Address</label>
                <Input 
                  value={user?.email}
                  disabled
                  className="bg-slate-950/20 border-slate-800/50 text-slate-500 cursor-not-allowed h-12"
                />
                <p className="text-[10px] text-slate-500 italic">Email cannot be changed once the account is created.</p>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-12 gap-2 text-base" disabled={saving || name === user?.name}>
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
