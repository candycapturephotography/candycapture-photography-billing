# Implementation Plan: Billing & Invoice Management Portal

## Overview

This implementation plan extends the existing CandyCapture Photography React application into a production-ready Billing & Invoice Management Portal. The plan follows an incremental approach, building foundational infrastructure first, then authentication, then enhanced business logic, and finally UI improvements.

The implementation uses JavaScript (React 19 + Vite) to match the existing codebase.

## Tasks

- [x] 1. Set up foundational infrastructure and configuration
  - [x] 1.1 Create ConfigContext with environment-driven configuration
    - Create `src/context/ConfigContext.jsx` with AppConfig interface
    - Implement config loading from environment variables (VITE_* prefix for Vite)
    - Add config validation with startup halt on missing required values
    - Export `useConfig` hook
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [x] 1.2 Create storage adapter utility
    - Create `src/utils/storage.js` with load/save helpers
    - Abstract localStorage operations for future IndexedDB migration
    - Add error handling for storage failures
    - _Requirements: 19.1_

  - [x] 1.3 Create form validation utility
    - Create `src/utils/validators.js` with validation functions
    - Implement: validateCustomerName (non-empty), validateMobile (10-15 digits), validateEmail (standard format), validateDate (valid calendar date), validatePassword (8-128 chars), validateUsername (1-150 chars)
    - _Requirements: 9.1, 2.3, 1.3_

  - [x]* 1.4 Write property tests for form validation
    - **Property 9: Form Field Validation**
    - **Validates: Requirements 9.1**

- [x] 2. Implement authentication system
  - [x] 2.1 Create AuthContext with user management
    - Create `src/context/AuthContext.jsx`
    - Implement User data model with id, username, passwordHash, role, enabled, createdAt, lastLogin
    - Implement login/logout functions
    - Implement session management with 60-minute timeout
    - Implement login attempt tracking and account lockout (5 attempts in 15 minutes)
    - Seed initial admin account from config when no users exist
    - Export `useAuth` hook
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 1.7, 2.1, 2.6, 2.8_

  - [x]* 2.2 Write property tests for session timeout
    - **Property 3: Session Timeout Validity**
    - **Validates: Requirements 1.4**

  - [x]* 2.3 Write property tests for username/password validation
    - **Property 2: Username and Password Field Length Validation**
    - **Validates: Requirements 1.3, 2.3**

  - [x] 2.4 Implement user management functions in AuthContext
    - Implement createUser, updateUser, disableUser functions
    - Implement updatePassword, resetPassword functions
    - Implement getUsers, getLoginAttempts functions
    - Enforce username uniqueness (case-insensitive)
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x]* 2.5 Write property tests for username uniqueness
    - **Property 4: Username Uniqueness Enforcement**
    - **Validates: Requirements 2.2**

  - [x] 2.6 Create LoginForm component
    - Create `src/components/Auth/LoginForm.jsx`
    - Display "CandyCapture Photography" title and "Billing Portal" subtitle
    - Implement username/password fields with validation
    - Show error messages without disclosing which field failed
    - Retain username on failed login, clear password
    - Show lockout message with remaining time
    - _Requirements: 1.2, 1.3, 1.5, 1.6_

  - [x] 2.7 Create Login page
    - Create `src/pages/Login.jsx`
    - Integrate LoginForm component
    - Handle successful login redirect to Dashboard
    - _Requirements: 1.4_

  - [x] 2.8 Create ProtectedRoute component
    - Create `src/components/Auth/ProtectedRoute.jsx`
    - Check authentication status
    - Redirect unauthenticated users to login
    - Handle session expiry with message
    - _Requirements: 1.1, 1.4_

  - [x]* 2.9 Write property tests for route protection
    - **Property 1: Authentication Route Protection**
    - **Validates: Requirements 1.1**

  - [x] 2.10 Create AdminRoute component
    - Create `src/components/Auth/AdminRoute.jsx`
    - Check admin role
    - Redirect non-admin users to Dashboard with access-denied indication
    - _Requirements: 2.7_

- [x] 3. Checkpoint - Authentication system complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Enhance AppContext with invoice snapshots and counter
  - [x] 4.1 Create invoice number generator utility
    - Create `src/utils/invoiceNumberGenerator.js`
    - Implement persistent counter with localStorage
    - Generate format CCP-YYYY-NNN with year rollover
    - Ensure atomic increment to prevent duplicates
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x]* 4.2 Write property tests for invoice number generation
    - **Property 10: Invoice Number Format and Sequential Increment**
    - **Validates: Requirements 11.1, 11.2, 11.4, 11.5**

  - [x] 4.3 Extend Package model with services array
    - Update Package data structure in AppContext to include services array
    - Each PackageService has: id, serviceId (optional), name, description, quantity, sortOrder
    - Add reorderPackageServices function
    - _Requirements: 16.2_

  - [x] 4.4 Implement seeded packages with services
    - Add SEEDED_PACKAGES data with all services from design
    - PREMIUM PACKAGE 1 (75000), PREMIUM PACKAGE 2 (45000), PREMIUM PACKAGE 5 (210000), PREMIUM PACKAGE 4 (250000)
    - Load seeded packages on first run only
    - Store as editable data
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 4.5 Implement invoice snapshot creation
    - Create InvoiceSnapshot structure with packageId, packageName, packagePrice, lineItems, studioProfile
    - Capture complete state at invoice creation time
    - Store snapshot as immutable data within invoice
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

  - [x]* 4.6 Write property tests for invoice snapshot immutability
    - **Property 14: Invoice Snapshot Immutability**
    - **Validates: Requirements 16.4, 20.1, 20.2, 20.3, 20.4**

  - [x] 4.7 Enhance addInvoice function with snapshots
    - Generate invoice number using persistent counter
    - Create complete invoice snapshot
    - Include studio profile snapshot
    - _Requirements: 9.3, 9.4, 20.1_

  - [x] 4.8 Implement payment status calculation
    - Verify calcStatus function matches requirements
    - Status: 'advance' (paid=0), 'partial' (0<paid<total), 'paid' (paid>=total)
    - Update status on payment changes
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [x]* 4.9 Write property tests for payment status
    - **Property 15: Payment Status Calculation**
    - **Validates: Requirements 18.1, 18.2, 18.3, 18.4**

  - [x] 4.10 Implement pending amount calculation
    - Ensure Pending_Amount = Total Amount - Advance
    - Calculate automatically without manual entry
    - _Requirements: 8.2, 8.3_

  - [x]* 4.11 Write property tests for pending amount
    - **Property 8: Pending Amount Calculation**
    - **Validates: Requirements 8.2, 8.3**

- [x] 5. Checkpoint - Enhanced AppContext complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement customer management enhancements
  - [x] 6.1 Enhance customer matching logic
    - Match by mobile number first
    - Match by name (case-insensitive) if no mobile match
    - Create new customer if no match
    - _Requirements: 12.1, 12.2, 12.3_

  - [x]* 6.2 Write property tests for customer matching
    - **Property 11: Customer Matching by Mobile or Name**
    - **Validates: Requirements 12.2, 12.3**

  - [x] 6.3 Enhance customer data model
    - Store: name, mobile, email, invoiceIds, createdAt
    - Compute: totalBilled, totalPaid, totalPending on access
    - _Requirements: 12.4_

  - [x] 6.4 Implement customer search filtering
    - Filter by name (case-insensitive substring)
    - Filter by mobile number (substring)
    - Show all when search cleared
    - _Requirements: 13.1, 13.2, 13.3_

  - [ ]* 6.5 Write property tests for customer search
    - **Property 12: Customer Search Filtering**
    - **Validates: Requirements 13.2, 13.3**

- [x] 7. Implement dashboard enhancements
  - [x] 7.1 Add month filter to Dashboard
    - Create month/year selector component
    - Filter invoices by event date
    - Calculate scoped metrics
    - _Requirements: 5.3, 5.4_

  - [ ]* 7.2 Write property tests for month filter
    - **Property 5: Dashboard Month Filter Scoping**
    - **Validates: Requirements 5.3, 5.4**

  - [x] 7.3 Enhance dashboard stats calculation
    - Total Income = sum of paidAmount
    - Pending Amount = sum of (totalAmount - paidAmount)
    - Total Customers, Upcoming Events, Monthly Total Events
    - _Requirements: 5.1, 5.2, 5.5_

  - [ ]* 7.4 Write property tests for dashboard totals
    - **Property 6: Dashboard Totals Calculation**
    - **Validates: Requirements 5.5**

- [x] 8. Checkpoint - Business logic complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement new invoice creation enhancements
  - [x] 9.1 Create PackageSelector component
    - Create `src/components/Invoice/PackageSelector.jsx`
    - Display active packages with name and price
    - Show package services preview on selection
    - Exclude deactivated packages
    - _Requirements: 6.1, 6.4, 6.5, 16.3_

  - [x] 9.2 Create LineItemEditor component
    - Create `src/components/Invoice/LineItemEditor.jsx`
    - Display line items from selected package
    - Allow add/remove services
    - Allow edit description and quantity
    - Allow add custom service with price
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 9.3 Implement line item total recalculation
    - Recalculate total on any line item change
    - Total = package base price + custom item prices
    - _Requirements: 7.6_

  - [ ]* 9.4 Write property tests for line item totals
    - **Property 7: Line Item Total Recalculation**
    - **Validates: Requirements 7.6**

  - [x] 9.5 Enhance NewInvoice page (rename from InvoiceCreate)
    - Rename `src/pages/InvoiceCreate.jsx` to `src/pages/NewInvoice.jsx`
    - Integrate PackageSelector and LineItemEditor
    - Add form fields: Customer Name, Mobile, Gmail, Event Date
    - Display Total Amount, Advance, Pending Amount
    - _Requirements: 6.1, 6.2, 6.3, 8.1_

  - [x] 9.6 Implement invoice generation with validation
    - Validate all required fields on Generate Invoice
    - Show specific validation errors for each failing field
    - Do not generate invoice or assign number if validation fails
    - Retain form values on validation failure
    - _Requirements: 9.1, 9.2_

  - [x] 9.7 Implement complete invoice save workflow
    - Assign invoice number
    - Create invoice snapshot
    - Save invoice
    - Auto-create/update customer
    - Update customer history
    - _Requirements: 9.3, 9.4, 9.7, 21.2_

- [x] 10. Enhance PDF generator
  - [x] 10.1 Update PDF generator with snapshot data
    - Update `src/utils/pdfGenerator.jsx`
    - Use snapshot data instead of current package/service data
    - Include studio profile from snapshot
    - _Requirements: 20.1, 20.4_

  - [x] 10.2 Implement professional invoice header
    - Display logo in top-left region
    - Display Date, Time, Location, Invoice Number in right region
    - Format invoice number as CCP-YYYY-NNN
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 10.3 Add studio profile icons in FROM block
    - Display icons adjacent to phone, email, Instagram, website
    - Use studio profile snapshot data
    - _Requirements: 4.3_

  - [x] 10.4 Implement PDF download with error handling
    - Auto-download PDF on invoice generation
    - Show error message if PDF generation fails
    - Keep saved invoice available
    - Provide retry download option
    - _Requirements: 9.5, 9.6_

- [x] 11. Checkpoint - Invoice creation flow complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement invoices list enhancements
  - [x] 12.1 Enhance Invoices page with filters
    - Add search/filter for: Invoice Number, Customer Name, Mobile, Invoice Date, Event Date, Payment Status
    - Display all invoice fields in list
    - _Requirements: 15.1, 15.2_

  - [x] 12.2 Implement invoice filtering logic
    - Filter by all applied criteria (AND logic)
    - Show only matching invoices
    - _Requirements: 15.3_

  - [ ]* 12.3 Write property tests for invoice filtering
    - **Property 13: Invoice List Filtering**
    - **Validates: Requirements 15.2, 15.3**

  - [x] 12.4 Enhance InvoiceView page
    - Display invoice detail with all snapshot data
    - Add View PDF and Download PDF options
    - _Requirements: 15.4_

- [x] 13. Implement customer info enhancements
  - [x] 13.1 Enhance Customers page
    - Add search field
    - Display customer list with search results
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 13.2 Enhance CustomerDetail page
    - Display customer profile: name, mobile, email
    - Display event history table: Event Date, Event, Package, Amount, Advance, Pending
    - Display invoice history with View Invoice, Download PDF, View Event, View Payment Details actions
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 14. Implement services and package management
  - [x] 14.1 Enhance Services page with package management
    - Create, edit, delete, deactivate packages
    - Change package price
    - Add/remove services from package
    - Edit service descriptions
    - Reorder services within package
    - _Requirements: 16.1, 16.2_

  - [x] 14.2 Implement package deactivation
    - Mark package as inactive
    - Exclude inactive packages from New Invoice selector
    - _Requirements: 16.3_

- [x] 15. Implement settings and user management
  - [x] 15.1 Create Settings sub-sections structure
    - Update `src/pages/Settings.jsx` with tabs/sections
    - Profile, Admin Password, User Management sections
    - _Requirements: 3.4_

  - [x] 15.2 Implement Profile settings
    - Edit: logo, studio name, address, phone, email, Instagram, website
    - Allow logo size configuration
    - Initialize with default studio profile values
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [x] 15.3 Implement Admin Password settings
    - Allow admin to change own password
    - Validate password requirements (8-128 chars)
    - Admin only access
    - _Requirements: 2.4_

  - [x] 15.4 Create UserManagement component
    - Create `src/components/Settings/UserManagement.jsx`
    - List all users
    - Create new users with username, password, role
    - Edit user roles
    - Disable user accounts
    - Reset user passwords
    - Admin only access
    - _Requirements: 2.2, 2.4, 2.5_

- [x] 16. Checkpoint - All features implemented
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Implement navigation and layout
  - [x] 17.1 Enhance Sidebar with Settings sub-menu
    - Update sidebar navigation
    - Add entries: Dashboard, New Invoice, Customer Info, Invoices, Services, Settings
    - Indicate active section
    - Settings expands to show Profile, Admin Password (admin only), User Management (admin only)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 17.2 Create Header component
    - Create `src/components/Layout/Header.jsx`
    - Display user menu with logout option
    - Show current user info
    - _Requirements: 1.7_

  - [x] 17.3 Create MobileSidebar component
    - Create `src/components/Layout/MobileSidebar.jsx`
    - Hamburger menu for mobile
    - Drawer-style navigation
    - _Requirements: 22.2_

- [x] 18. Implement responsive design
  - [x] 18.1 Create useResponsive hook
    - Create `src/hooks/useResponsive.js`
    - Detect viewport: mobile (<480), tablet (480-768), laptop (768-1024), desktop (>1024)
    - _Requirements: 22.1_

  - [x] 18.2 Update layout for responsive breakpoints
    - Mobile: sidebar becomes drawer
    - Tablet: sidebar collapses to icons
    - Desktop: full sidebar visible
    - _Requirements: 22.1, 22.2, 22.3_

  - [x] 18.3 Update forms for responsive layout
    - Adapt form layouts for reduced width
    - Keep controls reachable and operable
    - _Requirements: 22.3_

- [x] 19. Update App.jsx with routing and providers
  - [x] 19.1 Update provider hierarchy
    - Wrap app with ConfigProvider > AuthProvider > AppProvider
    - _Requirements: Design specification_

  - [x] 19.2 Update routing with protection
    - Add Login route (public)
    - Wrap all other routes with ProtectedRoute
    - Wrap admin routes with AdminRoute
    - Update route paths for renamed pages
    - _Requirements: 1.1, 2.7_

  - [x] 19.3 Ensure Dashboard is entry screen after login
    - Redirect to Dashboard after successful login
    - _Requirements: 21.1_

- [x] 20. Final integration and polish
  - [x] 20.1 Migrate existing data compatibility
    - Check for old package format (no services array)
    - Migrate to new format with empty services array
    - Preserve existing invoices
    - _Requirements: Design specification_

  - [x] 20.2 Apply consistent visual styling
    - Review all pages for consistent style
    - Ensure professional presentation
    - _Requirements: 23.1, 23.2_

  - [x] 20.3 Verify end-to-end billing workflow
    - Test complete flow: login → new invoice → PDF → dashboard update
    - Ensure single operation saves customer, event, invoice
    - _Requirements: 21.1, 21.2, 21.3, 21.4_

- [x] 21. Final checkpoint - All tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based test sub-tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses JavaScript (JSX) to match the existing codebase
- All new contexts follow the existing pattern in AppContext.jsx
- Storage keys follow the existing `ccp_` prefix convention

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["2.5", "2.6"] },
    { "id": 4, "tasks": ["2.7", "2.8"] },
    { "id": 5, "tasks": ["2.9", "2.10"] },
    { "id": 6, "tasks": ["4.1"] },
    { "id": 7, "tasks": ["4.2", "4.3"] },
    { "id": 8, "tasks": ["4.4", "4.5"] },
    { "id": 9, "tasks": ["4.6", "4.7"] },
    { "id": 10, "tasks": ["4.8"] },
    { "id": 11, "tasks": ["4.9", "4.10"] },
    { "id": 12, "tasks": ["4.11", "6.1"] },
    { "id": 13, "tasks": ["6.2", "6.3"] },
    { "id": 14, "tasks": ["6.4"] },
    { "id": 15, "tasks": ["6.5", "7.1"] },
    { "id": 16, "tasks": ["7.2", "7.3"] },
    { "id": 17, "tasks": ["7.4", "9.1"] },
    { "id": 18, "tasks": ["9.2"] },
    { "id": 19, "tasks": ["9.3"] },
    { "id": 20, "tasks": ["9.4", "9.5"] },
    { "id": 21, "tasks": ["9.6"] },
    { "id": 22, "tasks": ["9.7", "10.1"] },
    { "id": 23, "tasks": ["10.2", "10.3"] },
    { "id": 24, "tasks": ["10.4", "12.1"] },
    { "id": 25, "tasks": ["12.2"] },
    { "id": 26, "tasks": ["12.3", "12.4"] },
    { "id": 27, "tasks": ["13.1"] },
    { "id": 28, "tasks": ["13.2", "14.1"] },
    { "id": 29, "tasks": ["14.2", "15.1"] },
    { "id": 30, "tasks": ["15.2", "15.3"] },
    { "id": 31, "tasks": ["15.4", "17.1"] },
    { "id": 32, "tasks": ["17.2", "17.3"] },
    { "id": 33, "tasks": ["18.1"] },
    { "id": 34, "tasks": ["18.2", "18.3"] },
    { "id": 35, "tasks": ["19.1"] },
    { "id": 36, "tasks": ["19.2"] },
    { "id": 37, "tasks": ["19.3", "20.1"] },
    { "id": 38, "tasks": ["20.2"] },
    { "id": 39, "tasks": ["20.3"] }
  ]
}
```
