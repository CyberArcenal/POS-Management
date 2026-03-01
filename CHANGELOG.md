
# 📑 Changelog – POSify  
**Version:** v0.0.1-beta  
**Date:** March 1, 2026  

### Changed  
- Renamed app from working title to **POSify** for consistent branding across GitHub and Microsoft Store.
- Change app icon to new icon design.

---

**Version:** v0.0.0-beta  
**Date:** February 22, 2026  

### Added
- Core **sales processing flow**: initiation → payment → receipt printing → cash drawer integration (hardware integration currently untested).  
- **Loyalty system**: earn/redeem points, lifetime points tracking, automatic customer status (Regular, VIP, Elite).  
- **Inventory management**: stock deduction, movement tracking, audit‑safe warehouse notifications.  
- **Communication alerts**: email notifications and SMS alerts for key events.  
- **Database layer**: TypeORM with migrations and seeders.  
- **UI/UX**: cashier workflows, ergonomic layouts, Vite + React + Tailwind renderer.  

### Changed
- TypeScript configuration adjusted to be less strict (`strict: false`) for smoother builds.  
- Build process refined: Vite for renderer, `tsc` for main process, `electron-builder` for packaging.  

### Known Issues
- Hardware integrations (barcode scanner, cash drawer, printer) are **untested** due to lack of physical devices.
- TypeScript strict checks disabled in renderer.