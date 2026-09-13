/**
 * Form Validation Utilities
 * 
 * Each validation function returns:
 * { valid: boolean, error?: string }
 * 
 * Validates: Requirements 9.1, 2.3, 1.3
 */

/**
 * Validates customer name - must be non-empty after trimming whitespace
 * @param {string} name - The customer name to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCustomerName(name) {
  if (name == null || String(name).trim() === '') {
    return { valid: false, error: 'Customer name is required' };
  }
  return { valid: true };
}

/**
 * Validates mobile number - must contain 10-15 digits
 * @param {string} mobile - The mobile number to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateMobile(mobile) {
  if (mobile == null) {
    return { valid: false, error: 'Mobile number must be 10-15 digits' };
  }
  
  // Extract only digits from the input
  const digitsOnly = String(mobile).replace(/\D/g, '');
  
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return { valid: false, error: 'Mobile number must be 10-15 digits' };
  }
  
  return { valid: true };
}

/**
 * Validates email address - standard email format (optional field)
 * Passes if empty/null, validates format if provided
 * @param {string|null|undefined} email - The email address to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateEmail(email) {
  // Optional field - passes if empty or null
  if (email == null || String(email).trim() === '') {
    return { valid: true };
  }
  
  const trimmedEmail = String(email).trim();
  
  // Standard email format: local-part@domain
  // - Local part: at least one character before @
  // - Domain: at least one character, a dot, and at least one more character
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  return { valid: true };
}

/**
 * Validates event date - must be a valid calendar date
 * @param {string|Date} date - The date to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDate(date) {
  if (date == null || date === '') {
    return { valid: false, error: 'Please select a valid event date' };
  }
  
  let dateObj;
  
  if (date instanceof Date) {
    dateObj = date;
  } else {
    // Try to parse the date string
    dateObj = new Date(date);
  }
  
  // Check if the date is valid
  // getTime() returns NaN for invalid dates
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Please select a valid event date' };
  }
  
  return { valid: true };
}

/**
 * Validates password - must be 8-128 characters
 * @param {string} password - The password to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePassword(password) {
  if (password == null) {
    return { valid: false, error: 'Password must be 8-128 characters' };
  }
  
  const passwordStr = String(password);
  
  if (passwordStr.length < 8 || passwordStr.length > 128) {
    return { valid: false, error: 'Password must be 8-128 characters' };
  }
  
  return { valid: true };
}

/**
 * Validates username - must be 1-150 characters
 * @param {string} username - The username to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateUsername(username) {
  if (username == null) {
    return { valid: false, error: 'Username must be 1-150 characters' };
  }
  
  const usernameStr = String(username);
  
  if (usernameStr.length < 1 || usernameStr.length > 150) {
    return { valid: false, error: 'Username must be 1-150 characters' };
  }
  
  return { valid: true };
}

/**
 * Validates multiple fields at once and returns all errors
 * @param {Object} data - Object containing field values to validate
 * @param {Object} rules - Object specifying which validations to run
 * @returns {{ valid: boolean, errors: Object }}
 */
export function validateInvoiceForm(data) {
  const errors = {};
  let valid = true;
  
  // Validate customer name
  const nameResult = validateCustomerName(data.customerName);
  if (!nameResult.valid) {
    errors.customerName = nameResult.error;
    valid = false;
  }
  
  // Validate mobile number
  const mobileResult = validateMobile(data.mobile);
  if (!mobileResult.valid) {
    errors.mobile = mobileResult.error;
    valid = false;
  }
  
  // Validate event date
  const dateResult = validateDate(data.eventDate);
  if (!dateResult.valid) {
    errors.eventDate = dateResult.error;
    valid = false;
  }
  
  // Validate email (optional)
  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) {
    errors.email = emailResult.error;
    valid = false;
  }
  
  return { valid, errors };
}
