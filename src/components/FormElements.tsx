/**
 * Enhanced Form Elements with Real-Time Validation UX
 *
 * Provides accessible, user-friendly form inputs with:
 * - Real-time validation with debouncing
 * - Visual success/error states
 * - Password strength meter
 * - Helpful inline error messages
 * - Character counters
 */

import { useState, useEffect, useRef, forwardRef } from 'react';
import { cn } from '../lib/utils';
import {
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Info,
  Loader2,
  X
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface InputState {
  status: 'idle' | 'validating' | 'valid' | 'invalid';
  message?: string;
}

interface BaseInputProps {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
  successMessage?: string;
  className?: string;
  inputClassName?: string;
  validateOnChange?: boolean;
  debounceMs?: number;
  onValidate?: (value: string) => Promise<{ valid: boolean; message?: string }> | { valid: boolean; message?: string };
}

// ============================================
// FormInput Component
// ============================================

interface FormInputProps extends BaseInputProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> {}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(({
  label,
  name,
  error,
  hint,
  required,
  showCharCount,
  maxLength,
  successMessage,
  className,
  inputClassName,
  validateOnChange = false,
  debounceMs = 300,
  onValidate,
  type = 'text',
  value,
  onChange,
  onBlur,
  ...props
}, ref) => {
  const [inputState, setInputState] = useState<InputState>({ status: 'idle' });
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value?.toString() || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Sync external value
  useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value.toString());
    }
  }, [value]);

  // Update input state based on error prop
  useEffect(() => {
    if (error) {
      setInputState({ status: 'invalid', message: error });
    } else if (inputState.status === 'invalid' && !error) {
      setInputState({ status: 'idle' });
    }
  }, [error, inputState.status]);

  const runValidation = async (val: string) => {
    if (!onValidate) return;

    setInputState({ status: 'validating' });
    try {
      const result = await onValidate(val);
      setInputState({
        status: result.valid ? 'valid' : 'invalid',
        message: result.message
      });
    } catch {
      setInputState({ status: 'idle' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(e);

    if (validateOnChange && onValidate) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        runValidation(newValue);
      }, debounceMs);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);

    // Validate on blur if not validating on change
    if (!validateOnChange && onValidate && localValue) {
      runValidation(localValue);
    }
  };

  const charCount = localValue.length;
  const showCount = showCharCount && maxLength;

  const getStatusIcon = () => {
    switch (inputState.status) {
      case 'validating':
        return <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />;
      case 'valid':
        return <Check className="w-4 h-4 text-green-400" />;
      case 'invalid':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    if (inputState.status === 'invalid' && inputState.message) {
      return inputState.message;
    }
    if (inputState.status === 'valid' && successMessage) {
      return successMessage;
    }
    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-300"
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        {showCount && (
          <span className={cn(
            'text-xs',
            charCount > maxLength ? 'text-red-400' : 'text-gray-500'
          )}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>

      {/* Input wrapper */}
      <div className="relative">
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          value={localValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          maxLength={maxLength}
          aria-invalid={inputState.status === 'invalid'}
          aria-describedby={statusMessage ? `${name}-message` : hint ? `${name}-hint` : undefined}
          className={cn(
            'w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white placeholder-gray-500',
            'focus:outline-none focus:ring-2 transition-all duration-200',
            inputState.status === 'invalid'
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
              : inputState.status === 'valid'
              ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20'
              : isFocused
              ? 'border-brand-primary focus:ring-brand-primary/20'
              : 'border-white/10 hover:border-white/20',
            inputState.status !== 'idle' && 'pr-10',
            inputClassName
          )}
          {...props}
        />

        {/* Status icon */}
        {inputState.status !== 'idle' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {getStatusIcon()}
          </div>
        )}
      </div>

      {/* Message area */}
      {statusMessage && (
        <p
          id={`${name}-message`}
          className={cn(
            'text-xs flex items-center gap-1.5 mt-1',
            inputState.status === 'invalid' ? 'text-red-400' : 'text-green-400'
          )}
          role={inputState.status === 'invalid' ? 'alert' : undefined}
        >
          {inputState.status === 'invalid' ? (
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
          ) : (
            <Check className="w-3 h-3 flex-shrink-0" />
          )}
          {statusMessage}
        </p>
      )}

      {/* Hint (only show when no status message) */}
      {hint && !statusMessage && (
        <p
          id={`${name}-hint`}
          className="text-xs text-gray-500 flex items-center gap-1.5"
        >
          <Info className="w-3 h-3 flex-shrink-0" />
          {hint}
        </p>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

// ============================================
// PasswordInput Component with Strength Meter
// ============================================

interface PasswordInputProps extends Omit<FormInputProps, 'type'> {
  showStrengthMeter?: boolean;
  strengthRequirements?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecial?: boolean;
  };
}

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

function calculatePasswordStrength(
  password: string,
  requirements: PasswordInputProps['strengthRequirements'] = {}
): PasswordStrength {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = true
  } = requirements;

  const checks = {
    length: password.length >= minLength,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  // Calculate score
  let score = 0;
  if (checks.length) score++;
  if (requireUppercase && checks.uppercase) score++;
  else if (!requireUppercase) score++;
  if (requireLowercase && checks.lowercase) score++;
  else if (!requireLowercase) score++;
  if (requireNumber && checks.number) score++;
  else if (!requireNumber) score++;
  if (requireSpecial && checks.special) score++;
  else if (!requireSpecial) score++;

  // Normalize to 0-4 scale
  const normalizedScore = Math.min(4, Math.floor((score / 5) * 4));

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];

  return {
    score: normalizedScore,
    label: labels[normalizedScore],
    color: colors[normalizedScore],
    checks
  };
}

export function PasswordInput({
  showStrengthMeter = true,
  strengthRequirements,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState<PasswordStrength | null>(null);

  useEffect(() => {
    if (password && showStrengthMeter) {
      setStrength(calculatePasswordStrength(password, strengthRequirements));
    } else {
      setStrength(null);
    }
  }, [password, showStrengthMeter, strengthRequirements]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    props.onChange?.(e);
  };

  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = true
  } = strengthRequirements || {};

  return (
    <div className="space-y-2">
      <div className="relative">
        <FormInput
          {...props}
          type={showPassword ? 'text' : 'password'}
          onChange={handleChange}
          inputClassName={cn(props.inputClassName, 'pr-12')}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-300 transition-colors p-1"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Strength Meter */}
      {showStrengthMeter && strength && password.length > 0 && (
        <div className="space-y-2">
          {/* Progress bar */}
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all duration-300',
                  i <= strength.score ? strength.color : 'bg-white/10'
                )}
              />
            ))}
          </div>

          {/* Strength label */}
          <p className={cn(
            'text-xs font-medium',
            strength.score <= 1 ? 'text-red-400' :
            strength.score <= 2 ? 'text-yellow-400' : 'text-green-400'
          )}>
            Password strength: {strength.label}
          </p>

          {/* Requirements checklist */}
          <ul className="space-y-1">
            <PasswordRequirement
              met={strength.checks.length}
              text={`At least ${minLength} characters`}
            />
            {requireUppercase && (
              <PasswordRequirement
                met={strength.checks.uppercase}
                text="One uppercase letter"
              />
            )}
            {requireLowercase && (
              <PasswordRequirement
                met={strength.checks.lowercase}
                text="One lowercase letter"
              />
            )}
            {requireNumber && (
              <PasswordRequirement
                met={strength.checks.number}
                text="One number"
              />
            )}
            {requireSpecial && (
              <PasswordRequirement
                met={strength.checks.special}
                text="One special character"
              />
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <li className={cn(
      'flex items-center gap-2 text-xs transition-colors',
      met ? 'text-green-400' : 'text-gray-500'
    )}>
      {met ? (
        <Check className="w-3 h-3" />
      ) : (
        <X className="w-3 h-3" />
      )}
      {text}
    </li>
  );
}

// ============================================
// FormTextarea Component
// ============================================

interface FormTextareaProps extends BaseInputProps, Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> {}

export function FormTextarea({
  label,
  name,
  error,
  hint,
  required,
  showCharCount,
  maxLength,
  successMessage,
  className,
  inputClassName,
  value,
  onChange,
  ...props
}: FormTextareaProps) {
  const [localValue, setLocalValue] = useState(value?.toString() || '');

  useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
    onChange?.(e);
  };

  const charCount = localValue.length;
  const showCount = showCharCount && maxLength;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-300"
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        {showCount && (
          <span className={cn(
            'text-xs',
            charCount > maxLength ? 'text-red-400' : 'text-gray-500'
          )}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>

      <textarea
        id={name}
        name={name}
        value={localValue}
        onChange={handleChange}
        maxLength={maxLength}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={cn(
          'w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white placeholder-gray-500',
          'focus:outline-none focus:ring-2 transition-all duration-200 resize-y min-h-[100px]',
          error
            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
            : 'border-white/10 hover:border-white/20 focus:border-brand-primary focus:ring-brand-primary/20',
          inputClassName
        )}
        {...props}
      />

      {error && (
        <p
          id={`${name}-error`}
          className="text-xs text-red-400 flex items-center gap-1.5"
          role="alert"
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}

      {hint && !error && (
        <p
          id={`${name}-hint`}
          className="text-xs text-gray-500 flex items-center gap-1.5"
        >
          <Info className="w-3 h-3 flex-shrink-0" />
          {hint}
        </p>
      )}
    </div>
  );
}

// ============================================
// FormSelect Component
// ============================================

interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormSelectProps extends Omit<BaseInputProps, 'showCharCount' | 'maxLength'> {
  options: FormSelectOption[];
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function FormSelect({
  label,
  name,
  error,
  hint,
  required,
  options,
  placeholder,
  className,
  inputClassName,
  ...props
}: FormSelectProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-300"
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <select
        id={name}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={cn(
          'w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white',
          'focus:outline-none focus:ring-2 transition-all duration-200',
          'appearance-none cursor-pointer',
          error
            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
            : 'border-white/10 hover:border-white/20 focus:border-brand-primary focus:ring-brand-primary/20',
          inputClassName
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.75rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.25rem 1.25rem',
          paddingRight: '2.5rem'
        }}
        {...props}
      >
        {placeholder && (
          <option value="" disabled className="bg-brand-gray text-gray-400">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="bg-brand-gray text-white"
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p
          id={`${name}-error`}
          className="text-xs text-red-400 flex items-center gap-1.5"
          role="alert"
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}

      {hint && !error && (
        <p
          id={`${name}-hint`}
          className="text-xs text-gray-500 flex items-center gap-1.5"
        >
          <Info className="w-3 h-3 flex-shrink-0" />
          {hint}
        </p>
      )}
    </div>
  );
}

// ============================================
// FormCheckbox Component
// ============================================

interface FormCheckboxProps {
  label: React.ReactNode;
  name: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
}

export function FormCheckbox({
  label,
  name,
  checked,
  onChange,
  error,
  className
}: FormCheckboxProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative flex items-center justify-center pt-0.5">
          <input
            type="checkbox"
            name={name}
            checked={checked}
            onChange={onChange}
            className="peer sr-only"
            aria-invalid={!!error}
          />
          <div className={cn(
            'w-5 h-5 border-2 rounded transition-all duration-200',
            'peer-focus:ring-2 peer-focus:ring-brand-primary/20',
            error
              ? 'border-red-500/50'
              : checked
              ? 'border-brand-primary bg-brand-primary'
              : 'border-white/20 group-hover:border-white/40'
          )}>
            {checked && (
              <Check className="w-full h-full text-white p-0.5" />
            )}
          </div>
        </div>
        <span className="text-sm text-gray-300 select-none">{label}</span>
      </label>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1.5 ml-8" role="alert">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================
// FormFieldGroup Component
// ============================================

interface FormFieldGroupProps {
  legend?: string;
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3;
}

export function FormFieldGroup({
  legend,
  children,
  className,
  columns = 1
}: FormFieldGroupProps) {
  return (
    <fieldset className={cn('space-y-4', className)}>
      {legend && (
        <legend className="text-sm font-semibold text-white mb-4">
          {legend}
        </legend>
      )}
      <div className={cn(
        'grid gap-4',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3'
      )}>
        {children}
      </div>
    </fieldset>
  );
}

// ============================================
// Inline Error Message Component
// ============================================

interface InlineErrorProps {
  message: string;
  className?: string;
}

export function InlineError({ message, className }: InlineErrorProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20',
        className
      )}
      role="alert"
    >
      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
      <p className="text-sm text-red-400">{message}</p>
    </div>
  );
}

// ============================================
// Success Message Component
// ============================================

interface SuccessMessageProps {
  message: string;
  className?: string;
}

export function SuccessMessage({ message, className }: SuccessMessageProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20',
        className
      )}
      role="status"
    >
      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
      <p className="text-sm text-green-400">{message}</p>
    </div>
  );
}

export default {
  FormInput,
  PasswordInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormFieldGroup,
  InlineError,
  SuccessMessage
};
