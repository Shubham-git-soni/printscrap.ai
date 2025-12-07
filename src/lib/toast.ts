import { toast } from 'sonner';

/**
 * Show a confirmation toast with custom action buttons
 * @param message - The confirmation message
 * @param onConfirm - Callback when user confirms
 */
export const confirmDelete = (message: string, onConfirm: () => void) => {
    toast(message, {
        action: {
            label: 'Delete',
            onClick: () => onConfirm(),
        },
        cancel: {
            label: 'Cancel',
            onClick: () => { },
        },
        duration: 5000,
    });
};

/**
 * Show success toast
 */
export const showSuccess = (message: string) => {
    toast.success(message);
};

/**
 * Show error toast
 */
export const showError = (message: string) => {
    toast.error(message);
};

/**
 * Show info toast
 */
export const showInfo = (message: string) => {
    toast.info(message);
};
