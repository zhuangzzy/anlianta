import nodemailer from 'nodemailer';
import { execSync } from 'child_process';

let envLoaded = false;

function loadEnv(): void {
  if (envLoaded) return;

  try {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('dotenv').config();
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        envLoaded = true;
        return;
      }
    } catch {
      // dotenv not available
    }

    const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;

    const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }

    envLoaded = true;
  } catch {
    // Silently fail
  }
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized?: boolean;
  };
}

function getEmailConfig(): EmailConfig | null {
  loadEnv();

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('SMTP configuration not found in environment variables');
    return null;
  }

  return {
    host,
    port,
    secure: port === 465, // 465 for SSL, 587 for STARTTLS
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false, // 允许自签名证书（仅用于测试）
    },
  };
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const config = getEmailConfig();
  if (!config) return null;

  if (transporter) return transporter;

  transporter = nodemailer.createTransport(config);

  return transporter;
}

export async function sendWelcomeEmail(
  userEmail: string,
  userRealName: string
): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.error('SMTP transporter not available');
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"暗恋" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: '🎉 欢迎加入暗恋！',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff5f5;">
          <div style="background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 欢迎加入暗恋！</h1>
          </div>

          <div style="padding: 30px; background-color: white; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              亲爱的 <strong>${userRealName}</strong>，
            </p>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              欢迎加入 <strong style="color: #c44569;">暗恋</strong>！这是一个帮助大家安全表达心意的平台。
            </p>

            <div style="background-color: #fff0f3; border-left: 4px solid #ff6b9d; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h3 style="color: #c44569; margin: 0 0 10px 0; font-size: 18px;">💡 如何使用：</h3>
              <ol style="margin: 10px 0; padding-left: 20px; color: #555;">
                <li style="margin: 8px 0;">填写你的个人资料（出生年月、出生地、所在地）</li>
                <li style="margin: 8px 0;">添加你暗恋的人的信息</li>
                <li style="margin: 8px 0;">如果TA也喜欢你，系统会自动通知你们双方</li>
              </ol>
            </div>

            <p style="font-size: 16px; color: #333; line-height: 1.6; margin-top: 20px;">
              填写你的个人资料，开始你的暗恋之旅吧！
            </p>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/profile"
                 style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
                填写个人资料
              </a>
            </div>

            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/dashboard"
                 style="display: inline-block; padding: 12px 30px; background: white; border: 2px solid #ff6b9d; color: #ff6b9d; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
                进入仪表板
              </a>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>这是一封自动发送的邮件，请勿回复。</p>
          </div>
        </div>
      `,
    });

    console.log('Welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

export async function sendMatchNotification(
  userEmail: string,
  userRealName: string,
  matchRealName: string,
  matchBirthDate?: string | null,
  matchBirthPlace?: string | null,
  matchCurrentLocation?: string | null
): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.error('SMTP transporter not available');
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"暗恋" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: '💕 双向暗恋成功！',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff5f5;">
          <div style="background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💕 双向暗恋成功！</h1>
          </div>

          <div style="padding: 30px; background-color: white; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              亲爱的 <strong>${userRealName}</strong>，
            </p>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              恭喜你！你暗恋的 <strong style="color: #c44569; font-size: 18px;">${matchRealName}</strong> 也喜欢你！
            </p>

            <div style="background-color: #fff0f3; border-left: 4px solid #ff6b9d; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h3 style="color: #c44569; margin: 0 0 10px 0; font-size: 18px;">TA 的信息：</h3>
              ${matchBirthDate ? `<p style="margin: 5px 0; color: #555;">📅 出生年月：${new Date(matchBirthDate).toLocaleDateString('zh-CN')}</p>` : ''}
              ${matchBirthPlace ? `<p style="margin: 5px 0; color: #555;">📍 出生地：${matchBirthPlace}</p>` : ''}
              ${matchCurrentLocation ? `<p style="margin: 5px 0; color: #555;">📍 所在地：${matchCurrentLocation}</p>` : ''}
              ${!matchBirthDate && !matchBirthPlace && !matchCurrentLocation ? '<p style="margin: 5px 0; color: #555;">对方暂未填写详细信息</p>' : ''}
            </div>

            <p style="font-size: 16px; color: #333; line-height: 1.6; text-align: center; margin-top: 30px;">
              <strong style="color: #c44569; font-size: 18px;">勇敢地去表白吧！❤️</strong>
            </p>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/dashboard"
                 style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
                查看匹配详情
              </a>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>这是一封自动发送的邮件，请勿回复。</p>
          </div>
        </div>
      `,
    });

    console.log('Match notification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send match notification email:', error);
    return false;
  }
}

export async function verifySMTPConfig(): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.error('SMTP transporter not available');
    return false;
  }

  try {
    await transporter.verify();
    console.log('SMTP configuration is valid');
    return true;
  } catch (error) {
    console.error('SMTP configuration is invalid:', error);
    return false;
  }
}

export { getEmailConfig, loadEnv };
