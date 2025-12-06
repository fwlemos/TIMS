# PRD: TIMS - Tennessine Integrative Management Software (Core MVP)

**Version:** 1.0  
**Date:** December 3, 2025  
**Status:** Draft  
**Author:** Product Team  

---

## 1. Introduction/Overview

### What is TIMS?

TIMS (Tennessine Integrative Management Software) is an internal business management platform designed for Tennessine, a company that distributes research and development equipment from global manufacturers. Tennessine operates through two offices:

- **TIA (Tennessine Instrumentação Analítica):** Based in Brazil, handles nationalized sales in BRL
- **TIC (Tennessine Instruments Corporation):** Based in the United States, handles direct importation and international transactions

### Problem Statement

Tennessine currently lacks a unified system to manage their client relationships, track sales opportunities across different transaction types (Direct Importation, Nationalized Sales, Commissioned Sales), and maintain a centralized database of contacts, companies, products, and manufacturers. This leads to fragmented data, inefficient workflows, and difficulty tracking the sales pipeline.

### Solution

TIMS will provide a secure, modern, and integrated platform that centralizes:
- Database management for core business entities (contacts, companies, products, manufacturers)
- CRM functionality with a Kanban-style pipeline for tracking opportunities
- Global search capability to find any entity across the system

---

## 2. Goals

### Primary Goals

1. **Centralize Business Data:** Provide a single source of truth for all contacts, companies, products, and manufacturer information
2. **Streamline Sales Pipeline:** Enable the sales team to track opportunities from lead to close with clear stage requirements
3. **Ensure Data Security:** Implement enterprise-grade security with no sensitive data exposed through client-side code
4. **Enable Granular Access Control:** Allow administrators to configure precise permissions for each user
5. **Support Multi-Office Operations:** Track which office (TIA/TIC) handles each opportunity while maintaining data visibility across the organization

### Success Criteria

- All core business entities are accessible and manageable through a single interface
- Sales team can track opportunities through the complete sales lifecycle
- Zero sensitive data (API keys, database credentials, user data) exposed via browser developer tools
- System supports English and Brazilian Portuguese languages
- Application is fully responsive across desktop, tablet, and mobile devices

---

## 3. User Stories

### Authentication & Access

| ID | User Story | Priority |
|----|------------|----------|
| US-01 | As a user, I want to sign in with my @tennessine.com.br email so that only authorized employees can access the system | Must Have |
| US-02 | As a user, I want to sign in using Google SSO so that I can use my existing work credentials | Must Have |
| US-03 | As an admin, I want to configure granular permissions for each user so that I can control who can view, edit, add, or download specific resources | Must Have |
| US-04 | As a user, I want to switch between English and Portuguese so that I can use the system in my preferred language | Must Have |
| US-05 | As a user, I want to toggle between light and dark themes so that I can reduce eye strain | Should Have |

### Central Search

| ID | User Story | Priority |
|----|------------|----------|
| US-06 | As a user, I want to search across all entities by typing a few characters so that I can quickly find contacts, companies, products, opportunities, or documents | Must Have |
| US-07 | As a user, I want to click on a search result to navigate directly to that entity's detail page so that I can view or edit it immediately | Must Have |

### Database Management

| ID | User Story | Priority |
|----|------------|----------|
| US-08 | As a user, I want to create, view, edit, and delete contacts so that I can maintain an up-to-date contact database | Must Have |
| US-09 | As a user, I want to create, view, edit, and delete companies so that I can track client organizations | Must Have |
| US-10 | As a user, I want to create, view, edit, and delete products so that I can maintain our equipment catalog | Must Have |
| US-11 | As a user, I want to create, view, edit, and delete manufacturers so that I can track our supplier relationships and contracts | Must Have |
| US-12 | As a user, I want to filter and sort database records so that I can find specific entries quickly | Must Have |
| US-13 | As a user, I want to upload documents (catalogs, contracts, exclusivity letters) to relevant records so that all documentation is centralized | Must Have |
| US-14 | As a user, I want to link contacts to companies so that I can see which collaborators belong to each organization | Must Have |
| US-15 | As a user, I want to link products to manufacturers so that I can see which products each manufacturer supplies | Must Have |

### CRM Module

| ID | User Story | Priority |
|----|------------|----------|
| US-16 | As a user, I want to view opportunities in a Kanban board so that I can visualize the sales pipeline at a glance | Must Have |
| US-17 | As a user, I want to view opportunities in a list format so that I can see detailed information in a tabular view | Must Have |
| US-18 | As a user, I want to create a new opportunity by clicking a plus button and filling out required fields so that I can add new leads quickly | Must Have |
| US-19 | As a user, I want to drag and drop opportunity cards between stages so that I can update their status efficiently | Must Have |
| US-20 | As a user, I want the system to validate required fields before allowing stage transitions so that data quality is maintained | Must Have |
| US-21 | As a user, I want to click on an opportunity card to view its full details and history so that I can review all related information | Must Have |
| US-22 | As a user, I want to edit opportunity information so that I can update details as the sale progresses | Must Have |
| US-23 | As a user, I want to mark an opportunity as "Lost" with a required justification so that we can track why deals are lost | Must Have |
| US-24 | As an admin, I want to add, edit, or remove pipeline stages so that the CRM reflects our actual sales process | Should Have |
| US-25 | As an admin, I want to configure which fields are required at each pipeline stage so that stage transition rules can be customized | Should Have |
| US-26 | As an admin, I want to add custom fields to opportunities so that we can capture additional data specific to our business | Should Have |
| US-27 | As a user, I want to specify which office (TIA/TIC) handles an opportunity so that we can track office-specific deals | Must Have |

### Inline Entity Creation

| ID | User Story | Priority |
|----|------------|----------|
| US-28 | As a user, when selecting a contact/company/product in any form, I want to search existing records and create a new one inline if not found so that I don't have to leave my current workflow | Must Have |

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | The system MUST support email/password authentication using Supabase Auth | Must Have |
| FR-02 | The system MUST support Google SSO authentication | Must Have |
| FR-03 | The system MUST restrict authentication to users with @tennessine.com.br email domain | Must Have |
| FR-04 | The system MUST implement role-based access control with the following permission types per resource: View, Edit, Add, Delete, Download | Must Have |
| FR-05 | The system MUST provide an admin interface for configuring user permissions | Must Have |
| FR-06 | The system MUST log all authentication attempts (successful and failed) | Must Have |
| FR-07 | The system MUST implement session management with secure token handling | Must Have |
| FR-08 | The system MUST NOT expose any authentication tokens, API keys, or credentials in client-side code or browser developer tools | Must Have |

### 4.2 Security Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-09 | All API calls MUST be authenticated and authorized on the server side | Must Have |
| FR-10 | All CRUD operations MUST have server-side validation | Must Have |
| FR-11 | The system MUST use Row Level Security (RLS) in Supabase for data access control | Must Have |
| FR-12 | The system MUST NOT pass sensitive information (passwords, API keys, database credentials, internal business data) through front-end calls | Must Have |
| FR-13 | All file uploads MUST be validated on the server side for type and size | Must Have |
| FR-14 | The system MUST implement CSRF protection for all state-changing operations | Must Have |
| FR-15 | The system MUST use HTTPS for all communications | Must Have |
| FR-16 | The system MUST sanitize all user inputs to prevent XSS and SQL injection attacks | Must Have |

### 4.3 Central Search

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-17 | The system MUST provide a global search bar accessible from all pages | Must Have |
| FR-18 | The search MUST query across: Contacts, Companies, Products, Manufacturers, Opportunities, and uploaded document names | Must Have |
| FR-19 | The search MUST begin returning results after the user types 2+ characters | Must Have |
| FR-20 | Search results MUST be categorized by entity type | Must Have |
| FR-21 | Each search result MUST be clickable and navigate to the entity's detail page | Must Have |
| FR-22 | The search MUST be performant, returning results within 500ms | Should Have |
| FR-23 | Search results MUST respect the user's permission level (only show entities the user can view) | Must Have |

### 4.4 Database Management - Contact Entity

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-24 | A Contact record MUST have the following fields: Name (required), Company (optional, linked to Company entity), Email (optional), Phone (optional), Observation (optional) | Must Have |
| FR-25 | The system MUST provide a list view for Contacts with filtering and sorting capabilities | Must Have |
| FR-26 | The system MUST provide a detail view for individual Contact records | Must Have |
| FR-27 | Users with appropriate permissions MUST be able to Create, Read, Update, and Delete Contact records | Must Have |

### 4.5 Database Management - Company Entity

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-28 | A Company record MUST have the following fields: Name (required), Address (optional), TAX ID (optional), Phone (optional), Website (optional), Observation (optional), Collaborators List (linked Contact entities) | Must Have |
| FR-29 | The system MUST provide a list view for Companies with filtering and sorting capabilities | Must Have |
| FR-30 | The system MUST provide a detail view for individual Company records showing linked Contacts | Must Have |
| FR-31 | Users with appropriate permissions MUST be able to Create, Read, Update, and Delete Company records | Must Have |

### 4.6 Database Management - Product Entity

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-32 | A Product record MUST have the following fields: Name (required), Manufacturer (required, linked to Manufacturer entity), Technical Description (optional), Catalog (optional, document upload), NCM (optional) | Must Have |
| FR-33 | The system MUST provide a list view for Products with filtering and sorting capabilities | Must Have |
| FR-34 | The system MUST provide a detail view for individual Product records | Must Have |
| FR-35 | Users with appropriate permissions MUST be able to Create, Read, Update, and Delete Product records | Must Have |
| FR-36 | Users MUST be able to upload PDF catalog documents to Product records | Must Have |

### 4.7 Database Management - Manufacturer Entity

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-37 | A Manufacturer record MUST have all Company fields PLUS: Products List (linked Product entities), Contract (document upload), Contract Validity (date), Exclusivity (boolean), Exclusivity Letter (document upload) | Must Have |
| FR-38 | The system MUST provide a list view for Manufacturers with filtering and sorting capabilities | Must Have |
| FR-39 | The system MUST provide a detail view for individual Manufacturer records showing linked Products | Must Have |
| FR-40 | Users with appropriate permissions MUST be able to Create, Read, Update, and Delete Manufacturer records | Must Have |
| FR-41 | The system SHOULD visually indicate when a Manufacturer's contract is expiring (within 30 days) or expired | Should Have |

### 4.8 CRM Module - Opportunity Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-42 | The system MUST provide a Kanban board view with the following default stages: Lead Backlog, Qualification, Quotation, Closing, Won, Lost | Must Have |
| FR-43 | The system MUST provide a list view for Opportunities | Must Have |
| FR-44 | Users MUST be able to switch between Kanban and List views | Must Have |
| FR-45 | An Opportunity record MUST have the following core fields: Title (required), Client Contact (linked to Contact), Client Company (linked to Company), Desired Equipment (linked to Product), Lead Origin (enum: Website, Social Media, Email, Phone Call, Events, Manufacturer), Office (enum: TIA, TIC) | Must Have |
| FR-46 | An Opportunity record MUST have the following stage-dependent fields: Quote Number, Net Price, Sales Price, Client Purchase Order, Lost Reason | Must Have |
| FR-47 | Users MUST be able to drag and drop Opportunity cards between stages in Kanban view | Must Have |
| FR-48 | The system MUST validate required fields before allowing stage transitions (see Stage Transition Rules below) | Must Have |
| FR-49 | Users MUST be able to click on an Opportunity card to open a detail page | Must Have |
| FR-50 | The Opportunity detail page MUST show the complete history/activity log of the opportunity | Must Have |
| FR-51 | The Opportunity detail page MUST allow editing of all editable fields | Must Have |

### 4.9 CRM Module - Stage Transition Rules (Default)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-52 | To move from Lead Backlog → Qualification: Title, Contact, and Lead Origin MUST be filled | Must Have |
| FR-53 | To move from Qualification → Quotation: All previous fields PLUS Desired Equipment MUST be filled | Must Have |
| FR-54 | To move from Quotation → Closing: All previous fields PLUS Quote Number, Net Price, and Sales Price MUST be filled | Must Have |
| FR-55 | To move from Closing → Won: All previous fields PLUS Client Purchase Order MUST be filled | Must Have |
| FR-56 | To move to Lost from any stage: Lost Reason MUST be provided | Must Have |
| FR-57 | Administrators MUST be able to modify stage transition rules via a settings interface | Should Have |

### 4.10 CRM Module - New Opportunity Creation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-58 | A floating action button (FAB) MUST be visible in the bottom-right corner of the CRM view | Must Have |
| FR-59 | Clicking the FAB MUST open a popup/modal for creating a new Opportunity | Must Have |
| FR-60 | The creation popup MUST include fields: Title, Client Contact (searchable with inline create), Client Company (searchable with inline create), Desired Equipment (searchable with inline create), Lead Origin (dropdown), Office (dropdown: TIA/TIC) | Must Have |
| FR-61 | New Opportunities MUST be added to the Lead Backlog stage by default | Must Have |

### 4.11 CRM Module - Administration

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-62 | Administrators MUST be able to add new pipeline stages | Should Have |
| FR-63 | Administrators MUST be able to edit existing pipeline stage names | Should Have |
| FR-64 | Administrators MUST be able to reorder pipeline stages | Should Have |
| FR-65 | Administrators MUST be able to add custom fields to Opportunities | Should Have |
| FR-66 | Administrators MUST be able to configure which custom fields are required at each stage | Should Have |

### 4.12 Inline Entity Creation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-67 | All entity selection fields (Contact, Company, Product, Manufacturer) MUST support type-ahead search | Must Have |
| FR-68 | If no matching entity is found, the field MUST display an option to "Create New [Entity]" | Must Have |
| FR-69 | Selecting "Create New" MUST open a modal with the entity creation form | Must Have |
| FR-70 | After successful creation, the new entity MUST be automatically selected in the original field | Must Have |

### 4.13 Internationalization

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-71 | The system MUST support English (default) and Brazilian Portuguese languages | Must Have |
| FR-72 | Users MUST be able to select their preferred language in Settings | Must Have |
| FR-73 | All UI text, labels, messages, and system-generated content MUST be translatable | Must Have |
| FR-74 | Date, time, and number formats MUST adapt to the selected locale | Should Have |

### 4.14 UI/UX Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-75 | The system MUST have a retractable side menu for navigation | Must Have |
| FR-76 | The system MUST support light and dark themes | Must Have |
| FR-77 | Users MUST be able to toggle between themes in Settings | Must Have |
| FR-78 | The design MUST follow minimalist principles: primarily black and white, generous whitespace, limited color usage | Must Have |
| FR-79 | The UI MUST be fully responsive (desktop, tablet, mobile) | Must Have |
| FR-80 | The UI MUST include subtle animations for state changes and transitions | Should Have |
| FR-81 | All interactive elements MUST have appropriate loading states | Must Have |
| FR-82 | **All data fetches and updates MUST use optimistic updates with seamless UI transitions - NO hard page reloads are permitted anywhere in the system** | Must Have |

### 4.15 Document Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-83 | The system MUST support PDF document uploads | Must Have |
| FR-84 | The system MUST validate file types on both client and server side | Must Have |
| FR-85 | The system MUST enforce a maximum file size (configurable, default 10MB) | Must Have |
| FR-86 | Uploaded documents MUST be stored securely with access controlled by user permissions | Must Have |
| FR-87 | Users with Download permission MUST be able to download uploaded documents | Must Have |

---

## 5. Non-Goals (Out of Scope)

The following items are explicitly **NOT** included in this MVP release:

1. **Services Management Module** - Will be developed in a future phase
2. **Order Management Module** - Will be developed in a future phase
3. **Revenue/Expense Tracking** - Will be developed in a future phase
4. **Reporting and Analytics Dashboard** - Will be developed in a future phase
5. **Email Integration** - No automatic email sending or tracking
6. **Calendar Integration** - No scheduling or calendar sync
7. **Mobile Native Apps** - Web responsive only; no iOS/Android apps
8. **Multi-Tenancy** - System is for Tennessine internal use only
9. **Public API** - No external API access
10. **Data Import/Export** - No bulk import from Excel/CSV or export functionality
11. **Audit Trail UI** - While changes are logged, there is no UI to view audit history in MVP
12. **Automated Notifications** - No email/SMS notifications for pipeline changes
13. **Office-based Data Filtering** - Data filtering by TIA/TIC will be implemented in a later phase
14. **Advanced Search Filters** - Complex search filters (date ranges, multiple criteria) are post-MVP

---

## 6. Design Considerations

### Visual Design Principles

Based on the provided reference images, the TIMS interface should follow these design principles:

1. **Minimalist Aesthetic**
   - Clean, uncluttered layouts
   - Generous whitespace
   - Primary palette: Black, White, and grayscale
   - Accent colors used sparingly for CTAs and status indicators

2. **Typography**
   - Modern sans-serif font family
   - Clear hierarchy through size and weight variations
   - High contrast for readability

3. **Navigation**
   - Retractable side menu (collapsible to icons only)
   - Persistent global search bar in header
   - Breadcrumb navigation for deep pages

4. **Components**
   - Card-based design for Kanban and entity displays
   - Clean form inputs with floating labels or clear placeholders
   - Subtle shadows for depth
   - Rounded corners on cards and buttons

5. **Animations**
   - Smooth transitions on page changes
   - Subtle hover effects
   - Drag-and-drop visual feedback
   - Loading skeletons instead of spinners where appropriate

### Key UI Components

| Component | Description |
|-----------|-------------|
| Side Menu | Collapsible navigation with module icons and labels |
| Header | Global search bar, user avatar, settings access, theme toggle |
| Kanban Board | Horizontally scrollable columns with draggable cards |
| List View | Sortable, filterable table with pagination |
| Detail Page | Full-width page with sections for entity information |
| Modal/Popup | Centered overlay for forms and confirmations |
| FAB | Floating action button for primary actions |
| Search Dropdown | Type-ahead dropdown with categorized results |
| Entity Selector | Searchable dropdown with inline create option |

### Responsive Breakpoints

- **Desktop:** 1200px and above
- **Tablet:** 768px - 1199px
- **Mobile:** Below 768px

### Dark Theme Considerations

- Invert background: Dark gray (#1a1a1a) instead of white
- Text: Light gray (#e0e0e0) instead of black
- Maintain sufficient contrast ratios (WCAG AA minimum)
- Accent colors may need slight adjustment for dark backgrounds

---

## 7. Technical Considerations

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | TypeScript, React (or Next.js), Tailwind CSS |
| Backend | Python (FastAPI or similar), TypeScript (API routes if Next.js) |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth with Google OAuth |
| File Storage | Supabase Storage |
| Hosting | TBD (Vercel, AWS, etc.) |

### Architecture Principles

1. **Server-Side Security**
   - All business logic and validation MUST run on the server
   - Use Supabase Row Level Security (RLS) for database-level access control
   - API routes should validate user permissions before any operation
   - Never trust client-side data; always validate server-side

2. **API Design**
   - RESTful API structure
   - All endpoints require authentication
   - Consistent error response format
   - Rate limiting on sensitive endpoints

3. **Database Design**
   - Normalized schema for core entities
   - Junction tables for many-to-many relationships
   - Soft delete pattern for data recovery
   - Timestamps (created_at, updated_at) on all tables
   - Audit logging for compliance

4. **Code Quality Standards**
   - Comprehensive commenting and documentation
   - Meaningful variable and function names
   - No hardcoded values; use environment variables and configuration
   - TypeScript strict mode enabled
   - ESLint and Prettier for code consistency
   - Unit and integration tests for critical paths

### Database Schema (High-Level)

```
Tables:
- users (managed by Supabase Auth)
- user_permissions
- contacts
- companies
- products
- manufacturers
- opportunities
- opportunity_history (activity log)
- pipeline_stages
- stage_field_requirements
- custom_fields
- documents (metadata)
```

### Security Implementation Notes

1. **Authentication Flow**
   - Supabase handles JWT tokens
   - Tokens stored in httpOnly cookies (not localStorage)
   - Domain restriction enforced at OAuth provider level

2. **Authorization**
   - Permission checks at API route level
   - RLS policies as secondary enforcement layer
   - Permission cache with short TTL for performance

3. **File Upload Security**
   - File type validation (magic bytes, not just extension)
   - Virus scanning if available
   - Signed URLs for download with expiration

### Dependencies & Integrations

- **Google OAuth:** For SSO authentication (restricted to tennessine.com.br)
- **Supabase:** Backend-as-a-Service for database, auth, and storage

---

## 8. Success Metrics

### Quantitative Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| System Uptime | 99.5% | Monitoring tools |
| Page Load Time | < 2 seconds | Performance monitoring |
| Search Response Time | < 500ms | API logging |
| Zero Security Incidents | 0 critical vulnerabilities | Security audits |
| User Adoption | 100% of sales team | User login tracking |

### Qualitative Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| User Satisfaction | Positive feedback | User interviews/surveys |
| Data Accuracy | Improved data quality | Spot checks, user reports |
| Workflow Efficiency | Reduced time to track opportunities | User feedback |

### MVP Completion Criteria

The MVP is considered complete when:

1. ✅ Users can authenticate with email/password or Google SSO (domain-restricted)
2. ✅ Administrators can configure per-user permissions
3. ✅ Global search returns results across all entity types
4. ✅ Full CRUD operations work for Contacts, Companies, Products, and Manufacturers
5. ✅ CRM Kanban board displays opportunities with drag-and-drop functionality
6. ✅ Stage transition rules are enforced
7. ✅ Inline entity creation works in all relevant forms
8. ✅ UI supports light/dark themes and English/Portuguese languages
9. ✅ All pages are responsive across device sizes
10. ✅ Security audit confirms no sensitive data exposure in browser tools

---

## 9. Open Questions

| ID | Question | Status | Decision |
|----|----------|--------|----------|
| OQ-01 | What is the preferred hosting provider? (Vercel, AWS, GCP, etc.) | Open | - |
| OQ-02 | Are there existing brand guidelines (logo, specific colors) to incorporate? | Open | - |
| OQ-03 | Should the system support multiple currencies for price fields in Opportunities? | Open | - |
| OQ-04 | What is the maximum file size for document uploads? | Open | Suggested: 10MB |
| OQ-05 | Should opportunity history track all field changes or just stage changes? | Open | - |
| OQ-06 | Is there a specific format required for Quote Numbers and Purchase Order numbers? | Open | - |
| OQ-07 | Should the system send email notifications when contracts are expiring? | Open | (May be out of scope for MVP) |
| OQ-08 | What happens to linked records when a parent record is deleted? (Cascade, restrict, nullify?) | Open | - |
| OQ-09 | Should there be a maximum number of custom fields allowed per opportunity? | Open | - |
| OQ-10 | Are there any specific compliance requirements (LGPD, GDPR) to consider? | Open | - |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| TIA | Tennessine Instrumentação Analítica - Brazilian office |
| TIC | Tennessine Instruments Corporation - US office |
| Direct Importation | Sales where client buys from TIC and imports goods themselves |
| Nationalized Sale | Sales where TIA imports and delivers to Brazilian clients |
| Commissioned Sale | Sales where TIA/TIC facilitates a direct manufacturer-to-client sale |
| NCM | Nomenclatura Comum do Mercosul - Brazilian product classification code |
| RLS | Row Level Security - Supabase feature for database-level access control |
| FAB | Floating Action Button - UI pattern for primary actions |

---

## Appendix B: Reference UI Mockups

The UI design should be inspired by the provided reference images (Interface.jpg, Interface_2.jpg, Interface_3.jpg), incorporating:

- Clean Kanban boards with card-based opportunity display
- Dashboard-style metrics display (for future phases)
- Minimalist side navigation
- Modern data visualization components
- Card hover states and subtle shadows

---

*End of Document*
