# POS Management System

A modern, feature-rich Point of Sale (POS) management system built with Electron, React, TypeScript, and SQLite. This desktop application provides comprehensive tools for retail management, inventory tracking, sales processing, and customer relationship management.

## 🚀 Features

### Core Features
- **Sales Processing**: Complete point-of-sale functionality with receipt generation
- **Inventory Management**: Track stock levels, manage products, and monitor inventory changes
- **Customer Management**: Customer profiles, contact management, and transaction history
- **Loyalty Program**: Integrated loyalty system with points earning and redemption
- **Multi-platform**: Windows, macOS, and Linux support

### Advanced Features
- **Database Synchronization**: Real-time inventory sync with external systems
- **Audit Trail**: Comprehensive logging of all system activities
- **Automated Backups**: Database backup and recovery system
- **Migration Management**: Automated database schema migrations
- **Reporting & Analytics**: Sales reports, charts, and business insights
- **User Management**: Role-based access control and user activity tracking

## 🛠 Technology Stack

### Frontend
- **React 19**: Modern React with latest features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Chart.js**: Interactive charts and graphs
- **React Router**: Client-side routing

### Backend
- **Electron**: Cross-platform desktop framework
- **TypeORM**: TypeScript ORM for database operations
- **SQLite3**: Embedded relational database
- **Node.js**: JavaScript runtime environment

### Key Libraries
- **Bcryptjs**: Password hashing and security
- **Decimal.js**: Precise decimal arithmetic for financial calculations
- **Lucide React**: Modern icon library
- **Reflect Metadata**: Runtime type metadata for TypeORM


## 📸 Screenshots
Here are sample displays of the system

![Screenshot 3](https://github.com/CyberArcenal/POS-Management/blob/main/public/img3.png?raw=true)
![Screenshot 2](https://github.com/CyberArcenal/POS-Management/blob/main/public/img2.png?raw=true)
![Screenshot 1](https://github.com/CyberArcenal/POS-Management/blob/main/public/img1.png?raw=true)


## 📁 Project Structure

```
pos-management/
├── src/
│   ├── main/           # Electron main process
│   │   ├── db/         # Database configuration
│   │   ├── entities/   # TypeORM entities
│   │   ├── ipc/        # IPC handlers
│   │   └── services/   # Business logic services
│   ├── renderer/       # React frontend
│   └── migrations/     # Database migrations
├── build/              # Build assets and icons
├── dist/               # Production build output
├── release/            # Packaged application
└── assets/             # Static assets
```

## 🔧 Installation

### Prerequisites
- Node.js 18+ and npm
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/CyberArcenal/POS-Management.git
   cd POS-Management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Development: No configuration needed
   - Production: Update `package.json` build settings as needed

4. **Run database migrations**
   ```bash
   npm run migration:run
   ```

5. **Seed initial data** (optional)
   ```bash
   npm run seed
   ```

## 🚦 Development

### Available Scripts

- **Development mode**: `npm run dev`
  - Starts Vite dev server + Electron with hot reload

- **Build for production**: `npm run build`
  - Compiles TypeScript + builds React app + packages Electron app

- **Database operations**:
  ```bash
  npm run migration:generate   # Generate new migration
  npm run migration:run       # Run pending migrations
  npm run migration:revert    # Revert last migration
  npm run seed:reset          # Reset and reseed database
  ```

- **Linting**: `npm run lint`
- **Preview production build**: `npm run preview`

### Development Workflow

1. Start development server:
   ```bash
   npm run dev
   ```
   This concurrently runs:
   - Vite development server (port 5173)
   - TypeScript compiler in watch mode
   - Electron application

2. Make changes to:
   - `src/renderer/` for React components
   - `src/main/` for Electron/backend logic
   - `src/entities/` for database models

## 📦 Building for Production

### Create Production Build
```bash
npm run build
```

The build process:
1. Compiles React frontend with Vite
2. Compiles TypeScript main process
3. Packages Electron application using electron-builder
4. Outputs to `release/` directory

### Build Configuration
- **Windows**: NSIS installer with icon support
- **macOS**: DMG with .icns icon
- **Linux**: AppImage with .png icon
- **Auto-update**: GitHub releases integration

## 🗄️ Database Management

### SQLite Database
- **Location**: User data directory (OS-specific)
- **Backups**: Automatic backups before migrations
- **Recovery**: Built-in backup restoration system

### Entities Overview
- **Users & Roles**: Authentication and authorization
- **Products & Inventory**: Stock management with transaction logs
- **Sales & Transactions**: Complete sales records with items
- **Customers**: Profiles, contacts, and loyalty data
- **Audit Trail**: Security and compliance logging
- **System Settings**: Configurable application settings

## 🔌 Inventory Synchronization

The system includes a robust inventory sync module that can:
- Connect to external inventory databases
- Real-time stock level synchronization
- Automatic retry for failed sync operations
- Configurable sync intervals and rules

### Sync Configuration
Edit `src/services/inventory_sync/inventoryConfig.js` to configure:
- Database connection settings
- Sync frequency and rules
- Error handling and retry logic

## 🔒 Security Features

- **Password Hashing**: Bcrypt for secure password storage
- **Audit Logging**: Comprehensive activity tracking
- **Database Encryption**: SQLite encryption options
- **Input Validation**: Protection against injection attacks
- **Secure IPC**: Isolated context for renderer processes

## 📊 Reporting & Analytics

- **Sales Reports**: Daily, weekly, monthly summaries
- **Inventory Reports**: Stock levels, turnover rates
- **Customer Insights**: Purchase history, loyalty points
- **Financial Reports**: Revenue, profit margins, taxes
- **Chart Visualizations**: Interactive graphs using Chart.js

## 🛠️ Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check file permissions in user data directory
   - Verify database file isn't locked by another process
   - Run `npm run rebuild` if SQLite native modules fail

2. **Migration failures**
   - Automatic backup restoration available
   - Manual migration control via IPC handlers
   - Check `src/migrations/` for migration files

3. **Build failures**
   - Ensure all dependencies are installed
   - Check Node.js and npm versions
   - Verify TypeScript compilation errors

### Logs
- Console logs in development mode
- Log files in user data directory for production
- IPC communication logging available

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Copyright © CyberArcenal. All rights reserved.

This software is proprietary. See the repository for license details.

## 📞 Support

For support, feature requests, or bug reports:
- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review troubleshooting section above

---

**Built with ❤️ by CyberArcenal**

*Last Updated: January 2026*