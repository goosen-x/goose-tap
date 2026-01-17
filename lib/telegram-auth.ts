import { validate, validate3rd } from '@tma.js/init-data-node';

export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface ValidationResult {
  valid: boolean;
  user?: TelegramUser;
  error?: string;
}

/**
 * Validates Telegram Mini App initData
 * Supports both:
 * - Ed25519 signature (new method, uses Telegram's public key via validate3rd)
 * - HMAC-SHA256 hash (legacy method, uses bot token via validate)
 */
export async function validateInitData(initData: string): Promise<ValidationResult> {
  if (!initData || initData.trim() === '') {
    return { valid: false, error: 'Empty initData' };
  }

  try {
    const params = new URLSearchParams(initData);
    const signature = params.get('signature');
    const hash = params.get('hash');

    // Determine which validation method to use
    if (signature) {
      return await validateWithSignature(initData);
    } else if (hash) {
      return validateWithHash(initData);
    } else {
      return { valid: false, error: 'No signature or hash in initData' };
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validate using Ed25519 signature (new Telegram method)
 * Uses official @tma.js/init-data-node library
 */
async function validateWithSignature(initData: string): Promise<ValidationResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  console.log('[Auth] validateWithSignature called');

  if (!botToken) {
    console.error('[Auth] Bot token not configured');
    return { valid: false, error: 'Bot token not configured' };
  }

  // Extract bot ID from token (format: BOT_ID:SECRET)
  const botId = parseInt(botToken.split(':')[0], 10);
  console.log('[Auth] Bot ID:', botId);

  try {
    // Try production environment first, then test
    for (const isTest of [false, true]) {
      try {
        console.log('[Auth] Trying validate3rd with test:', isTest);
        await validate3rd(initData, botId, {
          expiresIn: 6 * 60 * 60, // 6 hours
          test: isTest,
        });
        // Validation passed
        console.log('[Auth] validate3rd SUCCESS with test:', isTest);
        return extractUserFromInitData(initData);
      } catch (e) {
        console.log('[Auth] validate3rd failed for test:', isTest, 'error:', e instanceof Error ? e.message : e);
        continue;
      }
    }

    console.error('[Auth] Signature verification failed for both environments');
    return { valid: false, error: 'Invalid signature' };
  } catch (error) {
    console.error('[Auth] Signature validation error:', error);
    return { valid: false, error: 'Signature validation failed' };
  }
}

/**
 * Validate using HMAC-SHA256 hash (legacy method)
 */
function validateWithHash(initData: string): ValidationResult {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return { valid: false, error: 'Bot token not configured' };
  }

  try {
    validate(initData, botToken, {
      expiresIn: 6 * 60 * 60, // 6 hours
    });
    // Validation passed
    return extractUserFromInitData(initData);
  } catch (error) {
    console.error('[Auth] Hash validation failed:', error);
    return { valid: false, error: 'Invalid hash' };
  }
}

/**
 * Extract and validate user from initData after signature/hash verification
 */
function extractUserFromInitData(initData: string): ValidationResult {
  const params = new URLSearchParams(initData);

  // Extract user data
  const userJson = params.get('user');
  if (!userJson) {
    return { valid: false, error: 'No user in initData' };
  }

  const user = JSON.parse(userJson) as TelegramUser;
  return { valid: true, user };
}

/**
 * Extract user from initData without validation
 * Use only for development/debugging
 */
export function extractUser(initData: string): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData);
    const userJson = params.get('user');

    if (!userJson) {
      return null;
    }

    return JSON.parse(userJson) as TelegramUser;
  } catch {
    return null;
  }
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Validate initData with development mode fallback
 * In development, allows mock users for testing
 */
export async function validateInitDataWithDevFallback(initData: string): Promise<ValidationResult> {
  // First try real validation
  const result = await validateInitData(initData);

  if (result.valid) {
    return result;
  }

  // In development, allow mock users
  if (isDevelopment()) {
    const user = extractUser(initData);
    if (user) {
      console.warn('[DEV] Using unvalidated user data:', user.id);
      return { valid: true, user };
    }
  }

  return result;
}
