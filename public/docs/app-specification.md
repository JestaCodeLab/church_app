# Church Management App - Complete Feature Specification

## Table of Contents
1. [Overview](#overview)
2. [Authentication & Onboarding](#authentication--onboarding)
3. [Branch Management](#branch-management)
4. [Member Management](#member-management)
5. [Department Management](#department-management)
6. [Event Management](#event-management)
7. [SMS Messaging](#sms-messaging)
8. [Sermon Management](#sermon-management)
9. [Social Media Management](#social-media-management)
10. [Technical Stack](#technical-stack)
11. [API Architecture](#api-architecture)
12. [Security & Permissions](#security--permissions)

---

## Overview

A comprehensive church management platform that enables churches to manage multiple branches, coordinate activities, maintain a unified social media presence, manage members and departments, organize events, send SMS communications, and archive sermons. The system supports multi-branch organizations with role-based access control and subscription-based feature gating.

**Core Modules:**
- Authentication & User Management
- Branch Management
- Member Management (Member Directory, Groups, Attendance)
- Department Management (Ministry Departments, Staff, Volunteers)
- Event Management (Calendar, Registration, Check-in, Ticketing)
- SMS Messaging (Broadcasts, Templates, Two-way SMS)
- Sermon Management (Archive, Series, Notes, Audio/Video)
- Social Media Management (Facebook, Instagram, WhatsApp)
- Analytics & Reporting
- Content Management
- Settings & Subscription Management

---

## Authentication & Onboarding

### Registration Flow

**Route:** `/register`

**User Types:**
- Church Administrator (primary account owner)
- Branch Manager (assigned to specific branches)
- Content Creator (can create/schedule posts)
- Department Head (manages specific departments)
- Viewer (read-only analytics access)

**Registration Steps:**

1. **Church Information**
   - Church name (required)
   - Church email (required, verified)
   - Phone number (required, E.164 format)
   - Church type dropdown: Traditional, Modern, Pentecostal, Catholic, Orthodox, Other
   - Estimated membership size: <100, 100-500, 500-1000, 1000-5000, 5000+
   - Church website (optional)
   - Denomination (optional)

2. **Administrator Account**
   - Full name (required)
   - Email (required, must be unique)
   - Password (required, min 8 chars, must contain uppercase, lowercase, number, special char)
   - Confirm password
   - Phone number (optional)
   - Role automatically set to "Super Admin"

3. **Primary Branch Setup**
   - Branch name (defaults to "Main Branch")
   - Physical address (street, city, state, postal code, country)
   - Branch phone number
   - Branch email
   - Service times (optional, can add multiple)
   - Seating capacity (optional)

4. **Subscription Plan Selection**
   - **Free Plan**: 1 branch, 2 social accounts, 100 members, basic analytics
   - **Starter Plan**: 3 branches, 5 social accounts, 500 members, events, SMS (100/month)
   - **Growth Plan**: 10 branches, 15 social accounts, 2000 members, departments, AI features, SMS (1000/month)
   - **Enterprise Plan**: Unlimited branches/accounts/members, white-label, custom integrations, unlimited SMS

5. **Email Verification**
   - Verification email sent to church email
   - 6-digit code expires in 15 minutes
   - Resend option available after 60 seconds
   - Account remains pending until verified

**API Endpoints:**
- `POST /auth/register` - Create account (returns JWT + user object)
- `POST /auth/verify-email` - Verify email with code
- `POST /auth/resend-verification` - Resend verification email

**Post-Registration:**
- Redirect to `/dashboard` or `/onboarding/tour` (interactive product tour)
- Auto-create first branch with church details
- Show "Complete Your Profile" prompt if optional fields are missing
- Display subscription plan limits in dashboard banner

---

### Login Flow

**Route:** `/login`

**Features:**
- Email/password authentication
- "Remember me" checkbox (30-day session)
- "Forgot password" link
- Social login options: Google, Facebook (optional based on config)
- Account lockout after 5 failed attempts (15-minute cooldown)

**Two-Factor Authentication (Optional):**
- SMS-based or Authenticator app (Google Authenticator, Authy)
- Enabled in account settings
- Backup codes provided (10 single-use codes)

**API Endpoints:**
- `POST /auth/login` - Authenticate user (returns JWT + refresh token)
- `POST /auth/forgot-password` - Send password reset email
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/refresh-token` - Refresh expired JWT
- `POST /auth/logout` - Invalidate tokens

**Password Reset Flow:**
1. User enters email on forgot password page
2. Reset link sent to email (token valid 1 hour)
3. User clicks link, redirected to `/reset-password?token=...`
4. User enters new password (same requirements as registration)
5. Success message and redirect to login

---

### Session Management

- JWT stored in `httpOnly` cookie + localStorage (for client-side checks)
- Refresh token stored in `httpOnly` cookie only
- Token expiration: 1 hour (access token), 7 days (refresh token)
- Auto-refresh 5 minutes before expiration
- Global logout clears all sessions across devices
- "Active Sessions" page shows logged-in devices with revoke option

---

## Branch Management

### Branch Selection

**Requirement:** Most features are branch-scoped. Users must select a branch before accessing member, events, SMS, and social media features.

**Implementation:**
- `useBranchSelection` hook manages global branch selection state
- `BranchSelectionModal` appears on first visit to any branch-scoped route
- Selected branch persisted in localStorage + URL params (`?branchId=...`)
- Branch switcher dropdown in page header for quick switching
- "All Branches" option available for Super Admin (aggregated data view)

**Branch Permissions:**
- Super Admin: Access all branches
- Branch Manager: Access assigned branches only
- Department Head: Access assigned branches, department-specific data
- Content Creator: Access assigned branches, limited to content operations
- Viewer: Access assigned branches, read-only

**BranchSelectionModal:**
- Title: "Select a Branch"
- Subtitle: "Choose which branch you want to manage"
- Branch list with:
  - Branch name
  - Location (city, state)
  - Member count
  - Active events count
  - Last activity timestamp
- Search/filter by name or location
- "Create New Branch" button (if subscription allows)
- Cannot be dismissed without selection (blocking modal)

---

### Branch CRUD Operations

**Routes:**
- `/branches` - List all branches
- `/branches/create` - Create new branch
- `/branches/:id` - Branch details/dashboard
- `/branches/:id/edit` - Edit branch
- `/branches/:id/settings` - Branch-specific settings

**Create Branch Form:**
- Branch name (required)
- Branch code (auto-generated, editable, unique, e.g., "NYC-001")
- Address (full address fields)
- Contact information (phone, email, website)
- Timezone (dropdown, defaults to church's primary timezone)
- Service times (repeating schedule: day, start time, end time, service type)
- Seating capacity (number input)
- Branch pastor/leader (dropdown of users)
- Branch logo upload (optional)
- Branch manager assignment (dropdown of users)
- Status: Active, Inactive, Coming Soon

**Branch Dashboard:**
- Overview cards: Members, Departments, Events This Month, Attendance Rate, SMS Credits
- Quick actions: Add Member, Create Event, Send SMS, Create Post
- Recent activity feed: New members, events, posts, attendance records
- Assigned staff list with roles
- Upcoming events (next 5)
- Branch-specific analytics preview

**API Endpoints:**
- `GET /branches` - List branches (filtered by user permissions)
- `GET /branches/:id` - Get branch details
- `POST /branches` - Create branch
- `PUT /branches/:id` - Update branch
- `DELETE /branches/:id` - Delete branch (soft delete, requires confirmation)
- `GET /branches/:id/stats` - Branch statistics

---

## Member Management

### Overview

The Member Management module provides comprehensive tools for managing church members, tracking attendance, organizing groups, and maintaining detailed member profiles. All member data is branch-scoped.

---

### Member Directory

**Route:** `/members`

**Purpose:** Central directory of all church members with advanced filtering and bulk operations.

**Layout:**

1. **Header Bar**
   - Title: "Member Directory"
   - Branch selector dropdown
   - Member count badge (e.g., "247 members")
   - "Add Member" button (primary, UserPlus icon)
   - "Import Members" button (secondary, Upload icon)

2. **Filters & Search (3-column grid + search)**
   
   | Filter | Type | Options |
   |--------|------|---------|
   | Search | Text input | Search by name, email, phone, member ID |
   | Status | Dropdown | All, Active, Inactive, New (joined last 30 days), Visitor |
   | Member Type | Dropdown | All, Regular Member, Visitor, First Timer, Leadership, Volunteer |
   | Department | Dropdown | All, plus dynamically loaded departments |
   | Age Group | Dropdown | All, Children (0-12), Youth (13-17), Young Adult (18-35), Adult (36-64), Senior (65+) |
   | Gender | Dropdown | All, Male, Female, Other |
   | Marital Status | Dropdown | All, Single, Married, Divorced, Widowed |
   | Join Date | Date Range | All Time, Last 30 Days, Last 90 Days, Last Year, Custom |

   - "Clear Filters" button (shown when any filter is active)
   - "Export" button (exports filtered results as CSV/Excel)

3. **View Toggle**
   - Grid View (default, 3-4 columns, cards with photos)
   - List View (table format, compact)
   - Stats View (analytics cards with member demographics)

4. **Member Grid/List**

   **Grid View (Card Layout):**
   - Profile photo (120x120px, circle, placeholder if none)
   - Name (bold, large)
   - Member ID badge (small, gray)
   - Contact info: Phone icon + number, Email icon + email
   - Department badges (up to 2 shown, "+N" overflow)
   - Status indicator (green dot = active, gray = inactive, blue = new)
   - Quick actions on hover: View Profile, Send SMS, Edit, Delete
   - Attendance percentage bar (last 90 days)
   - Last seen: "Yesterday" / "2 weeks ago" / "3 months ago"

   **List View (Table Layout):**
   
   | Column | Content |
   |--------|---------|
   | Member | Photo (32px) + Name + Member ID |
   | Contact | Phone + Email (with copy buttons) |
   | Type | Badge (Regular/Visitor/Leadership/etc.) |
   | Departments | Department badges (2 max, "+N") |
   | Join Date | Relative time (e.g., "2 months ago") |
   | Attendance | Percentage with trend icon |
   | Status | Active/Inactive badge |
   | Actions | View, Edit, Delete dropdown menu |

5. **Bulk Actions (when items selected)**
   - Toolbar appears at top: "X members selected"
   - Actions: Send SMS, Send Email, Add to Department, Add to Group, Change Status, Export, Delete
   - "Clear Selection" button

6. **Pagination**
   - 20/50/100 items per page
   - Page numbers with smart ellipsis
   - "Showing X-Y of Z members"

**Member Demographics Stats View:**
- Gender distribution (pie chart)
- Age group distribution (bar chart)
- Member type distribution (donut chart)
- New members trend (line chart, last 12 months)
- Department distribution (horizontal bar chart)
- Marital status distribution (pie chart)

**API Endpoints:**
- `GET /members?branchId=...&page=...&limit=...&filters=...` - List members
- `GET /members/stats?branchId=...` - Member statistics
- `POST /members/export?branchId=...&filters=...` - Export members
- `POST /members/bulk-action` - Bulk update/delete

---

### Member Profile

**Route:** `/members/:id`

**Purpose:** Detailed view of a single member with full profile, family, attendance history, and engagement data.

**Layout:** Tabs interface

#### Overview Tab

**Left Column (2/3 width):**

1. **Profile Header Card**
   - Large profile photo (200x200px, circle, editable on hover)
   - Name (large, bold)
   - Member ID badge
   - Status badge (Active/Inactive/New)
   - Member type badge (Regular/Visitor/Leadership/etc.)
   - Action buttons: Edit Profile, Send SMS, Send Email, Print ID Card

2. **Quick Stats (4-column grid)**
   | Stat | Icon | Description |
   |------|------|-------------|
   | Member Since | Calendar | Join date (relative time) |
   | Attendance Rate | CheckCircle | Percentage (last 90 days) |
   | Events Attended | Users | Count of events |
   | Departments | Briefcase | Count of departments |

3. **Personal Information Card**
   - Full name
   - Date of birth (with age calculated)
   - Gender
   - Marital status
   - Nationality
   - Phone number (primary + secondary)
   - Email (primary + secondary)
   - Address (street, city, state, postal code, country)
   - Emergency contact (name, relationship, phone)

4. **Spiritual Information Card**
   - Baptism status (Yes/No, date if yes)
   - Baptism location
   - Salvation date
   - Membership status (Member/Visitor/New Convert/etc.)
   - Date joined church
   - Conversion story (expandable text area)
   - Water baptism date
   - Holy Spirit baptism date

5. **Family Information Card**
   - Spouse (if married, link to spouse's profile)
   - Children (list with names, ages, links to profiles if they're members)
   - Parents (if under 18, links to parent profiles)
   - "Add Family Member" button

**Right Column (1/3 width, sticky):**

1. **Departments Card**
   - List of departments member belongs to
   - Each department shows:
     - Department name
     - Role (Member/Leader/Volunteer)
     - Date joined
   - "Add to Department" button

2. **Groups Card**
   - List of groups/cells member belongs to
   - Each group shows:
     - Group name
     - Role (Member/Leader)
     - Next meeting date
   - "Add to Group" button

3. **Skills & Talents Card**
   - Tagged list of skills (e.g., "Music", "Teaching", "Technology")
   - Clickable tags (search for other members with same skill)
   - "Add Skill" button

4. **Notes & Comments Card**
   - Timeline of notes added by staff
   - Each note shows:
     - Note text
     - Added by (staff name)
     - Date/time
   - "Add Note" button (modal opens)

5. **Custom Fields Card** (if church has custom fields)
   - Additional church-specific fields
   - Examples: "Home Fellowship Group", "Leadership Level", "Volunteer Status"

#### Attendance Tab

**Attendance Overview:**
- Current streak: "14 consecutive Sundays"
- Longest streak: "28 consecutive weeks"
- Total services attended: 156
- Attendance rate: 87% (last 90 days)

**Attendance Charts:**
1. **Monthly Attendance (Bar Chart)**
   - Last 12 months
   - Shows services attended vs. total services
   - Color-coded: Green (attended), Gray (missed)

2. **Service Type Breakdown (Pie Chart)**
   - Sunday Service: 45%
   - Midweek Service: 30%
   - Prayer Meeting: 15%
   - Special Events: 10%

**Attendance History Table:**
| Date | Service Type | Check-in Time | Check-out Time | Status |
|------|--------------|---------------|----------------|--------|
| Mar 10, 2026 | Sunday Service | 9:45 AM | 12:30 PM | Present |
| Mar 7, 2026 | Midweek Service | 6:00 PM | 7:45 PM | Present |
| Mar 3, 2026 | Sunday Service | - | - | Absent |

- Pagination: 10/20/50 per page
- Export button (CSV/PDF)
- Filter by date range and service type

**API Endpoints:**
- `GET /members/:id/attendance?startDate=...&endDate=...` - Attendance records
- `GET /members/:id/attendance/stats` - Attendance statistics

#### Events Tab

**Events Overview:**
- Total events attended: 23
- Upcoming registered events: 3
- Event types: Conferences (5), Workshops (8), Retreats (3), Socials (7)

**Upcoming Events List:**
- Event cards showing:
  - Event name
  - Date/time
  - Location
  - Registration status (Registered/Checked-in/Attended)
  - Ticket/payment status (if applicable)
  - "View Event" button

**Past Events List:**
- Similar to upcoming, with attendance status
- Filter by event type and date range
- Export button

**API Endpoints:**
- `GET /members/:id/events?status=...` - Member's events

#### Giving Tab (if Giving module enabled)

**Giving Overview:**
- Total giving (all time)
- Average monthly giving
- Largest single gift
- First gift date
- Last gift date
- Giving frequency (weekly, monthly, etc.)

**Giving Charts:**
1. **Monthly Giving Trend (Line Chart)**
   - Last 12 months
   - Shows amount per month

2. **Giving by Category (Pie Chart)**
   - Tithes: 70%
   - Offerings: 20%
   - Special Projects: 10%

**Giving History Table:**
| Date | Category | Amount | Method | Receipt |
|------|----------|--------|--------|---------|
| Mar 10, 2026 | Tithe | $500 | Card | Download |
| Mar 3, 2026 | Offering | $100 | Cash | Download |

- Pagination and export
- "Send Receipt" button for each transaction

#### Communication Tab

**Communication History:**
- Timeline of all communications sent to member:
  - SMS messages (with delivery status)
  - Emails (with open/click status)
  - Push notifications
  - Phone calls (if logged)

**Communication Stats:**
- Total SMS sent: 45
- SMS delivery rate: 98%
- Total emails sent: 32
- Email open rate: 65%
- Last contacted: "2 days ago"

**Send New Communication:**
- Buttons to send SMS, Email, or make a call
- Quick message templates dropdown

**API Endpoints:**
- `GET /members/:id/communications` - Communication history
- `POST /members/:id/send-sms` - Send SMS to member
- `POST /members/:id/send-email` - Send email to member

#### Activity Tab

**Activity Feed:**
- Timeline of all member activities:
  - Profile updates ("Updated phone number")
  - Department joins/leaves
  - Event registrations
  - Check-ins
  - Group joins
  - Notes added by staff
  - Status changes

Each activity shows:
- Icon (type-specific)
- Description
- Date/time (relative)
- Initiated by (if by staff)

**Filters:**
- Activity type dropdown
- Date range picker
- "Export Activity Log" button

**API Endpoints:**
- `GET /members/:id/activity?type=...&startDate=...` - Activity log

---

### Add/Edit Member

**Routes:**
- `/members/add` - New member
- `/members/:id/edit` - Edit existing member

**Layout:** Multi-step form (wizard) or single-page with collapsible sections

**Form Sections:**

1. **Basic Information** (required)
   - Profile photo upload (drag-and-drop)
   - First name (required)
   - Middle name
   - Last name (required)
   - Gender (required): Male, Female, Other
   - Date of birth (required, date picker)
   - Marital status: Single, Married, Divorced, Widowed
   - Member type: Regular Member, Visitor, First Timer, Leadership, Volunteer

2. **Contact Information** (required)
   - Primary phone (required, with country code dropdown)
   - Secondary phone
   - Primary email (required, validated)
   - Secondary email
   - Preferred contact method: Phone, Email, SMS, WhatsApp

3. **Address** (optional)
   - Street address
   - Apartment/Unit number
   - City (required if address provided)
   - State/Province (required if address provided)
   - Postal code
   - Country (dropdown, required if address provided)
   - Auto-complete via Google Places API

4. **Emergency Contact** (optional but recommended)
   - Name (required if section filled)
   - Relationship (dropdown: Spouse, Parent, Sibling, Friend, Other)
   - Phone number (required if section filled)
   - Email

5. **Family Information** (optional)
   - Link to spouse (search existing members)
   - Add children (search existing members or mark as non-member)
   - Add parents (for minors)

6. **Spiritual Information** (optional)
   - Baptism status (Yes/No)
   - Baptism date (if yes)
   - Baptism location
   - Salvation date
   - Date joined church (defaults to today)
   - Previous church
   - Conversion story (textarea)
   - Water baptism completed (checkbox)
   - Holy Spirit baptism received (checkbox)

7. **Departments & Groups** (optional)
   - Select departments (multi-select dropdown)
   - Assign role in each department: Member, Leader, Volunteer
   - Select groups/cells (multi-select dropdown)

8. **Skills & Talents** (optional)
   - Tag input (e.g., "Music, Teaching, Technology")
   - Predefined suggestions: Music, Teaching, Technology, Administration, Counseling, Youth Work, Children's Ministry, Media, Security, Hospitality

9. **Custom Fields** (if configured)
   - Church-specific fields defined in settings
   - Can be text, number, date, dropdown, or checkbox

10. **Notes** (optional)
    - Internal notes about member (not visible to member)
    - Textarea (2000 char limit)

**Form Validation:**
- Real-time validation on blur
- Required field indicators (red asterisk)
- Email format validation
- Phone number format validation (E.164)
- Age validation (must be at least 0, max 120)
- Duplicate detection (shows warning if name/email/phone matches existing member)

**Actions:**
- "Save as Draft" (secondary button, saves without marking as active)
- "Save & Add Another" (secondary button, saves and clears form)
- "Save Member" (primary button, saves and redirects to profile)
- "Cancel" (goes back to directory)

**Auto-generation:**
- Member ID: Auto-generated on save (format: BR001-M00001, where BR001 is branch code)
- Join date: Defaults to today if not specified

**API Endpoints:**
- `POST /members` - Create member
- `PUT /members/:id` - Update member
- `GET /members/check-duplicate?email=...&phone=...` - Check for duplicates

---

### Member Groups

**Route:** `/members/groups`

**Purpose:** Manage small groups, cell groups, home fellowships, and other member groupings.

**Layout:**

1. **Header Bar**
   - Title: "Member Groups"
   - Branch selector
   - Group count badge
   - "Create Group" button (primary)

2. **Filters**
   - Search groups by name
   - Group type dropdown: All, Cell Group, Home Fellowship, Prayer Group, Bible Study, Ministry Team, Other
   - Status: All, Active, Inactive
   - Leader dropdown (filter by group leader)

3. **Groups Grid (3-column responsive)**

   Each group card shows:
   - Group name (bold)
   - Group type badge (colored pill)
   - Leader name with profile photo (32px)
   - Member count (e.g., "12 members")
   - Meeting schedule (e.g., "Every Wednesday, 7:00 PM")
   - Location (address or "Online")
   - Last meeting date (relative time)
   - Quick actions: View Details, Edit, Delete

4. **Group Detail Modal/Page** (`/members/groups/:id`)

   **Overview Section:**
   - Group name
   - Description (long text)
   - Group type
   - Meeting schedule
   - Meeting location
   - Leader (with link to profile)
   - Co-leader(s) (if any)
   - Created date

   **Members Section:**
   - List of members with:
     - Profile photo (48px)
     - Name
     - Role: Leader, Co-Leader, Member
     - Date joined group
     - Attendance rate (last 90 days)
     - Quick actions: View Profile, Remove from Group
   - "Add Members" button (multi-select modal)

   **Meetings Section:**
   - Upcoming meetings (next 5)
   - Past meetings with attendance records
   - Each meeting shows:
     - Date/time
     - Topic/agenda
     - Attendance count (e.g., "8 of 12 attended")
     - "View Attendance" button
   - "Schedule Meeting" button

   **Communication Section:**
   - "Send SMS to Group" button
   - "Send Email to Group" button
   - Communication history timeline

**Create/Edit Group Form:**
- Group name (required)
- Group type dropdown (required)
- Description (textarea, 500 char max)
- Leader (searchable dropdown of members)
- Co-leaders (multi-select, optional)
- Meeting day(s) (checkboxes: Sun-Sat)
- Meeting time (time picker)
- Meeting location (text or "Online" checkbox)
- Maximum capacity (number, optional)
- Status: Active/Inactive
- Start date (defaults to today)

**API Endpoints:**
- `GET /groups?branchId=...` - List groups
- `GET /groups/:id` - Group details
- `POST /groups` - Create group
- `PUT /groups/:id` - Update group
- `DELETE /groups/:id` - Delete group
- `POST /groups/:id/members` - Add members to group
- `DELETE /groups/:id/members/:memberId` - Remove member from group
- `GET /groups/:id/meetings` - Group meetings
- `POST /groups/:id/send-sms` - Send SMS to group members

---

### Member Check-in (Attendance)

**Route:** `/attendance` or `/check-in`

**Purpose:** Quick check-in interface for recording member attendance at services and events.

**Layout Options:**

#### Option 1: Kiosk Mode (Tablet/iPad at entrance)
- Full-screen interface
- Large touch-friendly buttons
- Branch logo at top
- Service/event selector dropdown
- Search member by:
  - Name (autocomplete)
  - Phone number
  - Member ID (barcode/QR scanner support)
- Check-in button (large, green, shows success animation)
- Guest check-in option (quick form: name, phone, email)
- Display: "X members checked in today"

#### Option 2: Admin Check-in Interface
- Header: Service/event selector + Date picker + Branch selector
- Search bar: Find member by name, phone, or ID
- Member list with check-in checkboxes
- Bulk check-in mode:
  - Select multiple members
  - "Check In Selected" button
- Attendance summary: "45 of 67 members present (67%)"
- Export attendance report (CSV/PDF)

**Check-in Process:**
1. Select service/event
2. Search for member or scan QR code
3. Click "Check In" button
4. System records:
   - Member ID
   - Branch ID
   - Service/Event ID
   - Check-in time (timestamp)
   - Check-in method (Kiosk, Admin, QR Scan, Mobile App)
   - Device/location (optional)
5. Show success message: "Welcome, [Name]! You're checked in."
6. Optional: Print name tag or ticket

**Features:**
- Check-out tracking (optional, records time left)
- Late check-in warning (if service started >30 mins ago)
- Duplicate check-in prevention (shows last check-in time)
- Guest check-in creates temporary member record (can be converted to full member later)
- QR code generation for members (scannable ID card)
- SMS confirmation sent to member (optional)

**API Endpoints:**
- `POST /attendance/check-in` - Record check-in
- `POST /attendance/check-out` - Record check-out
- `GET /attendance/session?serviceId=...&date=...` - Today's attendance
- `POST /attendance/bulk-check-in` - Bulk check-in
- `GET /members/:id/generate-qr` - Generate member QR code

---

### Member Import/Export

**Import Members:**
- **Route:** `/members/import`
- Upload CSV or Excel file
- Template download (with required columns)
- Column mapping interface (map CSV columns to member fields)
- Validation preview (shows errors before import)
- Duplicate handling options: Skip, Update, Create New
- Progress indicator during import
- Import summary report (X added, Y updated, Z errors)

**Required CSV Columns:**
- First Name
- Last Name
- Email or Phone (at least one required)
- Gender
- Date of Birth

**Optional CSV Columns:**
- Member ID, Middle Name, Phone, Address fields, Member Type, Join Date, Department, etc.

**Export Members:**
- Export all or filtered members
- Format options: CSV, Excel, PDF
- Field selection (choose which columns to export)
- "Include photos" checkbox (for PDF export)
- Email export link or download directly

**API Endpoints:**
- `POST /members/import` - Upload and import members (multipart/form-data)
- `POST /members/import/validate` - Validate CSV before import
- `POST /members/export` - Generate export file

---

## Department Management

### Overview

The Department Management module enables churches to organize ministries, assign staff and volunteers, track department activities, and manage department-specific resources. Examples: Children's Ministry, Youth Department, Music Ministry, Media Team, Ushering, etc.

---

### Department Directory

**Route:** `/departments`

**Purpose:** Central view of all ministry departments with member counts and activity overview.

**Layout:**

1. **Header Bar**
   - Title: "Departments & Ministries"
   - Branch selector
   - Department count badge
   - "Create Department" button (primary, Plus icon)

2. **View Toggle**
   - Grid View (default, cards with icons)
   - List View (table format)

3. **Filters**
   - Search departments by name
   - Category dropdown: All, Ministry, Administration, Worship, Outreach, Education, Support Services
   - Status: All, Active, Inactive
   - Department head dropdown (filter by leader)

4. **Departments Grid (3-column responsive)**

   Each department card shows:
   - Department icon/logo (64x64px, colored, or uploaded image)
   - Department name (bold, large)
   - Category badge (colored pill)
   - Department head/leader:
     - Profile photo (32px)
     - Name
     - Role (e.g., "Department Head")
   - Member count: "15 members" (with breakdown: 3 leaders, 5 volunteers, 7 members)
   - Last activity: "Active 2 days ago"
   - Quick stats:
     - Events this month: 3
     - Attendance rate: 85%
   - Quick actions on hover: View Details, Edit, Send SMS, Delete
   - Status indicator (green dot = active, gray = inactive)

5. **Stats Dashboard (top of page, collapsible)**
   - Total departments: 12
   - Total department members: 247
   - Active volunteers: 89
   - Departments by category (bar chart)
   - Most active departments (top 5 list)

**API Endpoints:**
- `GET /departments?branchId=...&category=...&status=...` - List departments
- `GET /departments/stats?branchId=...` - Department statistics

---

### Department Detail

**Route:** `/departments/:id`

**Purpose:** Comprehensive view of a single department with members, events, resources, and communication.

**Layout:** Tabs interface

#### Overview Tab

**Left Column (2/3 width):**

1. **Department Header Card**
   - Large icon/logo (150x150px, editable)
   - Department name (large, bold)
   - Category badge
   - Status badge (Active/Inactive)
   - Description (long text, expandable)
   - Action buttons: Edit Department, Send SMS to All, Schedule Event, View Reports

2. **Department Stats (4-column grid)**
   | Stat | Icon | Description |
   |------|------|-------------|
   | Total Members | Users | Count of all members (leaders + volunteers + members) |
   | Events This Month | Calendar | Upcoming + past events |
   | Attendance Rate | CheckCircle | Average attendance at department events |
   | Budget Spent | DollarSign | YTD spending (if budget tracking enabled) |

3. **Department Information Card**
   - Category
   - Founded date
   - Meeting schedule (e.g., "Every Sunday, 2:00 PM - 4:00 PM")
   - Meeting location
   - Budget allocation (annual, if applicable)
   - Contact email
   - Contact phone
   - Department goals (bullet list)

4. **Recent Activities Feed**
   - Timeline of department activities:
     - New member joined
     - Event created
     - Meeting held
     - Communication sent
     - Resource uploaded
   - Shows last 10 activities
   - "View All Activity" link

**Right Column (1/3 width, sticky):**

1. **Leadership Card**
   - Department Head:
     - Profile photo (64px)
     - Name (link to profile)
     - Phone + Email (with copy buttons)
     - "Send Message" button
   - Co-leaders/Assistants (if any):
     - Same format as head
   - "Assign Leader" button (if no head assigned)

2. **Quick Actions Card**
   - Add Member
   - Schedule Meeting/Event
   - Send SMS to Department
   - Send Email to Department
   - Upload Resource
   - View Budget Report
   - Print Member List

3. **Upcoming Events Card** (next 3 events)
   - Event name
   - Date/time
   - Location
   - Expected attendance
   - "View All Events" link

4. **Department Resources Card**
   - List of uploaded files (documents, images, videos)
   - Each resource shows:
     - File icon (based on type)
     - File name
     - Upload date
     - Uploaded by
     - Download button
   - "Upload Resource" button
   - "View All Resources" link (if > 5)

#### Members Tab

**Members Overview:**
- Total members: 15
- Leaders: 3
- Volunteers: 5
- Regular members: 7
- New this month: 2

**Members List:**
- Table or grid view toggle
- Columns: Photo, Name, Role, Phone, Email, Join Date, Attendance, Actions

**Roles:**
- Department Head
- Co-Leader/Assistant
- Team Leader
- Volunteer
- Member

**Features:**
- Search members by name
- Filter by role
- Sort by join date, attendance, name
- Bulk actions: Send SMS, Change Role, Remove from Department
- Add members button (multi-select modal)
- Export member list

**Add Member Modal:**
- Search existing church members
- Multi-select (checkboxes)
- Assign role dropdown for each selected member
- "Add Members" button

**API Endpoints:**
- `GET /departments/:id/members` - List department members
- `POST /departments/:id/members` - Add members to department
- `PUT /departments/:id/members/:memberId` - Update member role
- `DELETE /departments/:id/members/:memberId` - Remove member from department

#### Events Tab

**Events Overview:**
- Upcoming events: 3
- Past events this year: 12
- Average attendance: 85%

**Events List:**
- Similar to main Events page but filtered to this department
- Shows:
  - Event name
  - Date/time
  - Location
  - Expected vs. actual attendance
  - Status (Upcoming/Ongoing/Completed/Cancelled)
- "Create Event" button (pre-fills department)

**API Endpoints:**
- `GET /departments/:id/events` - Department events
- `POST /events` (with `departmentId` field) - Create department event

#### Budget Tab (if budget tracking enabled)

**Budget Overview:**
- Annual allocation: $10,000
- Spent YTD: $7,500 (75%)
- Remaining: $2,500
- Budget status: On Track / Over Budget / Under Budget

**Budget Breakdown (Pie Chart):**
- Equipment: 40% ($3,000)
- Events: 30% ($2,250)
- Training: 20% ($1,500)
- Supplies: 10% ($750)

**Transactions Table:**
| Date | Description | Category | Amount | Receipt |
|------|-------------|----------|--------|---------|
| Mar 10 | New microphones | Equipment | $500 | Download |
| Mar 5 | Youth retreat | Events | $1,200 | Download |

- Pagination and export
- "Add Transaction" button (modal with form)
- Filter by category and date range

**API Endpoints:**
- `GET /departments/:id/budget` - Budget overview
- `GET /departments/:id/transactions` - Budget transactions
- `POST /departments/:id/transactions` - Add transaction

#### Resources Tab

**Resources Overview:**
- Total files: 23
- Storage used: 156 MB (of plan limit)

**Resource Categories:**
- Documents (PDFs, Word, Excel)
- Images (training materials, event photos)
- Videos (teaching series, tutorials)
- Links (external resources)

**Resources Grid:**
- Card or list view
- Each resource shows:
  - File icon/thumbnail
  - File name
  - File type badge
  - File size
  - Upload date
  - Uploaded by (staff name)
  - Download count
  - Actions: Download, Share Link, Delete

**Upload Resource:**
- Drag-and-drop zone
- File size limit: 50MB per file (plan-dependent)
- Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, MP4, MP3
- Add title, description, category
- Mark as "Members Only" or "Public"

**API Endpoints:**
- `GET /departments/:id/resources` - List resources
- `POST /departments/:id/resources` - Upload resource (multipart/form-data)
- `DELETE /departments/:id/resources/:resourceId` - Delete resource
- `GET /departments/:id/resources/:resourceId/download` - Download resource

#### Communication Tab

**Communication History:**
- Timeline of all communications sent to department members:
  - SMS messages (with delivery status)
  - Emails (with open/click rate)
  - Announcements
  - Meeting invites

**Quick Send:**
- "Send SMS" button → Opens SMS compose modal with all department members pre-selected
- "Send Email" button → Opens email compose modal
- "Create Announcement" button → Posts to department activity feed

**Communication Stats:**
- Total messages sent: 45
- SMS delivery rate: 98%
- Email open rate: 65%
- Last communication: "2 days ago"

**API Endpoints:**
- `GET /departments/:id/communications` - Communication history
- `POST /departments/:id/send-sms` - Send SMS to department
- `POST /departments/:id/send-email` - Send email to department

---

### Create/Edit Department

**Routes:**
- `/departments/create` - New department
- `/departments/:id/edit` - Edit existing department

**Form Sections:**

1. **Basic Information**
   - Department name (required)
   - Category dropdown (required): Ministry, Administration, Worship, Outreach, Education, Support Services, Other
   - Description (textarea, 1000 char max)
   - Icon/Logo upload (optional, 512x512px recommended)
   - Status: Active, Inactive

2. **Leadership**
   - Department Head (searchable dropdown of members)
   - Co-Leaders (multi-select, optional)
   - Team Leaders (multi-select, optional)

3. **Schedule & Location**
   - Meeting day(s) (checkboxes: Sun-Sat)
   - Meeting time (time picker)
   - Meeting location (text input or select from branch rooms)
   - Meeting frequency: Weekly, Bi-weekly, Monthly, Custom

4. **Contact Information**
   - Department email (optional)
   - Department phone (optional)
   - Public contact (checkbox: show contact info to members)

5. **Budget** (optional, if feature enabled)
   - Annual budget allocation (number input)
   - Budget start date (fiscal year start)
   - Track expenses (checkbox)

6. **Goals & Objectives** (optional)
   - Textarea for department goals
   - Key focus areas (tag input)

7. **Custom Fields** (if configured)
   - Church-specific fields

**Actions:**
- "Save Department" (primary button)
- "Cancel" (goes back to directory)

**API Endpoints:**
- `POST /departments` - Create department
- `PUT /departments/:id` - Update department

---

## Event Management

### Overview

The Event Management module provides comprehensive tools for planning, promoting, and managing church events including conferences, workshops, retreats, social gatherings, and regular services. Features include event registration, ticketing, check-in, capacity management, and post-event analytics.

---

### Events Calendar

**Route:** `/events`

**Purpose:** Visual calendar and list view of all church events with filtering and quick actions.

**Layout:**

1. **Header Bar**
   - Title: "Events & Activities"
   - Branch selector
   - View toggle: Calendar / List / Timeline
   - "Create Event" button (primary, Plus icon)

2. **Calendar View (default)**

   **Calendar Navigation:**
   - Previous/Next month buttons
   - Month/Year display with dropdown (quick jump to any month)
   - "Today" button
   - View mode: Month / Week / Day / Agenda

   **Month View (similar to Social Calendar):**
   - 7-column grid (Sun-Sat)
   - Each day shows events as colored pills:
     - Conference (purple)
     - Workshop (blue)
     - Retreat (green)
     - Social Event (orange)
     - Service (indigo)
     - Meeting (gray)
     - Other (pink)
   - Event pill shows:
     - Time (e.g., "10:00 AM")
     - Event name (truncated)
     - Registration count (if applicable)
   - Click event pill → Event detail page
   - Click empty day → Quick create event for that date
   - Multi-day events span across days

3. **List View**

   **Filters (above list):**
   - Search by event name
   - Event type dropdown: All, Conference, Workshop, Retreat, Social Event, Service, Meeting, Fundraiser, Other
   - Status: All, Upcoming, Ongoing, Completed, Cancelled
   - Date range: All, Today, This Week, This Month, Next 30 Days, Custom
   - Registration: All, Open, Closed, Waitlist
   - Department filter (multi-select)

   **Event Cards (stacked list or 2-column grid):**
   - Large event image/banner (16:9 ratio, 400x225px)
   - Event name (bold, large)
   - Event type badge
   - Date & time with Calendar icon
   - Location with MapPin icon
   - Capacity bar: "45 of 100 registered" (color-coded: green <70%, yellow 70-90%, red >90%)
   - Registration status badge: Open (green) / Closed (red) / Waitlist (yellow)
   - Price (if ticketed): "Free" / "$25" / "$25-$50" (if multiple tickets)
   - Quick actions: View Details, Edit, Duplicate, Cancel Event
   - Hover: Shadow and scale effect

4. **Timeline View** (Gantt-chart style)
   - Horizontal timeline showing events plotted by date
   - Useful for visualizing overlapping events
   - Drag-and-drop to reschedule (if permissions allow)

**Quick Stats (above calendar/list):**
- Upcoming events: 12
- Total registrations this month: 347
- Events this week: 5
- Most registered event: "Easter Conference" (250 registrations)

**API Endpoints:**
- `GET /events?branchId=...&startDate=...&endDate=...&type=...&status=...` - List events
- `GET /events/stats?branchId=...` - Event statistics

---

### Event Detail

**Route:** `/events/:id`

**Purpose:** Comprehensive view of a single event with registration, attendee management, and analytics.

**Layout:** Tabs interface

#### Overview Tab

**Hero Section:**
- Large event banner image (full width, 16:9 ratio, max height 400px)
- Event name overlay (large, white text with shadow)
- Date & time badge (top-right corner)
- Status badge: Upcoming / Ongoing / Completed / Cancelled

**Left Column (2/3 width):**

1. **Event Details Card**
   - Event name (large, bold)
   - Event type badge
   - Full description (rich text, expandable)
   - Organized by: Department name (if applicable)
   - Tags: "Youth", "Worship", "Training" (clickable, search for similar events)

2. **Event Information Grid (2 columns)**
   | Field | Value |
   |-------|-------|
   | Date & Time | Saturday, March 15, 2026, 10:00 AM - 4:00 PM |
   | Duration | 6 hours |
   | Location | Main Sanctuary, 123 Church St, New York, NY |
   | Map Link | Google Maps link (if address provided) |
   | Capacity | 100 attendees |
   | Registration Status | Open / Closed / Waitlist / Sold Out |
   | Registration Deadline | March 13, 2026, 11:59 PM |
   | Price | Free / $25 / $10-$50 (range for multiple ticket types) |
   | Contact Person | Pastor John Doe (phone, email) |

3. **Schedule/Agenda** (if multi-session event)
   - Timeline of sessions:
     - 10:00 AM - 11:00 AM: Registration & Welcome
     - 11:00 AM - 12:30 PM: Keynote Session
     - 12:30 PM - 1:30 PM: Lunch Break
     - 1:30 PM - 3:00 PM: Breakout Sessions
     - 3:00 PM - 4:00 PM: Closing Remarks

4. **Speakers/Leaders** (if applicable)
   - Card for each speaker:
     - Profile photo (80x80px)
     - Name (bold)
     - Title/Role
     - Bio (expandable)
     - Session topic

5. **Event Requirements** (if any)
   - "What to bring" list
   - Prerequisites (e.g., "Must be 18+ to attend")
   - Dress code
   - Special instructions

**Right Column (1/3 width, sticky):**

1. **Registration Card**
   - Capacity progress bar: "45 of 100 registered"
   - Registration status badge
   - Price display (if ticketed)
   - "Register Now" button (primary, large)
     - Disabled if registration closed
     - Shows "Join Waitlist" if full
     - Shows "Registration Closed" if deadline passed
   - "Share Event" button (social share icons: WhatsApp, Facebook, Email, Copy Link)

2. **Quick Stats Card**
   | Stat | Value |
   |------|-------|
   | Total Registered | 45 |
   | Checked In | 12 (if event is ongoing) |
   | Waitlist | 5 |
   | Revenue | $1,125 (if ticketed) |

3. **Organizer Card**
   - Department logo/icon
   - Department name
   - Contact email
   - Contact phone
   - "Contact Organizer" button

4. **Similar Events Card** (upcoming events of same type)
   - List of 3 similar events
   - Each shows:
     - Event name
     - Date
     - "View Event" link

**Action Buttons (top-right of page, contextual based on user role):**
- Edit Event (Pencil icon)
- Duplicate Event (Copy icon)
- Cancel Event (Ban icon, shows confirmation modal)
- Download Attendee List (Download icon, CSV/PDF)
- Check-in Attendees (CheckSquare icon, opens check-in modal)
- Send Communication (MessageSquare icon, opens SMS/Email modal)

**API Endpoints:**
- `GET /events/:id` - Event details
- `GET /events/:id/stats` - Event statistics

#### Registrations Tab

**Registrations Overview:**
- Total registered: 45
- Checked in: 12 (percentage bar)
- Pending payment: 3 (if ticketed)
- Cancelled: 2
- Waitlist: 5

**Registration Status Breakdown:**
- Confirmed: 40 (green)
- Pending: 3 (yellow)
- Cancelled: 2 (red)

**Registrations Table:**
| Photo | Name | Email | Phone | Ticket Type | Status | Check-in | Actions |
|-------|------|-------|-------|-------------|--------|----------|---------|
| [img] | John Doe | john@example.com | +1234567890 | General | Confirmed | ✅ 10:15 AM | View, Edit, Cancel |

**Features:**
- Search registrants by name, email, or phone
- Filter by status, ticket type, check-in status
- Sort by registration date, name, check-in time
- Export registrations (CSV, Excel, PDF with badges)
- Bulk actions:
  - Send SMS/Email to selected
  - Check in selected
  - Cancel registrations
  - Resend confirmation emails
  - Mark as paid (if pending payment)
- Pagination: 20/50/100 per page

**Quick Actions:**
- "Add Registration" button (manual registration by admin)
- "Check In All" button (for walk-ins)
- "Send Reminder" button (SMS/Email to all registered)
- "Download Badges" button (PDF name tags)

**API Endpoints:**
- `GET /events/:id/registrations` - List registrations
- `POST /events/:id/registrations` - Manual registration
- `PUT /events/:id/registrations/:regId` - Update registration
- `DELETE /events/:id/registrations/:regId` - Cancel registration
- `POST /events/:id/registrations/bulk-check-in` - Bulk check-in
- `POST /events/:id/registrations/send-reminder` - Send reminder

#### Check-in Tab

**Check-in Interface:**

**Two Modes:**

1. **Kiosk Mode** (tablet at event entrance)
   - Full-screen, touch-friendly
   - Large "Check In" title
   - Search by:
     - Name (autocomplete)
     - Phone number
     - Email
     - Registration ID / QR Code
   - QR scanner (camera access for scanning digital tickets)
   - Check-in button (large, green)
   - Success animation with attendee name
   - Display: "X of Y attendees checked in"

2. **Admin Mode** (staff dashboard)
   - List of all registrations with checkboxes
   - Bulk check-in mode
   - Manual search
   - Check-in status indicators (green checkmark)
   - Check-in time displayed

**Check-in Stats:**
- Total checked in: 45 of 78 (58%)
- On time (before start time): 32
- Late: 13
- Not yet checked in: 33

**Check-in Timeline:**
- Real-time graph showing check-ins over time
- Helps identify bottlenecks at entrance

**Features:**
- Auto check-in (if QR code scanned)
- Check-out tracking (optional, records departure time)
- Guest check-in (for unregistered walk-ins, quick form)
- Print name badge on check-in
- SMS confirmation sent on check-in
- Check-in history (who checked in when)

**API Endpoints:**
- `POST /events/:id/check-in` - Check in attendee
- `POST /events/:id/check-out` - Check out attendee
- `GET /events/:id/check-in/stats` - Check-in statistics

#### Tickets Tab (if ticketed event)

**Ticket Types:**
- Table listing all ticket types:
  | Ticket Name | Price | Quantity Available | Sold | Revenue | Status |
  |-------------|-------|-------------------|------|---------|--------|
  | General Admission | $25 | 50 | 35 | $875 | On Sale |
  | VIP | $50 | 20 | 18 | $900 | On Sale |
  | Student | $10 | 30 | 10 | $100 | On Sale |

- Actions: Edit Ticket, Pause Sales, Delete Ticket

**Revenue Summary:**
- Total revenue: $1,875
- Pending payments: $75 (3 tickets)
- Refunded: $50 (2 cancellations)
- Net revenue: $1,750

**Ticket Sales Over Time (Line Chart):**
- Shows daily ticket sales since event creation
- Helps identify sales trends

**Add/Edit Ticket Type Modal:**
- Ticket name (required)
- Description
- Price (required, $0 for free)
- Quantity available (required, or "Unlimited")
- Sales start date (optional, defaults to now)
- Sales end date (optional, defaults to event start time)
- Max per order (optional, e.g., max 5 tickets per person)
- Visibility: Public / Private (private requires access code)

**Ticket Distribution:**
- Pie chart showing percentage of each ticket type sold

**API Endpoints:**
- `GET /events/:id/tickets` - List ticket types
- `POST /events/:id/tickets` - Create ticket type
- `PUT /events/:id/tickets/:ticketId` - Update ticket type
- `DELETE /events/:id/tickets/:ticketId` - Delete ticket type
- `GET /events/:id/tickets/revenue` - Revenue stats

#### Communication Tab

**Communication History:**
- Timeline of all communications sent about this event:
  - Registration confirmations
  - Payment confirmations
  - Reminders (1 day before, 1 hour before)
  - Updates/changes
  - Thank you messages (post-event)

**Quick Send:**
- "Send SMS" button → Opens SMS modal with all registrants pre-selected
- "Send Email" button → Opens email modal
- "Send Update" button → Announcement to all registrants

**Email Templates:**
- Registration confirmation (auto-sent)
- Payment confirmation (auto-sent if ticketed)
- Event reminder (scheduled 1 day before)
- Event update (manual)
- Thank you email (post-event)

**Communication Stats:**
- Total emails sent: 95
- Email open rate: 72%
- Total SMS sent: 45
- SMS delivery rate: 98%

**Scheduled Communications:**
- List of upcoming scheduled emails/SMS
- Each shows:
  - Message type
  - Recipient count
  - Send date/time
  - Status (Scheduled/Sent)
  - Actions: Edit, Cancel, Send Now

**API Endpoints:**
- `GET /events/:id/communications` - Communication history
- `POST /events/:id/send-sms` - Send SMS to registrants
- `POST /events/:id/send-email` - Send email to registrants
- `POST /events/:id/schedule-communication` - Schedule future communication

#### Analytics Tab (post-event)

**Event Performance:**
- Total registrations: 78
- Actual attendance: 65 (83% attendance rate)
- New members/visitors: 12
- Revenue: $1,750 (if ticketed)
- Cost per attendee: $15 (if budget tracked)

**Registration Timeline (Line Chart):**
- Shows registration count over time
- Helps identify marketing effectiveness

**Attendance Breakdown:**
- By ticket type (pie chart)
- By member status: Members (50), Visitors (15)
- By age group (bar chart)
- By department (if department-specific event)

**Feedback & Ratings:**
- Average rating: 4.5 / 5 (based on post-event survey)
- Total feedback responses: 45
- Top comments (sentiment analysis):
  - "Great worship experience!"
  - "Well organized event"
  - "Food was delicious"
- Improvement suggestions

**Check-in Analytics:**
- Average check-in time: 10 minutes
- Peak check-in time: 9:45 AM - 10:00 AM
- Late arrivals: 13 attendees

**Post-Event Survey:**
- Link to survey results
- Response rate: 58% (45 of 78 respondents)
- Survey questions and answers (charts)

**Comparison with Similar Events:**
- Table comparing this event with past similar events:
  | Event | Date | Registrations | Attendance | Rating |
  |-------|------|---------------|------------|--------|
  | Easter Conference 2026 | Mar 15 | 78 | 65 | 4.5 |
  | Easter Conference 2025 | Mar 20 | 65 | 58 | 4.3 |
  | Easter Conference 2024 | Mar 25 | 52 | 48 | 4.2 |

**API Endpoints:**
- `GET /events/:id/analytics` - Event analytics
- `GET /events/:id/feedback` - Event feedback/ratings

---

### Create/Edit Event

**Routes:**
- `/events/create` - New event
- `/events/:id/edit` - Edit existing event

**Layout:** Multi-step wizard or single-page with sections

**Form Sections:**

1. **Basic Information**
   - Event name (required)
   - Event type dropdown (required): Conference, Workshop, Retreat, Social Event, Service, Meeting, Fundraiser, Other
   - Short description (textarea, 200 char max, for listings)
   - Full description (rich text editor, 2000 char max)
   - Event banner image upload (16:9 ratio, max 5MB)

2. **Date & Time**
   - Start date (required, date picker)
   - Start time (required, time picker)
   - End date (defaults to start date)
   - End time (required, time picker)
   - All-day event (checkbox)
   - Timezone (dropdown, defaults to branch timezone)
   - Recurring event (checkbox):
     - Repeat frequency: Daily, Weekly, Monthly
     - Repeat until: Date or After X occurrences
     - Days of week (for weekly)

3. **Location**
   - Location type: Physical / Online / Hybrid
   - **If Physical:**
     - Venue name (e.g., "Main Sanctuary")
     - Address (full address fields with autocomplete)
     - Map link (auto-generated from address)
   - **If Online:**
     - Meeting link (e.g., Zoom URL)
     - Meeting ID & password
   - **If Hybrid:**
     - Both physical and online fields
   - Seating/capacity (number input, optional)

4. **Registration**
   - Require registration (checkbox)
   - **If registration required:**
     - Registration deadline (date/time picker)
     - Capacity limit (number or "Unlimited")
     - Waitlist enabled (checkbox)
     - Registration fields (checkboxes):
       - Name (always required)
       - Email (always required)
       - Phone (optional checkbox)
       - Age/Date of Birth (optional)
       - Gender (optional)
       - Custom question (text input, repeatable)
     - Registration confirmation email (checkbox, default on)
     - Auto-approve registrations (checkbox) or "Require manual approval"

5. **Ticketing** (if paid event)
   - Is this a paid event? (checkbox)
   - **If paid:**
     - Multiple ticket types (repeatable section):
       - Ticket name (e.g., "General", "VIP", "Student")
       - Price (required, $0 for free)
       - Quantity available
       - Description
       - Sales period (start/end dates)
     - Payment methods: Credit Card, Bank Transfer, Cash (checkboxes)
     - Refund policy (textarea)

6. **Organization**
   - Organized by department (dropdown, optional)
   - Contact person (dropdown of staff/members)
   - Contact email
   - Contact phone

7. **Event Details** (optional)
   - Add speakers/leaders (multi-select, with session/topic for each)
   - Add schedule/agenda (repeatable: time, session name, description)
   - Requirements (textarea: what to bring, prerequisites, dress code)
   - Tags (tag input for searchability)

8. **Visibility & Promotion**
   - Visibility: Public (anyone can view/register) / Private (members only) / Invite Only
   - Publish event (checkbox, event goes live immediately)
   - Feature event (checkbox, shows on homepage)
   - Send notification to members (checkbox, sends SMS/Email on creation)

9. **Advanced Settings**
   - Allow guests/non-members to register (checkbox)
   - Collect dietary restrictions (checkbox)
   - Collect t-shirt size (checkbox)
   - Enable check-in (checkbox)
   - Generate QR codes for tickets (checkbox)
   - Enable feedback survey (checkbox)

**Actions:**
- "Save as Draft" (secondary, saves without publishing)
- "Preview" (opens preview modal)
- "Save & Publish" (primary, saves and makes event live)
- "Cancel" (goes back to events list)

**Validation:**
- End date/time must be after start date/time
- Registration deadline must be before event start
- Capacity must be > 0
- At least one ticket type required if paid event
- Contact person required if registration enabled

**API Endpoints:**
- `POST /events` - Create event
- `PUT /events/:id` - Update event
- `POST /events/:id/duplicate` - Duplicate event

---

### Event Registration (Public)

**Route:** `/events/:id/register`

**Purpose:** Public-facing registration form for members and guests.

**Layout:**

1. **Event Summary (top section)**
   - Event banner image
   - Event name
   - Date & time
   - Location
   - Price (if ticketed)

2. **Registration Form**

   **Step 1: Personal Information**
   - First name (required)
   - Last name (required)
   - Email (required, validated)
   - Phone (required if set by admin)
   - Are you a member? (radio: Yes/No)
     - If Yes: Member ID or Search by name/email (auto-fill)
     - If No: Proceed as guest

   **Step 2: Ticket Selection** (if ticketed)
   - List of ticket types with radio buttons
   - Quantity selector (if multiple tickets allowed)
   - Total price calculation

   **Step 3: Additional Information** (if configured)
   - Age/Date of birth (if required)
   - Gender (dropdown)
   - Custom questions (text/textarea/dropdown based on admin config)
   - Dietary restrictions (textarea, if enabled)
   - T-shirt size (dropdown, if enabled)

   **Step 4: Payment** (if ticketed and payment required)
   - Payment method selection (radio buttons)
   - If Credit Card:
     - Stripe/PayStack payment form
     - Card number, expiry, CVV
   - If Bank Transfer:
     - Bank account details displayed
     - Upload payment proof
   - If Cash:
     - "Pay at the door" message
     - Reservation held for 24 hours

   **Step 5: Confirmation**
   - Review all entered information
   - Terms & conditions checkbox (required)
   - Privacy policy checkbox (required)
   - Email me event updates (checkbox, opt-in)

3. **Submit Button**
   - "Complete Registration" (primary, large)
   - Shows loading spinner during submission

4. **Success Page** (after submission)
   - Success animation (green checkmark)
   - "Registration Confirmed!" message
   - Registration details summary
   - QR code (if enabled, scannable at check-in)
   - "Download Ticket" button (PDF)
   - "Add to Calendar" button (generates .ics file)
   - "Share Event" buttons
   - Next steps instructions

**Features:**
- Save and continue later (for logged-in members, draft saved)
- Mobile-responsive (optimized for phone registration)
- Real-time capacity check (warns if event filling up)
- Automatic form filling for logged-in members
- Email confirmation sent immediately
- Duplicate registration prevention (checks email/phone)

**API Endpoints:**
- `POST /events/:id/register` - Submit registration
- `GET /events/:id/registration-fields` - Get required fields
- `POST /events/:id/check-capacity` - Check available spots
- `GET /registrations/:id/ticket` - Download ticket PDF

---

## SMS Messaging

### Overview

The SMS Messaging module enables churches to communicate with members via text messages. Features include one-time broadcasts, scheduled campaigns, personalized messages, two-way conversations, message templates, delivery tracking, and SMS analytics. All SMS features respect opt-in/opt-out preferences and comply with regulations (TCPA, GDPR).

---

### SMS Dashboard

**Route:** `/sms` or `/messaging/sms`

**Purpose:** Central hub for SMS messaging with overview stats, recent messages, and quick send.

**Layout:**

1. **Header Bar**
   - Title: "SMS Messaging"
   - Branch selector
   - "Compose Message" button (primary, MessageSquare icon)
   - "View Templates" link

2. **Overview Stat Cards (4-column grid)**

   | Card | Icon | Metric | Color |
   |------|------|--------|-------|
   | SMS Credits Remaining | Zap | Count (e.g., "2,450 of 5,000") with progress bar | Blue |
   | Messages Sent This Month | Send | Count (e.g., "347") with % of plan limit | Green |
   | Delivery Rate | CheckCircle | Percentage (e.g., "98.5%") with trend | Purple |
   | Opt-out Rate | UserX | Percentage (e.g., "1.2%") with trend | Orange |

   Each card shows:
   - Large metric number
   - Subtitle with context
   - Trend indicator (vs. last month)
   - "View Details" link

3. **Quick Send Card** (1/3 width)
   - Title: "Quick Send"
   - Recipient selector:
     - All members (checkbox)
     - Specific departments (multi-select)
     - Specific groups (multi-select)
     - Individual members (search and select)
   - Recipient count badge: "247 recipients selected"
   - Message textarea (160 char limit, shows "1 message" or "2 messages" if longer)
   - Character counter: "125 / 160"
   - "Send Now" button (primary)
   - "Schedule for Later" button (secondary)
   - Template dropdown (quick insert)

4. **Recent Messages** (2/3 width)
   - Title: "Recent Campaigns"
   - Table of last 10 sent messages:
     | Message Preview | Recipients | Status | Delivered | Sent Date | Actions |
     |-----------------|------------|--------|-----------|-----------|---------|
     | "Join us this Sunday..." | 247 | Delivered | 243 (98%) | 2 hours ago | View Details |
     | "Event reminder: Youth..." | 56 | Delivered | 56 (100%) | Yesterday | View Details |
   
   - Status badges: Sending (yellow), Delivered (green), Failed (red), Scheduled (blue)
   - Click row → Message detail page
   - Pagination: 10 per page

5. **Scheduled Messages** (below recent messages)
   - List of upcoming scheduled messages
   - Shows:
     - Message preview
     - Recipients count
     - Scheduled date/time
     - Actions: Edit, Cancel, Send Now

6. **SMS Credits Widget** (sidebar or card)
   - Plan name: "Growth Plan"
   - Monthly SMS limit: 1,000
   - Used this month: 347 (35%)
   - Progress bar (color-coded: green <70%, yellow 70-90%, red >90%)
   - Resets on: "April 1, 2026"
   - "Buy More Credits" button (if plan allows top-ups)
   - "Upgrade Plan" link

**API Endpoints:**
- `GET /sms/dashboard?branchId=...` - Dashboard stats
- `GET /sms/messages?limit=10&page=1&branchId=...` - Recent messages
- `GET /sms/scheduled?branchId=...` - Scheduled messages
- `GET /sms/credits` - SMS credits info

---

### Compose Message

**Route:** `/sms/compose`

**Purpose:** Create and send new SMS messages to members.

**Layout:** Split-screen (editor left, preview & recipient list right)

**Left Column (Editor, 3/5 width):**

1. **Recipients Section**
   - Title: "Send To"
   - Selection options (radio or tabs):
     - **All Members** - Shows total count, e.g., "247 members"
     - **Departments** - Multi-select dropdown, shows members per department
     - **Groups** - Multi-select dropdown, shows members per group
     - **Custom List** - Upload CSV or manually add phone numbers
     - **Individuals** - Search members by name/phone, multi-select with checkboxes
   
   - **Filters (for All Members):**
     - Member type: All, Regular, Visitor, Leadership
     - Age group: All, Children, Youth, Adults, Seniors
     - Gender: All, Male, Female
     - Attendance: All, Active (attended in last 30 days), Inactive
   
   - **Recipient Count Badge:** "125 recipients selected" (updates live)
   - **Exclude Opted-Out:** Checkbox (on by default) - "Exclude members who opted out of SMS"
   - "Preview Recipients" link (opens modal with list)

2. **Message Composer**
   - Label: "Message"
   - Textarea (auto-resizing, 4-8 rows)
   - Character counter: "125 / 160 characters (1 message)"
   - SMS segments info: "Messages over 160 characters cost 1 credit per 153 characters"
   - Personalization tags (dropdown, inserts variable):
     - `{{firstName}}` - Member's first name
     - `{{lastName}}` - Member's last name
     - `{{branchName}}` - Church branch name
     - `{{eventName}}` - Event name (if event-related)
     - `{{eventDate}}` - Event date
     - Custom fields (if configured)
   - Emoji picker button
   - "Load Template" button (opens template selector modal)

3. **Link Shortener** (optional)
   - "Add Link" button
   - Input URL, system auto-shortens and inserts into message
   - Shortened URL format: `https://short.church/abc123`
   - Track link clicks in analytics

4. **Sender ID** (if supported by SMS provider)
   - Dropdown: Church Name (default) / Branch Name / Phone Number
   - Info: "Sender ID may not display on all carriers"

5. **Schedule Options**
   - Radio buttons:
     - **Send Now** (default)
     - **Schedule for Later**
       - Date picker
       - Time picker
       - Timezone display
   - Smart send (checkbox): "Send at optimal time for each recipient (based on their timezone and engagement data)"

6. **Test Message**
   - "Send Test Message" button
   - Opens modal: Enter phone number, sends test before campaign

**Right Column (Preview & Summary, 2/5 width, sticky):**

1. **Message Preview Card**
   - Title: "Preview"
   - Mock phone screen showing message
   - Sender displayed (Church Name or number)
   - Message text with personalization tags replaced with sample data
   - Timestamp (e.g., "Now")
   - Switches between different member types to show personalization

2. **Recipient Summary Card**
   - Total recipients: 125
   - Breakdown:
     - Members: 100
     - Visitors: 25
     - Opted out (excluded): 3
   - By department (if filtered):
     - Youth: 45
     - Young Adults: 30
     - Others: 50
   - By location (if multi-branch):
     - Branch A: 75
     - Branch B: 50
   - "View Full List" button (opens modal)

3. **Cost Estimate Card**
   - SMS credits required: 125 (1 message × 125 recipients)
   - SMS credits available: 875
   - Remaining after send: 750
   - Warning if insufficient credits: "Not enough credits. Buy more or reduce recipients."

4. **Sending Rules Card** (info panel)
   - Quiet hours: "SMS will not be sent between 9 PM - 8 AM (recipient's local time)"
   - Frequency limit: "Maximum 1 promotional message per day per recipient"
   - Compliance: "All recipients have opted in to receive SMS"

**Action Buttons (bottom of right column):**
- "Send Message" (primary, large, gradient)
- "Schedule" (secondary, if scheduled option selected)
- "Save as Draft" (tertiary)
- "Cancel" (goes back to dashboard)

**Sending Flow:**
1. Validate recipients (at least 1 selected)
2. Validate message (not empty, ≤ 1,000 chars)
3. Check SMS credits (sufficient balance)
4. Confirmation modal (if sending to >100 recipients):
   - Shows recipient count, message preview, cost
   - "Confirm Send" button
5. API call: `POST /sms/send`
6. Progress indicator (for large campaigns, shows "Sending X of Y")
7. Success toast: "Message sent to 125 recipients!"
8. Redirect to message detail page

**API Endpoints:**
- `POST /sms/send` - Send SMS campaign
- `POST /sms/schedule` - Schedule SMS campaign
- `POST /sms/test` - Send test message
- `GET /sms/recipient-count?filters=...` - Get recipient count

---

### Message Detail

**Route:** `/sms/:id`

**Purpose:** Detailed view of a sent or scheduled SMS campaign with delivery stats and recipient list.

**Layout:**

**Header Section:**
- Message preview (in gray bubble, as sent)
- Message ID badge
- Status badge: Sending / Delivered / Failed / Scheduled / Cancelled
- Sent by: Staff name
- Sent date/time (or scheduled date/time)
- Action buttons:
  - Resend (creates a copy for editing)
  - Cancel (if scheduled)
  - Download Report (CSV/PDF)

**Stats Cards (4-column grid):**

| Card | Icon | Metric | Description |
|------|------|--------|-------------|
| Total Sent | Send | 125 | Number of messages sent |
| Delivered | CheckCircle | 123 (98.4%) | Successfully delivered |
| Failed | XCircle | 2 (1.6%) | Failed to deliver |
| Link Clicks | MousePointer | 45 (36%) | Clicked embedded link (if applicable) |

**Delivery Timeline (Line Chart):**
- X-axis: Time (hours since sent, or for scheduled: hours before/after send time)
- Y-axis: Number of messages delivered
- Shows delivery speed (most SMS deliver within minutes)

**Recipient Details Table:**
| Member | Phone | Status | Delivered At | Failure Reason | Actions |
|--------|-------|--------|--------------|----------------|---------|
| John Doe | +1234567890 | Delivered | 10:32 AM | - | View Profile |
| Jane Smith | +0987654321 | Failed | - | Invalid number | Update Phone |

- Status badges: Delivered (green), Failed (red), Pending (yellow), Opted Out (gray)
- Failure reasons: Invalid number, Blocked by carrier, Opted out, Network error
- Search members by name
- Filter by status
- Export recipient list
- Pagination: 20/50/100 per page

**Opt-out Tracking:**
- Shows any members who opted out after receiving this message
- "X members opted out after this message"
- List of opted-out members with opt-out timestamp

**Message Info Card:**
- Message length: 125 characters (1 SMS segment)
- Recipients: 125
- Cost: 125 SMS credits
- Template used: "Sunday Service Reminder" (if applicable)
- Personalization: Yes ({{firstName}} used)
- Scheduled by: Staff name (if scheduled)

**API Endpoints:**
- `GET /sms/:id` - Message details
- `GET /sms/:id/recipients` - Recipient delivery status
- `POST /sms/:id/cancel` - Cancel scheduled message
- `POST /sms/:id/resend` - Create copy for resending

---

### Message Templates

**Route:** `/sms/templates`

**Purpose:** Create and manage reusable SMS message templates for common communications.

**Layout:**

1. **Header Bar**
   - Title: "SMS Templates"
   - Template count badge
   - "Create Template" button (primary)

2. **Filters**
   - Search templates by name or content
   - Category dropdown: All, Announcement, Event Reminder, Giving, Welcome, Follow-up, Emergency, Custom

3. **Templates Grid (2-3 columns, responsive)**

   Each template card shows:
   - Template name (bold)
   - Category badge (colored)
   - Message preview (3-line clamp)
   - Character count (e.g., "125 characters")
   - Personalization tags count (e.g., "2 variables")
   - Usage count (e.g., "Used 15 times")
   - Last used (relative time)
   - Actions:
     - "Use Template" (copies to compose page)
     - "Edit" (opens edit modal)
     - "Delete" (with confirmation)

4. **System Templates** (separate section)
   - Pre-defined templates provided by platform
   - Read-only (can duplicate to customize)
   - Examples:
     - "Sunday Service Reminder"
     - "Event Registration Confirmation"
     - "Giving Thank You"
     - "New Member Welcome"
     - "Birthday Greeting"
     - "Emergency Alert"

**Create/Edit Template Modal:**

**Form Fields:**
- Template name (required, max 100 chars)
- Category dropdown (required)
- Message content (required, textarea, max 1,000 chars)
  - Character counter updates live
  - Shows SMS segment count
  - Personalization helper: Insert variable button (dropdown with tags)
- Personalization tags (auto-detected from message, displayed as chips)
- Use case description (optional, helps team understand when to use template)

**Personalization Tags Available:**
- `{{firstName}}` - Member's first name
- `{{lastName}}` - Member's last name
- `{{fullName}}` - Member's full name
- `{{branchName}}` - Church branch name
- `{{churchName}}` - Church name
- `{{eventName}}` - Event name
- `{{eventDate}}` - Event date
- `{{eventTime}}` - Event time
- `{{eventLocation}}` - Event location
- `{{amount}}` - Giving amount
- `{{date}}` - Current date
- `{{time}}` - Current time
- Custom fields (configured in settings)

**Actions:**
- "Save Template" (primary)
- "Save & Use" (saves and redirects to compose with template loaded)
- "Cancel"

**Template Interface:**
```typescript
interface SMSTemplate {
  _id: string;
  name: string;
  category: string;
  content: string;
  variables: string[]; // Extracted {{variable}} names
  characterCount: number;
  segmentCount: number; // SMS segments
  usageCount: number;
  isSystem: boolean;
  branchId?: string; // Branch-specific templates
  createdBy: string; // User ID
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
}
```

**API Endpoints:**
- `GET /sms/templates?category=...&search=...` - List templates
- `GET /sms/templates/:id` - Get template
- `POST /sms/templates` - Create template
- `PUT /sms/templates/:id` - Update template
- `DELETE /sms/templates/:id` - Delete template
- `POST /sms/templates/:id/duplicate` - Duplicate system template

---

### Two-Way Conversations

**Route:** `/sms/conversations`

**Purpose:** Manage two-way SMS conversations with members (if supported by SMS provider and plan).

**Layout:**

1. **Header Bar**
   - Title: "SMS Conversations"
   - Branch selector
   - Unread count badge (e.g., "5 unread")
   - Filter: All / Unread / Archived

2. **Conversation List (Left Sidebar, 1/3 width)**

   List of conversations (sorted by most recent):
   - Member profile photo (48px)
   - Member name (bold if unread)
   - Last message preview (gray, italic, 1-line truncate)
   - Timestamp (relative: "2 min ago" / "Yesterday")
   - Unread indicator (blue dot)
   - Click conversation → Opens in detail panel

   **Filters:**
   - Search by member name or message content
   - Status: All, Unread, Archived, Flagged
   - Sort: Newest First, Oldest First, Unread First

3. **Conversation Detail (Right Panel, 2/3 width)**

   **Header:**
   - Member profile photo (64px) + name
   - Phone number (with copy button)
   - "View Profile" link
   - Actions: Archive, Flag for Follow-up, Block Number

   **Messages Thread:**
   - Chat interface (WhatsApp-style)
   - Incoming messages (left-aligned, gray bubbles)
   - Outgoing messages (right-aligned, blue bubbles)
   - Timestamps on each message
   - Delivery status for outgoing: Sent / Delivered / Failed
   - Auto-scroll to latest message
   - "Load More" button for older messages

   **Reply Section (bottom):**
   - Textarea for typing reply
   - Character counter
   - Emoji picker button
   - "Send" button (primary, Shift+Enter to send)
   - "Add to template" button (saves this reply as a template)

   **Quick Replies (above textarea):**
   - Pre-defined quick response buttons:
     - "Thank you!"
     - "We'll get back to you soon"
     - "Please call the church office"
     - Custom quick replies (admin-defined)
   - Click button → Inserts text into textarea

   **Member Info Sidebar (collapsible):**
   - Member details (name, email, department)
   - Recent activity (attendance, events)
   - Notes (staff can add internal notes about this conversation)

**Features:**
- Real-time updates (new messages appear instantly via WebSocket)
- Push notifications for new incoming messages
- Auto-reply for off-hours (configurable in settings)
- Keyword triggers (e.g., "STOP" → auto-opt-out, "HELP" → auto-reply with info)
- Assignment (assign conversation to specific staff member for follow-up)
- Tags (tag conversations: "Prayer Request", "Question", "Feedback", etc.)

**Empty State (no messages):**
- "No messages yet"
- "When members reply to your SMS, their messages will appear here"

**API Endpoints:**
- `GET /sms/conversations?branchId=...&status=...` - List conversations
- `GET /sms/conversations/:id/messages` - Get messages in conversation
- `POST /sms/conversations/:id/reply` - Send reply
- `PUT /sms/conversations/:id/archive` - Archive conversation
- `PUT /sms/conversations/:id/flag` - Flag for follow-up

---

### SMS Analytics

**Route:** `/sms/analytics`

**Purpose:** Comprehensive analytics for SMS campaigns with delivery metrics, engagement data, and trends.

**Layout:**

1. **Header Bar**
   - Title: "SMS Analytics"
   - Branch selector
   - Date range selector (Last 7/30/90 Days, Custom)
   - "Export Report" button (PDF with charts)

2. **Overview Cards (4-column grid)**

   | Card | Icon | Metric | Description |
   |------|------|--------|-------------|
   | Total Sent | Send | 2,450 | Total SMS sent in period |
   | Delivery Rate | CheckCircle | 98.2% | Percentage delivered successfully |
   | Average Response Rate | MessageCircle | 12.5% | Percentage of recipients who replied (if two-way enabled) |
   | Opt-out Rate | UserX | 1.8% | Percentage who opted out |

3. **Sending Trend (Line Chart)**
   - X-axis: Date
   - Y-axis: Number of SMS sent
   - Shows daily/weekly/monthly sending volume (based on date range)
   - Helps identify campaign frequency

4. **Delivery Status (Donut Chart)**
   - Delivered: 2,405 (98.2%) - Green
   - Failed: 35 (1.4%) - Red
   - Pending: 10 (0.4%) - Yellow

5. **Failure Reasons (Bar Chart)**
   - Invalid Number: 15
   - Blocked by Carrier: 8
   - Network Error: 7
   - Opted Out: 5

6. **Top Performing Campaigns (Table)**
   - Ranked by delivery rate, engagement (clicks/replies)
   - Columns: Campaign Name, Sent Date, Recipients, Delivered, Clicks, Replies, Score

7. **Engagement Over Time (Line Chart)**
   - If two-way SMS enabled
   - Shows reply rate trend over time
   - Helps identify best times for high engagement

8. **SMS Credits Usage (Stacked Bar Chart)**
   - Monthly view (last 12 months)
   - Shows credits used vs. credits available
   - Color-coded by usage level

9. **Recipient Demographics**
   - By age group (bar chart)
   - By gender (pie chart)
   - By member type (donut chart)
   - By department (horizontal bar chart)

10. **Best Sending Times (Heatmap)**
    - Similar to Social Media Analytics heatmap
    - 7 rows (days) × 24 columns (hours)
    - Color intensity based on delivery + open/click rates
    - Helps determine optimal send times

11. **Message Length Analysis**
    - Average message length: 145 characters
    - Distribution by segment count (1 segment, 2 segments, 3+ segments)
    - Cost analysis (credits per message)

**Empty State:**
- "No SMS sent yet"
- "Send your first campaign to start tracking analytics"

**API Endpoints:**
- `GET /sms/analytics/overview?branchId=...&startDate=...&endDate=...` - Overview stats
- `GET /sms/analytics/trend?period=...` - Sending trend data
- `GET /sms/analytics/campaigns?top=10` - Top campaigns
- `GET /sms/analytics/demographics?branchId=...` - Recipient demographics

---

### SMS Settings

**Route:** `/settings/sms`

**Purpose:** Configure SMS provider, sender ID, opt-in/opt-out preferences, and compliance settings.

**Settings Sections:**

1. **SMS Provider**
   - Provider dropdown: Twilio, Vonage (Nexmo), Africa's Talking, Termii, Custom
   - API credentials fields (API Key, Secret, Account SID)
   - "Test Connection" button (sends test SMS to admin phone)
   - Webhook URL (for delivery receipts and incoming messages)

2. **Sender ID**
   - Default sender ID: Church Name (text input, max 11 chars for alphanumeric)
   - Use phone number as sender (checkbox, if alpha sender ID not supported)
   - Phone number (verified, from SMS provider)

3. **Opt-in/Opt-out**
   - Require opt-in (checkbox): "Members must explicitly opt in to receive SMS"
   - Opt-in method:
     - Auto opt-in on member creation (checkbox)
     - Require manual opt-in (checkbox)
     - Double opt-in (checkbox, sends confirmation SMS)
   - Opt-out keyword: "STOP" (default, customizable)
   - Auto-reply on opt-out: "You have been unsubscribed from SMS. Reply START to resubscribe."
   - Opt-in keyword: "START" (default, allows re-opt-in)

4. **Quiet Hours**
   - Enable quiet hours (checkbox): "Don't send SMS during specified hours"
   - Start time: 9:00 PM (time picker)
   - End time: 8:00 AM (time picker)
   - Timezone: Use recipient's timezone / Church timezone (radio)
   - What happens during quiet hours:
     - Queue messages (deliver when quiet hours end)
     - Fail messages (don't send)

5. **Frequency Limits**
   - Maximum promotional SMS per day: 1 (number input)
   - Maximum SMS per week: 3 (number input)
   - Exclude transactional SMS (checkbox): "Registration confirmations, receipts, etc. don't count toward limit"

6. **Auto-replies** (if two-way enabled)
   - Enable auto-replies (checkbox)
   - Off-hours auto-reply:
     - Message: "Thank you for your message. We're currently offline. We'll respond during office hours (Mon-Fri, 9 AM - 5 PM)."
   - "HELP" keyword reply:
     - Message: "For assistance, call [phone] or email [email]. Office hours: Mon-Fri, 9 AM - 5 PM."
   - Custom keyword triggers (repeatable):
     - Keyword: "INFO"
     - Reply: "Visit our website: [url]"

7. **Compliance**
   - Include opt-out instructions (checkbox): "Automatically append 'Reply STOP to unsubscribe' to promotional SMS"
   - GDPR compliance (checkbox): "Only send to members who have given explicit consent"
   - TCPA compliance (checkbox, for US): "Respect Do Not Call list"
   - Data retention: Delete SMS logs after X months (dropdown: 3/6/12/24/Never)

8. **Notifications**
   - Email me when:
     - SMS credits below threshold (checkbox, threshold: 100 credits)
     - Delivery rate drops below X% (checkbox, threshold: 95%)
     - Member opts out (checkbox)
     - Reply received (checkbox)

**Actions:**
- "Save Settings" (primary)
- "Test Configuration" (sends test SMS to verify setup)

**API Endpoints:**
- `GET /settings/sms` - Get SMS settings
- `PUT /settings/sms` - Update SMS settings
- `POST /settings/sms/test` - Test SMS configuration

---

## Sermon Management

### Overview

The Sermon Management module provides tools for archiving, organizing, and distributing sermon recordings (audio/video), notes, and related resources. Features include sermon series tracking, speaker management, topic tagging, search/filter, public sermon library (optional), and download/streaming.

---

### Sermon Library

**Route:** `/sermons`

**Purpose:** Central archive of all sermons with filtering, search, and playback.

**Layout:**

1. **Header Bar**
   - Title: "Sermon Library"
   - Branch selector (if multi-branch)
   - Sermon count badge (e.g., "247 sermons")
   - "Upload Sermon" button (primary, Upload icon)

2. **View Toggle**
   - Grid View (default, cards with thumbnails)
   - List View (table format)
   - Series View (grouped by series)

3. **Filters & Search (4 columns + search bar)**

   | Filter | Type | Options |
   |--------|------|---------|
   | Search | Text input | Search by title, speaker, series, scripture, topic |
   | Series | Dropdown | All Series, plus dynamically loaded series names |
   | Speaker | Dropdown | All Speakers, plus dynamically loaded speaker names |
   | Date Range | Date picker | All Time, This Year, Last Year, Last 30 Days, Custom |
   | Media Type | Dropdown | All, Audio Only, Video, Notes Only |
   | Topic/Tag | Multi-select | All topics (e.g., Faith, Prayer, Worship, Leadership) |

   - "Clear Filters" button
   - "Sort by" dropdown: Newest First, Oldest First, Title A-Z, Most Downloads, Most Viewed

4. **Sermon Grid (3-column responsive)**

   Each sermon card shows:
   - Thumbnail image (16:9, 400x225px):
     - Custom uploaded image, or
     - Video screenshot, or
     - Series artwork, or
     - Default placeholder with church logo
   - Play button overlay (if audio/video available)
   - Duration badge (top-right, e.g., "45:30")
   - Media type icons (bottom-left: Audio, Video, Notes badges)
   - Sermon title (bold, 2-line clamp)
   - Speaker name with profile photo (32px)
   - Series name (if part of series, with link to series)
   - Date preached (formatted: "March 10, 2026")
   - Scripture reference (e.g., "John 3:16-21")
   - View count (e.g., "1.2K views")
   - Download count (e.g., "350 downloads")
   - Quick actions on hover:
     - Play (opens player modal)
     - Download (audio/video/notes)
     - Share (social share buttons)
     - Edit (admin only)

5. **Series View** (if toggled)
   - Groups sermons by series
   - Each series section shows:
     - Series title (large, bold)
     - Series artwork (banner, 21:9 ratio)
     - Series description (expandable)
     - Total sermons in series
     - List/grid of sermons in series
     - "View All" link

6. **Quick Stats (top of page, collapsible)**
   - Total sermons: 247
   - Total series: 15
   - Total speakers: 8
   - Total hours of content: 187 hours
   - Most popular sermon (title + views)
   - Recent uploads (last 7 days): 2

**API Endpoints:**
- `GET /sermons?branchId=...&series=...&speaker=...&startDate=...&endDate=...&search=...` - List sermons
- `GET /sermons/stats?branchId=...` - Sermon statistics

---

### Sermon Detail

**Route:** `/sermons/:id`

**Purpose:** Detailed view of a single sermon with playback, notes, and related content.

**Layout:**

**Hero Section:**
- Large thumbnail/video player (16:9, full width, max height 500px)
- If video: Native HTML5 video player with controls
- If audio only: Large audio player with waveform visualization
- Play/Pause button (centered, large)
- Progress bar (shows current time / total duration)
- Volume control
- Playback speed control (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
- Fullscreen button (for video)
- Download button (downloads media file)

**Below Player:**

**Left Column (2/3 width):**

1. **Sermon Information Card**
   - Sermon title (large, bold)
   - Speaker with profile photo (64px)
   - Date preached (full format: "Sunday, March 10, 2026")
   - Series badge (clickable, links to series page)
   - Scripture reference (large, e.g., "John 3:16-21")
   - Service type (Sunday Service, Midweek, Special Event, etc.)
   - Topic tags (clickable pills: "Faith", "Grace", "Salvation")

2. **Description**
   - Full sermon description (rich text, expandable)
   - Key points (bullet list)
   - Sermon outline (collapsible section)

3. **Scripture Passage**
   - Full Bible passage displayed (fetched from Bible API if available)
   - Bible version dropdown (KJV, NIV, ESV, NKJV, etc.)
   - Copy button

4. **Sermon Notes** (if available)
   - PDF embed viewer (inline)
   - "Download Notes" button (PDF file)
   - "Print Notes" button
   - Formatted HTML notes (if PDF not available)

5. **Discussion Questions** (if available)
   - List of reflection/discussion questions
   - Useful for small groups

6. **Related Sermons** (horizontal scroll)
   - 5-6 sermon cards (same format as library grid)
   - Based on: Same series, Same speaker, Same topic

**Right Column (1/3 width, sticky):**

1. **Quick Actions Card**
   - "Download Audio" button (MP3)
   - "Download Video" button (MP4, if available)
   - "Download Notes" button (PDF, if available)
   - "Share Sermon" button (social share: WhatsApp, Facebook, Email, Copy Link)
   - "Add to Playlist" button (if playlists feature enabled)
   - "Report Issue" button (for audio/video problems)

2. **Sermon Metadata Card**
   - Duration: 45:30
   - File size: Audio (25 MB), Video (450 MB)
   - Views: 1,234
   - Downloads: 350
   - Date uploaded: March 10, 2026
   - Uploaded by: Admin name

3. **Series Information Card** (if part of series)
   - Series artwork (150x150px)
   - Series name (bold)
   - "Part X of Y" badge
   - Series description (2-line clamp)
   - "View Full Series" button

4. **Speaker Bio Card**
   - Speaker profile photo (80x80px)
   - Speaker name
   - Title/Role (e.g., "Lead Pastor", "Guest Speaker")
   - Short bio (3-line clamp)
   - "View All Sermons" link (filter library by this speaker)
   - Contact info (if public)

5. **Scripture Memory Card**
   - Featured verse from sermon
   - Large text display
   - "Save to Memory Verses" button
   - "Share Verse" button (image quote card generated)

6. **Upcoming Events Card** (related to sermon topic)
   - If sermon topic aligns with an upcoming event
   - Event card with date and "Register" button

**Comments/Feedback Section** (below left column, full width):
- If comments enabled (admin setting)
- List of member comments with:
  - Commenter name + profile photo
  - Comment text
  - Timestamp
  - Like button + like count
  - Reply button (threaded replies)
- "Add Comment" form (textarea + submit button)
- Requires login to comment

**Admin Actions (top-right, for staff only):**
- Edit Sermon (Pencil icon)
- Delete Sermon (Trash icon, with confirmation)
- Toggle Visibility (Eye icon: Public/Private/Members Only)
- Analytics (BarChart icon, opens detailed stats)

**API Endpoints:**
- `GET /sermons/:id` - Get sermon details
- `POST /sermons/:id/view` - Increment view count (called on page load)
- `POST /sermons/:id/download` - Track download (returns download URL)
- `GET /sermons/:id/related` - Get related sermons
- `POST /sermons/:id/comments` - Add comment (if enabled)
- `GET /sermons/:id/comments` - Get comments

---

### Upload Sermon

**Route:** `/sermons/upload`

**Purpose:** Upload and publish new sermon recordings with metadata.

**Layout:** Multi-step wizard

**Step 1: Media Upload**

- **Media Type Selection** (radio buttons):
  - Audio Only (MP3, M4A, WAV)
  - Video (MP4, MOV, AVI)
  - Audio + Video (upload both)
  - Notes Only (PDF, for transcript/notes without media)

- **Upload Zones:**
  - **Audio File** (if Audio selected):
    - Drag-and-drop zone
    - "Browse Files" button
    - Accepted formats: MP3, M4A, WAV, AAC
    - Max file size: 500 MB (plan-dependent)
    - Progress bar during upload
    - Audio preview player (after upload)
  
  - **Video File** (if Video selected):
    - Drag-and-drop zone
    - "Browse Files" button
    - Accepted formats: MP4, MOV, AVI, MKV
    - Max file size: 5 GB (plan-dependent)
    - Progress bar during upload
    - Video preview player (after upload)
  
  - **Sermon Notes** (optional):
    - Drag-and-drop zone for PDF
    - "Browse Files" button
    - Accepted format: PDF
    - Max file size: 50 MB

- **Thumbnail Image** (optional):
  - Drag-and-drop zone
  - "Browse Files" button
  - Accepted formats: JPG, PNG
  - Recommended size: 1280x720px (16:9)
  - If not uploaded, system auto-generates from video or uses series artwork

- **YouTube Link** (alternative to upload):
  - Text input for YouTube URL
  - "Import" button (fetches video from YouTube)
  - Info: "Video will be embedded, not downloaded"

**Step 2: Sermon Information**

- **Basic Information:**
  - Sermon title (required, max 200 chars)
  - Speaker (dropdown, searchable):
    - Select existing speaker
    - "Add New Speaker" button (opens modal)
  - Date preached (required, date picker)
  - Service type (dropdown): Sunday Service, Midweek Service, Special Event, Revival, Conference, Other

- **Scripture Reference:**
  - Book (dropdown: Genesis - Revelation)
  - Chapter (number input)
  - Verse range (text input, e.g., "16-21" or "16")
  - "Add Another Reference" button (for multiple scriptures)
  - Preview: Shows "John 3:16-21" format

- **Series** (optional):
  - Dropdown: None (standalone sermon), or select existing series
  - "Create New Series" button (opens modal)
  - If series selected:
    - Part number (e.g., "Part 3 of 12")

- **Description:**
  - Rich text editor (2000 char max)
  - Toolbar: Bold, Italic, List, Link
  - Suggested sections:
    - Overview
    - Key Points
    - Application

- **Sermon Outline** (optional):
  - Repeatable section (add/remove points)
  - Each point:
    - Title (text input)
    - Description (textarea)
  - Drag handle to reorder points

**Step 3: Additional Details**

- **Topics/Tags:**
  - Tag input (comma-separated or press Enter)
  - Suggested tags (based on scripture/title): Faith, Prayer, Worship, Leadership, Grace, Salvation, Holy Spirit, etc.
  - Up to 10 tags

- **Discussion Questions** (optional):
  - Repeatable textarea (add/remove questions)
  - Useful for small groups or Bible study

- **Key Verse/Quote** (optional):
  - Text input for a memorable verse or quote from sermon
  - Used for social media sharing

- **Language:**
  - Dropdown: English (default), Spanish, French, etc.
  - For multi-lingual churches

- **Target Audience** (optional):
  - Checkboxes: General, Youth, Children, Adults, Seniors, New Believers, Leaders

**Step 4: Settings**

- **Visibility:**
  - Public (anyone can view, including non-members)
  - Members Only (requires login)
  - Private (staff only, for review before publishing)

- **Allow Downloads:**
  - Checkbox: Enable audio download
  - Checkbox: Enable video download
  - Checkbox: Enable notes download

- **Allow Comments:**
  - Checkbox: Enable member comments
  - Info: "Comments require moderation by staff"

- **Featured:**
  - Checkbox: Feature on homepage
  - Info: "Featured sermons appear in the hero slider"

- **Publish Date/Time:**
  - Publish immediately (radio, default)
  - Schedule for later (radio, shows date/time picker)

**Step 5: Review & Publish**

- Summary of all entered information:
  - Media preview (audio/video player)
  - Sermon title, speaker, date, scripture
  - Description preview
  - Series info (if applicable)
  - Tags, visibility, settings
- "Edit" buttons next to each section (goes back to that step)
- "Save as Draft" button (saves without publishing)
- "Publish Sermon" button (primary, large)

**Publishing Flow:**
1. Validate all required fields
2. Upload media files to cloud storage (S3/Cloudinary)
3. Process video (generate thumbnail, multiple quality levels for streaming)
4. Process audio (generate waveform, normalize volume)
5. Save sermon record to database
6. If "Publish immediately": Set status to published
7. If "Schedule": Set status to scheduled, publish at specified time
8. Send notification to members (if enabled in settings)
9. Success message and redirect to sermon detail page

**API Endpoints:**
- `POST /sermons/upload/media` - Upload media files (multipart/form-data)
- `POST /sermons` - Create sermon record
- `POST /sermons/draft` - Save as draft
- `POST /sermons/:id/publish` - Publish draft sermon

---

### Sermon Series

**Route:** `/sermons/series`

**Purpose:** Manage sermon series (multi-part sermon collections).

**Layout:**

1. **Header Bar**
   - Title: "Sermon Series"
   - Branch selector
   - Series count badge
   - "Create Series" button (primary)

2. **Series Grid (2-3 columns, responsive)**

   Each series card shows:
   - Series artwork (large banner, 16:9, 500x281px)
   - Series title (bold, large)
   - Total sermons in series (badge, e.g., "12 sermons")
   - Date range (e.g., "Jan 2026 - Mar 2026")
   - Status badge: Ongoing (blue) / Completed (green) / Upcoming (yellow)
   - Description preview (2-line clamp)
   - Progress bar (sermons published vs. total planned)
   - Speaker(s) (profile photos, overlapping)
   - Quick actions:
     - View Series (goes to series detail page)
     - Add Sermon (quick add to series)
     - Edit Series
     - Delete Series

3. **Filters:**
   - Search series by title
   - Status: All, Ongoing, Completed, Upcoming
   - Year: All, 2026, 2025, 2024, etc.
   - Speaker: All, plus list of speakers

**Series Detail Page** (`/sermons/series/:id`)

**Header:**
- Large series artwork (banner, full width, 21:9 ratio)
- Series title (overlay, large white text with shadow)
- Subtitle/Tagline
- Status badge
- Actions: Edit Series, Delete Series, Share Series

**Series Info:**
- Total sermons: 12
- Duration: 3 months (Jan - Mar 2026)
- Speaker(s): Pastor John Doe, Guest speakers
- Description (full, rich text, expandable)
- Series goals/themes

**Sermons in Series (list or grid):**
- Chronological order (Part 1, Part 2, etc.)
- Each sermon shows:
  - Part number badge
  - Sermon title
  - Speaker
  - Date preached
  - Scripture reference
  - Duration
  - View/download counts
  - Play button
- "Play All" button (plays sermons sequentially)
- Download all (zip file with all audio/notes)

**Series Stats (if completed):**
- Total views: 12.5K
- Total downloads: 3.2K
- Average sermon length: 42 minutes
- Most popular sermon in series

**Related Series:**
- Other series by same speaker
- Other series in same topic/theme

**Create/Edit Series Form:**
- Series title (required)
- Subtitle/Tagline (optional)
- Description (rich text, 2000 chars)
- Series artwork (upload, 1920x1080px recommended)
- Speaker(s) (multi-select)
- Start date (date picker)
- End date (date picker, optional)
- Total planned sermons (number input)
- Status: Upcoming, Ongoing, Completed
- Topics/Tags (tag input)
- Visibility: Public, Members Only, Private

**API Endpoints:**
- `GET /sermons/series` - List series
- `GET /sermons/series/:id` - Series details
- `POST /sermons/series` - Create series
- `PUT /sermons/series/:id` - Update series
- `DELETE /sermons/series/:id` - Delete series
- `GET /sermons/series/:id/sermons` - Sermons in series

---

### Speakers

**Route:** `/sermons/speakers`

**Purpose:** Manage speaker profiles (pastors, guest speakers, teachers).

**Layout:**

1. **Header Bar**
   - Title: "Speakers"
   - Speaker count badge
   - "Add Speaker" button (primary)

2. **Speakers Grid (3-4 columns)**

   Each speaker card shows:
   - Profile photo (120x120px, circle)
   - Name (bold)
   - Title/Role (e.g., "Lead Pastor", "Youth Pastor", "Guest Speaker")
   - Total sermons (e.g., "45 sermons")
   - Latest sermon (title + date)
   - Quick actions: View Profile, Edit, Delete

**Speaker Profile Page** (`/sermons/speakers/:id`)

**Header:**
- Large profile photo (200x200px)
- Name (large, bold)
- Title/Role
- Contact info (email, phone, if public)
- Social media links (Facebook, Twitter, Instagram, website)

**Bio:**
- Full biography (rich text, expandable)
- Education
- Ministry experience
- Areas of expertise

**Sermons by This Speaker:**
- Grid/list of all sermons
- Total count
- Filter by series, date, topic
- Sort by date, views, downloads

**Stats:**
- Total sermons: 45
- Total hours: 34 hours
- Total views: 15.2K
- Total downloads: 4.5K
- Average sermon length: 45 minutes
- Most popular sermon (title + views)

**Sermon Series Led:**
- List of series where this speaker was primary speaker

**Add/Edit Speaker Form:**
- Full name (required)
- Title/Role (e.g., "Senior Pastor")
- Profile photo (upload, 500x500px recommended)
- Bio (rich text, 2000 chars)
- Email (optional)
- Phone (optional)
- Website (optional)
- Social media links (Facebook, Twitter, Instagram, YouTube)
- Visibility: Public (profile visible to all), Private (internal only)

**API Endpoints:**
- `GET /sermons/speakers` - List speakers
- `GET /sermons/speakers/:id` - Speaker details
- `POST /sermons/speakers` - Add speaker
- `PUT /sermons/speakers/:id` - Update speaker
- `DELETE /sermons/speakers/:id` - Delete speaker
- `GET /sermons/speakers/:id/sermons` - Speaker's sermons

---

### Sermon Analytics

**Route:** `/sermons/analytics`

**Purpose:** Detailed analytics for sermon library usage and engagement.

**Layout:**

1. **Header Bar**
   - Title: "Sermon Analytics"
   - Branch selector
   - Date range selector (Last 30/90/365 Days, All Time)
   - "Export Report" button (PDF/CSV)

2. **Overview Cards (4-column grid)**

   | Card | Icon | Metric |
   |------|------|--------|
   | Total Sermons | Mic | 247 |
   | Total Views | Eye | 125.5K |
   | Total Downloads | Download | 35.2K |
   | Average View Duration | Clock | 32 minutes (of 45 min avg sermon length) |

3. **Views Over Time (Line Chart)**
   - X-axis: Date
   - Y-axis: View count
   - Shows daily/weekly/monthly views
   - Helps identify trends

4. **Top Sermons (Table)**
   - Ranked by views/downloads
   - Columns: Rank, Sermon Title, Speaker, Date, Views, Downloads, Avg. Watch Time
   - Top 20 shown, expandable to full list

5. **Top Series (Bar Chart)**
   - Horizontal bar chart
   - Shows series by total views across all sermons

6. **Top Speakers (Bar Chart)**
   - Horizontal bar chart
   - Shows speakers by total views across all sermons

7. **Popular Topics (Word Cloud or Bar Chart)**
   - Shows most viewed topics/tags
   - Clickable (filters sermon library by topic)

8. **Engagement Metrics:**
   - Average completion rate: 68% (how much of sermon is watched)
   - Peak viewership time: Sundays at 2 PM (when most people watch)
   - Platform breakdown: Website (60%), Mobile App (30%), Podcast (10%)

9. **Audience Demographics** (if tracking enabled):
   - By age group (bar chart)
   - By gender (pie chart)
   - By location (map view)
   - By member status (Members vs. Visitors)

10. **Download Stats:**
    - Audio downloads: 25.5K
    - Video downloads: 8.2K
    - Notes downloads: 1.5K
    - Podcast subscriptions: 2.3K

11. **Search Queries:**
    - Top search terms (what people search for in sermon library)
    - Helps identify content gaps

**API Endpoints:**
- `GET /sermons/analytics/overview?branchId=...&startDate=...&endDate=...` - Overview stats
- `GET /sermons/analytics/top-sermons?limit=20` - Top sermons
- `GET /sermons/analytics/top-series` - Top series
- `GET /sermons/analytics/engagement` - Engagement metrics

---

### Sermon Settings

**Route:** `/settings/sermons`

**Settings Sections:**

1. **Public Access:**
   - Make sermon library public (checkbox): "Allow non-members to view/listen to sermons"
   - Require login for downloads (checkbox)
   - Embed sermons on website (checkbox): "Allow sermons to be embedded on your website"

2. **Media Storage:**
   - Storage provider: AWS S3 / Cloudinary / Local Server (dropdown)
   - Storage credentials (if cloud provider)
   - Video quality levels: Auto (adaptive), 1080p, 720p, 480p, 360p (checkboxes)
   - Audio quality: High (320kbps) / Medium (192kbps) / Low (128kbps)

3. **Auto-publishing:**
   - Auto-publish sermons after upload (checkbox)
   - Auto-generate thumbnails (checkbox)
   - Auto-transcribe audio (checkbox, if transcription service integra…