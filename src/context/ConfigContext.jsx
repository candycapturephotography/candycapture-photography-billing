import React, { createContext, useContext, useMemo } from 'react'

const ConfigContext = createContext(null)

/**
 * AppConfig interface (TypeScript-style documentation):
 * 
 * interface AppConfig {
 *   appUrl: string;
 *   storageType: 'localStorage' | 'indexedDB';
 *   pdfStorageLocation: string;
 *   logoStorageLocation: string;
 *   sessionTimeoutMinutes: number;
 *   initialAdminUsername: string;
 *   initialAdminPassword: string;
 * }
 * 
 * interface ConfigContextValue {
 *   config: AppConfig;
 *   isConfigured: boolean;
 *   configErrors: string[];
 * }
 */

// Required configuration keys that must be present for the app to start
const REQUIRED_CONFIG_KEYS = [
  'initialAdminUsername',
  'initialAdminPassword',
]

// Default values for optional configuration
const DEFAULT_CONFIG = {
  appUrl: 'http://localhost:5173',
  storageType: 'localStorage',
  pdfStorageLocation: '/pdfs',
  logoStorageLocation: '/logos',
  sessionTimeoutMinutes: 60,
}

/**
 * Loads configuration from Vite environment variables.
 * Environment variables must be prefixed with VITE_ to be exposed to the client.
 * 
 * Supported environment variables:
 * - VITE_APP_URL: Application URL
 * - VITE_STORAGE_TYPE: Storage type ('localStorage' or 'indexedDB')
 * - VITE_PDF_STORAGE_LOCATION: Path for PDF storage
 * - VITE_LOGO_STORAGE_LOCATION: Path for logo storage
 * - VITE_SESSION_TIMEOUT_MINUTES: Session timeout in minutes
 * - VITE_INITIAL_ADMIN_USERNAME: Initial admin username (required)
 * - VITE_INITIAL_ADMIN_PASSWORD: Initial admin password (required)
 */
function loadConfigFromEnv() {
  const env = import.meta.env

  return {
    appUrl: env.VITE_APP_URL || DEFAULT_CONFIG.appUrl,
    storageType: validateStorageType(env.VITE_STORAGE_TYPE) || DEFAULT_CONFIG.storageType,
    pdfStorageLocation: env.VITE_PDF_STORAGE_LOCATION || DEFAULT_CONFIG.pdfStorageLocation,
    logoStorageLocation: env.VITE_LOGO_STORAGE_LOCATION || DEFAULT_CONFIG.logoStorageLocation,
    sessionTimeoutMinutes: parseNumber(env.VITE_SESSION_TIMEOUT_MINUTES, DEFAULT_CONFIG.sessionTimeoutMinutes),
    initialAdminUsername: env.VITE_INITIAL_ADMIN_USERNAME || '',
    initialAdminPassword: env.VITE_INITIAL_ADMIN_PASSWORD || '',
  }
}

/**
 * Validates storage type is one of the allowed values.
 * @param {string|undefined} value - The storage type to validate
 * @returns {'localStorage'|'indexedDB'|null} - The validated storage type or null if invalid
 */
function validateStorageType(value) {
  if (value === 'localStorage' || value === 'indexedDB') {
    return value
  }
  return null
}

/**
 * Safely parses a string to a number with a fallback default.
 * @param {string|undefined} value - The string to parse
 * @param {number} defaultValue - The default value if parsing fails
 * @returns {number} - The parsed number or default value
 */
function parseNumber(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue
  }
  const parsed = Number(value)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Validates the configuration and returns an array of error messages for missing required values.
 * @param {object} config - The configuration object to validate
 * @returns {string[]} - Array of error messages for missing required configuration values
 */
function validateConfig(config) {
  const errors = []

  for (const key of REQUIRED_CONFIG_KEYS) {
    const value = config[key]
    if (value === undefined || value === null || value === '') {
      const envVarName = `VITE_${camelToScreamingSnake(key)}`
      errors.push(`Missing required configuration: ${key} (environment variable: ${envVarName})`)
    }
  }

  return errors
}

/**
 * Converts camelCase to SCREAMING_SNAKE_CASE for environment variable names.
 * @param {string} str - The camelCase string
 * @returns {string} - The SCREAMING_SNAKE_CASE string
 */
function camelToScreamingSnake(str) {
  return str.replace(/([A-Z])/g, '_$1').toUpperCase()
}

/**
 * ConfigProvider component that provides configuration context to the application.
 * 
 * Validates required configuration values at startup. If required values are missing,
 * the context will report errors via configErrors and set isConfigured to false.
 * 
 * Per Requirement 19.5: If one or more required configuration values are missing or 
 * empty at startup, the Config_Service SHALL halt startup and report each missing 
 * required configuration value by name.
 */
export function ConfigProvider({ children }) {
  const contextValue = useMemo(() => {
    const config = loadConfigFromEnv()
    const configErrors = validateConfig(config)
    const isConfigured = configErrors.length === 0

    return {
      config,
      isConfigured,
      configErrors,
    }
  }, [])

  // If not configured, render an error display instead of the app
  // This implements the "halt startup" behavior from Requirement 19.5
  if (!contextValue.isConfigured) {
    return (
      <ConfigContext.Provider value={contextValue}>
        <ConfigErrorDisplay errors={contextValue.configErrors} />
      </ConfigContext.Provider>
    )
  }

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  )
}

/**
 * Error display component shown when required configuration is missing.
 * Renders a visible error state that prevents the app from starting in a
 * partially configured state (Requirement 19.5).
 */
function ConfigErrorDisplay({ errors }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fef2f2',
      padding: '2rem',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
      }}>
        <h1 style={{
          color: '#dc2626',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span role="img" aria-label="error">⚠️</span>
          Configuration Error
        </h1>
        <p style={{
          color: '#4b5563',
          marginBottom: '1rem',
        }}>
          The application cannot start because required configuration values are missing.
          Please set the following environment variables:
        </p>
        <ul style={{
          listStyleType: 'none',
          padding: 0,
          margin: 0,
        }}>
          {errors.map((error, index) => (
            <li
              key={index}
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                padding: '0.75rem',
                marginBottom: '0.5rem',
                color: '#991b1b',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </li>
          ))}
        </ul>
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '4px',
        }}>
          <p style={{
            color: '#4b5563',
            fontSize: '0.875rem',
            marginBottom: '0.5rem',
          }}>
            <strong>Example .env file:</strong>
          </p>
          <pre style={{
            backgroundColor: '#1f2937',
            color: '#e5e7eb',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.75rem',
            lineHeight: '1.5',
          }}>
{`VITE_INITIAL_ADMIN_USERNAME=admin
VITE_INITIAL_ADMIN_PASSWORD=securepassword123
VITE_APP_URL=http://localhost:5173
VITE_STORAGE_TYPE=localStorage
VITE_SESSION_TIMEOUT_MINUTES=60`}
          </pre>
        </div>
      </div>
    </div>
  )
}

/**
 * Custom hook to access the configuration context.
 * Must be used within a ConfigProvider.
 * 
 * @returns {ConfigContextValue} The configuration context value
 * @throws {Error} If used outside of ConfigProvider
 */
export const useConfig = () => {
  const ctx = useContext(ConfigContext)
  if (!ctx) {
    throw new Error('useConfig must be used within ConfigProvider')
  }
  return ctx
}
