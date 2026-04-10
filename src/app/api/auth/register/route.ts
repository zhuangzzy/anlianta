import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, realName } = body;

    // 验证必需字段
    if (!email || !password || !realName) {
      return NextResponse.json(
        { error: '邮箱、密码和真实姓名都是必填项' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 1. 注册用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/auth/callback`,
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: `注册失败: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: '用户创建失败' },
        { status: 500 }
      );
    }

    // Supabase 默认需要邮箱验证，我们设置自动登录
    // 如果没有 session，尝试手动登录
    let session = authData.session;
    if (!session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // 忽略登录错误，继续创建档案
        console.error('Auto sign-in after registration failed:', signInError);
      } else {
        session = signInData.session;
      }
    }

    // 2. 创建用户档案
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        real_name: realName,
      });

    if (profileError) {
      // 如果档案创建失败，尝试删除已创建的用户
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: `档案创建失败: ${profileError.message}` },
        { status: 500 }
      );
    }

    // 3. 发送欢迎邮件（异步，不阻塞注册流程）
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      try {
        const { sendWelcomeEmail } = await import('@/lib/email');
        await sendWelcomeEmail(email, realName);
      } catch (error) {
        console.error('Failed to send welcome email:', error);
      }
    })();

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        realName,
        session: session ? {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        } : null,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
