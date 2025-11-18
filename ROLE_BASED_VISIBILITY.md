# Role-Based Field Visibility - Implementation Guide

## Overview

This system controls what data different user roles can view and edit, preventing unauthorized access to sensitive information.

## Roles and Access Levels

### ADMIN
- **Full Access**: Can view and edit all fields
- **Sensitive Data**: Access to internal notes, ownership details, system IDs
- **User Management**: Can see user phone numbers, 2FA status

### TECHNICIAN
- **Limited Access**: Can edit most asset/ticket fields
- **Read-Only**: Can view internal notes, ownership, but cannot modify
- **Restricted**: Cannot see user phone numbers or 2FA settings

### USER
- **Minimal Access**: Can only view basic asset/ticket information
- **No Internal Data**: Cannot see notes, ownership, scan information
- **Self-Service**: Can edit their own profile fields

## Field Permissions by Entity

### Asset Fields

| Field | ADMIN | TECHNICIAN | USER |
|-------|-------|------------|------|
| name, description | Write | Write | Read |
| status, condition | Write | Write | Read |
| notes | Write | Read | None |
| remote_id | Write | None | None |
| ownership | Write | Read | None |
| scanned_by | Read | Read | None |

### User Fields

| Field | ADMIN | TECHNICIAN | USER |
|-------|-------|------------|------|
| name, bio | Write | Read | Write |
| email, role | Write | Read | Read |
| phone | Write | None | None |
| 2FA status | Read | None | None |
| passwords | None | None | None |

### Ticket Fields

| Field | ADMIN | TECHNICIAN | USER |
|-------|-------|------------|------|
| title, description | Write | Write | Write |
| status, priority | Write | Write | Read |
| assignedToId | Write | Read | None |

## Backend Implementation

### Permission Checking

```typescript
import { hasFieldPermission, validateFieldUpdates } from '@/lib/permissions';

// Check if user can read a field
const canRead = hasFieldPermission(userRole, 'asset', 'remote_id', 'read');

// Check if user can update fields
const check = validateFieldUpdates(userRole, 'asset', updateData);
if (!check.valid) {
  return res.status(403).json({
    message: 'Permission denied',
    invalidFields: check.invalidFields
  });
}
```

### Automatic Response Filtering

Applied to all GET routes via middleware:

```typescript
import { applyFieldVisibility } from '@/middleware/fieldVisibility';

router.get('/', authenticate, applyFieldVisibility('asset'), async (req, res) => {
  // Response automatically filtered based on user role
});
```

### Routes with Field Visibility

- ✅ `/api/assets` - GET (list, single)
- ✅ `/api/assets/:id` - PUT (with validation)
- ✅ `/api/users` - GET
- ✅ `/api/tickets` - GET (list, single)

## Frontend Implementation

### Using the Hook

```typescript
import { useFieldPermissions } from '@/hooks/useFieldPermissions';

function AssetDetails() {
  const { canView, canEdit, isAdmin } = useFieldPermissions('asset');

  return (
    <div>
      {canView('remote_id') && <div>{asset.remote_id}</div>}
      {canEdit('notes') ? (
        <textarea value={notes} onChange={...} />
      ) : (
        <p>{notes}</p>
      )}
    </div>
  );
}
```

### Protected Field Component

```typescript
import ProtectedField, { ProtectedInput } from '@/components/ProtectedField';

// Read-only display
<ProtectedField entityType="asset" fieldName="remote_id" value={asset.remote_id}>
  <span className="text-sm">{asset.remote_id}</span>
</ProtectedField>

// Form input with automatic disable
<ProtectedInput entityType="asset" fieldName="notes">
  <textarea value={notes} onChange={handleChange} />
</ProtectedInput>
```

## Testing Checklist

### Backend Tests
- [ ] ADMIN can update all asset fields
- [ ] TECHNICIAN cannot update `remote_id`
- [ ] USER gets filtered response (no sensitive fields)
- [ ] Update with forbidden fields returns 403

### Frontend Tests
- [ ] Fields hidden for users without permission
- [ ] Inputs disabled for read-only fields
- [ ] Masked values for sensitive data
- [ ] Role changes update visibility immediately

## Security Considerations

1. **Never trust frontend**: All permission checks enforced on backend
2. **Consistent permissions**: Frontend mirrors backend rules
3. **Sensitive data**: Passwords, tokens, secrets never exposed
4. **Audit logging**: All permission violations logged
5. **Default deny**: Unknown fields default to no access

## Adding New Fields

1. **Backend**: Add to `server/src/lib/permissions.ts`
   ```typescript
   myNewField: { ADMIN: 'write', TECHNICIAN: 'read', USER: 'none' }
   ```

2. **Frontend**: Add to `client/src/lib/permissions.ts`
   ```typescript
   myNewField: { ADMIN: 'write', TECHNICIAN: 'read', USER: 'none' }
   ```

3. **Label**: Add to `fieldLabels` object
   ```typescript
   myNewField: 'My New Field'
   ```

4. **Test**: Verify permissions work for all roles

## Common Patterns

### Conditional Rendering
```typescript
{isAdmin && <SensitiveDataPanel />}
{canEdit('notes') && <EditButton />}
```

### Form Field Disabling
```typescript
<input disabled={!canEdit('remote_id')} />
```

### Role-Specific UI
```typescript
{isTechnician && <TechnicianDashboard />}
{isUser && <UserDashboard />}
```

## Files Modified

### Backend
- `server/src/lib/permissions.ts` - Permission definitions
- `server/src/middleware/fieldVisibility.ts` - Response filtering
- `server/src/routes/assets.ts` - Applied middleware
- `server/src/routes/users.ts` - Applied middleware
- `server/src/routes/tickets.ts` - Applied middleware

### Frontend
- `client/src/lib/permissions.ts` - Permission definitions
- `client/src/hooks/useFieldPermissions.ts` - React hook
- `client/src/components/ProtectedField.tsx` - Visibility components

## Next Steps

To complete the implementation:
1. Apply `<ProtectedInput>` to all form fields in asset/user/ticket pages
2. Test with different user roles
3. Add visual indicators for read-only fields
4. Implement field masking for sensitive data display
