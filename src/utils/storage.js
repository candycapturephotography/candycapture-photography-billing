/**
 * Storage Adapter Utility
 * 
 * Abstracts localStorage operations for the CandyCapture Photography billing portal.
 * Designed for future migration to IndexedDB while maintaining a consistent API.
 * 
 * All storage keys use the 'ccp_' prefix convention.
 * 
 * @module storage
 */

/**
 * Storage key prefix for all CandyCapture Photography data
 */
export const STORAGE_PREFIX = 'ccp_'

/**
 * Known storage keys used by the application
 */
export const STORAGE_KEYS = {
  INVOICES: 'ccp_invoices',
  CUSTOMERS: 'ccp_customers',
  SERVICES: 'ccp_services',
  PACKAGES: 'ccp_packages',
  STUDIO: 'ccp_studio',
  USERS: 'ccp_users',
  SESSION: 'ccp_session',
  LAST_ACTIVITY: 'ccp_last_activity',
  LOGIN_ATTEMPTS: 'ccp_login_attempts',
  INVOICE_COUNTER: 'ccp_invoice_counter',
  CONFIG: 'ccp_config',
  SESSION_EXPIRED: 'ccp_session_expired',
}

/**
 * Storage adapter interface for abstracting storage operations.
 * Currently implements localStorage, designed for future IndexedDB migration.
 */
const storageAdapter = {
  /**
   * Get an item from storage
   * @param {string} key - Storage key
   * @returns {string|null} - Raw string value or null if not found
   */
  getItem(key) {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error(`[Storage] Error reading key "${key}":`, error)
      return null
    }
  },

  /**
   * Set an item in storage
   * @param {string} key - Storage key
   * @param {string} value - String value to store
   * @returns {boolean} - True if successful, false otherwise
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error(`[Storage] Error writing key "${key}":`, error)
      // Handle quota exceeded errors
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.error('[Storage] Storage quota exceeded')
      }
      return false
    }
  },

  /**
   * Remove an item from storage
   * @param {string} key - Storage key
   * @returns {boolean} - True if successful, false otherwise
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`[Storage] Error removing key "${key}":`, error)
      return false
    }
  },

  /**
   * Clear all items from storage (use with caution)
   * @returns {boolean} - True if successful, false otherwise
   */
  clear() {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('[Storage] Error clearing storage:', error)
      return false
    }
  },

  /**
   * Check if storage is available
   * @returns {boolean} - True if storage is available
   */
  isAvailable() {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, testKey)
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  },
}

/**
 * Load a value from storage with JSON parsing and fallback support.
 * 
 * @param {string} key - Storage key (will be used as-is, include prefix if needed)
 * @param {*} fallback - Default value to return if key doesn't exist or parsing fails
 * @returns {*} - Parsed value from storage or fallback
 * 
 * @example
 * // Load invoices with empty array fallback
 * const invoices = load('ccp_invoices', [])
 * 
 * @example
 * // Load a single value with default
 * const counter = load('ccp_invoice_counter', { year: 2024, lastNumber: 0 })
 */
export function load(key, fallback) {
  try {
    const value = storageAdapter.getItem(key)
    if (value === null || value === undefined) {
      return fallback
    }
    return JSON.parse(value)
  } catch (error) {
    // JSON parse error or other issues
    console.warn(`[Storage] Failed to parse value for key "${key}":`, error)
    return fallback
  }
}

/**
 * Save a value to storage with JSON serialization.
 * 
 * @param {string} key - Storage key (will be used as-is, include prefix if needed)
 * @param {*} value - Value to store (will be JSON stringified)
 * @returns {boolean} - True if save was successful, false otherwise
 * 
 * @example
 * // Save invoices array
 * save('ccp_invoices', invoices)
 * 
 * @example
 * // Save counter object
 * save('ccp_invoice_counter', { year: 2024, lastNumber: 42 })
 */
export function save(key, value) {
  try {
    const serialized = JSON.stringify(value)
    return storageAdapter.setItem(key, serialized)
  } catch (error) {
    // JSON stringify error (circular reference, etc.) or storage error
    console.error(`[Storage] Failed to save value for key "${key}":`, error)
    return false
  }
}

/**
 * Remove a value from storage.
 * 
 * @param {string} key - Storage key to remove
 * @returns {boolean} - True if removal was successful, false otherwise
 * 
 * @example
 * remove('ccp_session')
 */
export function remove(key) {
  return storageAdapter.removeItem(key)
}

/**
 * Check if a key exists in storage.
 * 
 * @param {string} key - Storage key to check
 * @returns {boolean} - True if key exists, false otherwise
 * 
 * @example
 * if (exists('ccp_session')) {
 *   // User has a session
 * }
 */
export function exists(key) {
  return storageAdapter.getItem(key) !== null
}

/**
 * Get all storage keys that match the CandyCapture prefix.
 * 
 * @returns {string[]} - Array of storage keys with ccp_ prefix
 */
export function getAllKeys() {
  const keys = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keys.push(key)
      }
    }
  } catch (error) {
    console.error('[Storage] Error getting all keys:', error)
  }
  return keys
}

/**
 * Clear all CandyCapture data from storage.
 * Only removes keys with the ccp_ prefix.
 * 
 * @returns {boolean} - True if all keys were removed successfully
 */
export function clearAllAppData() {
  const keys = getAllKeys()
  let success = true
  for (const key of keys) {
    if (!remove(key)) {
      success = false
    }
  }
  return success
}

/**
 * Check if storage is available and working.
 * 
 * @returns {boolean} - True if storage is available
 */
export function isStorageAvailable() {
  return storageAdapter.isAvailable()
}

/**
 * Get storage usage information.
 * 
 * @returns {{ used: number, keys: number } | null} - Storage usage info or null if unavailable
 */
export function getStorageInfo() {
  try {
    let totalSize = 0
    const keys = getAllKeys()
    
    for (const key of keys) {
      const value = localStorage.getItem(key)
      if (value) {
        // Approximate size in bytes (UTF-16 encoding)
        totalSize += (key.length + value.length) * 2
      }
    }
    
    return {
      used: totalSize,
      keys: keys.length,
    }
  } catch (error) {
    console.error('[Storage] Error getting storage info:', error)
    return null
  }
}

// Default export for convenience
export default {
  load,
  save,
  remove,
  exists,
  getAllKeys,
  clearAllAppData,
  isStorageAvailable,
  getStorageInfo,
  STORAGE_KEYS,
  STORAGE_PREFIX,
}
