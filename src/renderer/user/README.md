# User Management Module for POS Desktop App

## Overview
A comprehensive user management system for a POS desktop application built with React + TypeScript. Features include user CRUD operations, role management, audit logging, and bulk actions.

## Features
- 🔍 **Search & Filter**: Find users by email, display name, role, and status
- 📋 **User Table**: List all users with sorting and selection capabilities
- 👤 **User Detail Modal**: View/edit user details with form validation
- 🛡️ **Role & Status Management**: Assign roles and activate/deactivate users
- ⚡ **Bulk Actions**: Activate/deactivate/delete multiple users at once
- 📊 **Audit Logging**: Track all user management activities
- 📱 **Responsive Design**: Works on desktop with Electron-style interface

## Tech Stack
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + custom dark theme
- **Validation**: Zod schema validation
- **State Management**: React Context + custom hooks
- **API**: RESTful API integration with existing user service

## Installation

1. **Install dependencies:**
```bash
npm install react react-dom react-router-dom zod
npm install -D typescript @types/react @types/react-dom