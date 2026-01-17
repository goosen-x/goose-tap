import crypto from 'crypto';

// Telegram's Ed25519 public keys for signature verification
const TELEGRAM_PUBLIC_KEYS = {
  // Production environment
  production: Buffer.from('e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d', 'hex'),
  // Test environment
  test: Buffer.from('40055058a4ee38156a06562e52eece92a771bcd8346a8c4615cb7376eddf72ec', 'hex'),
};

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
 * - Ed25519 signature (new method, uses Telegram's public key)
 * - HMAC-SHA256 hash (legacy method, uses bot token)
 */
export function validateInitData(initData: string): ValidationResult {
  if (!initData || initData.trim() === '') {
    return { valid: false, error: 'Empty initData' };
  }

  try {
    const params = new URLSearchParams(initData);
    const signature = params.get('signature');
    const hash = params.get('hash');

    // Determine which validation method to use
    if (signature) {
      return validateWithSignature(params, signature);
    } else if (hash) {
      return validateWithHash(params, hash);
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
 */
function validateWithSignature(params: URLSearchParams, signature: string): ValidationResult {
  // Remove signature from params for verification
  params.delete('signature');

  // Sort parameters alphabetically and create data_check_string
  const sortedParams = Array.from(params.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Convert base64url signature to buffer
  const signatureBuffer = Buffer.from(
    signature.replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  );

  // Try production key first, then test key
  const publicKeys = [TELEGRAM_PUBLIC_KEYS.production, TELEGRAM_PUBLIC_KEYS.test];
  let isValid = false;

  for (const publicKey of publicKeys) {
    try {
      const keyObject = crypto.createPublicKey({
        key: Buffer.concat([
          // Ed25519 public key ASN.1 prefix
          Buffer.from('302a300506032b6570032100', 'hex'),
          publicKey,
        ]),
        format: 'der',
        type: 'spki',
      });

      isValid = crypto.verify(
        null,
        Buffer.from(sortedParams),
        keyObject,
        signatureBuffer
      );

      if (isValid) break;
    } catch {
      continue;
    }
  }

  if (!isValid) {
    console.error('[Auth] Signature verification failed');
    return { valid: false, error: 'Invalid signature' };
  }

  return extractUserFromParams(params);
}

/**
 * Validate using HMAC-SHA256 hash (legacy method)
 */
function validateWithHash(params: URLSearchParams, hash: string): ValidationResult {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return { valid: false, error: 'Bot token not configured' };
  }

  // Remove hash from params for verification
  params.delete('hash');

  // Sort parameters alphabetically and create data_check_string
  const sortedParams = Array.from(params.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Calculate secret_key = HMAC-SHA256(BOT_TOKEN, "WebAppData")
  const secretKey = crypto
    .createHmac('sha256', botToken)
    .update('WebAppData')
    .digest();

  // Calculate hash = HMAC-SHA256(data_check_string, secret_key)
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(sortedParams)
    .digest('hex');

  if (calculatedHash !== hash) {
    console.error('[Auth] Hash mismatch');
    return { valid: false, error: 'Invalid hash' };
  }

  return extractUserFromParams(params);
}

/**
 * Extract and validate user from params after signature/hash verification
 */
function extractUserFromParams(params: URLSearchParams): ValidationResult {
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
