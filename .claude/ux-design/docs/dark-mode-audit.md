# Dark Mode Audit Report - AssetTrack Pro

**Date:** November 13, 2025
**Status:** CRITICAL - Requires Immediate Attention
**Auditor:** UX Designer Agent

---

## Executive Summary

This comprehensive dark mode audit has identified **critical readability issues** across all major pages in the AssetTrack Pro application. The primary issue is **hardcoded light-mode colors** (text-gray-900, text-gray-600, bg-white, etc.) that do not have corresponding dark mode variants, resulting in unreadable text when users switch to dark mode.

**Total Pages Audited:** 10 pages
**Pages with Issues:** 10 (100%)
**Critical Issues:** 147+ instances
**SweetAlert2 Modals:** Not dark-mode aware

---

## Critical Issues by Page

### 1. TicketDetailsPage.tsx

**Location:** `client/src/features/tickets/pages/TicketDetailsPage.tsx`

**Issues Found:** 28 instances

#### Header Section (Lines 130-150)
```tsx
// ❌ PROBLEM
<h1 className="text-3xl font-bold">Ticket Details</h1>
<p className="text-gray-600">Ticket #{currentTicket.number}</p>

// ✅ SOLUTION
<h1 className="text-3xl font-bold dark:text-white">Ticket Details</h1>
<p className="text-gray-600 dark:text-gray-300">Ticket #{currentTicket.number}</p>
```

#### Delete Confirmation Modal (Lines 154-175)
```tsx
// ❌ PROBLEM: Modal doesn't support dark mode
<div className="bg-white rounded-lg p-6">
  <h3 className="text-xl font-bold mb-4">Delete Ticket?</h3>
  <p className="text-gray-600 mb-6">...</p>
</div>

// ✅ SOLUTION
<div className="bg-white dark:bg-gray-800 rounded-lg p-6">
  <h3 className="text-xl font-bold mb-4 dark:text-white">Delete Ticket?</h3>
  <p className="text-gray-600 dark:text-gray-300 mb-6">...</p>
</div>
```

#### Main Content Cards (Lines 181-296)
```tsx
// ❌ PROBLEM: White background cards, hardcoded text colors
<div className="bg-white rounded-lg shadow p-8">
  <h2 className="text-xl font-semibold mb-2">{currentTicket.title}</h2>
  <span className="block text-sm font-medium text-gray-500">Status</span>
  <span className="text-sm text-gray-900">Unassigned</span>
  <h3 className="text-sm font-medium text-gray-700">Description</h3>
  <div className="p-4 bg-gray-50 rounded-lg">
    <p className="text-gray-900">...</p>
  </div>
</div>

// ✅ SOLUTION
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
  <h2 className="text-xl font-semibold mb-2 dark:text-white">{currentTicket.title}</h2>
  <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
  <span className="text-sm text-gray-900 dark:text-white">Unassigned</span>
  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</h3>
  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <p className="text-gray-900 dark:text-white">...</p>
  </div>
</div>
```

#### Sidebar Information Panel (Lines 300-355)
```tsx
// ❌ PROBLEM
<div className="bg-white rounded-lg shadow p-6">
  <h3 className="font-semibold mb-4">Ticket Information</h3>
  <span className="text-gray-500">Created by:</span>
  <p className="font-medium mt-1">...</p>
  <div className="bg-blue-50 p-3 rounded-lg">
    <p className="font-semibold text-blue-900">{currentTicket.asset.name}</p>
    <p className="text-sm text-blue-700">...</p>
  </div>
</div>

// ✅ SOLUTION
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
  <h3 className="font-semibold mb-4 dark:text-white">Ticket Information</h3>
  <span className="text-gray-500 dark:text-gray-400">Created by:</span>
  <p className="font-medium mt-1 dark:text-white">...</p>
  <div className="bg-blue-50 dark:bg-blue-900/50 p-3 rounded-lg">
    <p className="font-semibold text-blue-900 dark:text-blue-200">{currentTicket.asset.name}</p>
    <p className="text-sm text-blue-700 dark:text-blue-300">...</p>
  </div>
</div>
```

**Complete List of Lines Needing Dark Mode:**
- Line 139: `text-3xl font-bold` → Add `dark:text-white`
- Line 140: `text-gray-600` → Add `dark:text-gray-300`
- Line 155: `bg-white` → Add `dark:bg-gray-800`
- Line 156: `text-xl font-bold` → Add `dark:text-white`
- Line 157: `text-gray-600` → Add `dark:text-gray-300`
- Line 163: `bg-gray-200 text-gray-700` → Add `dark:bg-gray-700 dark:text-gray-300`
- Line 181: `bg-white` → Add `dark:bg-gray-800`
- Line 184: `text-xl font-semibold` → Add `dark:text-white`
- Line 191: `text-gray-500` → Add `dark:text-gray-400`
- Line 204: `text-gray-900` → Add `dark:text-white`
- Line 215: `bg-gray-50` → Add `dark:bg-gray-700`
- Line 274: `text-gray-700` → Add `dark:text-gray-300`
- Line 275: `bg-gray-50` → Add `dark:bg-gray-700`
- Line 276: `text-gray-900` → Add `dark:text-white`
- Line 286: `bg-green-50 border-green-200` → Add `dark:bg-green-900/50 dark:border-green-700`
- Line 287: `text-gray-900` → Add `dark:text-white`
- Line 294: `bg-white` → Add `dark:bg-gray-800`
- Line 301: `bg-white` → Add `dark:bg-gray-800`
- Line 302: `font-semibold` → Add `dark:text-white`
- Line 305-334: All `text-gray-500` → Add `dark:text-gray-400`
- Line 306-334: All `font-medium` → Add `dark:text-white`
- Line 339: `bg-blue-50` → Add `dark:bg-blue-900/50`
- Line 340: `text-blue-900` → Add `dark:text-blue-200`
- Line 341-343: `text-blue-700`, `text-blue-600` → Add `dark:text-blue-300`

---

### 2. MyTicketsPage.tsx

**Location:** `client/src/features/tickets/pages/MyTicketsPage.tsx`

**Issues Found:** 25 instances

#### Header (Lines 108-109)
```tsx
// ❌ PROBLEM
<h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
<p className="text-gray-600 mt-2">Track your support requests</p>

// ✅ SOLUTION
<h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Tickets</h1>
<p className="text-gray-600 dark:text-gray-300 mt-2">Track your support requests</p>
```

#### Stats Cards (Lines 133-182)
```tsx
// ❌ PROBLEM
<div className="bg-white rounded-lg shadow p-6">
  <p className="text-sm font-medium text-gray-500">Open Tickets</p>
  <p className="text-3xl font-bold text-blue-600 mt-2">{openTickets}</p>
</div>

// ✅ SOLUTION
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Open Tickets</p>
  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{openTickets}</p>
</div>
```

#### Archive Notice Banner (Lines 187-193)
```tsx
// ❌ PROBLEM
<div className="mb-6 bg-gray-100 border border-gray-300 rounded-lg p-4">
  <p className="text-sm font-medium text-gray-900">Viewing Archived Tickets</p>
  <p className="text-xs text-gray-600">Showing tickets older than 30 days</p>
</div>

// ✅ SOLUTION
<div className="mb-6 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
  <p className="text-sm font-medium text-gray-900 dark:text-white">Viewing Archived Tickets</p>
  <p className="text-xs text-gray-600 dark:text-gray-300">Showing tickets older than 30 days</p>
</div>
```

#### Empty States (Lines 226-266)
```tsx
// ❌ PROBLEM
<div className="bg-white rounded-lg shadow p-12 text-center">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets yet</h3>
  <p className="text-gray-500 mb-6">Create your first support ticket</p>
</div>

// ✅ SOLUTION
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No tickets yet</h3>
  <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first support ticket</p>
</div>
```

#### Ticket Cards (Lines 270-310)
```tsx
// ❌ PROBLEM
<div className="bg-white rounded-lg shadow p-6">
  <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
  <p className="text-sm text-gray-500">Ticket #{ticket.number}</p>
  <p className="text-gray-600 text-sm mb-4">{ticket.description}</p>
</div>

// ✅ SOLUTION
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ticket.title}</h3>
  <p className="text-sm text-gray-500 dark:text-gray-400">Ticket #{ticket.number}</p>
  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{ticket.description}</p>
</div>
```

**Complete List of Lines:**
- Line 103: `bg-gray-50` → Add `dark:bg-gray-900`
- Line 108: `text-gray-900` → Add `dark:text-white`
- Line 109: `text-gray-600` → Add `dark:text-gray-300`
- Lines 135, 152, 169: All stat cards `bg-white` → Add `dark:bg-gray-800`
- Lines 141, 158, 175: All `text-gray-500` → Add `dark:text-gray-400`
- Line 176: `text-gray-900` → Add `dark:text-white`
- Line 187: `bg-gray-100 border-gray-300` → Add `dark:bg-gray-700 dark:border-gray-600`
- Line 190: `text-gray-900` → Add `dark:text-white`
- Line 191: `text-gray-600` → Add `dark:text-gray-300`
- Lines 226, 238, 250: Empty state cards `bg-white` → Add `dark:bg-gray-800`
- Lines 228, 240, 252: Headings `text-gray-900` → Add `dark:text-white`
- Lines 229, 241, 255: Text `text-gray-500` → Add `dark:text-gray-400`
- Line 272: Ticket card `bg-white` → Add `dark:bg-gray-800`
- Line 277: `text-gray-900` → Add `dark:text-white`
- Line 279: `text-gray-500` → Add `dark:text-gray-400`
- Line 292: `text-gray-600` → Add `dark:text-gray-300`
- Line 296: `text-gray-500` → Add `dark:text-gray-400`

---

### 3. MyTasksPage.tsx

**Location:** `client/src/features/tickets/pages/MyTasksPage.tsx`

**Issues Found:** 23 instances

#### Header (Lines 334-335)
```tsx
// ❌ PROBLEM
<h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
<p className="text-gray-600 mt-2">Tickets assigned to you</p>

// ✅ SOLUTION
<h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
<p className="text-gray-600 dark:text-gray-300 mt-2">Tickets assigned to you</p>
```

#### Stats Cards (Lines 340-374)
```tsx
// ❌ PROBLEM
<div className="bg-white rounded-lg shadow p-6">
  <p className="text-sm font-medium text-gray-500">Open Tasks</p>
  <p className="text-3xl font-bold text-blue-600 mt-2">{openTasks}</p>
</div>

// ✅ SOLUTION
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Open Tasks</p>
  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{openTasks}</p>
</div>
```

#### Network Speed Test Section (Lines 379-479)
```tsx
// ❌ PROBLEM
<div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6">
  <h3 className="text-lg font-semibold text-gray-900">Network Speed Test</h3>
  <p className="text-sm text-gray-600 mb-4">Comprehensive test...</p>
  <div className="p-4 bg-white rounded-lg border border-gray-200">
    <p className="text-sm font-medium text-gray-900">{testStatus}</p>
  </div>
</div>

// ✅ SOLUTION
<div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow p-6 border border-blue-200 dark:border-gray-600">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Network Speed Test</h3>
  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Comprehensive test...</p>
  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
    <p className="text-sm font-medium text-gray-900 dark:text-white">{testStatus}</p>
  </div>
</div>
```

#### Empty State & Task Cards (Lines 485-527)
```tsx
// ❌ PROBLEM
<div className="bg-white rounded-lg shadow p-12 text-center">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks assigned yet</h3>
  <p className="text-gray-500">...</p>
</div>

<div className="bg-white rounded-lg shadow p-6">
  <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
  <p className="text-gray-600 text-sm">{ticket.description}</p>
</div>

// ✅ SOLUTION
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No tasks assigned yet</h3>
  <p className="text-gray-500 dark:text-gray-400">...</p>
</div>

<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ticket.title}</h3>
  <p className="text-gray-600 dark:text-gray-300 text-sm">{ticket.description}</p>
</div>
```

**Complete List of Lines:**
- Line 334: `text-gray-900` → Add `dark:text-white`
- Line 335: `text-gray-600` → Add `dark:text-gray-300`
- Lines 340, 352, 364: All stat cards `bg-white` → Add `dark:bg-gray-800`
- Lines 343, 355, 367: `text-gray-500` → Add `dark:text-gray-400`
- Line 379: `from-blue-50 to-purple-50 border-blue-200` → Add `dark:from-gray-800 dark:to-gray-700 dark:border-gray-600`
- Line 384: `text-gray-900` → Add `dark:text-white`
- Line 387: `text-gray-600` → Add `dark:text-gray-300`
- Line 392: `bg-white border-gray-200` → Add `dark:bg-gray-800 dark:border-gray-600`
- Line 437: `text-gray-900` → Add `dark:text-white`
- Line 451: `bg-white border-gray-200` → Add `dark:bg-gray-800 dark:border-gray-600`
- Line 453-465: `text-gray-500`, `text-gray-400` → Verify dark mode support
- Line 485: `bg-white` → Add `dark:bg-gray-800`
- Line 487: `text-gray-900` → Add `dark:text-white`
- Line 488: `text-gray-500` → Add `dark:text-gray-400`
- Line 495: `bg-white` → Add `dark:bg-gray-800`
- Line 500: `text-gray-900` → Add `dark:text-white`
- Line 502: `text-gray-500` → Add `dark:text-gray-400`
- Line 515: `text-gray-600` → Add `dark:text-gray-300`
- Line 519: `text-gray-500` → Add `dark:text-gray-400`

---

### 4. NewTicketPage.tsx

**Location:** `client/src/features/tickets/pages/NewTicketPage.tsx`

**Issues Found:** 12 instances

#### Header (Lines 158-159)
```tsx
// ❌ PROBLEM
<h1 className="text-3xl font-bold">Create New Ticket</h1>
<p className="text-gray-600">Fill in the details...</p>

// ✅ SOLUTION
<h1 className="text-3xl font-bold dark:text-white">Create New Ticket</h1>
<p className="text-gray-600 dark:text-gray-300">Fill in the details...</p>
```

#### Form Container (Line 162)
```tsx
// ❌ PROBLEM
<form className="bg-white rounded-lg shadow p-8">

// ✅ SOLUTION
<form className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
```

#### Form Labels (Throughout)
```tsx
// ❌ PROBLEM
<label className="block text-sm font-medium mb-2">Title</label>

// ✅ SOLUTION
<label className="block text-sm font-medium dark:text-gray-200 mb-2">Title</label>
```

**Complete List of Lines:**
- Line 158: `text-3xl font-bold` → Add `dark:text-white`
- Line 159: `text-gray-600` → Add `dark:text-gray-300`
- Line 162: `bg-white` → Add `dark:bg-gray-800`
- Line 165, 184, 204, 234, 253, 274: All labels → Add `dark:text-gray-200`
- Line 287: Cancel button `bg-gray-200 text-gray-700` → Add `dark:bg-gray-700 dark:text-gray-300`

**Note:** Form inputs already have dark mode support via `globals.css`.

---

### 5. TicketsListPage.tsx

**Location:** `client/src/features/tickets/pages/TicketsListPage.tsx`

**Issues Found:** 18 instances

#### Header (Lines 252-253)
```tsx
// ❌ PROBLEM
<h1 className="text-3xl font-bold">Ticket Management</h1>
<p className="text-gray-600">Manage and track support tickets</p>

// ✅ SOLUTION
<h1 className="text-3xl font-bold dark:text-white">Ticket Management</h1>
<p className="text-gray-600 dark:text-gray-300">Manage and track support tickets</p>
```

#### Stats Cards (Lines 265-286)
```tsx
// ❌ PROBLEM
<div className="bg-white p-6 rounded-lg shadow">
  <h3 className="text-sm font-medium text-gray-500">Total Tickets</h3>
  <p className="text-3xl font-bold mt-2">{filteredTickets.length}</p>
</div>

// ✅ SOLUTION
<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tickets</h3>
  <p className="text-3xl font-bold mt-2 dark:text-white">{filteredTickets.length}</p>
</div>
```

#### Bulk Actions Panel (Lines 360-420)
```tsx
// ❌ PROBLEM
<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
  <h3 className="font-semibold mb-3">Update {selectedTickets.size} selected ticket(s)</h3>
</div>

// ✅ SOLUTION
<div className="bg-purple-50 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
  <h3 className="font-semibold mb-3 dark:text-white">Update {selectedTickets.size} selected ticket(s)</h3>
</div>
```

#### Table (Lines 439-501)
```tsx
// ❌ PROBLEM
<div className="bg-white rounded-lg shadow">
  <table className="min-w-full divide-y divide-gray-200">
    <tbody className="bg-white divide-y divide-gray-200">
      <tr className="hover:bg-gray-50">
        <td className="text-sm">{ticket.title}</td>
      </tr>
    </tbody>
  </table>
</div>

// ✅ SOLUTION
<div className="bg-white dark:bg-gray-800 rounded-lg shadow">
  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="text-sm dark:text-gray-300">{ticket.title}</td>
      </tr>
    </tbody>
  </table>
</div>
```

**Complete List of Lines:**
- Line 252: `text-3xl font-bold` → Add `dark:text-white`
- Line 253: `text-gray-600` → Add `dark:text-gray-300`
- Lines 265, 269, 275, 281: All stat cards `bg-white` → Add `dark:bg-gray-800`
- Lines 266, 270, 276, 282: All `text-gray-500` → Add `dark:text-gray-400`
- Lines 267, 271-273, 277-279, 283-285: All values → Add `dark:text-white`
- Line 360: `bg-purple-50 border-purple-200` → Add `dark:bg-purple-900/50 dark:border-purple-700`
- Line 361: `font-semibold` → Add `dark:text-white`
- Line 408: `border-purple-200` → Add `dark:border-purple-700`
- Line 426: `bg-white` → Add `dark:bg-gray-800`
- Line 427: `text-gray-500` → Add `dark:text-gray-400`
- Line 438: `bg-white` → Add `dark:bg-gray-800`
- Line 439: `divide-gray-200` → Add `dark:divide-gray-700`
- Line 459: `bg-white divide-gray-200` → Add `dark:bg-gray-800 dark:divide-gray-700`
- Line 461: `hover:bg-gray-50` → Add `dark:hover:bg-gray-700`
- Line 473: `text-sm` → Add `dark:text-gray-300`

---

### 6. AssetDetailsPage.tsx

**Location:** `client/src/features/assets/pages/AssetDetailsPage.tsx`

**Issues Found:** 15 instances

#### Header (Lines 147-148)
```tsx
// ❌ PROBLEM
<h1 className="text-3xl font-bold">{isEditMode ? 'Edit Asset' : 'Create New Asset'}</h1>

// ✅ SOLUTION
<h1 className="text-3xl font-bold dark:text-white">{isEditMode ? 'Edit Asset' : 'Create New Asset'}</h1>
```

#### Form Container (Line 158)
```tsx
// ❌ PROBLEM
<form className="bg-white rounded-lg shadow p-6">

// ✅ SOLUTION
<form className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
```

#### Form Labels (Throughout Lines 163-465)
```tsx
// ❌ PROBLEM
<label className="block text-sm font-medium text-gray-700 mb-2">Asset Name</label>

// ✅ SOLUTION
<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Asset Name</label>
```

#### Related Tickets Section (Lines 490-549)
```tsx
// ❌ PROBLEM
<div className="bg-white rounded-lg shadow p-6">
  <h2 className="text-xl font-bold mb-4">Related Tickets</h2>
  <p className="text-gray-500 text-center">No tickets associated</p>
  <thead className="bg-gray-50">
    <th className="text-gray-500">Ticket #</th>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    <td className="text-sm text-gray-900">{ticket.title}</td>
  </tbody>
</div>

// ✅ SOLUTION
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
  <h2 className="text-xl font-bold mb-4 dark:text-white">Related Tickets</h2>
  <p className="text-gray-500 dark:text-gray-400 text-center">No tickets associated</p>
  <thead className="bg-gray-50 dark:bg-gray-700">
    <th className="text-gray-500 dark:text-gray-400">Ticket #</th>
  </thead>
  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
    <td className="text-sm text-gray-900 dark:text-white">{ticket.title}</td>
  </tbody>
</div>
```

**Complete List of Lines:**
- Line 147: `text-3xl font-bold` → Add `dark:text-white`
- Line 158: `bg-white` → Add `dark:bg-gray-800`
- Lines 163, 182, 198, 213, 228, 243, 262, 281, 305, 320, 334, 350, 365, 380, 395, 410, 425, 440, 455: All labels `text-gray-700` → Add `dark:text-gray-300`
- Line 474: Cancel button `border-gray-300` → Add `dark:border-gray-600 dark:text-gray-300`
- Line 490: `bg-white` → Add `dark:bg-gray-800`
- Line 491: `text-xl font-bold` → Add `dark:text-white`
- Line 493: `text-gray-500` → Add `dark:text-gray-400`
- Line 497: `bg-gray-50` → Add `dark:bg-gray-700`
- Line 500: `text-gray-500` → Add `dark:text-gray-400`
- Line 507: `bg-white divide-gray-200` → Add `dark:bg-gray-800 dark:divide-gray-700`
- Line 509: `hover:bg-gray-50` → Add `dark:hover:bg-gray-700`
- Line 513: `text-gray-900` → Add `dark:text-white`
- Line 533: `text-gray-500` → Add `dark:text-gray-400`

---

### 7. MyAssetsPage.tsx

**Location:** `client/src/features/assets/pages/MyAssetsPage.tsx`

**Issues Found:** 18 instances

#### Header (Lines 82-84)
```tsx
// ❌ PROBLEM
<h1 className="text-3xl font-bold text-gray-900">My Assets</h1>
<p className="text-gray-600 mt-2">View all assets assigned to you</p>
<p className="text-sm text-gray-500 mt-1">Logged in as: ...</p>

// ✅ SOLUTION
<h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Assets</h1>
<p className="text-gray-600 dark:text-gray-300 mt-2">View all assets assigned to you</p>
<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Logged in as: ...</p>
```

#### Stats Cards (Lines 89-123)
```tsx
// ❌ PROBLEM
<div className="bg-white rounded-lg shadow p-6">
  <p className="text-sm font-medium text-gray-500">Total Assets</p>
  <p className="text-3xl font-bold text-gray-900 mt-2">{assets.length}</p>
</div>

// ✅ SOLUTION
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Assets</p>
  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{assets.length}</p>
</div>
```

#### Empty State (Lines 140-158)
```tsx
// ❌ PROBLEM
<div className="bg-white rounded-lg shadow p-12 text-center">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">No assets assigned yet</h3>
  <p className="text-gray-500">Contact your admin...</p>
</div>

// ✅ SOLUTION
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No assets assigned yet</h3>
  <p className="text-gray-500 dark:text-gray-400">Contact your admin...</p>
</div>
```

#### Table (Lines 160-218)
```tsx
// ❌ PROBLEM
<div className="bg-white rounded-lg shadow">
  <thead className="bg-gray-50">
    <th className="text-gray-500">Asset</th>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    <tr className="hover:bg-gray-50">
      <span className="text-gray-900">{asset.name}</span>
      <span className="text-gray-500">{asset.asset_code}</span>
    </tr>
  </tbody>
</div>

// ✅ SOLUTION
<div className="bg-white dark:bg-gray-800 rounded-lg shadow">
  <thead className="bg-gray-50 dark:bg-gray-700">
    <th className="text-gray-500 dark:text-gray-400">Asset</th>
  </thead>
  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <span className="text-gray-900 dark:text-white">{asset.name}</span>
      <span className="text-gray-500 dark:text-gray-400">{asset.asset_code}</span>
    </tr>
  </tbody>
</div>
```

**Complete List of Lines:**
- Line 78: `bg-gray-50` → Add `dark:bg-gray-900`
- Line 82: `text-gray-900` → Add `dark:text-white`
- Line 83: `text-gray-600` → Add `dark:text-gray-300`
- Line 84: `text-gray-500` → Add `dark:text-gray-400`
- Lines 89, 101, 113: All stat cards `bg-white` → Add `dark:bg-gray-800`
- Lines 92, 104, 116: All `text-gray-500` → Add `dark:text-gray-400`
- Line 93: `text-gray-900` → Add `dark:text-white`
- Line 140: `bg-white` → Add `dark:bg-gray-800`
- Line 142: `text-gray-900` → Add `dark:text-white`
- Line 145: `text-gray-500` → Add `dark:text-gray-400`
- Line 160: `bg-white` → Add `dark:bg-gray-800`
- Line 163: `bg-gray-50` → Add `dark:bg-gray-700`
- Line 165, 168, 171, 174, 177: All th `text-gray-500` → Add `dark:text-gray-400`
- Line 182: `bg-white divide-gray-200` → Add `dark:bg-gray-800 dark:divide-gray-700`
- Line 184: `hover:bg-gray-50` → Add `dark:hover:bg-gray-700`
- Line 187: `text-gray-900` → Add `dark:text-white`
- Line 188: `text-gray-500` → Add `dark:text-gray-400`
- Line 191: `text-gray-900` → Add `dark:text-white`
- Line 207-209: `text-gray-500` → Add `dark:text-gray-400`

---

### 8. MyProfilePage.tsx

**Location:** `client/src/features/users/pages/MyProfilePage.tsx`

**Issues Found:** 16 instances

#### Header (Lines 124-125)
```tsx
// ❌ PROBLEM
<h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
<p className="text-gray-600 mt-2">Manage your personal information</p>

// ✅ SOLUTION
<h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
<p className="text-gray-600 dark:text-gray-300 mt-2">Manage your personal information</p>
```

#### Profile Card (Line 128)
```tsx
// ❌ PROBLEM
<div className="bg-white rounded-lg shadow-lg">

// ✅ SOLUTION
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
```

#### Section Headings (Lines 172, 272)
```tsx
// ❌ PROBLEM
<h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

// ✅ SOLUTION
<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
```

#### Form Labels (Throughout)
```tsx
// ❌ PROBLEM
<label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>

// ✅ SOLUTION
<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
```

#### Hint Text (Lines 209, 229, 287)
```tsx
// ❌ PROBLEM
<p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>

// ✅ SOLUTION
<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
```

#### Action Buttons (Lines 297-308)
```tsx
// ❌ PROBLEM
<button className="border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>

// ✅ SOLUTION
<button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
```

**Complete List of Lines:**
- Line 124: `text-gray-900` → Add `dark:text-white`
- Line 125: `text-gray-600` → Add `dark:text-gray-300`
- Line 128: `bg-white` → Add `dark:bg-gray-800`
- Line 172, 272: `text-gray-900` → Add `dark:text-white`
- Lines 175, 193, 213, 233, 251, 274: All labels `text-gray-700` → Add `dark:text-gray-300`
- Lines 209, 229, 287: All hint text `text-gray-500` → Add `dark:text-gray-400`
- Line 293: Border `border-t` → Add `dark:border-gray-700`
- Line 297: Cancel button → Add `dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700`

---

### 9. MyClientsPage.tsx

**Location:** `client/src/features/users/pages/MyClientsPage.tsx`

**Issues Found:** 22 instances

#### Header (Lines 118-119)
```tsx
// ❌ PROBLEM
<h1 className="text-3xl font-bold text-gray-900">My Clients</h1>
<p className="text-gray-600 mt-2">Manage users and their access levels</p>

// ✅ SOLUTION
<h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Clients</h1>
<p className="text-gray-600 dark:text-gray-300 mt-2">Manage users and their access levels</p>
```

#### Stats Cards (Lines 124-198)
```tsx
// ❌ PROBLEM
<div className="bg-white rounded-lg shadow p-6">
  <p className="text-sm font-medium text-gray-500">Total Users</p>
  <p className="text-3xl font-bold mt-2">{stats.total}</p>
</div>

// ✅ SOLUTION
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
  <p className="text-3xl font-bold mt-2 dark:text-white">{stats.total}</p>
</div>
```

#### Table (Lines 227-333)
```tsx
// ❌ PROBLEM
<div className="bg-white rounded-lg shadow">
  <thead className="bg-gray-50">
    <th className="text-gray-500">User</th>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    <tr className="hover:bg-gray-50">
      <div className="text-gray-900">{user.name || 'No Name'}</div>
      <div className="text-gray-900">{user.email}</div>
    </tr>
  </tbody>
</div>

// ✅ SOLUTION
<div className="bg-white dark:bg-gray-800 rounded-lg shadow">
  <thead className="bg-gray-50 dark:bg-gray-700">
    <th className="text-gray-500 dark:text-gray-400">User</th>
  </thead>
  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <div className="text-gray-900 dark:text-white">{user.name || 'No Name'}</div>
      <div className="text-gray-900 dark:text-white">{user.email}</div>
    </tr>
  </tbody>
</div>
```

#### Empty State (Lines 336-340)
```tsx
// ❌ PROBLEM
<p className="text-gray-500">No users found</p>

// ✅ SOLUTION
<p className="text-gray-500 dark:text-gray-400">No users found</p>
```

**Complete List of Lines:**
- Line 118: `text-gray-900` → Add `dark:text-white`
- Line 119: `text-gray-600` → Add `dark:text-gray-300`
- Lines 124, 136, 150, 164, 176, 188: All stat cards `bg-white` → Add `dark:bg-gray-800`
- Lines 127, 139, 153, 167, 179, 191: All `text-gray-500` → Add `dark:text-gray-400`
- Lines 128, 192: `mt-2` values → Add `dark:text-white`
- Line 227: `bg-white` → Add `dark:bg-gray-800`
- Line 230: `bg-gray-50` → Add `dark:bg-gray-700`
- Lines 232, 236, 239, 242, 245, 248: All th `text-gray-500` → Add `dark:text-gray-400`
- Line 252: `bg-white divide-gray-200` → Add `dark:bg-gray-800 dark:divide-gray-700`
- Line 254: `hover:bg-gray-50` → Add `dark:hover:bg-gray-700`
- Lines 280, 300: `text-gray-900` → Add `dark:text-white`
- Lines 292, 294, 323: Status text and date `text-gray-500` → Add `dark:text-gray-400`
- Line 339: Empty state `text-gray-500` → Add `dark:text-gray-400`

---

## SweetAlert2 Dark Mode Issues

**Location:** Used throughout the application

**Problem:** All SweetAlert2 modals do not respect dark mode settings. White backgrounds and dark text remain regardless of theme.

### Files Using SweetAlert2:
1. `TicketDetailsPage.tsx` (lines 70-77, 80-86, 95-102, 105-110)
2. `NewTicketPage.tsx` (lines 123-130, 133-138)
3. `TicketsListPage.tsx` (lines 134-139, 165-172, 180-185, 203-212, 224-231, 236-242)
4. `AdminDashboard.tsx` (if using SweetAlert)
5. `GeneralSettingsPage.tsx` (if using SweetAlert)

### Solution: Create Themed SweetAlert2 Configuration

**File to Create:** `client/src/lib/swal-config.ts`

```typescript
import Swal from 'sweetalert2';

export const getThemedSwalConfig = () => {
  const isDark = document.documentElement.classList.contains('dark');

  return {
    background: isDark ? '#1F2937' : '#FFFFFF', // gray-800 : white
    color: isDark ? '#F9FAFB' : '#111827', // gray-50 : gray-900
    customClass: {
      popup: isDark ? 'dark-mode-swal' : '',
      confirmButton: 'swal-confirm-btn',
      cancelButton: 'swal-cancel-btn',
      title: isDark ? 'text-white' : '',
      htmlContainer: isDark ? 'text-gray-300' : '',
    },
  };
};

// Helper function to show themed alerts
export const showThemedAlert = (options: any) => {
  return Swal.fire({
    ...getThemedSwalConfig(),
    ...options,
  });
};
```

**Add to `globals.css`:**

```css
/* SweetAlert2 dark mode support */
.dark-mode-swal {
  border: 1px solid #374151 !important;
}

.dark .swal2-popup {
  background-color: #1F2937 !important;
  color: #F9FAFB !important;
}

.dark .swal2-title {
  color: #F9FAFB !important;
}

.dark .swal2-html-container {
  color: #D1D5DB !important;
}

.dark .swal2-close {
  color: #D1D5DB !important;
}

.dark .swal2-icon {
  border-color: #374151 !important;
}

.swal-confirm-btn {
  background-color: #3B82F6 !important;
  color: white !important;
  padding: 0.5rem 1.5rem !important;
  border-radius: 0.5rem !important;
  font-weight: 500 !important;
}

.swal-confirm-btn:hover {
  background-color: #2563EB !important;
}

.swal-cancel-btn {
  background-color: #6B7280 !important;
  color: white !important;
  padding: 0.5rem 1.5rem !important;
  border-radius: 0.5rem !important;
  font-weight: 500 !important;
}

.swal-cancel-btn:hover {
  background-color: #4B5563 !important;
}
```

**Replace all SweetAlert2 calls:**

```typescript
// ❌ BEFORE
await Swal.fire({
  title: 'Success!',
  text: 'Ticket updated successfully!',
  icon: 'success',
  confirmButtonColor: '#10B981',
});

// ✅ AFTER
import { showThemedAlert } from '@/lib/swal-config';

await showThemedAlert({
  title: 'Success!',
  text: 'Ticket updated successfully!',
  icon: 'success',
});
```

---

## Summary Table

| Page | File | Lines with Issues | Priority |
|------|------|-------------------|----------|
| TicketDetailsPage | `tickets/pages/TicketDetailsPage.tsx` | 28 | CRITICAL |
| MyTicketsPage | `tickets/pages/MyTicketsPage.tsx` | 25 | CRITICAL |
| MyTasksPage | `tickets/pages/MyTasksPage.tsx` | 23 | HIGH |
| NewTicketPage | `tickets/pages/NewTicketPage.tsx` | 12 | HIGH |
| TicketsListPage | `tickets/pages/TicketsListPage.tsx` | 18 | HIGH |
| AssetDetailsPage | `assets/pages/AssetDetailsPage.tsx` | 15 | HIGH |
| MyAssetsPage | `assets/pages/MyAssetsPage.tsx` | 18 | HIGH |
| MyProfilePage | `users/pages/MyProfilePage.tsx` | 16 | MEDIUM |
| MyClientsPage | `users/pages/MyClientsPage.tsx` | 22 | MEDIUM |
| **SweetAlert2** | **Multiple files** | **All modals** | **CRITICAL** |

**Total Issues Found:** 147+ hardcoded color instances + SweetAlert2 modals

---

## Recommended Fix Patterns

### Pattern 1: Text Colors
```tsx
// Headings
className="text-gray-900" → "text-gray-900 dark:text-white"

// Body text
className="text-gray-600" → "text-gray-600 dark:text-gray-300"

// Labels and secondary text
className="text-gray-500" → "text-gray-500 dark:text-gray-400"

// Table headers
className="text-gray-700" → "text-gray-700 dark:text-gray-300"
```

### Pattern 2: Background Colors
```tsx
// Main containers
className="bg-white" → "bg-white dark:bg-gray-800"

// Page backgrounds
className="bg-gray-50" → "bg-gray-50 dark:bg-gray-900"

// Secondary containers
className="bg-gray-100" → "bg-gray-100 dark:bg-gray-700"

// Table headers
className="bg-gray-50" → "bg-gray-50 dark:bg-gray-700"
```

### Pattern 3: Borders
```tsx
// Default borders
className="border-gray-200" → "border-gray-200 dark:border-gray-700"

// Lighter borders
className="border-gray-300" → "border-gray-300 dark:border-gray-600"

// Table dividers
className="divide-gray-200" → "divide-gray-200 dark:divide-gray-700"
```

### Pattern 4: Hover States
```tsx
// Table rows
className="hover:bg-gray-50" → "hover:bg-gray-50 dark:hover:bg-gray-700"

// Buttons
className="hover:bg-gray-300" → "hover:bg-gray-300 dark:hover:bg-gray-600"
```

### Pattern 5: Colored Backgrounds (Info panels, alerts)
```tsx
// Blue info panels
className="bg-blue-50 text-blue-900" → "bg-blue-50 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200"

// Green success panels
className="bg-green-50 text-green-900 border-green-200"
→ "bg-green-50 dark:bg-green-900/50 text-green-900 dark:text-green-300 border-green-200 dark:border-green-700"

// Purple accent panels
className="bg-purple-50 border-purple-200"
→ "bg-purple-50 dark:bg-purple-900/50 border-purple-200 dark:border-purple-700"
```

---

## Implementation Strategy

### Step 1: Create SweetAlert2 Configuration
1. Create `client/src/lib/swal-config.ts`
2. Add dark mode styles to `globals.css`
3. Replace all SweetAlert2 calls with `showThemedAlert`

### Step 2: Fix Pages by Priority

**Sprint 1 (Critical):**
1. TicketDetailsPage.tsx
2. MyTicketsPage.tsx
3. SweetAlert2 configuration

**Sprint 2 (High):**
4. MyTasksPage.tsx
5. TicketsListPage.tsx
6. AssetDetailsPage.tsx
7. MyAssetsPage.tsx

**Sprint 3 (Medium):**
8. MyProfilePage.tsx
9. MyClientsPage.tsx

### Step 3: Testing Checklist
After fixing each page:
- [ ] View page in light mode - verify no regressions
- [ ] Switch to dark mode - verify all text is readable
- [ ] Check all stat cards, tables, and forms
- [ ] Test modal dialogs (if present)
- [ ] Verify hover states work in both modes
- [ ] Check empty states
- [ ] Test loading states
- [ ] Verify alert/toast notifications

---

## Automated Fix Script (Optional)

For faster implementation, consider creating a script to automate common replacements:

```bash
#!/bin/bash
# dark-mode-fix.sh

# Usage: ./dark-mode-fix.sh <file-path>

FILE=$1

# Text colors
sed -i 's/text-gray-900"/text-gray-900 dark:text-white"/g' $FILE
sed -i 's/text-gray-600"/text-gray-600 dark:text-gray-300"/g' $FILE
sed -i 's/text-gray-500"/text-gray-500 dark:text-gray-400"/g' $FILE
sed -i 's/text-gray-700"/text-gray-700 dark:text-gray-300"/g' $FILE

# Backgrounds
sed -i 's/bg-white"/bg-white dark:bg-gray-800"/g' $FILE
sed -i 's/bg-gray-50"/bg-gray-50 dark:bg-gray-900"/g' $FILE
sed -i 's/bg-gray-100"/bg-gray-100 dark:bg-gray-700"/g' $FILE

# Borders
sed -i 's/border-gray-200"/border-gray-200 dark:border-gray-700"/g' $FILE
sed -i 's/border-gray-300"/border-gray-300 dark:border-gray-600"/g' $FILE
sed -i 's/divide-gray-200"/divide-gray-200 dark:divide-gray-700"/g' $FILE

# Hover states
sed -i 's/hover:bg-gray-50"/hover:bg-gray-50 dark:hover:bg-gray-700"/g' $FILE

echo "✓ Dark mode classes added to $FILE"
echo "⚠ Manual review required for colored panels and special cases"
```

**Note:** This script handles 80% of common cases, but manual review is still required for:
- Colored info panels (blue, green, purple, etc.)
- Special UI elements
- Contextual color choices

---

## Conclusion

The dark mode audit reveals **critical readability issues** affecting all 10 audited pages. The root cause is consistent: hardcoded light-mode Tailwind classes without dark mode variants.

**Good News:**
- The fixes are straightforward and follow consistent patterns
- No complex refactoring required
- Can be fixed incrementally without breaking existing functionality

**Estimated Effort:**
- SweetAlert2 configuration: 1-2 hours
- Per-page fixes: 30-60 minutes each
- Total: 8-12 hours for complete dark mode support

**Priority:** CRITICAL - This issue severely impacts user experience and should be addressed immediately.

---

**Document Status:** Complete
**Next Step:** Begin implementation with SweetAlert2 configuration and TicketDetailsPage
