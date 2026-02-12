/**
 * Client-side AES-GCM encryption for the Password Vault.
 * 
 * Uses the Web Crypto API (SubtleCrypto) which is built into all modern browsers.
 * The user's master key is derived from a passphrase using PBKDF2.
 * Each password is encrypted with AES-256-GCM before being sent to the server.
 * The server never sees the plaintext passwords.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Derives an AES key from the user's master passphrase using PBKDF2.
 */
async function deriveKey(passphrase, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64 string containing: salt (16 bytes) + iv (12 bytes) + ciphertext.
 */
export async function encryptPassword(plaintext, masterKey) {
    if (!plaintext || !masterKey) return plaintext;

    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const key = await deriveKey(masterKey, salt);

    const ciphertext = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        encoder.encode(plaintext)
    );

    // Combine salt + iv + ciphertext into a single array
    const combined = new Uint8Array(salt.length + iv.length + new Uint8Array(ciphertext).length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a base64-encoded ciphertext string using AES-256-GCM.
 * The input must contain: salt (16 bytes) + iv (12 bytes) + ciphertext.
 */
export async function decryptPassword(encryptedBase64, masterKey) {
    if (!encryptedBase64 || !masterKey) return encryptedBase64;

    try {
        // Decode from base64
        const combined = new Uint8Array(
            atob(encryptedBase64).split('').map(c => c.charCodeAt(0))
        );

        const salt = combined.slice(0, SALT_LENGTH);
        const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

        const key = await deriveKey(masterKey, salt);

        const decrypted = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    } catch (err) {
        console.error('Decryption failed:', err);
        // Return the raw value if decryption fails (likely not encrypted / wrong key)
        return encryptedBase64;
    }
}

/**
 * Checks if a string looks like it's been encrypted (base64-encoded with proper length).
 */
export function isEncrypted(value) {
    if (!value || typeof value !== 'string') return false;
    // Must be pure base64 (no spaces, punctuation, etc.)
    if (!/^[A-Za-z0-9+/]+=*$/.test(value)) return false;
    try {
        const decoded = atob(value);
        // Minimum: 16 (salt) + 12 (iv) + 16 (AES-GCM auth tag, minimum) = 44 bytes
        return decoded.length >= 44;
    } catch {
        return false;
    }
}

/**
 * Gets the master key from session storage, or returns null.
 */
export function getMasterKey() {
    return sessionStorage.getItem('vault_master_key');
}

/**
 * Saves the master key to session storage (cleared when tab is closed).
 */
export function setMasterKey(key) {
    sessionStorage.setItem('vault_master_key', key);
}

/**
 * Clears the master key from session storage.
 */
export function clearMasterKey() {
    sessionStorage.removeItem('vault_master_key');
}
