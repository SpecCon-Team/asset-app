import Swal from 'sweetalert2';

/**
 * Custom SweetAlert2 configuration with dark mode support
 * Consolidated wrapper for all SweetAlert2 functionality
 */

// Get theme from DOM class or localStorage or system preference
const isDarkMode = () => {
  // Check DOM class FIRST (most reliable - ThemeContext applies it)
  const hasDarkClass = document.documentElement.classList.contains('dark');

  // Always trust the DOM class since ThemeContext manages it
  return hasDarkClass;
};

// Base configuration for all alerts
const getBaseConfig = () => {
  const isDark = isDarkMode();
  return {
    customClass: {
      popup: isDark ? 'dark-mode-swal' : '',
      title: isDark ? 'swal-dark-title' : '',
      htmlContainer: isDark ? 'swal-dark-content' : '',
      confirmButton: 'swal-confirm-btn px-4 py-2 rounded-lg font-medium',
      cancelButton: 'swal-cancel-btn px-4 py-2 rounded-lg font-medium',
    },
    background: isDark ? '#1F2937' : '#FFFFFF',
    color: isDark ? '#F9FAFB' : '#111827',
  };
};

/**
 * Show themed SweetAlert2 alert (base function)
 */
export const showThemedAlert = (options: any) => {
  return Swal.fire({
    ...getBaseConfig(),
    ...options,
  });
};

/**
 * Success alert
 * @param title - Title or message
 * @param text - Optional text (if title is used as title)
 * @param timer - Optional auto-close timer
 */
export const showSuccess = (title: string, text?: string, timer?: number) => {
  // Support both signatures: showSuccess(message) and showSuccess(title, text, timer)
  const config = text ? { title, text } : { title: 'Success!', text: title };

  return Swal.fire({
    ...getBaseConfig(),
    icon: 'success',
    ...config,
    confirmButtonColor: '#10b981',
    timer: timer || (text ? undefined : 3000),
    timerProgressBar: true,
    showConfirmButton: !timer || timer > 5000,
  });
};

/**
 * Error alert
 * @param title - Title or message
 * @param text - Optional text (if title is used as title)
 */
export const showError = (title: string, text?: string) => {
  // Support both signatures: showError(message) and showError(title, text)
  const config = text ? { title, text } : { title: 'Error!', text: title };

  return Swal.fire({
    ...getBaseConfig(),
    icon: 'error',
    ...config,
    confirmButtonColor: '#ef4444',
    showConfirmButton: true,
  });
};

/**
 * Warning alert
 * @param title - Title or message
 * @param text - Optional text (if title is used as title)
 */
export const showWarning = (title: string, text?: string) => {
  // Support both signatures: showWarning(message) and showWarning(title, text)
  const config = text ? { title, text } : { title: 'Warning!', text: title };

  return Swal.fire({
    ...getBaseConfig(),
    icon: 'warning',
    ...config,
    confirmButtonColor: '#f59e0b',
    showConfirmButton: true,
  });
};

/**
 * Info alert
 */
export const showInfo = (message: string, title: string = 'Info') => {
  return Swal.fire({
    ...getBaseConfig(),
    icon: 'info',
    title,
    text: message,
    confirmButtonColor: '#3b82f6',
    showConfirmButton: true,
  });
};

/**
 * Confirmation dialog
 * @param title - Title or message
 * @param text - Optional text (if title is used as title)
 * @param confirmText - Confirm button text
 * @param cancelText - Cancel button text
 */
export const showConfirm = (
  title: string,
  text?: string,
  confirmText: string = 'Yes',
  cancelText: string = 'Cancel'
) => {
  // Support both signatures
  const config = typeof text === 'string' ? { title, text } : { title: 'Are you sure?', text: title };

  return Swal.fire({
    ...getBaseConfig(),
    icon: 'question',
    ...config,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280',
    reverseButtons: true,
  });
};

/**
 * Confirmation dialog (alias for showConfirm)
 */
export const showConfirmation = showConfirm;

/**
 * Confirmation dialog (alias for showConfirm)
 */
export const showConfirmDialog = showConfirm;

/**
 * Delete confirmation dialog (dangerous action)
 */
export const showDeleteConfirm = (
  itemName: string = 'this item',
  message?: string
) => {
  return Swal.fire({
    ...getBaseConfig(),
    icon: 'warning',
    title: 'Delete Confirmation',
    html: message || `Are you sure you want to delete <strong>${itemName}</strong>?<br><br>This action cannot be undone.`,
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    reverseButtons: true,
    focusCancel: true,
  });
};

/**
 * Loading alert (useful for async operations)
 */
export const showLoading = (message: string = 'Processing...') => {
  return Swal.fire({
    ...getBaseConfig(),
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

/**
 * Close the current alert
 */
export const closeAlert = () => {
  Swal.close();
};

/**
 * Toast notification (small, non-intrusive)
 */
export const showToast = (
  message: string,
  icon: 'success' | 'error' | 'warning' | 'info' = 'success',
  position: 'top' | 'top-end' | 'bottom' | 'bottom-end' = 'top-end'
) => {
  const Toast = Swal.mixin({
    toast: true,
    position,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
    background: isDarkMode() ? '#1f2937' : '#ffffff',
    color: isDarkMode() ? '#ffffff' : '#000000',
  });

  return Toast.fire({
    icon,
    title: message,
  });
};

/**
 * Input dialog
 */
export const showInput = (
  title: string,
  inputLabel: string,
  inputPlaceholder: string = '',
  inputType: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' = 'text',
  required: boolean = true
) => {
  return Swal.fire({
    ...getBaseConfig(),
    title,
    input: inputType,
    inputLabel,
    inputPlaceholder,
    showCancelButton: true,
    confirmButtonText: 'Submit',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280',
    inputValidator: (value) => {
      if (required && !value) {
        return 'This field is required';
      }
      return null;
    },
  });
};

/**
 * Textarea dialog
 */
export const showTextarea = (
  title: string,
  textareaLabel: string,
  textareaPlaceholder: string = '',
  required: boolean = true
) => {
  return Swal.fire({
    ...getBaseConfig(),
    title,
    input: 'textarea',
    inputLabel: textareaLabel,
    inputPlaceholder: textareaPlaceholder,
    showCancelButton: true,
    confirmButtonText: 'Submit',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280',
    inputValidator: (value) => {
      if (required && !value) {
        return 'This field is required';
      }
      return null;
    },
  });
};

/**
 * Select dialog
 */
export const showSelect = (
  title: string,
  options: Record<string, string>,
  selectLabel: string = 'Select an option',
  required: boolean = true
) => {
  return Swal.fire({
    ...getBaseConfig(),
    title,
    input: 'select',
    inputLabel: selectLabel,
    inputOptions: options,
    showCancelButton: true,
    confirmButtonText: 'Submit',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280',
    inputValidator: (value) => {
      if (required && !value) {
        return 'Please select an option';
      }
      return null;
    },
  });
};

/**
 * Custom HTML content dialog
 */
export const showCustom = (config: any) => {
  return Swal.fire({
    ...getBaseConfig(),
    ...config,
  });
};

export default {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showConfirm,
  showDeleteConfirm,
  showLoading,
  closeAlert,
  showToast,
  showInput,
  showTextarea,
  showSelect,
  showCustom,
};
