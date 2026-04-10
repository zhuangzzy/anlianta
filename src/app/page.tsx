'use client';

import Link from 'next/link';
import { Heart, Sparkles, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-pink-950/20 dark:via-gray-900 dark:to-purple-950/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur opacity-25 animate-pulse"></div>
              <Heart className="relative h-20 w-20 text-pink-500 fill-pink-500" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
            暗恋
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            让那些不敢表白的人，也能委婉地表达心意
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                开始探索
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline">
                了解更多
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 grid md:grid-cols-3 gap-6">
          <Card className="border-pink-200 dark:border-pink-800">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-2">
                <Shield className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <CardTitle>安全保密</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                只有当双方都相互暗恋时，才会显示匹配结果。你的秘密，我们守护。
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>双向匹配</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                当你暗恋的人也暗恋你时，系统会自动通知。让爱情不期而遇。
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-pink-200 dark:border-pink-800">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-2">
                <Sparkles className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <CardTitle>简单易用</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                只需要填写暗恋对象的姓名，其他信息可选。让表达变得简单。
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-8">如何使用</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-pink-500">1</div>
              <h3 className="text-xl font-semibold">注册账号</h3>
              <p className="text-muted-foreground">填写真实姓名完成注册</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-purple-500">2</div>
              <h3 className="text-xl font-semibold">添加暗恋</h3>
              <p className="text-muted-foreground">填写暗恋对象的姓名</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-pink-500">3</div>
              <h3 className="text-xl font-semibold">等待匹配</h3>
              <p className="text-muted-foreground">双向暗恋会自动通知</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
