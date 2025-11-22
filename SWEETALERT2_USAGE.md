# SweetAlert2 Usage Guide

SweetAlert2 has been integrated into the application with a custom wrapper that supports dark mode and provides consistent styling.

## Import

```typescript
import {
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
  showCustom
} from '@/lib/sweetalert';
```

## Basic Alerts

### Success Alert
```typescript
showSuccess('Your changes have been saved!');
// or with custom title
showSuccess('Data saved successfully', 'Great!');
```

### Error Alert
```typescript
showError('Something went wrong. Please try again.');
// or with custom title
showError('Failed to connect to server', 'Connection Error');
```

### Warning Alert
```typescript
showWarning('This action may have consequences.');
```

### Info Alert
```typescript
showInfo('Your session will expire in 5 minutes.');
```

## Confirmation Dialogs

### Basic Confirmation
```typescript
const result = await showConfirm(
  'Are you sure you want to proceed?',
  'Confirm Action',
  'Yes, proceed',
  'Cancel'
);

if (result.isConfirmed) {
  // User clicked "Yes, proceed"
  console.log('Confirmed!');
}
```

### Delete Confirmation (Dangerous Action)
```typescript
const result = await showDeleteConfirm('User Account');

if (result.isConfirmed) {
  // Proceed with deletion
  await deleteUser();
}

// With custom message
const result = await showDeleteConfirm(
  'this workflow',
  'This workflow will be permanently deleted and cannot be recovered.'
);
```

## Loading Indicator

```typescript
// Show loading
showLoading('Processing your request...');

// Perform async operation
await someAsyncOperation();

// Close loading
closeAlert();
```

## Toast Notifications (Non-intrusive)

```typescript
// Success toast
showToast('Settings saved!', 'success', 'top-end');

// Error toast
showToast('Failed to save', 'error', 'top-end');

// Warning toast
showToast('Please review your input', 'warning', 'top');

// Info toast
showToast('New message received', 'info', 'bottom-end');
```

## Input Dialogs

### Text Input
```typescript
const result = await showInput(
  'Enter Your Name',
  'Full Name',
  'John Doe',
  'text',
  true // required
);

if (result.isConfirmed) {
  const name = result.value;
  console.log('User entered:', name);
}
```

### Textarea Input
```typescript
const result = await showTextarea(
  'Add Comment',
  'Your Comment',
  'Type your comment here...',
  true
);

if (result.isConfirmed) {
  const comment = result.value;
  console.log('Comment:', comment);
}
```

### Select Input
```typescript
const result = await showSelect(
  'Select Priority',
  {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical'
  },
  'Priority Level',
  true
);

if (result.isConfirmed) {
  const priority = result.value;
  console.log('Selected:', priority);
}
```

## Custom Dialog

```typescript
showCustom({
  title: 'Custom Dialog',
  html: '<p>Custom HTML content</p>',
  icon: 'info',
  confirmButtonText: 'OK',
  showCancelButton: true,
  cancelButtonText: 'Cancel',
});
```

## Real-World Examples

### Delete Workflow
```typescript
const deleteWorkflow = async (id: string, name: string) => {
  const result = await showDeleteConfirm(
    name,
    'This workflow will be permanently deleted and cannot be recovered.'
  );

  if (!result.isConfirmed) return;

  try {
    showLoading('Deleting workflow...');
    await api.delete(`/workflows/${id}`);
    closeAlert();
    showSuccess('Workflow deleted successfully');
  } catch (error) {
    closeAlert();
    showError('Failed to delete workflow');
  }
};
```

### Save Form with Validation
```typescript
const saveForm = async (data: FormData) => {
  try {
    showLoading('Saving changes...');
    await api.post('/save', data);
    closeAlert();
    showToast('Changes saved successfully!', 'success');
  } catch (error) {
    closeAlert();
    showError('Failed to save changes. Please try again.');
  }
};
```

### Confirm Before Navigation
```typescript
const handleLogout = async () => {
  const result = await showConfirm(
    'Are you sure you want to log out?',
    'Confirm Logout',
    'Yes, log out',
    'Stay logged in'
  );

  if (result.isConfirmed) {
    await logout();
    navigate('/login');
  }
};
```

## Dark Mode Support

The SweetAlert2 wrapper automatically detects dark mode from:
1. localStorage theme setting
2. System preference (prefers-color-scheme)

All alerts will automatically adjust their styling for dark mode.

## Styling

The alerts use Tailwind CSS colors and match your application's theme:
- **Success**: Green (#10b981)
- **Error**: Red (#ef4444)
- **Warning**: Amber (#f59e0b)
- **Info**: Blue (#3b82f6)
- **Confirm**: Blue (#3b82f6)
- **Cancel**: Gray (#6b7280)

## Tips

1. **Use Toasts for Non-Critical Feedback**: For quick feedback that doesn't require user interaction
2. **Use Confirmation for Destructive Actions**: Always confirm before deleting or making irreversible changes
3. **Use Loading for Async Operations**: Show loading indicators for operations that take time
4. **Keep Messages Clear and Concise**: Users should understand what happened or what's being asked
5. **Use Appropriate Icons**: Match the icon to the message type for better UX

## Replacing Old Alerts

### Before (Native Alerts)
```typescript
// ❌ Old way
if (confirm('Are you sure?')) {
  deleteItem();
}

alert('Item deleted!');
```

### After (SweetAlert2)
```typescript
// ✅ New way
const result = await showConfirm('Are you sure you want to delete this item?');
if (result.isConfirmed) {
  await deleteItem();
  showSuccess('Item deleted successfully!');
}
```

## Additional Resources

- [SweetAlert2 Official Documentation](https://sweetalert2.github.io/)
- [SweetAlert2 Examples](https://sweetalert2.github.io/#examples)
