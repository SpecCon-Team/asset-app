# Asset Management Application - New Features Implementation Guide

This guide provides comprehensive instructions for implementing all 17 new features that have been added to the application.

## Overview of New Features

1. **Bulk Operations** - Select and perform actions on multiple items
2. **Advanced Filters** - Filter data by multiple criteria simultaneously
3. **Quick Actions Menu** - Floating action button for common tasks
4. **Global Search** - Search across all modules (assets, tickets, inventory, users)
5. **Responsive Tables** - Mobile-friendly card view for tables
6. **Asset Timeline** - Visual timeline of asset lifecycle
7. **Dashboard Widgets** - Customizable dashboard with draggable widgets
8. **Email Notifications** - Automated emails for important events
9. **Asset Transfer** - Transfer assets between locations/departments
10. **QR Code Scanning** - Scan QR codes for quick asset lookup
11. **Reports Generator** - Create custom reports with filters
12. **Asset Reservations** - Reserve assets for future dates
13. **Depreciation Alerts** - Notifications for depreciation milestones
14. **PWA Offline Mode** - Progressive Web App with offline capabilities
15. **Export/Import** - Bulk import from CSV/Excel, export in various formats
16. **API Rate Limiting Display** - Show users their API usage
17. **Keyboard Shortcuts** - Keyboard shortcuts for power users

---

## Implementation Steps

### Step 1: Database Migration

Run the Prisma migration to add new models:

```bash
cd server
npx prisma migrate dev --name add_new_features
npx prisma generate
```

### Step 2: Install Additional Dependencies

```bash
# Client dependencies
cd client
npm install react-qr-reader qrcode.react html5-qrcode

# Server dependencies
cd ../server
npm install nodemailer @types/nodemailer
```

### Step 3: Update Component Exports

Add the new components to your exports in `client/src/components/index.ts`:

```typescript
export { default as BulkOperations } from './BulkOperations';
export { default as AdvancedFilter } from './AdvancedFilter';
export { default as QuickActionsMenu } from './QuickActionsMenu';
export { default as GlobalSearch } from './GlobalSearch';
export { default as ResponsiveTable } from './ResponsiveTable';
export { default as AssetTimeline } from './AssetTimeline';
export { default as DashboardWidgets } from './DashboardWidgets';
```

### Step 4: Add Server Routes

Update `server/src/index.ts` to include new routes:

```typescript
import globalSearchRouter from './routes/globalSearch';
import reservationsRouter from './routes/reservations';

// Add routes
app.use('/api/search', globalSearchRouter);
app.use('/api/reservations', reservationsRouter);
```

---

## Feature-Specific Implementation

### 1. Bulk Operations

**Client Implementation:**

```tsx
import { BulkOperations } from '@/components';

function AssetsListPage() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleBulkDelete = async (ids: string[]) => {
    // Implement bulk delete logic
  };

  return (
    <>
      {/* Your table/list */}
      <BulkOperations
        selectedItems={selectedItems}
        onClearSelection={() => setSelectedItems([])}
        onBulkDelete={handleBulkDelete}
        entityType="assets"
      />
    </>
  );
}
```

**Server Implementation:**

```typescript
// Add bulk operations endpoints
router.post('/bulk-delete', authenticateToken, async (req, res) => {
  const { ids } = req.body;
  await prisma.asset.deleteMany({
    where: { id: { in: ids } }
  });
  res.json({ message: 'Assets deleted successfully' });
});
```

### 2. Advanced Filters

**Usage Example:**

```tsx
import { AdvancedFilter, FilterConfig } from '@/components';

function InventoryPage() {
  const [filterOpen, setFilterOpen] = useState(false);

  const handleApplyFilters = (filters: FilterConfig) => {
    // Apply filters to your data fetching logic
    fetchItems(filters);
  };

  return (
    <>
      <button onClick={() => setFilterOpen(true)}>Filters</button>

      <AdvancedFilter
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={handleApplyFilters}
        onReset={() => fetchItems({})}
        filterOptions={{
          categories: ['Electronics', 'Furniture', 'Vehicles'],
          locations: ['Office A', 'Warehouse B'],
          statuses: ['available', 'in_use', 'maintenance'],
        }}
        entityType="assets"
      />
    </>
  );
}
```

### 3. Quick Actions Menu

**App-level Implementation:**

```tsx
import { QuickActionsMenu } from '@/components';

function App() {
  const user = useAuth(); // Get current user

  return (
    <Router>
      {/* Your routes */}
      <QuickActionsMenu userRole={user?.role} />
    </Router>
  );
}
```

### 4. Global Search

**App-level Implementation:**

```tsx
import { GlobalSearch } from '@/components';
import { useGlobalKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function App() {
  const [searchOpen, setSearchOpen] = useState(false);

  useGlobalKeyboardShortcuts(
    () => setSearchOpen(true),
    () => {/* handle quick actions */}
  );

  return (
    <>
      {/* Your app */}
      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
```

### 5. Responsive Tables

**Replace existing tables:**

```tsx
import { ResponsiveTable, Column } from '@/components';

function AssetsList() {
  const columns: Column<Asset>[] = [
    {
      key: 'asset_code',
      label: 'Asset Code',
      sortable: true,
      mobileLabel: 'Code',
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (asset) => <StatusBadge status={asset.status} />,
    },
  ];

  return (
    <ResponsiveTable
      data={assets}
      columns={columns}
      onRowClick={(asset) => navigate(`/assets/${asset.id}`)}
      getItemId={(asset) => asset.id}
      selectable
      selectedItems={selectedItems}
      onSelectionChange={setSelectedItems}
    />
  );
}
```

### 6. Asset Timeline

**Usage in Asset Detail Page:**

```tsx
import { AssetTimeline } from '@/components';

function AssetDetailPage() {
  return (
    <div>
      {/* Asset details */}

      <h2>Asset History</h2>
      <AssetTimeline assetId={assetId} />
    </div>
  );
}
```

### 7. Dashboard Widgets

**Replace existing dashboard:**

```tsx
import { DashboardWidgets } from '@/components';

function Dashboard() {
  const user = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      <DashboardWidgets userId={user.id} />
    </div>
  );
}
```

### 8. Email Notifications

**Server Setup (Create `server/src/services/emailService.ts`):**

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

export async function sendMaintenanceDueEmail(asset: any, user: any) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: user.email,
    subject: `Maintenance Due: ${asset.name}`,
    html: `
      <h2>Maintenance Reminder</h2>
      <p>The asset "${asset.name}" (${asset.asset_code}) requires maintenance.</p>
      <p>Please schedule maintenance as soon as possible.</p>
    `,
  });

  // Log email
  await prisma.emailNotificationLog.create({
    data: {
      recipient: user.email,
      subject: `Maintenance Due: ${asset.name}`,
      body: 'Maintenance reminder email',
      type: 'maintenance_due',
      entityType: 'asset',
      entityId: asset.id,
      status: 'sent',
    },
  });
}
```

**Environment Variables (.env):**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Asset Management <noreply@yourapp.com>"
```

### 9. Asset Transfer

**Create Transfer Component:**

```tsx
// client/src/components/AssetTransfer.tsx
function AssetTransfer({ assetId }: { assetId: string }) {
  const [transferData, setTransferData] = useState({
    newLocation: '',
    newDepartment: '',
    transferTo: '',
    reason: '',
    notes: '',
  });

  const handleTransfer = async () => {
    await apiClient.post(`/assets/${assetId}/transfer`, transferData);
    toast.success('Asset transferred successfully');
  };

  return (
    <form onSubmit={handleTransfer}>
      {/* Transfer form fields */}
    </form>
  );
}
```

### 10. QR Code Scanning

**Create QR Scanner Page:**

```tsx
// client/src/pages/QRScanner.tsx
import { Html5QrcodeScanner } from 'html5-qrcode';

function QRScannerPage() {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 250 },
      fps: 5,
    }, false);

    scanner.render(onScanSuccess, onScanError);

    return () => scanner.clear();
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    // Fetch asset by QR code
    const response = await apiClient.get(`/assets/qr/${decodedText}`);
    navigate(`/assets/${response.data.asset.id}`);
  };

  return <div id="reader" />;
}
```

### 11. Reports Generator

**Create Reports Page:**

```tsx
// client/src/pages/ReportsPage.tsx
function ReportsPage() {
  const [reportType, setReportType] = useState('assets');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [format, setFormat] = useState('pdf');

  const generateReport = async () => {
    const response = await apiClient.post('/reports/generate', {
      type: reportType,
      dateRange,
      format,
    }, {
      responseType: 'blob',
    });

    // Download file
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report_${Date.now()}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div>
      {/* Report configuration form */}
      <button onClick={generateReport}>Generate Report</button>
    </div>
  );
}
```

### 12. Asset Reservations

The reservation routes have been created. Add UI components:

```tsx
// client/src/components/AssetReservationForm.tsx
function AssetReservationForm({ assetId }: { assetId: string }) {
  const handleSubmit = async (data: any) => {
    await apiClient.post('/reservations', {
      assetId,
      ...data,
    });
    toast.success('Reservation created successfully');
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Reservation form fields */}
    </form>
  );
}
```

### 13. Depreciation Alerts

**Create Background Job (server/src/jobs/depreciationAlerts.ts):**

```typescript
import cron from 'node-cron';

// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  const assets = await prisma.asset.findMany({
    where: {
      isDepreciable: true,
      depreciationStatus: 'active',
    },
    include: {
      depreciation: true,
      owner: true,
    },
  });

  for (const asset of assets) {
    // Check if depreciation milestone reached
    // Send email notification
  }
});
```

### 14. PWA Offline Mode

**Create manifest.json:**

```json
{
  "name": "Asset Management System",
  "short_name": "AssetApp",
  "description": "Comprehensive asset management solution",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Create service worker (public/sw.js):**

```javascript
const CACHE_NAME = 'asset-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/js/app.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

### 15. Export/Import Functionality

Already implemented in existing codebase. Extend to other modules.

### 16. API Rate Limiting Display

**Create middleware (server/src/middleware/rateLimit.ts):**

```typescript
export async function trackApiUsage(req: any, res: any, next: any) {
  const userId = req.user?.id;
  const endpoint = req.path;

  // Track request
  await prisma.apiRateLimit.upsert({
    where: {
      userId_endpoint_windowStart: {
        userId,
        endpoint,
        windowStart: new Date(Date.now() - 60000), // 1 minute window
      },
    },
    update: {
      requestCount: { increment: 1 },
    },
    create: {
      userId,
      endpoint,
      requestCount: 1,
      windowStart: new Date(),
      windowEnd: new Date(Date.now() + 60000),
    },
  });

  next();
}
```

### 17. Keyboard Shortcuts

Already implemented! The hook exists at `client/src/hooks/useKeyboardShortcuts.ts`.

---

## Testing Checklist

- [ ] Bulk operations work on all list pages
- [ ] Advanced filters apply correctly
- [ ] Quick actions menu opens and navigates correctly
- [ ] Global search returns results from all modules
- [ ] Tables are responsive on mobile devices
- [ ] Asset timeline displays all events
- [ ] Dashboard widgets are customizable
- [ ] Email notifications are sent
- [ ] Asset transfers update correctly
- [ ] QR code scanning works
- [ ] Reports generate in PDF/CSV/Excel
- [ ] Reservations can be created and managed
- [ ] Depreciation alerts are triggered
- [ ] PWA works offline
- [ ] Export/import functions correctly
- [ ] API rate limits are enforced
- [ ] Keyboard shortcuts work

---

## Troubleshooting

### Database Migration Issues

If migration fails:
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### Email Not Sending

- Check SMTP credentials in `.env`
- Verify firewall allows SMTP port
- Test with a simple nodemailer script

### PWA Not Installing

- Ensure manifest.json is linked in index.html
- Check service worker registration
- Verify HTTPS (required for PWA)

---

## Next Steps

1. Run database migrations
2. Test each feature individually
3. Update user documentation
4. Train users on new features
5. Monitor system performance
6. Gather user feedback
7. Iterate and improve

---

## Support

For issues or questions, please check:
- GitHub Issues
- Documentation
- Contact: support@yourapp.com
