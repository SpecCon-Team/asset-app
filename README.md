# AssetTrack Pro - Enterprise Asset Management System

A comprehensive, secure, and GDPR-compliant asset management system built with modern web technologies.

## 🚀 Features

### Core Functionality
- **Asset Management** - Track hardware, software, and equipment
- **Ticket System** - Support ticket creation and tracking
- **User Management** - Role-based access control
- **Real-time Notifications** - Stay updated on changes
- **Dashboard Analytics** - Visualize key metrics

### Security & Compliance
- ✅ **Activity Audit Logs** - Complete activity tracking
- ✅ **Two-Factor Authentication** - TOTP-based 2FA
- ✅ **Role-Based Permissions** - Field-level access control
- ✅ **GDPR Compliance** - Data export, anonymization, privacy tools

### User Experience
- 🌓 Dark mode support
- 📱 Responsive design
- ⌨️ Keyboard shortcuts
- 🔍 Global search
- ♿ Accessibility features

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Zustand** for state management

### Backend
- **Node.js** with Express
- **Prisma ORM** with PostgreSQL
- **JWT** authentication
- **bcrypt** password hashing
- **Speakeasy** for 2FA

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Docker (optional, for local database)

## 🔧 Quick Start

### 1. Install dependencies
```bash
npm install
cd server && npm install
cd ../client && npm install
```

### 2. Setup environment
Create `server/.env` with your database URL and JWT secret

### 3. Setup database
```bash
cd server
npx prisma db push
npm run seed
```

### 4. Start the application
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

Access at: `http://localhost:5174`

## 📚 Documentation

- **[Security & Compliance Summary](SECURITY_COMPLIANCE_SUMMARY.md)** - Complete security overview
- **[GDPR Compliance Guide](GDPR_COMPLIANCE.md)** - GDPR implementation details
- **[Role-Based Visibility](ROLE_BASED_VISIBILITY.md)** - Permission system guide
- **[Improvements Completed](IMPROVEMENTS_COMPLETED.md)** - Feature history

## 🔐 Security Features

- Strong password requirements & 2FA
- Role-based access control
- Field-level permissions
- Complete audit logging
- GDPR compliance tools
- Data encryption & protection

## 📄 License

Proprietary and confidential.

---

**Built with ❤️ using React, Node.js, and PostgreSQL**
