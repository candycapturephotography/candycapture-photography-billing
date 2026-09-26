# Candy Capture Photography - Complete Project Documentation

## Project Overview

**Project Name:** Candy Capture Photography Billing Portal
**Live URL:** https://billing.candycapturephotography.in
**GitHub:** https://github.com/candycapturephotography/candycapture-photography-billing
**Local Path:** D:\kiro\candycapture-photography-billing

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Styling | Inline CSS (Pink theme) |
| Database | Supabase (PostgreSQL) |
| Hosting | Cloudflare Pages |
| WhatsApp API | Cloudflare Worker + Meta Business API |
| PDF Generation | jsPDF |

---

## Project Structure


\\\
D:\kiro\candycapture-photography-billing\
├── public\
│   ├── favicon.svg
│   ├── icons.svg
│   └── logo.png
├── src\
│   ├── components\
│   │   ├── Auth\LoginForm.jsx
│   │   └── Layout\Sidebar.jsx, MobileSidebar.jsx
│   ├── context\AppContext.jsx
│   ├── lib\
│   │   ├── supabase.js
│   │   └── whatsapp.js
│   ├── pages\
│   │   ├── Dashboard.jsx
│   │   ├── Customers.jsx
│   │   ├── CustomerDetail.jsx
│   │   ├── Invoices.jsx
│   │   ├── InvoiceCreate.jsx
│   │   ├── InvoiceView.jsx
│   │   ├── Payments.jsx
│   │   ├── Services.jsx
│   │   └── Settings.jsx
│   ├── utils\
│   │   ├── pdfGenerator.jsx
│   │   └── snapshotUtils.js
│   ├── App.jsx
│   └── main.jsx
├── cloudflare-worker\
│   ├── src\index.js
│   ├── package.json
│   └── wrangler.toml
├── .env
├── package.json
└── vite.config.js
\\\

---

## Supabase Database

### Connection Details
- **URL:** https://cyvvjbqymewaamuglrqo.supabase.co
- **Anon Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5dnZqYnF5bWV3YWFtdWdscnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMjM4MjIsImV4cCI6MjEwNDg5OTgyMn0.MCjlFLw1kMUQOuMkZzeIo22Cjd4-LidsNYxkWT6hDxk

### Database Tables

#### invoices
| Column | Type |
|--------|------|
| id | TEXT PRIMARY KEY |
| invoice_number | TEXT |
| customer_name | TEXT |
| customer_mobile | TEXT |
| customer_email | TEXT |
| event_date | DATE |
| event_type | TEXT |
| venue | TEXT |
| selected_package_id | TEXT |
| total_amount | NUMERIC |
| paid_amount | NUMERIC |
| status | TEXT |
| items | JSONB |
| payments | JSONB |
| snapshot | JSONB |
| notes | TEXT |
| created_at | TIMESTAMPTZ |

#### customers
id, name, mobile, email, invoice_ids (JSONB), created_at

#### services
id, name, description, active, created_at

#### packages
id, name, price, description, services (JSONB), active, created_at, updated_at

#### studio
id, name, address, mobile, email, instagram, website, signature, logo

---

## WhatsApp Business API

### Cloudflare Worker
- **URL:** https://candycapture-whatsapp-api.hellocandycapturephotography.workers.dev
- **Location:** D:\kiro\candycapture-photography-billing\cloudflare-worker\

### API Credentials
- **Phone Number ID:** 1343986805465390
- **Access Token:** EAAObtNUVZA2wBSuAZAwDRfJvB41XuU4eqWWmpksZCzst3SfarLzeU3CNjj6HMojEpdHC1m0MLvBF7HLHxhmlRHbVmIET7bu1AZAZC3fPR7Ckjpq5x1jnAa1ItJ4hIS4ZBYWipyoir36S87gFLy4jJrOwQRLhItMRu0N0ffC7FYmXPfGqJvHrPc9vDNj1MThPyqngZDZD

### Status: Display Name Approval PENDING
Approve at: https://business.facebook.com/wa/manage/phone-numbers/

## Environment Variables
VITE_INITIAL_ADMIN_USERNAME=admin
VITE_INITIAL_ADMIN_PASSWORD=CandyCapture@2024
VITE_WHATSAPP_API_URL=https://candycapture-whatsapp-api.hellocandycapturephotography.workers.dev

## Packages
THE ESSENTIAL Rs.25000
THE CLASSIC Rs.35000
THE SIGNATURE Rs.45000
THE PRESTIGE Rs.75000
THE GRANDEUR Rs.95000
THE LEGACY Rs.120000

## Features
1. Invoice Management
2. PDF Invoice with pink theme
3. WhatsApp Integration
4. Customer Management
5. Services and Packages
6. Studio Settings

## Contact
Email: hellocandycapturephotography@gmail.com
Instagram: @candycapture_
Website: candycapturephotography.in
Phone: +91 7373605380
