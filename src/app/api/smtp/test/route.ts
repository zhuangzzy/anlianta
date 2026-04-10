import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail, sendMatchNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, email, userName } = body;

    if (!email || !userName) {
      return NextResponse.json(
        { error: 'Email and userName are required' },
        { status: 400 }
      );
    }

    let success = false;
    let message = '';

    if (type === 'welcome') {
      // 测试欢迎邮件
      success = await sendWelcomeEmail(email, userName);
      message = success ? 'Welcome email sent successfully' : 'Failed to send welcome email';
    } else if (type === 'match') {
      // 测试匹配邮件
      success = await sendMatchNotification(
        email,
        userName,
        '测试对象',
        '1995-01-01',
        '北京市',
        '上海市'
      );
      message = success ? 'Match notification email sent successfully' : 'Failed to send match notification email';
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Use "welcome" or "match"' },
        { status: 400 }
      );
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message,
        email,
        type,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: message,
          email,
          type,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send test email',
      },
      { status: 500 }
    );
  }
}
