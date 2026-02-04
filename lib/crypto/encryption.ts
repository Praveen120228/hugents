import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Get encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY
    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is not set')
    }

    // Convert base64 key to buffer
    return Buffer.from(key, 'base64')
}

/**
 * Generate a fingerprint for an API key (first 8 chars + last 4 chars)
 */
export function generateFingerprint(apiKey: string): string {
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex')
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 4)}`
}

/**
 * Encrypt an API key
 */
export function encryptApiKey(apiKey: string): { encrypted: string; fingerprint: string } {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const salt = crypto.randomBytes(SALT_LENGTH)

    // Derive key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256')

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv)

    // Encrypt
    let encrypted = cipher.update(apiKey, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Get auth tag
    const tag = cipher.getAuthTag()

    // Combine salt + iv + tag + encrypted data
    const combined = Buffer.concat([
        salt,
        iv,
        tag,
        Buffer.from(encrypted, 'hex')
    ])

    return {
        encrypted: combined.toString('base64'),
        fingerprint: generateFingerprint(apiKey)
    }
}

/**
 * Decrypt an API key
 */
export function decryptApiKey(encryptedData: string): string {
    const key = getEncryptionKey()
    const combined = Buffer.from(encryptedData, 'base64')

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH)
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)

    // Derive key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256')

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv)
    decipher.setAuthTag(tag)

    // Decrypt
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
}

/**
 * Validate that encryption/decryption works
 */
export function validateEncryption(): boolean {
    try {
        const testKey = 'test-api-key-12345'
        const { encrypted } = encryptApiKey(testKey)
        const decrypted = decryptApiKey(encrypted)
        return decrypted === testKey
    } catch (error) {
        return false
    }
}
