import { Heart, Shield, Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-pink-950/20 dark:via-gray-900 dark:to-purple-950/20">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2">
            <Heart className="h-8 w-8 text-pink-500 fill-pink-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              暗恋
            </span>
          </Link>
        </div>

        {/* Introduction */}
        <Card className="border-pink-200 dark:border-pink-800 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center">关于暗恋</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed">
              暗恋，是一种美好又复杂的情感。有些人不敢表白，怕打破友谊；有些人害怕被拒绝，不愿面对失望。我们创建这个平台，就是为了让那些藏在心底的秘密，有了一个温柔的出口。
            </p>
            <p className="text-lg leading-relaxed mt-4">
              在这里，你可以安全地记录你暗恋的人。只有当他也暗恋你时，系统才会通知你们。这既保护了你的隐私，又给了爱情一个机会。
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-pink-200 dark:border-pink-800">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-2">
                <Shield className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <CardTitle>安全保密</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                你的暗恋名单只有你自己可见。只有当双方都相互暗恋时，才会显示匹配结果。
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2">
                <Lock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>隐私保护</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                我们采用先进的加密技术保护你的数据。你的真实姓名仅用于匹配识别，不会公开。
              </p>
            </CardContent>
          </Card>

          <Card className="border-pink-200 dark:border-pink-800">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-2">
                <Heart className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <CardTitle>真实情感</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                我们鼓励真实的情感表达。请使用真实姓名，让匹配更加准确和有意义。
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <Card className="border-purple-200 dark:border-purple-800 mb-8">
          <CardHeader>
            <CardTitle className="text-xl">使用流程</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">注册账号</h3>
                  <p className="text-sm text-muted-foreground">
                    使用邮箱注册，并填写你的真实姓名（用于匹配识别）
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">添加暗恋</h3>
                  <p className="text-sm text-muted-foreground">
                    填写暗恋对象的姓名（必填），以及其他可选信息（出生年月、出生地、所在地）
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">等待匹配</h3>
                  <p className="text-sm text-muted-foreground">
                    当你暗恋的人也注册并填写了你的名字时，系统会自动通知你们匹配成功
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="border-pink-200 dark:border-pink-800 mb-8">
          <CardHeader>
            <CardTitle className="text-xl">免责声明</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>本平台仅提供一个情感表达的渠道，不鼓励或建议任何形式的人肉搜索或骚扰行为</li>
              <li>请尊重他人的隐私和意愿，即使匹配成功，也要以礼貌和尊重的方式表达</li>
              <li>如果对方没有回应或不接受，请保持风度，尊重对方的选择</li>
              <li>本平台不对任何用户行为负责，用户需对自己的言行负责</li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Link href="/auth">
            <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-500">
              开始使用
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
