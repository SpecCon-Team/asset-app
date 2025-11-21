/**
 * @deprecated This file is deprecated. Please use @/lib/sweetalert instead.
 * This file is kept for backward compatibility and re-exports from sweetalert.
 *
 * Migration guide:
 * - Change: import { showSuccess } from '@/lib/swal-config'
 * - To: import { showSuccess } from '@/lib/sweetalert'
 */

export {
  showThemedAlert,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showConfirm,
  showConfirmation,
  showDeleteConfirm,
  showLoading,
  closeAlert,
  showToast,
  showInput,
  showTextarea,
  showSelect,
  showCustom,
} from './sweetalert';

// Legacy alias for backward compatibility
export { showThemedAlert as getThemedSwalConfig } from './sweetalert';
