# Quick Start Guide - New Features

## ✅ Database Migration Complete!

The database has been successfully updated with all new models. You're ready to start using the new features!

---

## 🚀 Immediate Next Steps

### 1. Add Components to Your App (5 minutes)

**Update `client/src/App.tsx` or main layout:**

```tsx
import { useState, useEffect } from 'react';
import { GlobalSearch, QuickActionsMenu } from '@/components';

function App() {
  const [searchOpen, setSearchOpen] = useState(false);

  // Add Ctrl+K shortcut for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Router>
      {/* Your existing routes and components */}

      {/* Add these two new components */}
      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
      <QuickActionsMenu userRole={user?.role} />
    </Router>
  );
}
```

### 2. Add Server Routes (2 minutes)

**Update `server/src/index.ts`:**

```typescript
// Add these imports at the top
import globalSearchRouter from './routes/globalSearch';
import reservationsRouter from './routes/reservations';

// Add these routes (after your existing routes)
app.use('/api/search', globalSearchRouter);
app.use('/api/reservations', reservationsRouter);
```

### 3. Test the Features (5 minutes)

1. Start your dev server: `npm run dev`
2. Press `Ctrl+K` - Global search should appear ✨
3. Click the blue + button in bottom-right - Quick actions menu appears ✨
4. Navigate to any list page and see if it renders ✅

---

## 🎯 Component Integration Examples

### Add Bulk Operations to a List Page

```tsx
import { BulkOperations } from '@/components';

function AssetsListPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleBulkDelete = async (ids: string[]) => {
    const apiClient = getApiClient();
    await apiClient.post('/assets/bulk-delete', { ids });
    // Refresh your data
    fetchAssets();
  };

  return (
    <>
      {/* Your existing table/list with checkboxes */}

      <BulkOperations
        selectedItems={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onBulkDelete={handleBulkDelete}
        entityType="assets"
      />
    </>
  );
}
```

### Add Advanced Filters to a List Page

```tsx
import { AdvancedFilter } from '@/components';

function InventoryPage() {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <>
      <button onClick={() => setFilterOpen(true)}>
        <Filter className="w-4 h-4" />
        Filters
      </button>

      <AdvancedFilter
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={(filters) => {
          // Apply filters to your data fetching
          fetchItems(filters);
        }}
        onReset={() => fetchItems({})}
        filterOptions={{
          categories: ['Electronics', 'Furniture'],
          locations: ['Office A', 'Warehouse B'],
          statuses: ['available', 'in_use'],
        }}
        entityType="inventory"
      />
    </>
  );
}
```

### Replace Existing Tables with ResponsiveTable

```tsx
import { ResponsiveTable, Column } from '@/components';

function TicketsListPage() {
  const columns: Column<Ticket>[] = [
    { key: 'number', label: 'Ticket #', sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (ticket) => <StatusBadge status={ticket.status} />,
    },
  ];

  return (
    <ResponsiveTable
      data={tickets}
      columns={columns}
      onRowClick={(ticket) => navigate(`/tickets/${ticket.id}`)}
      getItemId={(ticket) => ticket.id}
    />
  );
}
```

---

## 📱 New Routes to Add

### Reports Page

Create `client/src/pages/ReportsPage.tsx`:

```tsx
import { ReportsGenerator } from '@/components';

export default function ReportsPage() {
  return (
    <div className="container mx-auto p-6">
      <ReportsGenerator />
    </div>
  );
}
```

Add route in your router:

```tsx
<Route path="/reports" element={<ReportsPage />} />
```

### Asset Reservations Page

Create a new page for managing reservations:

```tsx
export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    const response = await apiClient.get('/reservations');
    setReservations(response.data.reservations);
  };

  return (
    <div>
      <h1>Asset Reservations</h1>
      {/* Display reservations in a table or list */}
    </div>
  );
}
```

---

## 🔧 Optional Enhancements

### Email Notifications Setup

1. Add to `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

2. Create `server/src/services/emailService.ts`:
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  });
}
```

### PWA Icons Setup

1. Use any online icon generator (e.g., https://www.pwabuilder.com/)
2. Generate icons from your logo
3. Place in `client/public/icons/` directory
4. The manifest.json is already configured!

---

## ✨ Features You Can Use Right Now

### Without Additional Setup:
- ✅ Global Search (Ctrl+K)
- ✅ Quick Actions Menu (Blue + button)
- ✅ Bulk Operations
- ✅ Advanced Filters
- ✅ Responsive Tables
- ✅ Asset Timeline
- ✅ Dashboard Widgets
- ✅ Reports Generator
- ✅ Asset Reservations (API ready)

### With Minor Setup:
- 📧 Email Notifications (add SMTP config)
- 📱 PWA/Offline Mode (add icons)
- 📊 QR Code Scanning (add scanner page)

---

## 🎨 Styling Notes

All components use:
- **Tailwind CSS** for styling
- **Dark mode support** built-in
- **Lucide React** for icons (already in your dependencies)
- **Responsive design** for mobile/tablet/desktop

They should match your existing design system automatically!

---

## 🐛 Troubleshooting

### "Component not found" error?
```bash
# Make sure to create/update components index file:
# client/src/components/index.ts

export { default as BulkOperations } from './BulkOperations';
export { default as AdvancedFilter } from './AdvancedFilter';
export { default as GlobalSearch } from './GlobalSearch';
export { default as QuickActionsMenu } from './QuickActionsMenu';
export { default as ResponsiveTable } from './ResponsiveTable';
export { default as AssetTimeline } from './AssetTimeline';
export { default as DashboardWidgets } from './DashboardWidgets';
export { default as ReportsGenerator } from './ReportsGenerator';
```

### "Cannot find module '@/components'" error?
Update `tsconfig.json` to include path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Search returns no results?
Make sure the global search route is added to your server and the endpoint is `/api/search/global`.

---

## 📚 Documentation References

- **Full Implementation Guide**: `FEATURES_IMPLEMENTATION_GUIDE.md`
- **Complete Summary**: `IMPLEMENTATION_SUMMARY.md`
- **This Quick Start**: `QUICK_START.md`

---

## 🎉 You're All Set!

Start with adding the Global Search and Quick Actions Menu to your main app. Then gradually integrate the other components into your existing pages.

**Estimated integration time**: 30-60 minutes for core features

**Happy coding! 🚀**
