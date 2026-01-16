import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Channel ID for @gooselabs
// To get: open https://web.telegram.org/a/#-XXXXXXXXXX and add -100 prefix
const GOOSELABS_CHANNEL_ID = process.env.GOOSELABS_CHANNEL_ID || '@gooselabs';

interface TelegramResponse {
  ok: boolean;
  result?: {
    status: 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked';
    user: {
      id: number;
      first_name: string;
    };
  };
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, channelId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        { error: 'Bot token not configured' },
        { status: 500 }
      );
    }

    // Use provided channelId or default to gooselabs
    const chatId = channelId || GOOSELABS_CHANNEL_ID;

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(chatId)}&user_id=${userId}`
    );

    const data: TelegramResponse = await response.json();

    if (!data.ok) {
      // User not found in chat or other error
      return NextResponse.json({
        subscribed: false,
        status: 'not_found',
        error: data.description,
      });
    }

    const status = data.result?.status;
    const isSubscribed = ['member', 'administrator', 'creator'].includes(status || '');

    return NextResponse.json({
      subscribed: isSubscribed,
      status: status,
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const channelId = searchParams.get('channelId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json(
      { error: 'Bot token not configured' },
      { status: 500 }
    );
  }

  const chatId = channelId || GOOSELABS_CHANNEL_ID;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(chatId)}&user_id=${userId}`
    );

    const data: TelegramResponse = await response.json();

    if (!data.ok) {
      return NextResponse.json({
        subscribed: false,
        status: 'not_found',
        error: data.description,
      });
    }

    const status = data.result?.status;
    const isSubscribed = ['member', 'administrator', 'creator'].includes(status || '');

    return NextResponse.json({
      subscribed: isSubscribed,
      status: status,
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription' },
      { status: 500 }
    );
  }
}
