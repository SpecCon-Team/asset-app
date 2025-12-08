# Asset Assignment to PEG Clients - Implementation Plan

## 🎯 Goal
Enable assignment of assets (laptops, tablets, etc.) to PEG clients with serial number tracking and comprehensive asset management.

---

## 📋 Overview

### Current State
- ✅ Asset model exists with serial numbers, asset types, status tracking
- ✅ PEGClient model exists with client information
- ❌ No relationship between Assets and PEGClients
- ❌ No UI for managing client assets

### Target State
- ✅ Assets can be assigned to PEG clients
- ✅ View all assets assigned to a client
- ✅ Add/assign new assets to clients
- ✅ Remove/unassign assets from clients
- ✅ Track asset details (serial number, type, condition, status)
- ✅ Beautiful, intuitive UI integrated into client details

---

## 🗄️ Database Schema Changes

### 1. Update Asset Model
Add relationship to PEGClient:

```prisma
model Asset {
  // ... existing fields ...
  
  // New field for PEG Client assignment
  pegClientId    String?
  pegClient      PEGClient? @relation(fields: [pegClientId], references: [id], onDelete: SetNull)
  
  // ... rest of model ...
  
  @@index([pegClientId])
}
```

### 2. Update PEGClient Model
Add relation to Assets:

```prisma
model PEGClient {
  // ... existing fields ...
  
  // New relation for assigned assets
  assets         Asset[]
  
  // ... rest of model ...
}
```

---

## 🎨 UI/UX Design Plan

### 1. Client Details Modal Enhancement
**Location**: `ProvinceDetailsPage.tsx` - Client Details Modal

**New Section**: "Assigned Assets"
- Display as a new section after "Additional Information"
- Show count badge: "X Assets Assigned"
- Grid/list view of assigned assets
- Each asset card shows:
  - Asset icon (laptop/tablet based on type)
  - Asset name
  - Serial number (prominent)
  - Asset type (Laptop/Tablet)
  - Condition badge (Good/Fair/Poor)
  - Status badge (Available/Assigned/Maintenance)
  - Quick actions: View Details, Unassign

### 2. Asset Assignment Modal
**New Component**: `AssignAssetModal.tsx`

**Features**:
- Search/filter available assets
- Filter by asset type (Laptop, Tablet, etc.)
- Filter by status (Available only)
- Display asset cards with:
  - Asset name
  - Serial number
  - Asset type
  - Current condition
  - Current status
- Multi-select or single-select mode
- "Assign Selected Assets" button
- Beautiful card-based layout

### 3. Asset Management Section
**Location**: Client Details Modal

**Layout**:
```
┌─────────────────────────────────────┐
│  📦 Assigned Assets (3)             │
│  [+ Assign Assets]                   │
├─────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐          │
│  │ 💻 Laptop│  │ 📱 Tablet│          │
│  │ SN12345 │  │ SN67890 │          │
│  │ Good ✓  │  │ Fair ⚠  │          │
│  └─────────┘  └─────────┘          │
└─────────────────────────────────────┐
```

**Asset Card Design**:
- Icon based on asset type (💻 Laptop, 📱 Tablet)
- Serial number prominently displayed
- Condition indicator (color-coded)
- Status badge
- Hover effects
- Click to view full asset details

---

## 🔧 Backend API Endpoints

### 1. Get Assets for PEG Client
```
GET /api/peg/:clientId/assets
Response: Array of Asset objects
```

### 2. Assign Asset to PEG Client
```
POST /api/peg/:clientId/assets
Body: { assetId: string }
Response: Updated Asset object
```

### 3. Unassign Asset from PEG Client
```
DELETE /api/peg/:clientId/assets/:assetId
Response: Success message
```

### 4. Get Available Assets (for assignment)
```
GET /api/assets/available?type=laptop|tablet
Response: Array of available Asset objects
```

---

## 📁 File Structure

### New Files
```
client/src/features/peg/
  ├── components/
  │   ├── AssignAssetModal.tsx      # Modal for assigning assets
  │   ├── ClientAssetCard.tsx        # Individual asset card component
  │   └── ClientAssetsSection.tsx    # Assets section in client details
  └── hooks/
      └── useClientAssets.ts         # Custom hook for asset operations
```

### Modified Files
```
server/prisma/schema.prisma          # Add Asset-PEGClient relation
server/src/routes/peg.ts              # Add asset assignment endpoints
client/src/features/peg/ProvinceDetailsPage.tsx  # Add assets section
```

---

## 🚀 Implementation Phases

### Phase 1: Database & Backend (Foundation)
1. ✅ Update Prisma schema
2. ✅ Run database migration
3. ✅ Update Prisma client
4. ✅ Create backend API endpoints
5. ✅ Add validation and error handling

### Phase 2: Frontend Components (UI)
1. ✅ Create `ClientAssetCard` component
2. ✅ Create `ClientAssetsSection` component
3. ✅ Create `AssignAssetModal` component
4. ✅ Create `useClientAssets` hook
5. ✅ Integrate into Client Details Modal

### Phase 3: Integration & Polish
1. ✅ Connect frontend to backend APIs
2. ✅ Add loading states
3. ✅ Add error handling
4. ✅ Add success notifications
5. ✅ Add empty states
6. ✅ Responsive design testing
7. ✅ Dark mode support

### Phase 4: Advanced Features (Optional)
1. Asset history tracking
2. Bulk assignment
3. Asset transfer between clients
4. Asset condition updates
5. Asset maintenance scheduling

---

## 🎨 UI Component Specifications

### Asset Card Component
```tsx
<ClientAssetCard
  asset={{
    id: string
    name: string
    serial_number: string
    asset_type: string
    condition: string
    status: string
  }}
  onUnassign: (assetId: string) => void
  onViewDetails: (assetId: string) => void
/>
```

**Visual Design**:
- Card with subtle shadow
- Icon (💻/📱) based on asset_type
- Serial number in monospace font
- Color-coded condition badge
- Status badge
- Hover effect with shadow elevation
- Smooth transitions

### Assign Asset Modal
**Features**:
- Search bar at top
- Filter chips (All, Laptop, Tablet)
- Grid of available assets
- Selected assets highlighted
- "Assign X Assets" button
- Loading skeleton while fetching
- Empty state when no assets available

---

## 📊 Data Flow

### Assigning Asset
```
User clicks "Assign Assets" 
  → Opens AssignAssetModal
  → Fetches available assets (GET /api/assets/available)
  → User selects assets
  → Clicks "Assign Selected"
  → POST /api/peg/:clientId/assets
  → Updates local state
  → Shows success notification
  → Refreshes client assets list
```

### Unassigning Asset
```
User clicks "Unassign" on asset card
  → Confirmation dialog
  → DELETE /api/peg/:clientId/assets/:assetId
  → Updates local state
  → Shows success notification
  → Asset becomes available again
```

---

## 🔒 Validation & Business Rules

1. **Asset Status Check**: Only "available" assets can be assigned
2. **Single Assignment**: Asset can only be assigned to one client at a time
3. **Serial Number**: Must be unique per asset
4. **Required Fields**: Asset name and serial number required
5. **Unassign Validation**: Confirm before unassigning

---

## 🎯 Success Criteria

- ✅ Users can view all assets assigned to a PEG client
- ✅ Users can assign new assets to clients
- ✅ Users can unassign assets from clients
- ✅ Serial numbers are prominently displayed
- ✅ Asset types (Laptop/Tablet) are clearly indicated
- ✅ UI is intuitive and beautiful
- ✅ Responsive on mobile and desktop
- ✅ Dark mode supported
- ✅ Loading and error states handled gracefully

---

## 📝 Notes

- Consider adding asset assignment history/audit trail
- Future: QR code scanning for quick asset assignment
- Future: Bulk import of assets with serial numbers
- Future: Asset condition photos
- Future: Asset warranty tracking

---

## 🚦 Next Steps

1. Review and approve this plan
2. Start with Phase 1 (Database & Backend)
3. Implement Phase 2 (Frontend Components)
4. Complete Phase 3 (Integration & Polish)
5. Test thoroughly
6. Deploy

---

**Estimated Implementation Time**: 4-6 hours
**Priority**: High
**Complexity**: Medium

