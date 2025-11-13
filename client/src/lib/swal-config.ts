import Swal from 'sweetalert2';

/**
 * Get themed SweetAlert2 configuration based on current dark mode state
 * @returns SweetAlert2 configuration object with theme-appropriate colors
 */
export const getThemedSwalConfig = () => {
  const isDark = document.documentElement.classList.contains('dark');

  return {
    background: isDark ? '#1F2937' : '#FFFFFF', // gray-800 : white
    color: isDark ? '#F9FAFB' : '#111827', // gray-50 : gray-900
    customClass: {
      popup: isDark ? 'dark-mode-swal' : '',
      confirmButton: 'swal-confirm-btn',
      cancelButton: 'swal-cancel-btn',
      title: isDark ? 'swal-dark-title' : '',
      htmlContainer: isDark ? 'swal-dark-content' : '',
    },
  };
};

/**
 * Show themed SweetAlert2 alert that respects dark mode
 * @param options - SweetAlert2 options object
 * @returns Promise with SweetAlert2 result
 *
 * @example
 * await showThemedAlert({
 *   title: 'Success!',
 *   text: 'Operation completed',
 *   icon: 'success'
 * });
 */
export const showThemedAlert = (options: any) => {
  return Swal.fire({
    ...getThemedSwalConfig(),
    ...options,
  });
};

/**
 * Show themed success alert
 * @param title - Alert title
 * @param text - Alert text
 * @param timer - Optional auto-close timer in milliseconds
 */
export const showSuccess = (title: string, text: string, timer?: number) => {
  return showThemedAlert({
    title,
    text,
    icon: 'success',
    confirmButtonColor: '#10B981',
    timer,
    showConfirmButton: !timer,
  });
};

/**
 * Show themed error alert
 * @param title - Alert title
 * @param text - Alert text
 */
export const showError = (title: string, text: string) => {
  return showThemedAlert({
    title,
    text,
    icon: 'error',
    confirmButtonColor: '#EF4444',
  });
};

/**
 * Show themed confirmation dialog
 * @param title - Dialog title
 * @param text - Dialog text
 * @param confirmText - Confirm button text
 * @param cancelText - Cancel button text
 */
export const showConfirmation = (
  title: string,
  text: string,
  confirmText: string = 'Yes',
  cancelText: string = 'Cancel'
) => {
  return showThemedAlert({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#6B7280',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
};

/**
 * Show themed warning alert
 * @param title - Alert title
 * @param text - Alert text
 */
export const showWarning = (title: string, text: string) => {
  return showThemedAlert({
    title,
    text,
    icon: 'warning',
    confirmButtonColor: '#3B82F6',
  });
};
