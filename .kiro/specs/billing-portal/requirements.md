# Requirements Document

## Introduction

The Billing & Invoice Management Portal is a production-ready web application for **CandyCapture Photography**. It lets studio staff manage customers, photography events, packages/services, invoices, and payments, and it produces professional, downloadable PDF invoices. The portal reuses and extends the existing React 19 + Vite application and its `AppContext` business logic (invoices, customers, services, packages, studio profile, payments, status calculation) while improving the user interface, adding authentication and user management, and organizing the application for clean deployment.

A core principle of the portal is **invoice immutability**: each invoice captures a permanent snapshot of the package price, the included services, the customer details, the amounts, the invoice number, and the invoice date at the moment of creation. Later edits to packages, services, or the studio profile must never alter previously generated invoices.

The portal is built and initially configured on the Kiro development/test machine, but must be modular and configuration-driven so the identical application and data structure can be migrated to a separate production machine without machine-specific code changes.

## Glossary

- **Portal**: The Billing & Invoice Management Portal application described in this document.
- **Admin**: An authenticated user with the Admin role who can access all features including Admin Settings and User Management.
- **Staff_User**: An authenticated user with the Staff/User role who can perform billing operations but cannot access User Management or Admin Password settings.
- **Auth_Service**: The Portal component responsible for authenticating users, managing sessions, and enforcing role-based access.
- **User_Manager**: The Portal component responsible for creating, editing, disabling users, changing/resetting passwords, and assigning roles.
- **Studio_Profile**: The configurable business identity of CandyCapture Photography (logo, studio name, address, phone, email, Instagram, website) shown in the invoice FROM block and used across the Portal.
- **Invoice**: A billing record for one customer event, containing customer details, event details, line items (services), total amount, advance, pending amount, invoice number, and invoice date.
- **Invoice_Snapshot**: The immutable copy of package price, included services, service descriptions, quantities, customer details, advance, pending amount, invoice number, and invoice date stored on an Invoice at the time it is generated. The Invoice_Snapshot is independent of later changes to packages, services, or the Studio_Profile.
- **Invoice_Immutability**: The rule that a generated Invoice's Invoice_Snapshot does not change when packages, services, or the Studio_Profile are subsequently edited.
- **Invoice_Number**: A unique identifier in the format `CCP-YYYY-NNN`, where `YYYY` is the four-digit year and `NNN` is a zero-padded sequence number.
- **Invoice_Counter**: A persistent, monotonically increasing sequence source that produces the `NNN` portion of the Invoice_Number and survives application restarts.
- **Package**: A named, priced bundle of services (for example "PREMIUM PACKAGE 1") that can be selected on the New Invoice page to auto-populate services.
- **Service**: A single deliverable line item (for example "Candid Photography") with a name, description, optional quantity, and optional price.
- **Advance**: The amount a customer has paid toward an Invoice at or after creation.
- **Pending_Amount**: The remaining amount owed on an Invoice, calculated as Total Amount minus total Advance.
- **Payment_Status**: The state of an Invoice's payment, one of `advance` (booked, no payment yet), `partial` (some payment made, not full), or `paid` (fully paid), consistent with the existing `calcStatus` logic.
- **Dashboard**: The landing screen after login showing summary cards and a month filter.
- **Config_Service**: The Portal component that reads deployment configuration (database connection, storage location, application URL, studio configuration, authentication secrets, PDF storage, logo storage) from configuration or environment variables.
- **PDF_Generator**: The Portal component that renders an Invoice into a professional PDF document for download.

## Requirements

### Requirement 1: User Authentication

**User Story:** As a studio owner, I want a secure login page, so that only authorized users can access billing data.

#### Acceptance Criteria

1. WHEN an unauthenticated user requests any Portal route other than the login route, THE Auth_Service SHALL redirect the user to the login page.
2. THE Portal SHALL display the login page with the title "CandyCapture Photography" and the subtitle "Billing Portal".
3. THE login page SHALL provide a username field that accepts 1 to 150 characters and a password field that accepts 8 to 128 characters.
4. WHEN a user submits valid credentials, THE Auth_Service SHALL establish an authenticated session, redirect the user to the Dashboard, and maintain the session until the user logs out or the session remains inactive for 60 minutes.
5. IF a user submits invalid credentials, THEN THE Auth_Service SHALL reject the login attempt, retain the entered username in the username field, clear the password field, and display an authentication error message that does not disclose whether the username or the password was incorrect.
6. IF a user submits invalid credentials 5 consecutive times within a 15-minute window for the same username, THEN THE Auth_Service SHALL reject further login attempts for that username for 15 minutes and display an error message indicating the account is temporarily locked.
7. WHEN an authenticated user selects logout, THE Auth_Service SHALL end the session and redirect the user to the login page.

### Requirement 2: User Management and Roles

**User Story:** As an Admin, I want to manage user accounts and roles, so that I can control who uses the Portal and what they can do.

#### Acceptance Criteria

1. THE Portal SHALL support exactly two roles: Admin and Staff_User.
2. WHERE the authenticated user is an Admin, THE User_Manager SHALL allow creating a new user with a unique username of 1 to 150 characters, an initial password of 8 to 128 characters, and an assigned role of Admin or Staff_User.
3. IF an Admin submits a new-user password or a reset password shorter than 8 characters or longer than 128 characters, THEN THE User_Manager SHALL reject the operation and display an error message indicating the password length requirement.
4. WHERE the authenticated user is an Admin, THE User_Manager SHALL allow changing or resetting the password of any user.
5. WHERE the authenticated user is an Admin, THE User_Manager SHALL allow editing a user's role and disabling a user account.
6. IF a disabled user attempts to log in with otherwise valid credentials, THEN THE Auth_Service SHALL reject the login attempt and display an authentication error message that does not disclose that the account is disabled.
7. IF a Staff_User requests the User Management or Admin Password sections, THEN THE Auth_Service SHALL deny access by not rendering the requested section and redirecting the user to the Dashboard with an access-denied indication.
8. THE Portal SHALL seed exactly one enabled Admin account from the configured initial administrator credentials when no user accounts exist, so the first login is possible on a new deployment.

### Requirement 3: Navigation and Application Structure

**User Story:** As a user, I want a clear left sidebar, so that I can navigate the Portal quickly.

#### Acceptance Criteria

1. THE Portal SHALL display a left sidebar with navigation entries for Dashboard, New Invoice, Customer Info, Invoices, Services, and Settings.
2. WHEN a user selects a sidebar entry, THE Portal SHALL navigate to the corresponding section.
3. THE Portal SHALL indicate the currently active section in the sidebar.
4. THE Settings section SHALL contain the sub-sections Profile, Admin Password, and User Management.

### Requirement 4: Studio Profile Configuration

**User Story:** As an Admin, I want to configure the studio profile, so that invoices show correct and current business information.

#### Acceptance Criteria

1. WHERE the authenticated user is an Admin, THE Portal SHALL allow editing the Studio_Profile fields: logo, studio name, address, phone, email, Instagram, and website in Settings > Profile.
2. THE Portal SHALL initialize the Studio_Profile with studio name "CandyCapture Photography", address "189/10, Bathrakaliamman Temple Opposite, Sivakasi - 626123", phone "7373605380", email "helloCandycapturephotography@gmail.com", Instagram "@CandyCapture_", and website "https://CandyCapturePhotography.in".
3. THE Portal SHALL display an icon adjacent to each of the phone, email, Instagram, and website values in the invoice FROM block.
4. WHERE the Studio_Profile logo is configured, THE Portal SHALL allow the Admin to set the displayed logo size.
5. WHEN an Admin saves changes to the Studio_Profile, THE Portal SHALL apply the updated Studio_Profile to invoices generated after the change and SHALL leave existing invoices unchanged.

### Requirement 5: Dashboard Reporting

**User Story:** As a user, I want a dashboard with key metrics, so that I can see the state of the business at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL display cards for Total Customers, Total Income, Pending Amount, Upcoming Events, and Monthly Total Events.
2. WHEN underlying invoice, payment, or customer data changes, THE Dashboard SHALL display values derived from the latest stored data.
3. THE Dashboard SHALL provide a month filter that allows selecting a specific month and year.
4. WHEN a user selects a month in the month filter, THE Dashboard SHALL display events, income, pending amount, and customer counts scoped to the selected month.
5. THE Dashboard SHALL calculate Total Income as the sum of paid amounts across invoices and SHALL calculate Pending Amount as the sum of Pending_Amount across invoices.

### Requirement 6: New Invoice Creation Form

**User Story:** As a user, I want to enter customer and event details and select a package, so that I can create an invoice quickly.

#### Acceptance Criteria

1. THE New Invoice page SHALL provide fields for Customer Name, Mobile Number, Gmail, Event Date, and a Service/Package selector.
2. THE New Invoice page SHALL mark Customer Name, Mobile Number, and Event Date as required fields.
3. THE New Invoice page SHALL mark the Gmail field as optional.
4. WHEN a user selects a Package, THE Portal SHALL populate the line-item list below the selector with all services included in the selected Package.
5. WHEN a user selects a Package, THE Portal SHALL populate the Total Amount with the selected Package price.

### Requirement 7: Package Customization on an Invoice

**User Story:** As a user, I want to customize a selected package on the invoice, so that I can tailor the deliverables to the customer.

#### Acceptance Criteria

1. WHEN a Package is selected on the New Invoice page, THE Portal SHALL allow adding a service to the invoice line items.
2. WHEN a Package is selected on the New Invoice page, THE Portal SHALL allow removing a service from the invoice line items.
3. THE Portal SHALL allow editing the description of any invoice line item.
4. THE Portal SHALL allow changing the quantity of any invoice line item.
5. THE Portal SHALL allow adding a custom service line item with a name and an additional price.
6. WHEN any line item is added, removed, or changed, THE Portal SHALL recalculate the invoice Total Amount from the current line items.

### Requirement 8: Invoice Amount Calculation

**User Story:** As a user, I want amounts calculated automatically, so that I avoid manual arithmetic errors.

#### Acceptance Criteria

1. THE Portal SHALL display Total Amount, Advance, and Pending_Amount on the New Invoice page.
2. WHEN the Total Amount or the Advance changes, THE Portal SHALL calculate Pending_Amount as Total Amount minus Advance.
3. THE Portal SHALL calculate Pending_Amount automatically without requiring manual entry of the Pending_Amount value.

### Requirement 9: Generate Invoice and PDF

**User Story:** As a user, I want to generate an invoice and receive a PDF, so that I can share it with the customer immediately.

#### Acceptance Criteria

1. WHEN a user selects Generate Invoice, THE Portal SHALL validate that Customer Name is non-empty, that Mobile Number consists of 10 to 15 digits, that Event Date is a valid calendar date, and that Gmail, when provided, matches a standard email address format (local-part, "@", and domain).
2. IF one or more validation checks fail when a user selects Generate Invoice, THEN THE Portal SHALL display a specific validation error identifying each failing field and SHALL NOT generate the Invoice, SHALL NOT assign an Invoice_Number, and SHALL retain the entered form values.
3. WHEN validation passes, THE Portal SHALL assign a unique Invoice_Number in the format `CCP-YYYY-NNN`.
4. WHEN validation passes, THE Portal SHALL save the Invoice with the customer details, event details, line-item services, Total Amount, Advance, and calculated Pending_Amount as an Invoice_Snapshot.
5. WHEN the Invoice is saved, THE PDF_Generator SHALL generate a professional PDF of the Invoice and THE Portal SHALL automatically download the PDF.
6. IF the PDF_Generator fails to generate the PDF after the Invoice is saved, THEN THE Portal SHALL display an error message indicating that PDF generation failed, SHALL keep the saved Invoice available in the Invoices section, and SHALL provide a means to retry the PDF download.
7. WHEN the Invoice is saved, THE Portal SHALL make the Invoice available in the Invoices section.

### Requirement 10: Professional Invoice Header

**User Story:** As a studio owner, I want a professional invoice header, so that invoices reflect the CandyCapture brand.

#### Acceptance Criteria

1. THE Portal SHALL display the configurable CandyCapture logo in the top-left region of the invoice header.
2. THE Portal SHALL display the invoice generation Date, Time, Location, and Invoice_Number in the right region of the invoice header.
3. THE Portal SHALL populate the invoice header Date and Time from the moment the Invoice is generated.
4. THE Portal SHALL render the Invoice_Number in the header in the format `CCP-YYYY-NNN`.

### Requirement 11: Invoice Number Generation

**User Story:** As a studio owner, I want sequential persistent invoice numbers, so that every invoice is uniquely and consistently identified.

#### Acceptance Criteria

1. THE Portal SHALL generate each Invoice_Number in the format `CCP-YYYY-NNN`, where `YYYY` is the four-digit generation year and `NNN` is the Invoice_Counter value zero-padded to a minimum of three digits, extending beyond three digits when the counter value exceeds 999.
2. WHEN a new Invoice is generated, THE Invoice_Counter SHALL produce the next sequential value that is exactly one greater than the previously issued value.
3. THE Invoice_Counter SHALL persist its value across application restarts so that Invoice_Numbers do not reset to a lower value.
4. WHEN two or more Invoices are generated concurrently, THE Portal SHALL assign each Invoice a distinct Invoice_Number such that no Invoice_Number is issued more than once across all Invoices.
5. THE Portal SHALL ensure that every generated Invoice_Number is unique across all Invoices.

### Requirement 12: Customer Management

**User Story:** As a user, I want customers created automatically from invoices, so that I do not maintain duplicate records.

#### Acceptance Criteria

1. WHEN an Invoice is generated, THE Portal SHALL add the customer to Customer Info if no matching customer exists.
2. WHEN an Invoice is generated for a customer that already exists, THE Portal SHALL associate the new Invoice with the existing customer record rather than creating a duplicate.
3. THE Portal SHALL match an existing customer by mobile number or by name for the purpose of avoiding duplicates.
4. THE Portal SHALL store for each customer the name, mobile number, email, associated events, invoice history, total billed amount, total paid amount, and total pending amount.

### Requirement 13: Customer Search

**User Story:** As a user, I want to search customers by name or mobile, so that I can find records quickly.

#### Acceptance Criteria

1. THE Customer Info section SHALL provide a search field.
2. WHEN a user enters a search term, THE Portal SHALL display customers whose name or mobile number matches the search term.
3. WHEN a user clears the search term, THE Portal SHALL display all customers.

### Requirement 14: Customer Profile and History

**User Story:** As a user, I want to view a customer's full history, so that I can support repeat customers.

#### Acceptance Criteria

1. THE customer profile SHALL display the customer name, mobile number, and email.
2. THE customer profile SHALL display an event history table with columns for Event Date, Event, Package, Amount, Advance, and Pending.
3. THE customer profile SHALL display an invoice history with actions to View Invoice, Download PDF, View Event, and View Payment Details for each Invoice.
4. THE Portal SHALL retain a customer's event and invoice history across multiple events.

### Requirement 15: Invoices Listing and Filtering

**User Story:** As a user, I want a searchable invoice list, so that I can locate and review invoices.

#### Acceptance Criteria

1. THE Invoices section SHALL display each Invoice with Invoice_Number, Customer Name, Mobile Number, Event Date, Package, Total Amount, Advance, Pending_Amount, Invoice Date, and Payment_Status.
2. THE Invoices section SHALL provide search and filter controls for Invoice_Number, customer name, mobile number, invoice date, event date, and Payment_Status.
3. WHEN a user applies a search or filter, THE Portal SHALL display only the Invoices matching the applied criteria.
4. WHEN a user selects an Invoice, THE Portal SHALL display the Invoice detail with options to view and download the PDF.

### Requirement 16: Services and Package Management

**User Story:** As an Admin, I want to manage packages and services, so that offerings stay current without affecting past invoices.

#### Acceptance Criteria

1. THE Services section SHALL allow creating, editing, deleting, and deactivating a Package.
2. THE Services section SHALL allow changing a Package price, adding a Service to a Package, removing a Service from a Package, editing a Service description, and reordering the Services within a Package.
3. WHILE a Package is deactivated, THE Portal SHALL exclude the Package from the New Invoice Package selector.
4. WHEN a Package or Service is edited after an Invoice has been generated, THE Portal SHALL preserve the Invoice_Snapshot of every existing Invoice unchanged (Invoice_Immutability).

### Requirement 17: Seed Initial Packages

**User Story:** As a studio owner, I want the standard packages preloaded, so that staff can start billing immediately.

#### Acceptance Criteria

1. THE Portal SHALL seed the Package "PREMIUM PACKAGE 1" priced at 75000 with the services: Traditional Photography; Traditional Videography; Candid Photography; Pre Wedding Photo; 200 Photos & 50 Sheet Premium Album; Documentary Highlight Video; Wedding Full Function Video; Complimentary 2 Photo Frames; Photo Table Frame and Calendar.
2. THE Portal SHALL seed the Package "PREMIUM PACKAGE 2" priced at 45000 with the services: Traditional Photography; Traditional Videography; Pre Wedding Photo; 100 Photos & 35 Sheet Premium Album; Documentary Highlight Video; Wedding Full Function Video; Complimentary 2 Photo Frames; Photo Table Frame and Calendar.
3. THE Portal SHALL seed the Package "PREMIUM PACKAGE 5" priced at 210000 with the services: One Traditional Photo; One Traditional Video; One Candid Photo; Two Candid Video; One Drone; Pre or Post Wedding; Two Album + One Candid Album; Pen Drive + Harddisk; Four Photo Frames; Two Candid Video + Two Teaser; One E-Invite; Two Traditional Film.
4. THE Portal SHALL seed the Package "PREMIUM PACKAGE 4" priced at 250000 with the services: One Traditional Photo; One Traditional Video; Two Candid Photo; Two Candid Video; One Drone; Pre or Post Wedding; Two Album + One Candid Album; Pen Drive + Harddisk; Four Photo Frames; Two Candid Video + Two Teaser; One E-Invite; Two Traditional Film.
5. THE Portal SHALL store seeded Packages as editable data so an Admin can modify them later.

### Requirement 18: Payment Status Tracking

**User Story:** As a user, I want each invoice to show its payment status, so that I can track outstanding balances.

#### Acceptance Criteria

1. THE Portal SHALL assign an Invoice the Payment_Status `advance` when the total Advance is zero.
2. THE Portal SHALL assign an Invoice the Payment_Status `paid` when the total Advance is greater than or equal to the Total Amount.
3. WHILE the total Advance is greater than zero and less than the Total Amount, THE Portal SHALL assign the Invoice the Payment_Status `partial`.
4. WHEN an additional payment is recorded against an Invoice, THE Portal SHALL update the total Advance, the Pending_Amount, and the Payment_Status.

### Requirement 19: Configuration and Environment-Driven Deployment

**User Story:** As a deployer, I want configuration driven by environment variables, so that the same application migrates from test to production without code changes.

#### Acceptance Criteria

1. THE Config_Service SHALL read the database connection, storage location, application URL, studio configuration, authentication secrets, PDF storage location, and logo storage location from configuration or environment variables.
2. THE Portal SHALL NOT embed machine-specific paths, IP addresses, database locations, or environment-specific settings in application source code.
3. WHERE a configuration value is provided through an environment variable, THE Config_Service SHALL use the provided value in place of the default.
4. WHEN the Portal is deployed to a different machine with all required configuration values present and non-empty, THE Portal SHALL operate using the same application code and data structure without source code changes.
5. IF one or more required configuration values are missing or empty at startup, THEN THE Config_Service SHALL halt startup and report each missing required configuration value by name, and THE Portal SHALL NOT start in a partially configured state.

### Requirement 20: Invoice Immutability

**User Story:** As a studio owner, I want invoices to be permanent records, so that historical billing remains accurate.

#### Acceptance Criteria

1. WHEN an Invoice is generated, THE Portal SHALL store the Package price at creation, the Services at creation, the customer details, the Advance, the Pending_Amount, the Invoice_Number, and the Invoice Date as the Invoice_Snapshot.
2. WHEN a Package or Service is edited after an Invoice is generated, THE Portal SHALL leave that Invoice's Invoice_Snapshot unchanged.
3. WHEN a Package or Service is deleted or deactivated after an Invoice is generated, THE Portal SHALL leave that Invoice's Invoice_Snapshot unchanged and SHALL keep the Invoice viewable and downloadable.
4. WHEN the Studio_Profile is edited after an Invoice is generated, THE Portal SHALL leave that Invoice's Invoice_Snapshot unchanged.

### Requirement 21: End-to-End Billing Workflow

**User Story:** As a user, I want a smooth billing flow from login to updated dashboard, so that a booking is captured in one pass.

#### Acceptance Criteria

1. WHEN a user completes login, THE Portal SHALL present the Dashboard as the entry screen.
2. WHEN a user generates an Invoice from the New Invoice page, THE Portal SHALL save the customer, save the event, save the Invoice, and update the customer history in a single operation.
3. WHEN an Invoice is generated, THE PDF_Generator SHALL produce and download the PDF as part of the same operation.
4. WHEN an Invoice is generated, THE Dashboard SHALL reflect the updated totals derived from the latest stored data on next display.

### Requirement 22: Responsive User Interface

**User Story:** As a user, I want the Portal to work on any device, so that I can bill from desktop, laptop, tablet, or mobile.

#### Acceptance Criteria

1. THE Portal SHALL render a usable layout on desktop, laptop, tablet, and mobile viewport widths.
2. WHILE the viewport width is at a mobile size, THE Portal SHALL present the navigation and forms in a layout adapted to the reduced width.
3. THE Portal SHALL keep all interactive controls reachable and operable across the supported viewport widths.

### Requirement 23: Professional Production-Ready Presentation

**User Story:** As a studio owner, I want a clean, professional portal, so that it is ready for real business use.

#### Acceptance Criteria

1. THE Portal SHALL present a consistent, professional visual style across all sections.
2. THE Portal SHALL organize features under the defined navigation structure so related functions are grouped together.
3. THE Portal SHALL operate on the Kiro development/test machine using its initial configuration.
