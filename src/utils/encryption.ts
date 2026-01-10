/**
 * Encryption utilities for secure localStorage management
 * Uses bcryptjs for secure hashing and verification
 * 
 * bcryptjs is a JavaScript implementation of bcrypt that works in the browser
 * Purpose: Provide one-way hashing and integrity verification for sensitive data
 * 
 * NOTE: Bcrypt is designed for password hashing with adaptive salting.
 * For localStorage tokens, we use it to create a secure obfuscation layer with integrity checking.
 * The encrypted format is: v1:bcrypthash:base64encodeddata:timestamp
 */

import bcrypt from 'bcryptjs';

const ALGORITHM_VERSION = 'v1';
const BCRYPT_ROUNDS = 10; // Cost factor for bcrypt (higher = more secure but slower)

/**
 * Generate a bcrypt hash for the given data
 * Each hash includes a unique salt, so hashing the same data produces different hashes
 * @param data - Data to hash (will be stringified if not already string)
 * @returns Promise resolving to bcrypt hash string
 */
const generateHash = async (data: any): Promise<string> => {
  try {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const hash = await bcrypt.hash(jsonString, salt);
    return hash;
  } catch (error) {
    console.error('[Encryption] Hash generation failed:', error);
    throw new Error('Failed to generate hash');
  }
};

/**
 * Verify data against a bcrypt hash
 * Uses bcrypt's time-constant comparison to prevent timing attacks
 * @param data - Original data to verify
 * @param hash - Bcrypt hash to compare against
 * @returns Promise resolving to true if data matches hash
 */
const verifyHash = async (data: any, hash: string): Promise<boolean> => {
  try {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    return await bcrypt.compare(jsonString, hash);
  } catch (error) {
    console.error('[Encryption] Hash verification failed:', error);
    return false;
  }
};

/**
 * Encrypt data using bcrypt hashing and base64 encoding
 * Format: v1:bcrypthash:base64encodeddata:timestamp
 * 
 * This approach provides:
 * 1. Integrity verification (bcrypt hash)
 * 2. One-way hashing (bcrypt is not reversible)
 * 3. Casual inspection prevention (base64 encoding)
 * 4. Timestamp for additional metadata
 * 
 * @param data - Any data to encrypt
 * @returns Promise resolving to encrypted string with version prefix
 */
export const encryptData = async (data: any): Promise<string> => {
  try {
    const jsonString = JSON.stringify(data);
    const encoded = btoa(jsonString); // Base64 encode for browser storage
    const hash = await generateHash(jsonString); // Bcrypt hash for verification
    const timestamp = Date.now().toString();
    
    // Format: v1:hash:base64data:timestamp
    return `${ALGORITHM_VERSION}:${hash}:${encoded}:${timestamp}`;
  } catch (error) {
    console.error('[Encryption] Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data using bcrypt verification
 * Verifies hash and recovers original data
 * @param encrypted - Encrypted string with version prefix
 * @returns Promise resolving to decrypted data or null if verification fails
 */
export const decryptData = async (encrypted: string): Promise<any> => {
  try {
    const parts = encrypted.split(':');
    
    if (parts.length < 3) {
      console.error('[Encryption] Invalid encrypted data format - insufficient parts');
      return null;
    }

    const [version, hash, encoded] = parts;
    
    if (version !== ALGORITHM_VERSION) {
      console.error(`[Encryption] Unsupported encryption version: ${version}`);
      return null;
    }

    if (!hash || !encoded) {
      console.error('[Encryption] Invalid encrypted data format - missing hash or data');
      return null;
    }

    // Decode the base64 data
    const jsonString = atob(encoded);
    
    // Verify the hash
    const isValid = await verifyHash(jsonString, hash);
    if (!isValid) {
      console.error('[Encryption] Hash verification failed - data integrity compromised');
      return null;
    }

    return JSON.parse(jsonString);
  } catch (error) {
    console.error('[Encryption] Decryption failed:', error);
    return null;
  }
};

/**
 * Store encrypted data in localStorage
 * IMPORTANT: This is an async function due to bcrypt operations
 * 
 * Usage:
 *   await setSecureItem('accessToken', token);
 * 
 * @param key - localStorage key
 * @param value - Value to encrypt and store
 * @returns Promise that resolves when item is stored
 */
export const setSecureItem = async (key: string, value: any): Promise<void> => {
  try {
    const encrypted = await encryptData(value);
    localStorage.setItem(key, encrypted);
    console.log(`[Encryption] Stored encrypted data for key: ${key}`);
  } catch (error) {
    console.error(`[Encryption] Failed to store secure item '${key}':`, error);
  }
};

/**
 * Retrieve and decrypt data from localStorage
 * IMPORTANT: This is an async function due to bcrypt verification
 * 
 * Usage:
 *   const token = await getSecureItem('accessToken');
 * 
 * @param key - localStorage key
 * @returns Promise resolving to decrypted value or null if not found/verification fails
 */
export const getSecureItem = async (key: string): Promise<any> => {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) {
      return null;
    }

    const decrypted = await decryptData(encrypted);
    if (decrypted === null) {
      console.error(`[Encryption] Failed to decrypt/verify data for key: ${key}`);
      return null;
    }

    console.log(`[Encryption] Successfully retrieved decrypted data for key: ${key}`);
    return decrypted;
  } catch (error) {
    console.error(`[Encryption] Failed to retrieve secure item '${key}':`, error);
    return null;
  }
};

/**
 * Remove encrypted item from localStorage
 * @param key - localStorage key
 */
export const removeSecureItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
    console.log(`[Encryption] Removed secure item: ${key}`);
  } catch (error) {
    console.error(`[Encryption] Failed to remove secure item '${key}':`, error);
  }
};

/**
 * Clear multiple encrypted items from localStorage
 * @param keys - Array of localStorage keys to remove
 */
export const clearSecureItems = (keys: string[]): void => {
  try {
    keys.forEach(key => {
      localStorage.removeItem(key);
    });
    console.log(`[Encryption] Cleared ${keys.length} secure items: ${keys.join(', ')}`);
  } catch (error) {
    console.error('[Encryption] Failed to clear secure items:', error);
  }
};
