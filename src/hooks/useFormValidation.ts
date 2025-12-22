import { useState, useCallback, useMemo } from 'react';
import {
  validateEmail,
  validatePassword,
  validateRequired,
  validateLength,
  validateUrl,
  validatePositiveNumber,
  validateCryptoAmount,
  sanitizeString,
  sanitizeForDisplay,
  type ValidationResult,
  type PasswordValidationOptions,
} from '../lib/validation';

/**
 * Field validator configuration
 */
interface FieldValidator {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  email?: boolean;
  password?: boolean | PasswordValidationOptions;
  url?: boolean | { requireHttps?: boolean };
  number?: boolean | 'positive' | 'crypto';
  custom?: (value: string) => ValidationResult;
}

/**
 * Form field configuration
 */
interface FieldConfig {
  initialValue?: string;
  validators?: FieldValidator;
  sanitize?: boolean;
}

/**
 * Form configuration
 */
type FormConfig<T extends string> = Record<T, FieldConfig>;

/**
 * Form values type
 */
type FormValues<T extends string> = Record<T, string>;

/**
 * Form errors type
 */
type FormErrors<T extends string> = Partial<Record<T, string>>;

/**
 * Form touched state type
 */
type FormTouched<T extends string> = Partial<Record<T, boolean>>;

/**
 * Hook result
 */
interface UseFormValidationResult<T extends string> {
  values: FormValues<T>;
  errors: FormErrors<T>;
  touched: FormTouched<T>;
  isValid: boolean;
  isDirty: boolean;
  setValue: (field: T, value: string) => void;
  setError: (field: T, error: string) => void;
  clearError: (field: T) => void;
  setTouched: (field: T, isTouched?: boolean) => void;
  validateField: (field: T) => boolean;
  validateAll: () => boolean;
  reset: () => void;
  handleChange: (field: T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (field: T) => () => void;
  getFieldProps: (field: T) => {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
  };
  getSanitizedValues: () => FormValues<T>;
}

/**
 * Custom hook for form validation
 */
export function useFormValidation<T extends string>(
  config: FormConfig<T>
): UseFormValidationResult<T> {
  const fields = Object.keys(config) as T[];

  // Initialize values from config
  const initialValues = useMemo(() => {
    const values: Partial<FormValues<T>> = {};
    for (const field of fields) {
      values[field] = config[field].initialValue || '';
    }
    return values as FormValues<T>;
  }, [config, fields]);

  const [values, setValues] = useState<FormValues<T>>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouchedState] = useState<FormTouched<T>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Validate a single field
  const validateField = useCallback(
    (field: T): boolean => {
      const value = values[field];
      const fieldConfig = config[field];
      const validators = fieldConfig?.validators;

      if (!validators) {
        return true;
      }

      // Required validation
      if (validators.required) {
        const result = validateRequired(value, field);
        if (!result.isValid) {
          setErrors((prev) => ({ ...prev, [field]: result.error }));
          return false;
        }
      }

      // Skip other validations if empty and not required
      if (!value) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
        return true;
      }

      // Email validation
      if (validators.email) {
        const result = validateEmail(value);
        if (!result.isValid) {
          setErrors((prev) => ({ ...prev, [field]: result.error }));
          return false;
        }
      }

      // Password validation
      if (validators.password) {
        const options = typeof validators.password === 'object' ? validators.password : {};
        const result = validatePassword(value, options);
        if (!result.isValid) {
          setErrors((prev) => ({ ...prev, [field]: result.error }));
          return false;
        }
      }

      // Length validation
      if (validators.minLength !== undefined || validators.maxLength !== undefined) {
        const result = validateLength(value, {
          min: validators.minLength,
          max: validators.maxLength,
          fieldName: field,
        });
        if (!result.isValid) {
          setErrors((prev) => ({ ...prev, [field]: result.error }));
          return false;
        }
      }

      // URL validation
      if (validators.url) {
        const options = typeof validators.url === 'object' ? validators.url : {};
        const result = validateUrl(value, options);
        if (!result.isValid) {
          setErrors((prev) => ({ ...prev, [field]: result.error }));
          return false;
        }
      }

      // Number validation
      if (validators.number) {
        let result: ValidationResult;
        if (validators.number === 'crypto') {
          result = validateCryptoAmount(value);
        } else if (validators.number === 'positive') {
          result = validatePositiveNumber(value, field);
        } else {
          result = validatePositiveNumber(value, field);
        }
        if (!result.isValid) {
          setErrors((prev) => ({ ...prev, [field]: result.error }));
          return false;
        }
      }

      // Custom validation
      if (validators.custom) {
        const result = validators.custom(value);
        if (!result.isValid) {
          setErrors((prev) => ({ ...prev, [field]: result.error }));
          return false;
        }
      }

      // Clear error if all validations pass
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });

      return true;
    },
    [config, values]
  );

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    let isValid = true;

    for (const field of fields) {
      const fieldValid = validateField(field);
      if (!fieldValid) {
        isValid = false;
      }
      setTouchedState((prev) => ({ ...prev, [field]: true }));
    }

    return isValid;
  }, [fields, validateField]);

  // Set a single field value
  const setValue = useCallback(
    (field: T, value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);
    },
    []
  );

  // Set a field error
  const setError = useCallback((field: T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  // Clear a field error
  const clearError = useCallback((field: T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Set field touched state
  const setTouched = useCallback((field: T, isTouched = true) => {
    setTouchedState((prev) => ({ ...prev, [field]: isTouched }));
  }, []);

  // Reset form to initial state
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouchedState({});
    setIsDirty(false);
  }, [initialValues]);

  // Handle input change
  const handleChange = useCallback(
    (field: T) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setValue(field, e.target.value);
      },
    [setValue]
  );

  // Handle input blur
  const handleBlur = useCallback(
    (field: T) => () => {
      setTouched(field, true);
      validateField(field);
    },
    [setTouched, validateField]
  );

  // Get field props for easy binding
  const getFieldProps = useCallback(
    (field: T) => ({
      value: values[field],
      onChange: handleChange(field),
      onBlur: handleBlur(field),
    }),
    [values, handleChange, handleBlur]
  );

  // Get sanitized values
  const getSanitizedValues = useCallback((): FormValues<T> => {
    const sanitized: Partial<FormValues<T>> = {};

    for (const field of fields) {
      const fieldConfig = config[field];
      if (fieldConfig?.sanitize !== false) {
        sanitized[field] = sanitizeString(values[field]);
      } else {
        sanitized[field] = values[field];
      }
    }

    return sanitized as FormValues<T>;
  }, [config, fields, values]);

  // Check if form is valid (no errors)
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    setValue,
    setError,
    clearError,
    setTouched,
    validateField,
    validateAll,
    reset,
    handleChange,
    handleBlur,
    getFieldProps,
    getSanitizedValues,
  };
}

/**
 * Simple input sanitization hook
 */
export function useSanitizedInput(initialValue = '') {
  const [value, setValue] = useState(initialValue);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(e.target.value);
    },
    []
  );

  const getSanitized = useCallback(() => {
    return sanitizeString(value);
  }, [value]);

  const getDisplaySafe = useCallback(() => {
    return sanitizeForDisplay(value);
  }, [value]);

  return {
    value,
    setValue,
    handleChange,
    getSanitized,
    getDisplaySafe,
  };
}
