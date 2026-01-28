import { getEmailService } from './email';

/**
 * Welcome Email Service
 *
 * Best practices for welcome emails to improve conversion:
 * 1. Send immediately after registration (within seconds)
 * 2. Personalize with user's name
 * 3. Highlight the free credits they received
 * 4. Include clear CTA to start using the product
 * 5. Show social proof or key features
 * 6. Keep it short and scannable
 */

interface WelcomeEmailData {
  email: string;
  name?: string;
  locale?: string;
  creditsAmount?: number;
}

// Email content for different locales
const WELCOME_CONTENT = {
  en: {
    subject: '🍌 Welcome to Nano Banana Studio - Your AI Creative Journey Begins!',
    preheader: 'Start creating amazing AI images today with your free credits',
  },
  zh: {
    subject: '🍌 欢迎来到 Nano Banana Studio - 开启你的 AI 创作之旅！',
    preheader: '使用免费积分开始创作精美的 AI 图像',
  },
};

/**
 * Generate welcome email HTML template
 */
function generateWelcomeEmailHtml(data: WelcomeEmailData): string {
  const locale = data.locale === 'zh' ? 'zh' : 'en';
  const name = data.name || (locale === 'zh' ? '朋友' : 'there');
  const credits = data.creditsAmount || 8;

  const content = locale === 'zh' ? {
    greeting: `你好，${name}！`,
    welcome: '欢迎加入 Nano Banana Studio！',
    intro: '我们很高兴你选择了我们的 AI 图像生成平台。现在，你可以轻松地将你的创意想法变成令人惊叹的视觉作品。',
    creditsTitle: '🎁 你的免费积分',
    creditsText: `我们已经为你准备了 <strong>${credits} 个免费积分</strong>，让你可以立即开始探索 AI 图像生成的无限可能！`,
    featuresTitle: '✨ 你可以做什么',
    feature1: '<strong>文字生成图像</strong> - 输入描述，AI 帮你创作',
    feature2: '<strong>图像重绘</strong> - 上传图片，AI 帮你变换风格',
    feature3: '<strong>高清放大</strong> - 一键提升图像分辨率',
    ctaButton: '开始创作',
    ctaUrl: 'https://nanobananastudio.com/app',
    tipsTitle: '💡 快速上手提示',
    tip1: '尝试使用详细的描述词来获得更精准的结果',
    tip2: '浏览首页的灵感提示词，快速获取创作灵感',
    tip3: '保存你喜欢的作品到个人图库',
    supportText: '有任何问题？随时回复这封邮件，我们很乐意帮助你！',
    signature: 'Nano Banana Studio 团队',
    unsubscribe: '此邮件发送至 {{email}}，因为你注册了 Nano Banana Studio 账户。',
  } : {
    greeting: `Hi ${name}!`,
    welcome: 'Welcome to Nano Banana Studio!',
    intro: "We're thrilled to have you join our AI image generation platform. Now you can easily transform your creative ideas into stunning visual artworks.",
    creditsTitle: '🎁 Your Free Credits',
    creditsText: `We've added <strong>${credits} free credits</strong> to your account so you can start exploring the amazing possibilities of AI image generation right away!`,
    featuresTitle: '✨ What You Can Do',
    feature1: '<strong>Text to Image</strong> - Describe your vision, AI creates it',
    feature2: '<strong>Image to Image</strong> - Upload a photo, transform its style',
    feature3: '<strong>HD Upscale</strong> - Enhance image resolution instantly',
    ctaButton: 'Start Creating',
    ctaUrl: 'https://nanobananastudio.com/app',
    tipsTitle: '💡 Quick Start Tips',
    tip1: 'Use detailed descriptions for more accurate results',
    tip2: 'Browse inspiration prompts on our homepage for creative ideas',
    tip3: 'Save your favorite creations to your personal gallery',
    supportText: 'Have questions? Just reply to this email - we\'re happy to help!',
    signature: 'The Nano Banana Studio Team',
    unsubscribe: 'This email was sent to {{email}} because you signed up for Nano Banana Studio.',
  };

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${WELCOME_CONTENT[locale].subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 40px 40px 30px; text-align: center;">
              <img src="https://nanobananastudio.com/logo.png" alt="Nano Banana Studio" width="60" height="60" style="width: 60px; height: 60px; border-radius: 12px; margin-bottom: 16px;">
              <h1 style="margin: 0; color: #1f2937; font-size: 28px; font-weight: 700;">${content.welcome}</h1>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 18px; line-height: 1.6;">
                ${content.greeting}
              </p>
              <p style="margin: 0 0 30px; color: #6b7280; font-size: 16px; line-height: 1.6;">
                ${content.intro}
              </p>

              <!-- Credits highlight box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="background-color: #fef3c7; border-radius: 8px; padding: 24px; border-left: 4px solid #f59e0b;">
                    <h3 style="margin: 0 0 8px; color: #92400e; font-size: 16px; font-weight: 600;">${content.creditsTitle}</h3>
                    <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.5;">
                      ${content.creditsText}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${content.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #1f2937; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
                      ${content.ctaButton} →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Features -->
              <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 16px; font-weight: 600;">${content.featuresTitle}</h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
                      ${content.feature1}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
                      ${content.feature2}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
                      ${content.feature3}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Tips -->
              <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 16px; font-weight: 600;">${content.tipsTitle}</h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; line-height: 1.5;">• ${content.tip1}</p>
                    <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; line-height: 1.5;">• ${content.tip2}</p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">• ${content.tip3}</p>
                  </td>
                </tr>
              </table>

              <!-- Support -->
              <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                ${content.supportText}
              </p>

              <p style="margin: 0; color: #374151; font-size: 14px;">
                ${content.signature} 🍌
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px;">
                ${content.unsubscribe.replace('{{email}}', data.email)}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Nano Banana Studio. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of welcome email
 */
function generateWelcomeEmailText(data: WelcomeEmailData): string {
  const locale = data.locale === 'zh' ? 'zh' : 'en';
  const name = data.name || (locale === 'zh' ? '朋友' : 'there');
  const credits = data.creditsAmount || 8;

  if (locale === 'zh') {
    return `
你好，${name}！

欢迎加入 Nano Banana Studio！

我们很高兴你选择了我们的 AI 图像生成平台。现在，你可以轻松地将你的创意想法变成令人惊叹的视觉作品。

🎁 你的免费积分
我们已经为你准备了 ${credits} 个免费积分，让你可以立即开始探索 AI 图像生成的无限可能！

✨ 你可以做什么
- 文字生成图像 - 输入描述，AI 帮你创作
- 图像重绘 - 上传图片，AI 帮你变换风格
- 高清放大 - 一键提升图像分辨率

👉 开始创作: https://nanobananastudio.com/app

💡 快速上手提示
- 尝试使用详细的描述词来获得更精准的结果
- 浏览首页的灵感提示词，快速获取创作灵感
- 保存你喜欢的作品到个人图库

有任何问题？随时回复这封邮件，我们很乐意帮助你！

Nano Banana Studio 团队 🍌

---
此邮件发送至 ${data.email}，因为你注册了 Nano Banana Studio 账户。
© ${new Date().getFullYear()} Nano Banana Studio. All rights reserved.
    `.trim();
  }

  return `
Hi ${name}!

Welcome to Nano Banana Studio!

We're thrilled to have you join our AI image generation platform. Now you can easily transform your creative ideas into stunning visual artworks.

🎁 Your Free Credits
We've added ${credits} free credits to your account so you can start exploring the amazing possibilities of AI image generation right away!

✨ What You Can Do
- Text to Image - Describe your vision, AI creates it
- Image to Image - Upload a photo, transform its style
- HD Upscale - Enhance image resolution instantly

👉 Start Creating: https://nanobananastudio.com/app

💡 Quick Start Tips
- Use detailed descriptions for more accurate results
- Browse inspiration prompts on our homepage for creative ideas
- Save your favorite creations to your personal gallery

Have questions? Just reply to this email - we're happy to help!

The Nano Banana Studio Team 🍌

---
This email was sent to ${data.email} because you signed up for Nano Banana Studio.
© ${new Date().getFullYear()} Nano Banana Studio. All rights reserved.
  `.trim();
}

/**
 * Send welcome email to new user
 *
 * @returns true if email was sent successfully, false otherwise
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const emailService = await getEmailService();

    // Check if email service is configured
    if (!emailService.hasProviders()) {
      console.log('Welcome email skipped: No email provider configured');
      return false;
    }

    const locale = data.locale === 'zh' ? 'zh' : 'en';
    const subject = WELCOME_CONTENT[locale].subject;

    const result = await emailService.sendEmail({
      to: data.email,
      from: 'Nano Banana Studio <support@nanobananastudio.com>',
      subject,
      text: generateWelcomeEmailText(data),
      html: generateWelcomeEmailHtml(data),
      replyTo: 'support@nanobananastudio.com',
    });

    if (result.success) {
      console.log(`Welcome email sent to ${data.email}`);
      return true;
    } else {
      console.error(`Failed to send welcome email to ${data.email}:`, result.error);
      return false;
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}
