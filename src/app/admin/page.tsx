'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Users, ChevronLeft, RefreshCw, Trash2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ADMIN_PASSWORD = 'Zhuang41';

interface UserWithStats {
  id: string;
  user_id: string;
  real_name: string;
  birth_date: string | null;
  birth_place: string | null;
  current_location: string | null;
  created_at: string;
  updated_at: string | null;
  crushes: Array<{
    id: string;
    user_id: string;
    crush_name: string;
    birth_date: string | null;
    birth_place: string | null;
    current_location: string | null;
    created_at: string;
  }>;
  crushes_count: number;
  matches_count: number;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [total, setTotal] = useState(0);
  const [checking, setChecking] = useState(false);
  const [matchResult, setMatchResult] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // 密码验证相关状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // 检查是否已验证过密码
    const authStatus = localStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      loadUsers();
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setPasswordError('');

    // 简单的密码比对
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      loadUsers();
    } else {
      setPasswordError('密码错误，请重试');
      setPassword('');
    }
    setIsVerifying(false);
  };

  const handleLogoutAdmin = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
    setPassword('');
  };

  const loadUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
        setTotal(data.total);
      }
    } catch {
      console.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`确定要删除用户 "${userName}" 吗？此操作不可恢复！`)) {
      return;
    }

    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        alert(`用户 "${userName}" 删除成功`);
        await loadUsers();
      } else {
        alert(`删除失败: ${data.error}`);
      }
    } catch {
      alert('删除失败，请稍后重试');
    }
  };

  const checkMatches = async () => {
    setChecking(true);
    setMatchResult(null);
    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch('/api/check-matches', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setMatchResult(data.message);
        if (data.matches.length > 0) {
          setMatchResult(data.message + '\n\n新匹配：\n' + data.matches.map((m: { user1: string; user2: string }) => `${m.user1} ↔ ${m.user2}`).join('\n'));
        }
        await loadUsers();
      }
    } catch {
      setMatchResult('匹配检测失败');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-pink-950/20 dark:via-gray-900 dark:to-purple-950/50">
      {/* Header */}
      <header className="border-b border-pink-200 dark:border-pink-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              返回首页
            </Link>

            <Link href="/" className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-pink-500 fill-pink-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                暗恋
              </span>
            </Link>

            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!isAuthenticated ? (
          /* 密码验证界面 */
          <div className="max-w-md mx-auto">
            <Card className="border-pink-200 dark:border-pink-800">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">后台管理</CardTitle>
                <CardDescription>
                  请输入管理员密码以访问后台管理功能
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">管理员密码</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="请输入密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isVerifying}
                    />
                  </div>

                  {passwordError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                      {passwordError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500"
                    disabled={isVerifying}
                  >
                    {isVerifying ? '验证中...' : '访问后台'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">用户管理</h1>
              <p className="text-muted-foreground">查看和管理所有注册用户</p>
            </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-pink-200 dark:border-pink-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">总用户数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{total}</div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">暗恋总数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {users.reduce((sum, u) => sum + u.crushes_count, 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-pink-200 dark:border-pink-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">匹配数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {users.reduce((sum, u) => sum + (u.matches_count || 0), 0) / 2}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 匹配检测 */}
        <Card className="border-purple-200 dark:border-purple-800 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              匹配检测
            </CardTitle>
            <CardDescription>
              手动触发双向暗恋匹配检测
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={checkMatches}
              disabled={checking}
              className="bg-gradient-to-r from-pink-500 to-purple-500"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              {checking ? '检测中...' : '开始匹配检测'}
            </Button>

            {matchResult && (
              <div className="mt-4 p-4 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap">{matchResult}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 用户列表 */}
        <Card className="border-pink-200 dark:border-pink-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-pink-500" />
              用户列表
            </CardTitle>
            <CardDescription>
              所有注册用户的详细信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">加载中...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                还没有用户注册
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="border border-pink-100 dark:border-pink-900 rounded-lg overflow-hidden">
                    {/* 用户基本信息 */}
                    <div className="p-4 bg-pink-50 dark:bg-pink-950/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.real_name[0]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{user.real_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              注册于 {new Date(user.created_at).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{user.crushes_count}</div>
                            <div className="text-xs text-muted-foreground">暗恋</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{user.matches_count}</div>
                            <div className="text-xs text-muted-foreground">匹配</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteUser(user.user_id, user.real_name)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* 个人资料 */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">出生年月：</span>
                          <span className="ml-2">{user.birth_date ? new Date(user.birth_date).toLocaleDateString('zh-CN') : '未填写'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">出生地：</span>
                          <span className="ml-2">{user.birth_place || '未填写'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">所在地：</span>
                          <span className="ml-2">{user.current_location || '未填写'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 暗恋列表 */}
                    {user.crushes.length > 0 && (
                      <div className="p-4">
                        <button
                          onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                          className="w-full text-left text-sm font-medium text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 flex items-center gap-2"
                        >
                          <Heart className="h-4 w-4" />
                          暗恋名单 ({user.crushes.length})
                          <span className="ml-auto">{expandedUser === user.id ? '▼' : '▶'}</span>
                        </button>
                        {expandedUser === user.id && (
                          <div className="mt-3 space-y-2">
                            {user.crushes.map((crush) => (
                              <div key={crush.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-pink-100 dark:border-pink-900">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                      {crush.crush_name[0]}
                                    </div>
                                    <div>
                                      <div className="font-medium">{crush.crush_name}</div>
                                      {crush.birth_date && (
                                        <div className="text-xs text-muted-foreground">
                                          📅 {new Date(crush.birth_date).toLocaleDateString('zh-CN')}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(crush.created_at).toLocaleDateString('zh-CN')}
                                  </div>
                                </div>
                                {crush.birth_place || crush.current_location ? (
                                  <div className="mt-2 text-sm text-muted-foreground flex gap-4">
                                    {crush.birth_place && <span>📍 出生地: {crush.birth_place}</span>}
                                    {crush.current_location && <span>📍 所在地: {crush.current_location}</span>}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 退出管理员登录 */}
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={handleLogoutAdmin}
            className="border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/20"
          >
            退出管理员登录
          </Button>
        </div>
          </>
        )}
      </main>
    </div>
  );
}
