
# PG Manager - Complete Platform Plan 🏠

## Overview
A production-ready PG (Paying Guest) management platform designed for the Indian market, serving both PG owners and tenants with a modern, colorful design.

---

## Phase 1: Foundation & Authentication

### 1.1 Landing Page
- Modern, vibrant landing page showcasing the platform
- Clear value propositions for both owners and tenants
- "List Your PG" and "Find a PG" CTAs
- Testimonials and feature highlights

### 1.2 Authentication System
- Dual login options: Phone OTP and Email/Password
- Separate registration flows for Owners and Tenants
- Profile setup with required details (Aadhaar verification optional for future)
- Secure session management

---

## Phase 2: PG Owner Dashboard

### 2.1 Multi-Property Management
- Add and manage multiple PG properties
- Property details: name, address, amenities, rules, photos
- Property-level settings and configurations

### 2.2 Room & Bed Management
- Room types (Single, Double, Triple, Dormitory)
- Bed assignments and occupancy tracking
- Room photos and amenity tags
- Visual floor plan view (optional enhancement)

### 2.3 Tenant Management
- Add tenants with complete details
- Assign rooms/beds to tenants
- Document uploads (ID proof, photos)
- Tenant timeline and history

### 2.4 Vacancy Posting (Marketplace)
- Post vacant rooms with photos and descriptions
- Set rent prices and deposit amounts
- Highlight amenities and nearby landmarks
- Toggle listings on/off

---

## Phase 3: Financial Management

### 3.1 Rent Collection
- Monthly rent tracking per tenant
- Multiple payment status: Paid, Pending, Overdue
- Generate digital rent receipts
- Payment history and reports

### 3.2 Payment Integration (Razorpay)
- UPI, cards, and net banking support
- Automated payment notifications
- Payment link generation for tenants
- Transaction reconciliation

### 3.3 Expense Tracking
- Log PG expenses (electricity, water, maintenance, staff)
- Category-wise expense breakdown
- Monthly expense reports
- Profit/loss overview per property

---

## Phase 4: Tenant Experience

### 4.1 Tenant Dashboard
- View assigned room details
- Current dues and payment history
- Upcoming rent reminders
- Quick actions

### 4.2 PG Discovery Marketplace
- Search PGs by city, area, or locality
- Filter by: rent range, room type, gender, amenities
- View listings with photos and details
- Contact PG owner or express interest

### 4.3 Rent Payments
- Pay rent directly through the app
- UPI payment flow (Razorpay)
- Download payment receipts
- View complete payment history

### 4.4 Vacancy Notice System
- Submit 1-month advance vacancy notice
- Track notice status
- Automatic notification to owner
- Deposit refund tracking

---

## Phase 5: Communication & Support

### 5.1 Complaints & Maintenance
- Raise maintenance requests (plumbing, electrical, etc.)
- Attach photos of issues
- Track request status (Open, In Progress, Resolved)
- Owner response and resolution notes

### 5.2 Notifications
- Rent due reminders (WhatsApp/SMS/Push optional)
- Vacancy notice alerts
- Complaint status updates
- New listing alerts for tenants

---

## Phase 6: Reporting & Analytics

### 6.1 Owner Analytics Dashboard
- Occupancy rates across properties
- Revenue trends and projections
- Expense breakdown charts
- Tenant demographics

### 6.2 Export & Reports
- Monthly/quarterly rent collection reports
- Expense reports for tax purposes
- Tenant register export
- Payment transaction history

---

## Design Theme
- **Primary Colors:** Vibrant purple/blue gradient with energetic accent colors
- **Style:** Modern cards, soft shadows, rounded corners
- **Mobile-First:** Responsive design optimized for mobile users (common in India)
- **Icons:** Lucide icons throughout
- **Typography:** Clean, readable fonts

---

## Tech Stack Summary
- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Lovable Cloud (Supabase)
- **Database:** PostgreSQL with RLS policies
- **Storage:** Supabase Storage for images
- **Payments:** Razorpay integration
- **Authentication:** Supabase Auth with phone OTP + email
