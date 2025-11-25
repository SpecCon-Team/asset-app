# AssetTrack Pro - Project Documentation

**Version:** 0.1.0
**Last Updated:** 2025-11-25
**Status:** Active Development

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Getting Started](#getting-started)
5. [Core Features](#core-features)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [Security Implementation](#security-implementation)
9. [User Roles & Permissions](#user-roles--permissions)
10. [Development Guidelines](#development-guidelines)
11. [Deployment](#deployment)
12. [Testing](#testing)
13. [Troubleshooting](#troubleshooting)
14. [Contributing](#contributing)
15. [License](#license)

---

## Project Overview

### What is AssetTrack Pro?

AssetTrack Pro is a comprehensive, enterprise-grade asset management system designed to help organizations track, manage, and optimize their physical and digital assets. Built with modern web technologies, it provides a secure, scalable, and user-friendly platform for asset lifecycle management.

### Key Objectives

- **Asset Lifecycle Management** - Track assets from acquisition to disposal
- **Support Ticket System** - Manage IT support requests efficiently
- **Inventory Control** - Monitor stock levels and procurement
- **Compliance & Audit** - GDPR-compliant with complete audit trails
- **Automation** - Workflow automation and SLA management
- **Security First** - Multi-layered security with 2FA and RBAC

### Target Users

- **IT Administrators** - System configuration and user management
- **Technicians** - Asset maintenance and ticket resolution
- **End Users** - Asset requests and ticket submission
- **Managers** - Analytics and reporting

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  React + TypeScript + Vite + Tailwind CSS + Zustand         │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST API (JSON)
┌─────────────────────────▼───────────────────────────────────┐
│                      Application Layer                       │
│     Express.js + TypeScript + JWT + Security Middleware     │
├─────────────────────────────────────────────────────────────┤
│                      Business Logic Layer                    │
│  Workflows | Permissions | Automation | Notifications       │
└─────────────────────────┬───────────────────────────────────┘
                          │ Prisma ORM
┌─────────────────────────▼───────────────────────────────────┐
│                       Data Layer                             │
│              PostgreSQL Database (Primary)                   │
│         Optional: Dual-Database Sync (Neon Cloud)           │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
asset-app/
├── client/                      # Frontend application
│   ├── public/                  # Static assets
│   │   └── manifest.json        # PWA manifest
│   ├── src/
│   │   ├── app/                 # App configuration
│   │   │   ├── layout/          # Layout components
│   │   │   ├── router/          # Route definitions
│   │   │   └── stores/          # Zustand state stores
│   │   ├── components/          # Reusable components
│   │   │   ├── ui/              # UI primitives
│   │   │   └── [feature]/       # Feature-specific components
│   │   ├── contexts/            # React contexts
│   │   ├── features/            # Feature modules
│   │   │   ├── assets/          # Asset management
│   │   │   ├── tickets/         # Ticket system
│   │   │   ├── inventory/       # Inventory management
│   │   │   ├── auth/            # Authentication
│   │   │   └── [others]/        # Other features
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility functions
│   │   ├── pages/               # Page components
│   │   ├── styles/              # Global styles
│   │   └── types/               # TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── server/                      # Backend application
│   ├── prisma/                  # Database schema & migrations
│   │   ├── schema.prisma        # Prisma schema definition
│   │   └── migrations/          # Database migrations
│   ├── src/
│   │   ├── lib/                 # Business logic libraries
│   │   │   ├── auditLog.ts      # Audit logging
│   │   │   ├── email.ts         # Email service
│   │   │   ├── encryption.ts    # Data encryption
│   │   │   ├── gdpr.ts          # GDPR compliance
│   │   │   ├── permissions.ts   # Permission system
│   │   │   ├── workflowEngine.ts # Workflow automation
│   │   │   └── [others]/        # Other services
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.ts          # Authentication
│   │   │   ├── security.ts      # Security middleware
│   │   │   └── fieldVisibility.ts # Field permissions
│   │   ├── routes/              # API route handlers
│   │   │   ├── auth.ts          # Auth endpoints
│   │   │   ├── assets.ts        # Asset endpoints
│   │   │   ├── tickets.ts       # Ticket endpoints
│   │   │   ├── inventory.ts     # Inventory endpoints
│   │   │   └── [others]/        # Other endpoints
│   │   └── index.ts             # Server entry point
│   ├── uploads/                 # File upload storage
│   ├── package.json
│   ├── tsconfig.json
│   ├── seed.mjs                 # Database seeding
│   └── .env                     # Environment variables
│
├── docs/                        # Documentation
│   ├── features/                # Feature documentation
│   ├── guides/                  # Setup and usage guides
│   ├── security/                # Security documentation
│   ├── testing/                 # Testing guides
│   ├── theme/                   # Theme documentation
│   ├── whatsapp/                # WhatsApp integration
│   └── workflow/                # Workflow documentation
│
├── package.json                 # Root workspace config
├── README.md                    # Project readme
└── PROJECT_DOCUMENTATION.md     # This file
```

---

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.6.3 | Type safety |
| Vite | 5.4.9 | Build tool & dev server |
| Tailwind CSS | 3.4.14 | Utility-first CSS |
| Zustand | 5.0.8 | State management |
| React Router | 6.28.0 | Client-side routing |
| React Hook Form | 7.53.0 | Form management |
| Zod | 3.23.8 | Schema validation |
| Axios | 1.7.7 | HTTP client |
| Chart.js | 4.5.1 | Data visualization |
| Recharts | 3.4.1 | React charts |
| React Hot Toast | 2.6.0 | Notifications |
| SweetAlert2 | 11.26.3 | Modal dialogs |
| Lucide React | 0.468.0 | Icon library |
| date-fns | 4.1.0 | Date utilities |
| jsPDF | 3.0.3 | PDF generation |
| xlsx | 0.18.5 | Excel export |
| QRCode React | 4.2.0 | QR code generation |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| Express | 4.19.2 | Web framework |
| TypeScript | 5.6.3 | Type safety |
| Prisma | 5.20.0 | ORM & database toolkit |
| PostgreSQL | Latest | Primary database |
| JWT | 9.0.2 | Authentication tokens |
| bcryptjs | 2.4.3 | Password hashing |
| Helmet | 8.1.0 | Security headers |
| CORS | 2.8.5 | Cross-origin resource sharing |
| express-rate-limit | 8.2.1 | Rate limiting |
| Multer | 2.0.2 | File upload handling |
| Nodemailer | 7.0.10 | Email sending |
| Speakeasy | 2.0.0 | TOTP 2FA |
| dotenv | 16.4.5 | Environment variables |
| compression | 1.8.1 | Response compression |
| morgan | 1.10.1 | HTTP logging |

### Development Tools

- **Package Manager**: npm workspaces
- **Process Manager**: tsx watch
- **Linting**: ESLint with Prettier
- **Testing**: Vitest
- **API Testing**: Postman/Insomnia (recommended)
- **Database GUI**: Prisma Studio, pgAdmin

---

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **PostgreSQL** 14.x or higher
- **Git** for version control

### Installation Steps

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd asset-app
```

#### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

#### 3. Configure Environment Variables

Create a `.env` file in the `server` directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/asset_app"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-refresh-token-secret-change-this"

# Server Configuration
PORT=4000
NODE_ENV=development
CLIENT_URL="http://localhost:5174"

# Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="AssetTrack Pro <noreply@assettrack.com>"

# WhatsApp Configuration (Optional)
WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
WHATSAPP_ACCESS_TOKEN="your-access-token"
WHATSAPP_VERIFY_TOKEN="asset_app_webhook_verify_2024"

# Backup Configuration (Optional)
BACKUP_ENCRYPTION_KEY="generate-a-32-byte-base64-key"
ENABLE_AUTOMATED_BACKUPS=false
```

#### 4. Setup Database

```bash
cd server

# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed database with sample data
npm run seed
```

#### 5. Start Development Servers

```bash
# Terminal 1 - Start backend (from server directory)
cd server
npm run dev

# Terminal 2 - Start frontend (from client directory)
cd client
npm run dev
```

#### 6. Access the Application

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:4000
- **API Health Check**: http://localhost:4000/health
- **Prisma Studio**: `npx prisma studio` (run from server directory)

### Default Login Credentials

After seeding, you can log in with:

```
Admin Account:
Email: admin@example.com
Password: admin123

Technician Account:
Email: tech@example.com
Password: tech123

User Account:
Email: user@example.com
Password: user123
```

**Important**: Change these credentials immediately in production!

---

## Core Features

### 1. Asset Management

**Purpose**: Complete lifecycle management of organizational assets

**Key Features**:
- Asset registration with unique codes
- Asset categories (Hardware, Software, Equipment)
- Status tracking (Available, In Use, Maintenance, Retired)
- Assignment to users/departments
- Location tracking with history
- QR code generation for physical assets
- Asset check-in/check-out system
- Maintenance scheduling
- Depreciation calculation
- Asset reservations/bookings
- Disposal management

**User Stories**:
- As an admin, I can add new assets to the system
- As a technician, I can update asset status and location
- As a user, I can view assets assigned to me
- As a user, I can request asset checkout

### 2. Support Ticket System

**Purpose**: Streamline IT support and issue resolution

**Key Features**:
- Ticket creation with priority levels
- Auto-assignment based on rules
- Status workflow (Open → In Progress → Resolved → Closed)
- Comment threads with notifications
- File attachments
- Ticket templates for common issues
- Reply templates for quick responses
- SLA tracking with deadlines
- Kanban board view
- Ticket linking to assets

**User Stories**:
- As a user, I can submit support tickets
- As a technician, I can be auto-assigned tickets
- As an admin, I can create ticket templates
- As a technician, I can track SLA deadlines

### 3. Inventory Management

**Purpose**: Track consumables, parts, and supplies

**Key Features**:
- Item catalog with categories
- Stock level monitoring
- Minimum/maximum stock thresholds
- Low stock alerts
- Purchase orders
- Supplier management
- Stock transactions (receive, issue, adjust, return)
- Barcode support
- Multi-location inventory
- Usage analytics

**User Stories**:
- As an admin, I can manage inventory items
- As a technician, I can issue stock to users
- As a user, I can request inventory items
- As an admin, I receive low stock alerts

### 4. Document Management

**Purpose**: Centralized document storage and organization

**Key Features**:
- Category-based organization
- Document versioning
- Access control and sharing
- Document associations (link to assets/tickets)
- Full-text search
- Access logging
- Document comments
- Expiring shares
- Role-based permissions

**User Stories**:
- As an admin, I can organize documents by category
- As a user, I can upload documents related to assets
- As a technician, I can share documents with specific users
- As an admin, I can track document access

### 5. User Management

**Purpose**: Secure user authentication and authorization

**Key Features**:
- Role-based access control (Admin, Technician, User)
- Two-factor authentication (TOTP)
- Password policies
- Session management
- Login history
- Account lockout protection
- Field-level permissions
- User profiles
- Department/location assignment

**User Stories**:
- As an admin, I can create user accounts
- As a user, I can enable 2FA for my account
- As an admin, I can assign roles and permissions
- As a user, I can manage my active sessions

### 6. Workflow Automation

**Purpose**: Automate repetitive tasks and processes

**Key Features**:
- Workflow templates
- Trigger-based automation (ticket created, status changed, etc.)
- Conditional logic
- Action execution (assign, notify, update, etc.)
- Auto-assignment rules (round-robin, least busy, skill-based)
- SLA policies with escalation
- Workflow execution history

**User Stories**:
- As an admin, I can create workflows to auto-assign tickets
- As an admin, I can set SLA policies for ticket priorities
- As a technician, I receive escalation notifications
- As an admin, I can view workflow execution history

### 7. Depreciation Management

**Purpose**: Calculate and track asset depreciation

**Key Features**:
- Multiple depreciation methods (Straight-line, Declining Balance)
- Automated schedule generation
- Book value tracking
- Depreciation reports
- Asset valuation history
- Fiscal year support

**User Stories**:
- As an admin, I can set depreciation schedules for assets
- As a finance user, I can generate depreciation reports
- As an admin, I can track book values over time

### 8. Analytics & Reporting

**Purpose**: Data-driven insights and decision making

**Key Features**:
- Dashboard widgets (customizable)
- Asset utilization reports
- Ticket resolution metrics
- Inventory turnover
- User activity reports
- Export to CSV/Excel/PDF
- Chart visualizations
- Saved filters

**User Stories**:
- As an admin, I can view asset utilization metrics
- As a manager, I can export ticket reports
- As a technician, I can track my resolution time
- As an admin, I can customize dashboard widgets

### 9. Notifications

**Purpose**: Keep users informed of important events

**Key Features**:
- In-app notifications
- Email notifications
- WhatsApp integration (optional)
- Notification preferences
- Real-time updates
- Notification bell with unread count

**Notification Types**:
- Ticket assignment
- Ticket comments
- Asset assignment
- Low stock alerts
- SLA warnings
- Maintenance due
- Checkout reminders

### 10. GDPR Compliance

**Purpose**: Data privacy and regulatory compliance

**Key Features**:
- Data export (user's personal data)
- Data anonymization
- Account deletion
- Privacy dashboard
- Consent management
- Audit logging
- Data retention policies

**User Stories**:
- As a user, I can export all my personal data
- As a user, I can delete my account
- As an admin, I can anonymize user data
- As a compliance officer, I can audit data access

---

## Database Schema

### Entity Relationship Overview

The database consists of 45+ tables organized into functional domains:

#### Core Entities
- **User** - User accounts and authentication
- **Asset** - Physical and digital assets
- **Ticket** - Support tickets
- **Comment** - Ticket comments
- **Notification** - User notifications

#### Asset Management
- **AssetCheckout** - Check-in/out tracking
- **AssetQRCode** - QR code management
- **AssetLocationHistory** - Location tracking
- **AssetHistory** - Change history
- **MaintenanceSchedule** - Maintenance planning
- **AssetDepreciation** - Depreciation tracking
- **DepreciationSchedule** - Depreciation periods
- **AssetValuation** - Asset valuations
- **AssetDisposal** - Disposal tracking
- **AssetReservation** - Asset bookings

#### Inventory Management
- **InventoryItem** - Inventory catalog
- **StockTransaction** - Stock movements
- **Supplier** - Supplier information
- **PurchaseOrder** - Purchase orders
- **PurchaseOrderItem** - PO line items
- **StockAlert** - Low stock alerts

#### Document Management
- **DocumentCategory** - Document categories
- **Document** - Document storage
- **DocumentAssociation** - Entity links
- **DocumentAccessLog** - Access tracking
- **DocumentShare** - Sharing management
- **DocumentComment** - Document comments

#### Workflow & Automation
- **WorkflowTemplate** - Workflow definitions
- **WorkflowExecution** - Execution history
- **AutoAssignmentRule** - Assignment rules
- **SLAPolicy** - SLA definitions
- **TicketSLA** - Ticket SLA tracking

#### Security & Audit
- **AuditLog** - System audit trail
- **LoginHistory** - Login tracking
- **SecurityEvent** - Security incidents
- **UserSession** - Active sessions
- **RefreshToken** - Token management

#### Templates & Configuration
- **TicketTemplate** - Ticket templates
- **ReplyTemplate** - Reply templates
- **SavedFilter** - User-saved filters
- **DashboardWidget** - Widget configuration
- **KeyboardShortcut** - User shortcuts

#### Additional Features
- **PEGClient** - Client management
- **Trip** - Travel planning
- **Attachment** - File attachments
- **WebhookLog** - Webhook logging
- **EmailNotificationLog** - Email tracking
- **ExportImportHistory** - Export/import tracking
- **ApiRateLimit** - Rate limit tracking
- **CheckoutReminder** - Checkout reminders

### Key Relationships

```
User (1) ─────< (*) Ticket (creator)
User (1) ─────< (*) Ticket (assignee)
User (1) ─────< (*) Asset (owner)
User (1) ─────< (*) AssetCheckout
Asset (1) ────< (*) Ticket
Asset (1) ────< (*) AssetCheckout
Asset (1) ────< (*) AssetHistory
Ticket (1) ───< (*) Comment
Ticket (1) ───< (*) Attachment
InventoryItem (1) ─< (*) StockTransaction
PurchaseOrder (1) ─< (*) PurchaseOrderItem
Document (1) ──< (*) DocumentAssociation
WorkflowTemplate (1) ─< (*) WorkflowExecution
```

### Database Indexes

Comprehensive indexing for optimal query performance:
- Primary keys (automatic)
- Foreign keys (automatic)
- Frequently queried fields (status, role, dates)
- Composite indexes for complex queries
- Unique constraints where applicable

### Schema Management

```bash
# View schema
npx prisma studio

# Create migration
npx prisma migrate dev --name migration_name

# Deploy migration (production)
npx prisma migrate deploy

# Reset database (development only!)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

---

## API Documentation

### Base URL

```
Development: http://localhost:4000/api
Production: https://your-domain.com/api
```

### Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### API Endpoints Overview

#### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/logout` | User logout | Yes |
| POST | `/refresh` | Refresh access token | Yes |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password | No |
| POST | `/verify-otp` | Verify email OTP | No |
| GET | `/me` | Get current user | Yes |

#### Users (`/api/users`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | List all users | Yes | Admin |
| GET | `/:id` | Get user by ID | Yes | Admin/Self |
| POST | `/` | Create user | Yes | Admin |
| PUT | `/:id` | Update user | Yes | Admin/Self |
| DELETE | `/:id` | Delete user | Yes | Admin |
| GET | `/profile` | Get own profile | Yes | All |
| PUT | `/profile` | Update own profile | Yes | All |

#### Assets (`/api/assets`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | List all assets | Yes | All |
| GET | `/:id` | Get asset details | Yes | All |
| POST | `/` | Create asset | Yes | Admin/Tech |
| PUT | `/:id` | Update asset | Yes | Admin/Tech |
| DELETE | `/:id` | Delete asset | Yes | Admin |
| GET | `/my-assets` | Get user's assets | Yes | All |
| POST | `/:id/assign` | Assign asset | Yes | Admin/Tech |
| POST | `/import` | Import CSV | Yes | Admin |
| GET | `/export` | Export assets | Yes | Admin/Tech |

#### Tickets (`/api/tickets`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | List all tickets | Yes | All |
| GET | `/:id` | Get ticket details | Yes | All |
| POST | `/` | Create ticket | Yes | All |
| PUT | `/:id` | Update ticket | Yes | All |
| DELETE | `/:id` | Delete ticket | Yes | Admin |
| POST | `/:id/assign` | Assign ticket | Yes | Admin/Tech |
| GET | `/my-tickets` | Get user's tickets | Yes | All |
| POST | `/bulk-assign` | Bulk assign tickets | Yes | Admin/Tech |

#### Comments (`/api/comments`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/ticket/:ticketId` | Get ticket comments | Yes |
| POST | `/` | Add comment | Yes |
| PUT | `/:id` | Update comment | Yes |
| DELETE | `/:id` | Delete comment | Yes |

#### Inventory (`/api/inventory`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/items` | List inventory items | Yes | All |
| GET | `/items/:id` | Get item details | Yes | All |
| POST | `/items` | Create item | Yes | Admin |
| PUT | `/items/:id` | Update item | Yes | Admin |
| DELETE | `/items/:id` | Delete item | Yes | Admin |
| POST | `/transactions` | Create transaction | Yes | Admin/Tech |
| GET | `/transactions` | List transactions | Yes | All |
| GET | `/alerts` | Get stock alerts | Yes | Admin/Tech |

#### Documents (`/api/documents`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List documents | Yes |
| GET | `/:id` | Get document | Yes |
| POST | `/upload` | Upload document | Yes |
| PUT | `/:id` | Update document | Yes |
| DELETE | `/:id` | Delete document | Yes |
| POST | `/:id/share` | Share document | Yes |
| GET | `/:id/versions` | Get versions | Yes |

#### Checkout (`/api/checkout`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Checkout asset | Yes |
| PUT | `/:id/checkin` | Check-in asset | Yes |
| GET | `/active` | Get active checkouts | Yes |
| GET | `/history` | Get checkout history | Yes |
| GET | `/overdue` | Get overdue checkouts | Yes |

#### Workflows (`/api/workflows`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/templates` | List workflows | Yes | Admin |
| POST | `/templates` | Create workflow | Yes | Admin |
| PUT | `/templates/:id` | Update workflow | Yes | Admin |
| DELETE | `/templates/:id` | Delete workflow | Yes | Admin |
| GET | `/executions` | Execution history | Yes | Admin |
| GET | `/assignment-rules` | List rules | Yes | Admin |
| GET | `/sla-policies` | List SLA policies | Yes | Admin |

#### Notifications (`/api/notifications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user notifications | Yes |
| PUT | `/:id/read` | Mark as read | Yes |
| PUT | `/read-all` | Mark all as read | Yes |
| DELETE | `/:id` | Delete notification | Yes |

#### Audit Logs (`/api/audit-logs`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | List audit logs | Yes | Admin |
| GET | `/:id` | Get log details | Yes | Admin |
| GET | `/user/:userId` | User's logs | Yes | Admin |
| GET | `/export` | Export logs | Yes | Admin |

#### Analytics (`/api/analytics`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/dashboard` | Dashboard stats | Yes | All |
| GET | `/assets` | Asset analytics | Yes | Admin/Tech |
| GET | `/tickets` | Ticket analytics | Yes | Admin/Tech |
| GET | `/inventory` | Inventory analytics | Yes | Admin/Tech |

### Response Format

#### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

#### Error Response

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "statusCode": 400
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

### Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes
- **Progressive delay**: Delays increase with request frequency
- Response headers include: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Security Implementation

### Authentication Flow

1. User submits credentials to `/api/auth/login`
2. Server validates credentials and checks account status
3. If 2FA is enabled, server requires TOTP code
4. Server generates JWT access token (15min) and refresh token (7 days)
5. Tokens are returned to client
6. Client includes access token in Authorization header
7. When access token expires, client uses refresh token to get new access token

### Password Security

- **Hashing**: bcrypt with salt rounds (10)
- **Strength**: Minimum 8 characters, enforced by zxcvbn
- **History**: Last 5 passwords stored, prevents reuse
- **Reset**: Secure token-based password reset
- **Lockout**: Account locked after 5 failed attempts

### Two-Factor Authentication

- **Method**: TOTP (Time-based One-Time Password)
- **Library**: Speakeasy
- **Backup Codes**: 10 single-use codes generated
- **QR Code**: Displayed during setup for authenticator apps
- **Recovery**: Email-based recovery with backup codes

### Session Management

- **Storage**: Database-backed sessions with UserSession model
- **Tracking**: Device, browser, IP, geolocation
- **Fingerprinting**: Browser fingerprint for anomaly detection
- **Expiry**: 7 days with automatic cleanup
- **Multi-device**: Users can manage multiple active sessions

### Role-Based Access Control (RBAC)

#### Roles

1. **ADMIN**
   - Full system access
   - User management
   - System configuration
   - All CRUD operations

2. **TECHNICIAN**
   - Asset management
   - Ticket resolution
   - Inventory management
   - Limited user operations

3. **USER**
   - View assigned assets
   - Create tickets
   - View own data
   - Limited operations

#### Field-Level Permissions

Granular control over field visibility and editability:

```typescript
// Example: Asset field permissions
{
  asset_code: { ADMIN: 'write', TECHNICIAN: 'write', USER: 'read' },
  serial_number: { ADMIN: 'write', TECHNICIAN: 'write', USER: 'read' },
  notes: { ADMIN: 'write', TECHNICIAN: 'read', USER: 'none' },
  ownership: { ADMIN: 'write', TECHNICIAN: 'write', USER: 'none' }
}
```

### Security Middleware Stack

Applied in order for all API requests:

1. **Request ID** - Unique ID for request tracing
2. **Security Logger** - Log security-relevant events
3. **Enhanced Headers** - Helmet with CSP
4. **CORS** - Origin validation
5. **Cookie Parser** - Secure cookie handling
6. **Compression** - Response compression
7. **Mongo Sanitize** - NoSQL injection prevention
8. **Input Validation** - XSS and injection prevention
9. **Parameter Pollution** - Duplicate parameter protection
10. **Data Integrity** - Request tampering detection
11. **Rate Limiting** - Dynamic rate limiting
12. **Progressive Delay** - Anti-brute-force

### Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

### Audit Logging

All security-relevant actions are logged to the `AuditLog` table:

- User login/logout
- Failed login attempts
- Password changes
- Role changes
- Data exports
- Asset assignments
- Ticket updates
- Permission changes

### GDPR Compliance Features

1. **Data Export**: Users can download all their personal data in JSON/CSV format
2. **Right to Erasure**: Users can request account deletion with data anonymization
3. **Data Portability**: Structured data export in machine-readable format
4. **Access Logs**: Complete audit trail of data access
5. **Consent Management**: Track user consent for data processing
6. **Privacy Dashboard**: User-facing privacy controls

### Security Best Practices

- Never commit `.env` files
- Use strong, unique JWT secrets
- Enable HTTPS in production
- Regularly update dependencies
- Monitor security events
- Rotate credentials periodically
- Implement database backups
- Use prepared statements (Prisma handles this)
- Sanitize all user inputs
- Implement CSP without `unsafe-inline`
- Enable automated backups in production

---

## User Roles & Permissions

### Permission Matrix

| Feature | Admin | Technician | User |
|---------|-------|------------|------|
| **Assets** |
| View all assets | ✓ | ✓ | Own only |
| Create assets | ✓ | ✓ | ✗ |
| Edit assets | ✓ | ✓ | ✗ |
| Delete assets | ✓ | ✗ | ✗ |
| Assign assets | ✓ | ✓ | ✗ |
| Export assets | ✓ | ✓ | ✗ |
| Import assets | ✓ | ✗ | ✗ |
| **Tickets** |
| View all tickets | ✓ | ✓ | Own only |
| Create tickets | ✓ | ✓ | ✓ |
| Edit tickets | ✓ | ✓ | Own only |
| Delete tickets | ✓ | ✗ | ✗ |
| Assign tickets | ✓ | ✓ | ✗ |
| Close tickets | ✓ | ✓ | Own only |
| **Inventory** |
| View inventory | ✓ | ✓ | ✓ |
| Manage items | ✓ | ✗ | ✗ |
| Create transactions | ✓ | ✓ | ✗ |
| View transactions | ✓ | ✓ | Own only |
| Manage suppliers | ✓ | ✗ | ✗ |
| Manage purchase orders | ✓ | ✗ | ✗ |
| **Users** |
| View all users | ✓ | ✓ | ✗ |
| Create users | ✓ | ✗ | ✗ |
| Edit users | ✓ | ✗ | Self only |
| Delete users | ✓ | ✗ | ✗ |
| Assign roles | ✓ | ✗ | ✗ |
| Reset 2FA | ✓ | ✗ | ✗ |
| **Workflows** |
| View workflows | ✓ | ✗ | ✗ |
| Create workflows | ✓ | ✗ | ✗ |
| Edit workflows | ✓ | ✗ | ✗ |
| Manage SLA policies | ✓ | ✗ | ✗ |
| View execution history | ✓ | ✗ | ✗ |
| **Documents** |
| View documents | ✓ | ✓ | Shared only |
| Upload documents | ✓ | ✓ | ✓ |
| Edit documents | ✓ | ✓ | Own only |
| Delete documents | ✓ | ✓ | Own only |
| Share documents | ✓ | ✓ | Own only |
| **Audit & Security** |
| View audit logs | ✓ | ✗ | ✗ |
| Export audit logs | ✓ | ✗ | ✗ |
| View security events | ✓ | ✗ | ✗ |
| Manage sessions | ✓ | ✗ | Self only |
| **Analytics** |
| View all analytics | ✓ | ✓ | Own only |
| Export reports | ✓ | ✓ | ✗ |
| Configure dashboards | ✓ | ✓ | ✓ |

### Implementing Custom Permissions

To add new permissions:

1. **Update Permission Types** (`server/src/lib/permissions.ts`)

```typescript
export const customFieldPermissions: FieldPermissions = {
  fieldName: { ADMIN: 'write', TECHNICIAN: 'read', USER: 'none' }
}
```

2. **Apply in Middleware** (`server/src/middleware/fieldVisibility.ts`)

```typescript
export const filterFieldsByPermission = (role: Role, data: any, permissions: FieldPermissions) => {
  // Filter logic
}
```

3. **Use in API Routes**

```typescript
router.get('/', authenticate, async (req, res) => {
  const data = await prisma.model.findMany();
  const filtered = filterFieldsByPermission(req.user.role, data, customFieldPermissions);
  res.json(filtered);
});
```

---

## Development Guidelines

### Code Style

- **TypeScript**: Use strict mode
- **Naming Conventions**:
  - Variables/Functions: camelCase
  - Components: PascalCase
  - Constants: UPPER_SNAKE_CASE
  - Files: kebab-case (except components)
- **Formatting**: Prettier with ESLint
- **Imports**: Use absolute imports with `@/` alias

### Component Structure

```typescript
// Imports
import React from 'react';
import { useEffect, useState } from 'react';
import { Component } from '@/components';

// Types/Interfaces
interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
}

// Component
export function MyComponent({ title, onSubmit }: Props) {
  // Hooks
  const [state, setState] = useState();

  // Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // Handlers
  const handleSubmit = () => {
    // Handler logic
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### API Route Structure

```typescript
import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';

const router = Router();

// GET /api/resource
router.get('/', authenticate, async (req, res) => {
  try {
    const data = await prisma.model.findMany();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

### Git Workflow

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and commit: `git commit -m "feat: add feature"`
3. Push to remote: `git push origin feature/feature-name`
4. Create pull request
5. Code review
6. Merge to main

### Commit Message Format

Follow Conventional Commits:

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: format code
refactor: restructure code
test: add tests
chore: update dependencies
```

### Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Debugging

- **Backend**: Use VSCode debugger with tsx
- **Frontend**: Use React DevTools browser extension
- **Database**: Use Prisma Studio for data inspection
- **API**: Use browser DevTools or Postman

---

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique JWT secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure production database
- [ ] Set up email service
- [ ] Enable automated backups
- [ ] Configure CORS for production domain
- [ ] Remove development dependencies
- [ ] Enable CSP without unsafe-inline
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Review and update security headers
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure CDN for static assets
- [ ] Optimize images and assets
- [ ] Enable database connection pooling
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Review audit log retention
- [ ] Test disaster recovery process

### Build Commands

```bash
# Build frontend
cd client
npm run build

# Build backend
cd server
npm run build

# Run production server
cd server
npm start
```

### Environment Variables (Production)

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
JWT_SECRET="<strong-random-secret>"
JWT_REFRESH_SECRET="<strong-random-secret>"
PORT=4000
CLIENT_URL="https://your-domain.com"
ENABLE_AUTOMATED_BACKUPS=true
BACKUP_ENCRYPTION_KEY="<32-byte-base64-key>"
```

### Docker Deployment (Optional)

See `docs/guides/DOCKER_SETUP_GUIDE.md` for Docker deployment instructions.

### Cloud Platforms

The application can be deployed to:
- **Vercel** (Frontend)
- **Railway** (Backend + Database)
- **Render** (Full-stack)
- **AWS** (EC2, RDS, S3)
- **Google Cloud** (Cloud Run, Cloud SQL)
- **Azure** (App Service, Azure SQL)

---

## Testing

### Test Categories

1. **Unit Tests** - Individual functions and components
2. **Integration Tests** - API endpoints and database operations
3. **E2E Tests** - Full user workflows
4. **Security Tests** - Authentication, authorization, input validation

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test path/to/test.spec.ts

# Run with coverage
npm run test:coverage
```

### Manual Testing

See `docs/testing/MANUAL_TEST_GUIDE.md` for comprehensive manual testing procedures.

### Test User Accounts

After seeding, use these accounts for testing:

```
Admin: admin@example.com / admin123
Technician: tech@example.com / tech123
User: user@example.com / user123
```

---

## Troubleshooting

### Common Issues

#### Database Connection Failed

**Problem**: Server cannot connect to PostgreSQL

**Solution**:
1. Verify PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL in `.env`
3. Ensure database exists: `createdb asset_app`
4. Check firewall/network settings

#### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::4000`

**Solution**:
```bash
# Find process using port
lsof -i :4000

# Kill process
kill -9 <PID>
```

#### Prisma Client Not Generated

**Problem**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
cd server
npx prisma generate
```

#### CORS Errors

**Problem**: `Access-Control-Allow-Origin` error in browser

**Solution**:
1. Check CLIENT_URL in server `.env`
2. Verify CORS configuration in `server/src/index.ts`
3. Ensure frontend is running on correct port

#### 2FA Not Working

**Problem**: TOTP codes are rejected

**Solution**:
1. Ensure server time is synchronized (NTP)
2. Check time skew on mobile device
3. Regenerate 2FA secret
4. Use backup codes as fallback

#### Email Not Sending

**Problem**: Email notifications fail

**Solution**:
1. Verify SMTP credentials in `.env`
2. Check SMTP host and port
3. Enable "Less secure apps" for Gmail
4. Check spam folder
5. Review logs for error messages

#### Build Errors

**Problem**: TypeScript compilation errors

**Solution**:
```bash
# Clear build cache
rm -rf dist node_modules
npm install
npm run build
```

### Debug Mode

Enable verbose logging:

```env
# .env
DEBUG=*
LOG_LEVEL=debug
```

### Getting Help

1. Check documentation in `docs/` directory
2. Review error logs: `server/logs/`
3. Search GitHub issues
4. Contact support team

---

## Contributing

### How to Contribute

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Update documentation
6. Submit pull request

### Pull Request Guidelines

- Clear description of changes
- Reference related issues
- Include screenshots for UI changes
- Ensure tests pass
- Follow code style guidelines
- Update CHANGELOG.md

### Code Review Process

1. Automated checks (lint, tests)
2. Peer review by 1+ developers
3. Security review for sensitive changes
4. QA testing
5. Approval and merge

---

## License

**Proprietary and Confidential**

This software is proprietary. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited.

© 2024 AssetTrack Pro. All rights reserved.

---

## Contact & Support

- **Documentation**: `/docs` directory
- **Issue Tracker**: GitHub Issues
- **Email**: support@assettrack.com
- **Website**: https://assettrack.com

---

## Changelog

See `docs/features/IMPROVEMENTS_COMPLETED.md` for detailed changelog.

---

## Acknowledgments

Built with:
- React, TypeScript, Node.js
- Prisma, PostgreSQL
- Tailwind CSS
- And many other open-source libraries

---

**Last Updated**: 2025-11-25
**Document Version**: 1.0.0
