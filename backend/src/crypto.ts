import crypto from 'crypto';

// Master Encryption Key derived for Vetri Indane Platform
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'VETRI_INDANE_SECRET_AES256_KEY_2026_RDK'; // 32 bytes key
const KEY_BUFFER = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

/**
 * Hashes a plaintext password securely using PBKDF2 with a salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored PBKDF2 salt:hash string.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  
  // Legacy / fallback plain password check for backwards compatibility
  if (!storedHash.includes(':')) {
    return password === storedHash;
  }

  const [salt, originalHash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(verifyHash, 'hex'));
}

/**
 * AES-256-GCM End-to-End Payload Encryption
 */
export function encryptPayload(text: string): { ciphertext: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BUFFER, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    tag,
  };
}

/**
 * AES-256-GCM Payload Decryption
 */
export function decryptPayload(ciphertext: string, ivHex: string, tagHex: string): string {
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY_BUFFER, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
