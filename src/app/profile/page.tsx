'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ArrowLeft, Save, User, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UserProfile {
  id: string;
  user_id: string;
  real_name: string;
  birth_date: string | null;
  birth_place: string | null;
  current_location: string | null;
  created_at: string;
  updated_at: string | null;
}

interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    birthDate: '',
    birthPlace: '',
    currentLocation: '',
  });

  useEffect(() => {
    checkAuth();
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth');
      return;
    }

    try {
      const response = await fetch('/api/auth/user', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        localStorage.removeItem('access_token');
        router.push('/auth');
        return;
      }

      const data = await response.json();
      setUser(data.user);
    } catch {
      localStorage.removeItem('access_token');
      router.push('/auth');
    }
  }, [router]);

  const loadProfile = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setFormData({
          birthDate: data.profile.birth_date?.split('T')[0] || '',
          birthPlace: data.profile.birth_place || '',
          currentLocation: data.profile.current_location || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '保存失败');
      }

      setProfile(data.profile);
      alert('个人资料已更新！');
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-pink-950/20 dark:via-gray-900 dark:to-purple-950/20">
      {/* Header */}
      <header className="border-b border-pink-200 dark:border-pink-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              返回
            </Link>

            <Link href="/" className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-pink-500 fill-pink-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                暗恋
              </span>
            </Link>

            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="font-medium">{user?.profile?.real_name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-pink-200 dark:border-pink-800">
          <CardHeader>
            <CardTitle className="text-2xl">个人资料</CardTitle>
            <CardDescription>
              填写你的个人信息，让匹配更准确
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {/* 基本信息（只读） */}
              <div className="space-y-4 p-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {profile?.real_name?.[0] || '?'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{profile?.real_name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  注册时间: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('zh-CN') : '未知'}
                </p>
              </div>

              {/* 可编辑信息 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="birth-date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    出生年月（可选）
                  </Label>
                  <Input
                    id="birth-date"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    placeholder="选择你的出生年月"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth-place" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    出生地（可选）
                  </Label>
                  <Input
                    id="birth-place"
                    type="text"
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                    placeholder="如：北京市"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current-location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    所在地（可选）
                  </Label>
                  <Input
                    id="current-location"
                    type="text"
                    value={formData.currentLocation}
                    onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                    placeholder="如：上海市"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '保存中...' : '保存'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
