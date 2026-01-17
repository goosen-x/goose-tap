import crypto from 'crypto';

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
 * Validates Telegram Mini App initData using HMAC-SHA256
 *
 * Algorithm:
 * 1. Parse initData as URLSearchParams
 * 2. Extract hash
 * 3. Sort remaining parameters alphabetically
 * 4. Create data_check_string (key=value\n...)
 * 5. Calculate secret_key = HMAC-SHA256("WebAppData", BOT_TOKEN)
 * 6. Calculate hash = HMAC-SHA256(data_check_string, secret_key)
 * 7. Compare with provided hash
 */
export function validateInitData(initData: string): ValidationResult {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return { valid: false, error: 'Bot token not configured' };
  }

  if (!initData || initData.trim() === '') {
    return { valid: false, error: 'Empty initData' };
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      return { valid: false, error: 'No hash in initData' };
    }

    // Remove hash from params for verification
    params.delete('hash');

    // Sort parameters alphabetically and create data_check_string
    const sortedParams = Array.from(params.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Calculate secret_key = HMAC-SHA256("WebAppData", BOT_TOKEN)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate hash = HMAC-SHA256(data_check_string, secret_key)
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(sortedParams)
      .digest('hex');

    if (calculatedHash !== hash) {
      return { valid: false, error: 'Invalid hash' };
    }

    // Check auth_date is not too old (6 hours max)
    const authDate = params.get('auth_date');
    if (authDate) {
      const authTimestamp = parseInt(authDate, 10) * 1000;
      const now = Date.now();
      const maxAge = 6 * 60 * 60 * 1000; // 6 hours in ms

      if (now - authTimestamp > maxAge) {
        return { valid: false, error: 'initData expired' };
      }
    }

    // Extract user data
    const userJson = params.get('user');
    if (!userJson) {
      return { valid: false, error: 'No user in initData' };
    }

    const user = JSON.parse(userJson) as TelegramUser;

    return { valid: true, user };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
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
export function validateInitDataWithDevFallback(initData: string): ValidationResult {
  // First try real validation
  const result = validateInitData(initData);

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
