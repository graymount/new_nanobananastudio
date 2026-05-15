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
    subject: '🍌 Welcome to TextRender Studio - Your AI Creative Journey Begins!',
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
    welcome: '欢迎加入 TextRender Studio！',
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
    signature: 'TextRender Studio 团队',
    unsubscribe: '此邮件发送至 {{email}}，因为你注册了 TextRender Studio 账户。',
  } : {
    greeting: `Hi ${name}!`,
    welcome: 'Welcome to TextRender Studio!',
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
    signature: 'The TextRender Studio Team',
    unsubscribe: 'This email was sent to {{email}} because you signed up for TextRender Studio.',
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
              <img src="https://nanobananastudio.com/logo.png" alt="TextRender Studio" width="60" height="60" style="width: 60px; height: 60px; border-radius: 12px; margin-bottom: 16px;">
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
                © ${new Date().getFullYear()} TextRender Studio. All rights reserved.
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

欢迎加入 TextRender Studio！

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

TextRender Studio 团队 🍌

---
此邮件发送至 ${data.email}，因为你注册了 TextRender Studio 账户。
© ${new Date().getFullYear()} TextRender Studio. All rights reserved.
    `.trim();
  }

  return `
Hi ${name}!

Welcome to TextRender Studio!

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

The TextRender Studio Team 🍌

---
This email was sent to ${data.email} because you signed up for TextRender Studio.
© ${new Date().getFullYear()} TextRender Studio. All rights reserved.
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

/**
 * Founder personal email - sent after welcome email to increase conversion
 * This is a more personal touch from the founder
 */

const FOUNDER_CONTENT = {
  en: {
    subject: 'Quick hello from Alex 👋',
  },
  zh: {
    subject: 'Alex 的一封简短问候 👋',
  },
};

function generateFounderEmailText(data: WelcomeEmailData): string {
  const locale = data.locale === 'zh' ? 'zh' : 'en';
  const name = data.name || (locale === 'zh' ? '朋友' : 'there');

  if (locale === 'zh') {
    return `
${name} 你好，

看到你刚注册了 Nano Banana Studio，欢迎！

我是 Alex，这个产品的创始人。做这个工具是因为我觉得其他 AI 图片生成器太复杂了，我想做一个简单好用的。

你现在有 5 个免费额度，可以试试：
• 输入「赛博朋克风格的可爱猫咪」
• 上传一张照片，把它变成艺术画
• 尝试不同的风格

👉 开始创作: https://nanobananastudio.com/app

有任何问题或建议，直接回复这封邮件就行，我会亲自看每一封。

祝创作愉快！

Alex King
Founder, Nano Banana Studio
    `.trim();
  }

  return `
Hi ${name},

I saw you just signed up for Nano Banana Studio - welcome!

I'm Alex, the founder. I built this tool because I was frustrated with how complicated other AI image generators are. I wanted something simple that just works.

You've got 5 free credits to play with. Here are some ideas to get started:
• Try "a cute cat in cyberpunk style"
• Upload a photo and transform it into artwork
• Experiment with different styles

👉 Start creating: https://nanobananastudio.com/app

If you run into any issues or have feedback, just reply to this email. I read every message personally.

Happy creating!

Alex King
Founder, Nano Banana Studio
  `.trim();
}

/**
 * Send founder personal email to new user
 */
export async function sendFounderEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const emailService = await getEmailService();

    if (!emailService.hasProviders()) {
      console.log('Founder email skipped: No email provider configured');
      return false;
    }

    const locale = data.locale === 'zh' ? 'zh' : 'en';
    const subject = FOUNDER_CONTENT[locale].subject;

    const result = await emailService.sendEmail({
      to: data.email,
      from: 'Alex King <alex.king@nanobananastudio.com>',
      subject,
      text: generateFounderEmailText(data),
      replyTo: 'alex.king@nanobananastudio.com',
    });

    if (result.success) {
      console.log(`Founder email sent to ${data.email}`);
      return true;
    } else {
      console.error(`Failed to send founder email to ${data.email}:`, result.error);
      return false;
    }
  } catch (error) {
    console.error('Error sending founder email:', error);
    return false;
  }
}
