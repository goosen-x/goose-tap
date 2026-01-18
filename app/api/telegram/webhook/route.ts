import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://goose-tap.vercel.app';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
}

async function sendMessage(chatId: number, text: string, replyMarkup?: object) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    }),
  });
}

export async function POST(request: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
  }

  try {
    const update: TelegramUpdate = await request.json();
    const message = update.message;

    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text;

    // Handle /start command
    if (text.startsWith('/start')) {
      const param = text.replace('/start', '').trim(); // "ref_123" or empty

      // Build webapp URL with referral parameter
      let webappUrl = WEBAPP_URL;
      if (param) {
        webappUrl = `${WEBAPP_URL}?startParam=${encodeURIComponent(param)}`;
      }

      const welcomeText = `<b>Welcome to Goose Tap!</b>

Tap the goose, earn coins, invite friends and climb the leaderboard!

Tap the button below to start playing.`;

      await sendMessage(chatId, welcomeText, {
        inline_keyboard: [
          [
            {
              text: '🎮 Play Goose Tap',
              web_app: { url: webappUrl },
            },
          ],
        ],
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Verify webhook (optional, for setup)
export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook endpoint' });
}
