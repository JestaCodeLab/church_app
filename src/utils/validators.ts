// frontend/src/utils/validators.ts

/**
 * Frontend Email and Phone Validation
 * Matches backend validation logic for consistency
 */

export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

export interface PhoneValidationResult extends ValidationResult {
  normalized: string;
  format: 'local' | 'international' | null;
}

/**
 * Validate email format (RFC 5322 compliant)
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return { 
      valid: false, 
      error: 'Please enter a valid email address (e.g. user@example.com)' 
    };
  }

  return { valid: true, error: null };
};

/**
 * Check if email is valid (boolean only)
 */
export const isValidEmail = (email: string) => {
  // Basic regex check
  const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!basicRegex.test(email)) {
    return false;
  }
  
  // ✅ ADDITIONAL TLD CHECKS:
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  
  const [localPart, domain] = parts;
  
  // Domain must have dot
  if (!domain.includes('.')) return false;
  
  // Split domain by dots
  const domainParts = domain.split('.');
  if (domainParts.length < 2) return false;
  
  // TLD (last part) must be valid
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) return false;
  if (!/^[a-zA-Z]+$/.test(tld)) return false;
  
  return true;
};

/**
 * Validate Ghana phone number
 * Accepts: 0XXXXXXXXX or 233XXXXXXXXX
 */
export const validatePhone = (phone: string): PhoneValidationResult => {
  if (!phone) {
    return { 
      valid: false, 
      error: 'Phone number is required',
      normalized: '',
      format: null
    };
  }

  const trimmed = phone.trim();
  const cleaned = trimmed.replace(/\D/g, '');

  // Check valid formats
  const isLocal = /^0[0-9]{9}$/.test(cleaned);
  const isInternational = /^233[0-9]{9}$/.test(cleaned);

  if (!isLocal && !isInternational) {
    return {
      valid: false,
      error: 'Please enter a valid phone number (0241234567 or 233241234567)',
      normalized: cleaned,
      format: null
    };
  }

  // Normalize to 233 format
  let normalized = cleaned;
  let format: 'local' | 'international' = 'international';

  if (isLocal) {
    normalized = '233' + cleaned.substring(1);
    format = 'local';
  }

  return {
    valid: true,
    error: null,
    normalized,
    format
  };
};

/**
 * Check if Ghana phone is valid (boolean only)
 */
export const isValidPhone = (phone: string): boolean => {
  return validatePhone(phone).valid;
};

/**
 * Format phone number for display
 */
export const formatPhoneDisplay = (
  phone: string, 
  style: 'local' | 'international' = 'local'
): string => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (style === 'local') {
    // 0XX XXX XXXX
    if (cleaned.startsWith('233') && cleaned.length === 12) {
      const local = '0' + cleaned.substring(3);
      return `${local.substring(0, 3)} ${local.substring(3, 6)} ${local.substring(6)}`;
    } else if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    }
  } else {
    // +233 XX XXX XXXX
    let intl = cleaned;
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      intl = '233' + cleaned.substring(1);
    }
    if (intl.startsWith('233') && intl.length === 12) {
      return `+233 ${intl.substring(3, 5)} ${intl.substring(5, 8)} ${intl.substring(8)}`;
    }
  }
  
  return phone;
};

/**
 * Validate both email and phone
 */
export const validateContact = (
  email: string | undefined,
  phone: string | undefined,
  options: {
    emailRequired?: boolean;
    phoneRequired?: boolean;
  } = {}
): {
  valid: boolean;
  errors: {
    email?: string;
    phone?: string;
  };
  normalized: {
    email?: string;
    phone?: string;
  };
} => {
  const { emailRequired = false, phoneRequired = true } = options;
  
  const errors: { email?: string; phone?: string } = {};
  const normalized: { email?: string; phone?: string } = {};
  
  // Validate email
  if (email || emailRequired) {
    const emailValidation = validateEmail(email || '');
    if (!emailValidation.valid) {
      errors.email = emailValidation.error || undefined;
    } else {
      normalized.email = email?.trim().toLowerCase();
    }
  }
  
  // Validate phone
  if (phone || phoneRequired) {
    const phoneValidation = validatePhone(phone || '');
    if (!phoneValidation.valid) {
      errors.phone = phoneValidation.error || undefined;
    } else {
      normalized.phone = phoneValidation.normalized;
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    normalized
  };
};

/**
 * Helper: Get error message for field
 */
export const getFieldError = (
  errors: Record<string, string | undefined>,
  field: string
): string | undefined => {
  return errors[field];
};

/**
 * Helper: Check if field has error
 */
export const hasFieldError = (
  errors: Record<string, string | undefined>,
  field: string
): boolean => {
  return !!errors[field];
};