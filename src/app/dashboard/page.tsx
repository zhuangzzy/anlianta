'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Plus, Trash2, LogOut, User, Sparkles, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  email: string;
  profile: {
    id: string;
    user_id: string;
    real_name: string;
    created_at: string;
  } | null;
}

interface Crush {
  id: string;
  user_id: string;
  crush_name: string;
  birth_date: string | null;
  birth_place: string | null;
  current_location: string | null;
  created_at: string;
}

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  matched_at: string;
  is_notified: boolean;
  otherUser: {
    user_id: string;
    real_name: string;
    birth_date: string | null;
    birth_place: string | null;
    current_location: string | null;
  } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [crushes, setCrushes] = useState<Crush[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // 添加暗恋表单
  const [newCrush, setNewCrush] = useState({
    crushName: '',
    birthDate: '',
    birthPlace: '',
    currentLocation: '',
  });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    checkAuth();
    loadData();
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

  const loadData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      // 加载暗恋列表
      const crushesRes = await fetch('/api/crushes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const crushesData = await crushesRes.json();
      if (crushesData.success) {
        setCrushes(crushesData.crushes);
      }

      // 加载匹配列表
      const matchesRes = await fetch('/api/matches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const matchesData = await matchesRes.json();
      if (matchesData.success) {
        setMatches(matchesData.matches);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCrush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrush.crushName.trim()) return;

    setAdding(true);
    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch('/api/crushes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCrush),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '添加失败');
      }

      // 重新加载数据
      await loadData();
      setShowAddDialog(false);
      setNewCrush({
        crushName: '',
        birthDate: '',
        birthPlace: '',
        currentLocation: '',
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : '添加失败');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCrush = async (id: string) => {
    if (!confirm('确定要删除这个暗恋对象吗？')) return;

    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch(`/api/crushes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      await loadData();
    } catch {
      alert('删除失败，请稍后重试');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/');
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
            <Link href="/" className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-pink-500 fill-pink-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                暗恋
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/profile" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <User className="h-4 w-4" />
                <span className="font-medium">{user?.profile?.real_name}</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                退出
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* 暗恋名单 */}
          <Card className="border-pink-200 dark:border-pink-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                    我的暗恋名单
                  </CardTitle>
                  <CardDescription>记录你心中的美好</CardDescription>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-gradient-to-r from-pink-500 to-purple-500">
                      <Plus className="h-4 w-4 mr-2" />
                      添加
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>添加暗恋对象</DialogTitle>
                      <DialogDescription>
                        填写你暗恋的人的信息，最少需要填写姓名
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddCrush} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="crush-name">姓名 <span className="text-red-500">*</span></Label>
                        <Input
                          id="crush-name"
                          placeholder="请输入姓名"
                          value={newCrush.crushName}
                          onChange={(e) => setNewCrush({ ...newCrush, crushName: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="birth-date">出生年月（可选）</Label>
                        <Input
                          id="birth-date"
                          type="date"
                          value={newCrush.birthDate}
                          onChange={(e) => setNewCrush({ ...newCrush, birthDate: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="birth-place">出生地（可选）</Label>
                        <Input
                          id="birth-place"
                          placeholder="如：北京市"
                          value={newCrush.birthPlace}
                          onChange={(e) => setNewCrush({ ...newCrush, birthPlace: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="current-location">所在地（可选）</Label>
                        <Input
                          id="current-location"
                          placeholder="如：上海市"
                          value={newCrush.currentLocation}
                          onChange={(e) => setNewCrush({ ...newCrush, currentLocation: e.target.value })}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>
                          取消
                        </Button>
                        <Button type="submit" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500" disabled={adding}>
                          {adding ? '添加中...' : '添加'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {crushes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>还没有添加暗恋对象</p>
                  <p className="text-sm mt-2">点击上方按钮添加你的第一个暗恋</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {crushes.map((crush) => (
                    <div key={crush.id} className="p-4 border border-pink-100 dark:border-pink-900 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-950/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{crush.crush_name}</h3>
                          {crush.birth_date && (
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(crush.birth_date).toLocaleDateString('zh-CN')}
                            </p>
                          )}
                          {crush.birth_place && (
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              出生地: {crush.birth_place}
                            </p>
                          )}
                          {crush.current_location && (
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              所在地: {crush.current_location}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCrush(crush.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 匹配结果 */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                双向暗恋
              </CardTitle>
              <CardDescription>缘分，悄然降临</CardDescription>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>还没有匹配成功</p>
                  <p className="text-sm mt-2">继续添加暗恋，等待缘分降临</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.map((match) => (
                    <div key={match.id} className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border border-pink-200 dark:border-pink-800 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {match.otherUser?.real_name?.[0] || '?'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{match.otherUser?.real_name}</h3>
                          <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 mt-1">
                            💕 双向暗恋成功
                          </Badge>
                        </div>
                      </div>

                      {/* 对方信息 */}
                      <div className="space-y-2 mb-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <p className="text-sm font-medium">对方信息：</p>
                        {match.otherUser?.birth_date && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            出生年月: {new Date(match.otherUser.birth_date).toLocaleDateString('zh-CN')}
                          </p>
                        )}
                        {match.otherUser?.birth_place && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            出生地: {match.otherUser.birth_place}
                          </p>
                        )}
                        {match.otherUser?.current_location && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            所在地: {match.otherUser.current_location}
                          </p>
                        )}
                        {!match.otherUser?.birth_date && !match.otherUser?.birth_place && !match.otherUser?.current_location && (
                          <p className="text-sm text-muted-foreground">对方暂未填写详细信息</p>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        匹配时间: {new Date(match.matched_at).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-sm text-pink-600 dark:text-pink-400 mt-2">
                        恭喜！TA 也喜欢你，勇敢地去表白吧！❤️
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
