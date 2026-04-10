import { NextRequest, NextResponse } from 'next/server';
import { verifySMTPConfig, getEmailConfig } from '@/lib/email';

export async function GET(_request: NextRequest) {
  try {
    const config = getEmailConfig();

    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: 'SMTP configuration not found. Please set environment variables: SMTP_HOST, SMTP_USER, SMTP_PASS',
          config: {
            host: process.env.SMTP_HOST || null,
            user: process.env.SMTP_USER || null,
            port: process.env.SMTP_PORT || null,
          },
        },
        { status: 400 }
      );
    }

    const isValid = await verifySMTPConfig();

    if (isValid) {
      return NextResponse.json({
        success: true,
        message: 'SMTP configuration is valid and working',
        config: {
          host: config.host,
          port: config.port,
          user: config.auth.user,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'SMTP configuration is invalid. Please check your credentials.',
          config: {
            host: config.host,
            port: config.port,
            user: config.auth.user,
          },
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('SMTP verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify SMTP configuration',
      },
      { status: 500 }
    );
  }
}
