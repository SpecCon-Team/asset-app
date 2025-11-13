# Component Library Documentation

**Created:** November 13, 2025
**Version:** 1.0
**Status:** Phase 3 Complete

---

## Overview

This document provides comprehensive documentation for the AssetTrack Pro UI component library. All components are built with TypeScript, include full dark mode support, meet WCAG 2.1 AA accessibility standards, and are designed for consistency across the application.

---

## Table of Contents

1. [Installation & Usage](#installation--usage)
2. [Button Component](#button-component)
3. [Card Components](#card-components)
4. [Badge Component](#badge-component)
5. [EmptyState Component](#emptystate-component)
6. [Input Component](#input-component)
7. [Select Component](#select-component)
8. [Tooltip Component](#tooltip-component)
9. [Modal Component](#modal-component)
10. [Loading Components](#loading-components)
11. [Accessibility Features](#accessibility-features)
12. [Dark Mode Support](#dark-mode-support)

---

## Installation & Usage

### Importing Components

All components can be imported from the central `@/components` index:

```tsx
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Input,
  Select,
  Modal,
  EmptyState,
  Tooltip,
  LoadingSpinner,
} from '@/components';
```

### TypeScript Support

All components are fully typed with TypeScript interfaces exported alongside the components:

```tsx
import { Button, type ButtonProps } from '@/components';
```

---

## Button Component

### Overview

Versatile button component with multiple variants, sizes, loading states, and icon support.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost' \| 'success'` | `'primary'` | Visual style variant |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `isLoading` | `boolean` | `false` | Shows spinner and disables button |
| `fullWidth` | `boolean` | `false` | Makes button full width |
| `leftIcon` | `ReactNode` | - | Icon before text |
| `rightIcon` | `ReactNode` | - | Icon after text |

### Examples

```tsx
// Primary button
<Button variant="primary" onClick={handleSubmit}>
  Submit
</Button>

// Loading state
<Button variant="primary" isLoading>
  Saving...
</Button>

// With icons
import { Plus, ArrowRight } from 'lucide-react';

<Button variant="primary" leftIcon={<Plus />}>
  Add New
</Button>

<Button variant="ghost" rightIcon={<ArrowRight />}>
  Continue
</Button>

// Danger button
<Button variant="danger" size="sm">
  Delete
</Button>

// Full width
<Button variant="primary" fullWidth>
  Sign In
</Button>
```

### Variants Preview

- **Primary**: Blue background, white text (main actions)
- **Secondary**: Gray background, dark text (secondary actions)
- **Danger**: Red background, white text (destructive actions)
- **Success**: Green background, white text (positive actions)
- **Ghost**: Bordered, transparent background (tertiary actions)

### Accessibility

- Proper focus indicators with 4.5:1 contrast ratio
- Disabled state prevents interaction
- Loading state shows spinner with sr-only text
- Active scale animation on click
- Works with keyboard (Enter/Space)

---

## Card Components

### Overview

Container components for consistent card layouts with headers, body, and footers.

### Available Components

- `Card` - Main container
- `CardHeader` - Header section with border
- `CardBody` - Main content area
- `CardFooter` - Footer section with border and background
- `CardTitle` - Styled heading
- `CardDescription` - Subtitle text

### Card Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `hoverable` | `boolean` | `false` | Adds hover shadow effect |
| `clickable` | `boolean` | `false` | Adds cursor pointer and hover border |

### CardBody Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `padded` | `boolean` | `true` | Adds padding to body |

### CardTitle Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `as` | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6'` | `'h2'` | Heading level |

### Examples

```tsx
// Basic card
<Card>
  <CardHeader>
    <CardTitle>Ticket Details</CardTitle>
    <CardDescription>Review and update ticket information</CardDescription>
  </CardHeader>
  <CardBody>
    <p>Content goes here...</p>
  </CardBody>
  <CardFooter>
    <Button variant="ghost">Cancel</Button>
    <Button variant="primary">Save</Button>
  </CardFooter>
</Card>

// Clickable card with hover
<Card hoverable clickable onClick={handleClick}>
  <CardBody>
    <h3>Click me!</h3>
  </CardBody>
</Card>

// Card without padding
<Card>
  <CardBody padded={false}>
    <table>...</table>
  </CardBody>
</Card>
```

### Accessibility

- Semantic HTML structure
- Proper heading hierarchy with `as` prop
- Focus indicators when clickable
- Dark mode compatible colors

---

## Badge Component

### Overview

Status badges for displaying labels, counts, or status indicators with consistent styling.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'success' \| 'warning' \| 'danger' \| 'info' \| 'neutral' \| 'purple'` | `'neutral'` | Color variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |
| `rounded` | `boolean` | `true` | Pill shape (rounded-full) |
| `dot` | `boolean` | `false` | Shows dot indicator |

### Examples

```tsx
// Status badges
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Closed</Badge>
<Badge variant="info">In Progress</Badge>

// With dot indicator
<Badge variant="success" dot>
  Online
</Badge>

// Different sizes
<Badge variant="info" size="sm">Small</Badge>
<Badge variant="info" size="md">Medium</Badge>
<Badge variant="info" size="lg">Large</Badge>

// Squared corners
<Badge variant="neutral" rounded={false}>
  Tag
</Badge>
```

### Variant Colors

All variants meet WCAG AA contrast requirements in both light and dark modes:

| Variant | Light Mode | Dark Mode |
|---------|------------|-----------|
| Success | Green-100 bg, Green-800 text | Green-900/50 bg, Green-300 text |
| Warning | Yellow-100 bg, Yellow-800 text | Yellow-900/50 bg, Yellow-300 text |
| Danger | Red-100 bg, Red-800 text | Red-900/50 bg, Red-300 text |
| Info | Blue-100 bg, Blue-800 text | Blue-900/50 bg, Blue-300 text |
| Purple | Purple-100 bg, Purple-800 text | Purple-900/50 bg, Purple-300 text |
| Neutral | Gray-100 bg, Gray-800 text | Gray-700 bg, Gray-300 text |

---

## EmptyState Component

### Overview

Display empty states for lists, search results, or missing data with consistent styling.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `LucideIcon` | - | Icon component from lucide-react |
| `title` | `string` | **Required** | Main heading text |
| `description` | `string` | - | Optional description text |
| `action` | `ReactNode` | - | Optional action button/element |

### Examples

```tsx
import { Inbox, Users, FileText } from 'lucide-react';

// Basic empty state
<EmptyState
  icon={Inbox}
  title="No tickets found"
  description="There are no tickets matching your criteria"
/>

// With action button
<EmptyState
  icon={Users}
  title="No clients yet"
  description="Get started by adding your first client"
  action={
    <Button variant="primary" leftIcon={<Plus />}>
      Add Client
    </Button>
  }
/>

// Search results empty state
<EmptyState
  icon={FileText}
  title="No results found"
  description={`No tickets match "${searchQuery}"`}
  action={
    <Button variant="ghost" onClick={clearSearch}>
      Clear Search
    </Button>
  }
/>
```

### Accessibility

- Uses `role="status"` for screen readers
- `aria-label` with title text
- Icons marked as `aria-hidden`
- Centered layout for visual balance

---

## Input Component

### Overview

Text input with label, error states, success states, helper text, and icon support.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text |
| `error` | `string` | - | Error message |
| `success` | `string` | - | Success message |
| `helperText` | `string` | - | Helper text below input |
| `leftIcon` | `ReactNode` | - | Icon on left side |
| `rightIcon` | `ReactNode` | - | Icon on right side |
| `containerClassName` | `string` | - | Container CSS classes |

### Examples

```tsx
import { Mail, Lock, Search } from 'lucide-react';

// Basic input with label
<Input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  required
/>

// With error state
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
  required
/>

// With success state
<Input
  label="Username"
  value={username}
  success="Username is available"
/>

// With helper text
<Input
  label="Phone Number"
  helperText="We'll never share your phone number"
/>

// With left icon
<Input
  label="Search"
  leftIcon={<Search className="w-5 h-5" />}
  placeholder="Search tickets..."
/>

// With both icons
<Input
  leftIcon={<Mail className="w-5 h-5" />}
  rightIcon={<Lock className="w-5 h-5" />}
  placeholder="Secure email"
/>
```

### Form Integration

Works seamlessly with React Hook Form:

```tsx
import { useForm } from 'react-hook-form';

const { register, formState: { errors } } = useForm();

<Input
  label="Email"
  {...register('email', { required: 'Email is required' })}
  error={errors.email?.message}
/>
```

### Accessibility

- Proper label association with `htmlFor`
- `aria-invalid` when error present
- `aria-describedby` linking to error/helper text
- Required indicator with asterisk
- Error/success icons with `aria-hidden`
- Focus indicators meet WCAG AA

---

## Select Component

### Overview

Dropdown select with label, error states, and consistent styling.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text |
| `error` | `string` | - | Error message |
| `helperText` | `string` | - | Helper text |
| `options` | `SelectOption[]` | `[]` | Array of options |
| `placeholder` | `string` | - | Placeholder option text |
| `containerClassName` | `string` | - | Container CSS classes |

### SelectOption Interface

```tsx
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
```

### Examples

```tsx
// Basic select
<Select
  label="Status"
  placeholder="Select status..."
  options={[
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'closed', label: 'Closed' },
  ]}
/>

// With error
<Select
  label="Priority"
  error="Please select a priority level"
  options={[
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ]}
  required
/>

// With disabled options
<Select
  label="Role"
  options={[
    { value: 'admin', label: 'Admin', disabled: true },
    { value: 'user', label: 'User' },
    { value: 'guest', label: 'Guest' },
  ]}
/>

// Custom children
<Select label="Country">
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
  <option value="ca">Canada</option>
</Select>
```

### Accessibility

- Label association
- `aria-invalid` on error
- `aria-describedby` for error/helper text
- Keyboard navigation (Arrow keys, Enter, Escape)
- Focus indicators

---

## Tooltip Component

### Overview

Accessible tooltip for contextual help with configurable positioning and delay.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `ReactNode` | **Required** | Tooltip content |
| `children` | `ReactElement` | **Required** | Trigger element |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Tooltip position |
| `delay` | `number` | `200` | Show delay in ms |

### Examples

```tsx
import { HelpCircle, Info, Trash2 } from 'lucide-react';

// Basic tooltip
<Tooltip content="Delete this item">
  <button>
    <Trash2 className="w-5 h-5" />
  </button>
</Tooltip>

// Different positions
<Tooltip content="Top tooltip" position="top">
  <Button>Hover me</Button>
</Tooltip>

<Tooltip content="Right tooltip" position="right">
  <Button>Hover me</Button>
</Tooltip>

// With delay
<Tooltip content="Quick tooltip" delay={100}>
  <Info className="w-4 h-4" />
</Tooltip>

// Complex content
<Tooltip
  content={
    <div>
      <strong>Pro Tip:</strong>
      <p>Press Ctrl+K to open search</p>
    </div>
  }
>
  <HelpCircle className="w-5 h-5" />
</Tooltip>
```

### Accessibility

- Uses `role="tooltip"`
- Trigger has `aria-describedby` when visible
- Shows on hover and focus
- Hides on blur and mouse leave
- Keyboard accessible

---

## Modal Component

### Overview

Accessible modal dialog with focus trap, backdrop click, and escape key handling.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | **Required** | Whether modal is open |
| `onClose` | `() => void` | **Required** | Close handler |
| `title` | `string` | - | Modal title |
| `children` | `ReactNode` | **Required** | Modal content |
| `footer` | `ReactNode` | - | Footer content (buttons) |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Modal size |
| `closeOnBackdropClick` | `boolean` | `true` | Close on backdrop click |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `showCloseButton` | `boolean` | `true` | Show X button |

### Examples

```tsx
const [isOpen, setIsOpen] = useState(false);

// Basic modal
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
>
  <p>Are you sure you want to proceed?</p>
</Modal>

// With footer buttons
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Delete Ticket"
  footer={
    <>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="danger" onClick={handleDelete}>
        Delete
      </Button>
    </>
  }
>
  <p>This action cannot be undone.</p>
</Modal>

// Large modal
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Ticket Details"
  size="lg"
>
  <div>
    {/* Complex form content */}
  </div>
</Modal>

// No backdrop close
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  closeOnBackdropClick={false}
  closeOnEscape={false}
>
  <p>Please fill out all required fields before closing.</p>
</Modal>
```

### Accessibility

- Uses `role="dialog"` and `aria-modal="true"`
- `aria-labelledby` references title
- Focus trap - Tab cycles through modal elements
- Focus restoration on close
- Escape key closes modal (configurable)
- Prevents body scroll when open
- First focusable element focused on open

---

## Loading Components

### LoadingSpinner

Simple spinner with configurable size and message.

```tsx
<LoadingSpinner size="md" message="Loading data..." />
```

### LoadingOverlay

Full-page loading with backdrop.

```tsx
<LoadingOverlay message="Processing..." />
```

### ButtonLoader

Inline spinner for buttons.

```tsx
<button disabled={isLoading}>
  {isLoading ? <ButtonLoader /> : 'Submit'}
</button>
```

### SkeletonLoader

Content placeholder with pulse animation.

```tsx
<SkeletonLoader className="h-20 w-full" />
```

### ListSkeleton

Pre-built skeleton for lists.

```tsx
<ListSkeleton items={5} />
```

### Accessibility

All loading components include:
- `role="status"`
- `aria-live="polite"`
- `aria-busy="true"`
- Screen reader text with `.sr-only`

---

## Accessibility Features

### WCAG 2.1 Level AA Compliance

All components meet the following criteria:

✅ **Color Contrast**
- Text: 4.5:1 minimum
- UI components: 3:1 minimum
- Focus indicators: 3:1 minimum

✅ **Keyboard Navigation**
- All interactive elements keyboard accessible
- Logical tab order
- Visible focus indicators
- No keyboard traps

✅ **Screen Reader Support**
- ARIA labels and roles
- State announcements
- Live regions for dynamic content
- Semantic HTML

✅ **Focus Management**
- Clear focus indicators
- Focus trap in modals
- Focus restoration
- Skip links support

### Focus Indicators

All components have custom focus indicators:
- Light mode: Blue-500 (#3B82F6)
- Dark mode: Blue-400 (#60A5FA)
- 2px solid outline
- 2px offset
- Visible on keyboard focus only (`:focus-visible`)

---

## Dark Mode Support

### Automatic Theme Support

All components automatically adapt to dark mode using Tailwind's `dark:` prefix:

```tsx
// No additional configuration needed
<Button variant="primary">Works in both modes</Button>
```

### Color Palette

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | White | Gray-800 |
| Text | Gray-900 | White/Gray-100 |
| Border | Gray-200/300 | Gray-700/600 |
| Hover | Gray-50/100 | Gray-700/600 |

### Testing Dark Mode

```tsx
// Components work automatically with your theme toggle
const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
```

---

## Best Practices

### Do's ✅

- Use semantic button variants (primary for main action, danger for delete)
- Provide labels for all form inputs
- Show loading states during async operations
- Use EmptyState for empty lists/results
- Include error messages in forms
- Use tooltips for icon-only buttons
- Provide proper heading hierarchy in cards

### Don'ts ❌

- Don't use Ghost buttons for primary actions
- Don't skip input labels
- Don't nest modals
- Don't use tooltips for critical information
- Don't override focus indicators
- Don't use color alone to convey information
- Don't create very large modals (use separate page instead)

---

## Migration Guide

### From Inline Styles to Component Library

**Before:**
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Submit
</button>
```

**After:**
```tsx
<Button variant="primary">
  Submit
</Button>
```

**Before:**
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
  <h2>Title</h2>
  <p>Content</p>
</div>
```

**After:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardBody>
    <p>Content</p>
  </CardBody>
</Card>
```

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

All components are tested and work in modern browsers with ES6+ support.

---

## Performance

### Bundle Impact

- Button: ~2KB
- Card: ~1.5KB
- Input/Select: ~3KB each
- Modal: ~4KB
- Tooltip: ~2KB
- Total: ~20KB (minified + gzipped)

### Optimization

- Tree-shakeable exports
- No runtime dependencies (except React)
- Minimal re-renders
- CSS-in-JS avoided (uses Tailwind)

---

## Support & Feedback

For questions, issues, or feature requests:

1. Check this documentation first
2. Review component source code in `client/src/components/ui/`
3. Test in isolation before reporting issues
4. Provide reproduction steps

---

**Last Updated:** November 13, 2025
**Version:** 1.0
**Status:** Production Ready ✅
