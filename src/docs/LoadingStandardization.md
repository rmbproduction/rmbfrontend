# Loading Spinner Standardization Guide

## Overview

To ensure consistency across the application, we've standardized all loading spinners using a single, flexible `LoadingSpinner` component. This guide explains how to use this component in different scenarios and how to replace custom spinner implementations.

## Standard Components

### `LoadingSpinner`

The primary component for all loading indicators:

```tsx
import LoadingSpinner from '../components/LoadingSpinner';

// Basic usage
<LoadingSpinner />

// With custom size and message
<LoadingSpinner size="lg" message="Loading data..." />

// Button variant for form submissions
<LoadingSpinner variant="button" size="sm" color="white" />

// Inline variant for text integration
<LoadingSpinner variant="inline" size="sm" message="Loading..." />
```

### `PageLoading`

A standardized full-page loading component:

```tsx
import PageLoading from '../components/PageLoading';

// Basic usage
<PageLoading />

// With custom message
<PageLoading message="Loading your profile..." />
```

## Usage Guidelines

### Page Loading States

When a full page is loading:

```tsx
if (loading) {
  return <PageLoading message="Loading page content..." />;
}
```

### Form Submission Buttons

```tsx
<button 
  type="submit"
  disabled={isSubmitting}
  className="flex items-center justify-center..."
>
  {isSubmitting ? (
    <>
      <LoadingSpinner variant="button" size="sm" color="white" />
      Processing...
    </>
  ) : (
    'Submit'
  )}
</button>
```

### Inline Text Loading

```tsx
<div className="flex items-center">
  <span>Loading your profile</span>
  <LoadingSpinner variant="inline" size="sm" showMessage={false} />
</div>
```

### Section Loading

```tsx
{isLoadingSection ? (
  <div className="p-4 text-center">
    <LoadingSpinner size="md" message="Loading section content..." />
  </div>
) : (
  // Section content
)}
```

## Props Reference

The `LoadingSpinner` component accepts the following props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'default' \| 'inline' \| 'button' \| 'fullscreen' | 'default' | Display variant |
| size | 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' | 'md' | Spinner size |
| color | string | '#FF5733' | Spinner color |
| bgColor | string | undefined | Background color |
| className | string | '' | Additional CSS classes |
| message | string | 'Loading...' | Loading message |
| showMessage | boolean | true | Whether to show the message |

## Converting Custom Spinners

When you encounter a custom spinner implementation:

1. Import `LoadingSpinner` component
2. Replace custom spinner with `LoadingSpinner`
3. Select appropriate variant and size
4. Set message text
5. Adjust container styles if needed

### Before:

```tsx
<div className="flex justify-center">
  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5733]"></div>
  <p className="mt-4">Loading...</p>
</div>
```

### After:

```tsx
<div className="flex justify-center">
  <LoadingSpinner size="lg" message="Loading..." />
</div>
```

## Examples

See `src/components/LoadingExamples.tsx` for a comprehensive set of examples demonstrating all variants. 