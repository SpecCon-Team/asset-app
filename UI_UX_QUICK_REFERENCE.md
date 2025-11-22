# 🎨 UI/UX Quick Reference Guide

Quick reference for using the new animation system and UI improvements.

---

## 🚀 Quick Start

### **Import Animations**
Animations are automatically available through `globals.css`.

---

## 📋 Animation Classes

### **Fade Animations**
```tsx
<div className="animate-fade-in">Fade in</div>
<div className="animate-fade-out">Fade out</div>
<div className="animate-fade-in-up">Fade in from bottom</div>
<div className="animate-fade-in-down">Fade in from top</div>
<div className="animate-fade-in-left">Fade in from left</div>
<div className="animate-fade-in-right">Fade in from right</div>
```

### **Scale Animations**
```tsx
<div className="animate-scale-in">Scale in</div>
<div className="animate-scale-out">Scale out</div>
```

### **Slide Animations**
```tsx
<div className="animate-slide-in-up">Slide up</div>
<div className="animate-slide-in-down">Slide down</div>
<div className="animate-slide-in-left">Slide from left</div>
<div className="animate-slide-in-right">Slide from right</div>
```

### **Special Effects**
```tsx
<div className="animate-bounce">Bounce</div>
<div className="animate-pulse">Pulse</div>
<div className="animate-spin">Spin</div>
<div className="animate-shake">Shake (errors)</div>
<div className="animate-shimmer">Shimmer (loading)</div>
<div className="animate-glow">Glow effect</div>
<div className="animate-badge-pulse">Badge pulse (notifications)</div>
```

---

## 🎯 Common Use Cases

### **Cards**
```tsx
<Card className="animate-fade-in-up hover-lift">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardBody>Content</CardBody>
</Card>
```

### **Lists with Stagger**
```tsx
<ul className="stagger-children">
  <li>Item 1</li>  {/* Delays: 0.05s */}
  <li>Item 2</li>  {/* Delays: 0.1s */}
  <li>Item 3</li>  {/* Delays: 0.15s */}
</ul>
```

### **Modals**
```tsx
<div className="animate-fade-in backdrop-blur-sm">
  <div className="animate-scale-in">
    <Modal>Content</Modal>
  </div>
</div>
```

### **Error Messages**
```tsx
<div className="animate-shake">
  <Alert variant="error">Error message</Alert>
</div>
```

### **Success Messages**
```tsx
<div className="animate-scale-in">
  <Alert variant="success">Success!</Alert>
</div>
```

---

## 💫 Hover Effects

```tsx
<div className="hover-lift">Lifts on hover</div>
<div className="hover-grow">Grows on hover</div>
<div className="hover-glow">Glows on hover</div>
```

---

## 📱 Loading States

### **Page Loader**
```tsx
import { PageLoader } from '@/components/LoadingSpinner';

<PageLoader message="Loading..." />
```

### **Overlay Loader**
```tsx
import { LoadingOverlay } from '@/components/LoadingSpinner';

<LoadingOverlay message="Processing..." />
```

### **Skeleton Loader**
```tsx
import { SkeletonLoader } from '@/components/LoadingSpinner';

<SkeletonLoader className="h-20 w-full" />
```

### **List Skeleton**
```tsx
import { ListSkeleton } from '@/components/LoadingSpinner';

<ListSkeleton items={5} />
```

---

## 🎨 Transitions

### **Smooth Transition**
```tsx
<div className="transition-smooth">
  {/* Properties transition smoothly */}
</div>
```

### **Bounce Transition**
```tsx
<div className="transition-bounce">
  {/* Bouncy transitions */}
</div>
```

---

## ⚡ Performance Tips

### **GPU Acceleration**
```tsx
<div className="gpu-accelerated">
  {/* Optimized for performance */}
</div>
```

### **Focus Ring**
```tsx
<button className="focus-ring">
  {/* Accessible focus indicator */}
</button>
```

---

## 🎯 Button Best Practices

```tsx
// Primary action
<Button variant="primary" size="lg">
  Save
</Button>

// With loading state
<Button variant="primary" isLoading disabled>
  Saving...
</Button>

// With icons
<Button variant="primary" leftIcon={<Plus />}>
  Add Item
</Button>

// Danger action
<Button variant="danger" size="md">
  Delete
</Button>
```

---

## 📊 Cheat Sheet

| Effect | Class | Use Case |
|--------|-------|----------|
| Fade in | `animate-fade-in` | Page load |
| Fade up | `animate-fade-in-up` | Cards, lists |
| Scale in | `animate-scale-in` | Modals, popovers |
| Shake | `animate-shake` | Errors |
| Shimmer | `animate-shimmer` | Skeletons |
| Lift | `hover-lift` | Interactive cards |
| Grow | `hover-grow` | Icons, buttons |
| Stagger | `stagger-children` | Lists |

---

## ♿ Accessibility

```tsx
// Always include for loading states
<div role="status" aria-live="polite" aria-busy="true">
  <Loader />
  <span className="sr-only">Loading...</span>
</div>

// Focus indicators are automatic
// Reduced motion is automatically respected
```

---

## 🎨 Color Theming

```css
/* Use CSS variables for theme colors */
.my-button {
  background-color: var(--color-primary);
}

.my-button:hover {
  background-color: var(--color-primary-dark);
}
```

---

## 📱 Mobile Optimizations

All animations are:
- ✅ Touch-friendly
- ✅ Performance-optimized
- ✅ Gesture-aware
- ✅ 44px minimum tap targets

---

## 🔥 Pro Tips

1. **Combine Effects**:
   ```tsx
   <div className="animate-fade-in-up hover-lift transition-smooth">
     {/* Multiple effects */}
   </div>
   ```

2. **Conditional Animations**:
   ```tsx
   <div className={isVisible ? 'animate-fade-in' : 'opacity-0'}>
     {/* Controlled animation */}
   </div>
   ```

3. **Custom Delays**:
   ```css
   .my-element {
     animation-delay: 0.3s;
   }
   ```

---

## 📚 More Information

See `UI_UX_IMPROVEMENTS_COMPLETE.md` for:
- Detailed documentation
- Implementation examples
- Performance guidelines
- Accessibility details
- Advanced techniques

---

**Happy coding!** 🚀✨
