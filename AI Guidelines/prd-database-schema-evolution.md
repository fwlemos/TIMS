# PRD: TIMS Database Schema Evolution

**Version:** 1.0  
**Date:** December 9, 2025  
**Author:** Claude (AI Architect)  
**Status:** Draft  

---

## 1. Introduction/Overview

This PRD defines the database schema evolution for TIMS (Tennessine Integrative Management Software) to transform it from a basic CRM into a comprehensive business management platform. The current system handles Contacts, Companies, Products, and Opportunities. This evolution adds proper Manufacturer separation, multi-currency Quotations, Order Management, Services, Finances, Activities/Automation, Custom Fields, and Audit Logging.

**Problem Statement:** The current schema has limitations that prevent scaling to a full ERP:
- Manufacturers are mixed into the Companies table with nullable fields
- Pricing is opportunity-level, not per-product
- No quotation versioning for multi-currency scenarios
- No order management after opportunities are won
- No services tracking
- No financial tracking (income/expenses across offices)
- No activity/task system
- No audit trail
- No custom fields capability

**Goal:** Create a robust, extensible database schema that supports the complete business workflow from lead to delivery to payment, with multi-currency, multi-office operations.

---

## 2. Goals

1. **Separate Manufacturers from Companies** using composition pattern for cleaner data management
2. **Enable per-product pricing** with support for multiple currencies within a single opportunity
3. **Support quotation versioning** allowing multiple currency quotes per opportunity
4. **Create Order Management** structure for post-sale fulfillment with 1:N opportunity-to-orders relationship
5. **Build Services module** supporting opportunity-linked, contract, standalone, and warranty services
6. **Implement Finances module** tracking income/expenses across legal entities (TIA/TIC) with multi-currency support
7. **Add Activity/Task system** with manual tasks and automated alerts based on configurable rules
8. **Implement field-level audit logging** for complete change history
9. **Create custom fields infrastructure** for admin-configurable fields on any object
10. **Establish proper user/role/permission structure** with hierarchical roles and manual permission assignment

---

## 3. User Stories

### CRM Module
- **US-001:** As a salesperson, I want to create a contact and mark them as an individual client so they have their own address fields.
- **US-002:** As a salesperson, I want to link a contact to a company so I can see all contacts at that organization.
- **US-003:** As a salesperson, I want to add multiple products to an opportunity with individual pricing per product so I can handle multi-manufacturer deals.
- **US-004:** As a salesperson, I want to create multiple quotations in different currencies for the same opportunity so clients can compare BRL vs USD pricing.
- **US-005:** As a salesperson, I want to mark a quotation as "accepted" when the client decides, so it becomes the basis for the order.

### Manufacturer Management
- **US-006:** As an admin, I want to manage manufacturers separately from regular companies so I can track contracts, exclusivity, and banking info.
- **US-007:** As an admin, I want to link products to manufacturers so I know where to order from.
- **US-008:** As an admin, I want to receive an alert when a manufacturer contract is expiring so I can negotiate renewal.

### Order Management
- **US-009:** As a salesperson, when I win an opportunity, I want the system to create orders (one per manufacturer) so fulfillment can begin.
- **US-010:** As an operations person, I want to track order status, manufacturer payment terms, and delivery dates independently per order.
- **US-011:** As an operations person, I want to see all orders related to an opportunity in one view so I understand the full deal scope.

### Services Module
- **US-012:** As a service coordinator, I want to create services linked to orders (like installation after delivery) so I can track post-sale work.
- **US-013:** As a service coordinator, I want to create standalone services (like a repair) not linked to any opportunity.
- **US-014:** As a service technician, I want to add expenses to a service (like buying tools) so they're tracked in the project finances.
- **US-015:** As a service coordinator, I want the system to check if equipment is under warranty based on delivery date and warranty period.

### Finances Module
- **US-016:** As a finance team member, I want to see all income and expenses for an opportunity across both TIA and TIC so I can calculate net profit.
- **US-017:** As a finance team member, I want to track expected vs. received payments from clients with different payment terms.
- **US-018:** As a finance team member, I want to track commission payments for commissioned sales with expected dates.
- **US-019:** As a finance team member, I want to receive alerts for overdue payments (from clients) or upcoming payments (to manufacturers).

### Activities & Automation
- **US-020:** As a salesperson, I want to create manual tasks for myself (like "call client on Friday") so I don't forget follow-ups.
- **US-021:** As a manager, I want to receive an alert when an opportunity hasn't been updated in 7+ days so I can follow up with my team member.
- **US-022:** As a director, I want to configure automation rules that create activities based on events (expiring contracts, overdue payments).

### Custom Fields
- **US-023:** As an admin, I want to add custom fields to CRM objects (Contact, Company, Product, Opportunity) without code changes.
- **US-024:** As an admin, I want to define field types including text, number, date, currency, dropdown, multi-select, and references to other objects.

### Audit & Permissions
- **US-025:** As a manager, I want to see a timeline of all changes to any record showing who changed what and when.
- **US-026:** As a director, I want to set specific permissions per user controlling what they can view/add/edit/delete in each module.

---

## 4. Functional Requirements

### 4.1 Contact Improvements

| Req ID | Requirement |
|--------|-------------|
| FR-001 | The system must require `name` field for all contacts. |
| FR-002 | The system must require `email` field for all contacts. |
| FR-003 | The system must have an `is_individual` boolean field (default: false). |
| FR-004 | When `is_individual` is false, the system must show and allow linking to a `company_id`. |
| FR-005 | When `is_individual` is true, the system must show address fields (street, complement, neighborhood, city, state, country, zip, formatted_address, place_id, lat, lng). |
| FR-006 | The system must not allow linking a contact to a company if that contact is already linked to another company. |
| FR-007 | The system must have an `observation` field for internal notes. |

### 4.2 Company Improvements

| Req ID | Requirement |
|--------|-------------|
| FR-008 | The system must require `name` field for all companies. |
| FR-009 | The system must have fields: tax_id, phone, website, email. |
| FR-010 | The system must have structured address fields (street, complement, neighborhood, city, state, country, zip, formatted_address, place_id, lat, lng). |
| FR-011 | The system must have an `observation` field for internal notes. |
| FR-012 | The system must show a list of contacts linked to the company. |
| FR-013 | When adding a contact to a company, the search must exclude contacts already linked to any company. |

### 4.3 Manufacturer (New Entity)

| Req ID | Requirement |
|--------|-------------|
| FR-014 | The system must have a separate `manufacturers` table with a required FK to `companies` (composition pattern). |
| FR-015 | A company can only be linked to one manufacturer record (1:1 relationship). |
| FR-016 | The system must store: contract_validity (date), contract_document_id (FK to documents), has_exclusivity (boolean), exclusivity_document_id (FK to documents). |
| FR-017 | The system must store banking information as a text field (`banking_info`). |
| FR-018 | The system must have an `observation` field for internal notes. |
| FR-019 | The system must show a list of products from this manufacturer. |
| FR-020 | The system must show a list of contacts who are employees of the manufacturer's company. |
| FR-021 | When linking products to a manufacturer, the search must only show products without an existing manufacturer. |

### 4.4 Product Improvements

| Req ID | Requirement |
|--------|-------------|
| FR-022 | The system must require `name` field for all products. |
| FR-023 | The system must require `manufacturer_id` (FK to manufacturers) for all products. |
| FR-024 | The system must have fields: part_number, description, ncm, sku, catalog_url. |
| FR-025 | The system must have a `default_warranty_years` field (numeric, nullable). |

### 4.5 Opportunity Stage Fields

| Req ID | Requirement |
|--------|-------------|
| FR-026 | **Lead Backlog → Qualification** requires: contact_id, at least one product in opportunity_products, lead_origin. |
| FR-027 | **Qualification → Quotation** requires: usage_description (text field explaining how equipment will be used), client address must be filled (either company address or individual contact address). |
| FR-028 | **Quotation → Closing** requires: at least one quotation marked as "accepted", estimated_close_date, client_payment_terms_id, estimated_delivery_weeks, incoterm, type_of_sale. |
| FR-029 | **Closing → Won** requires: client_purchase_order_document_id OR purchase_order_justification (text), manufacturer_payment_terms (per order), client_delivery_deadline, manufacturer_delivery_deadline. |
| FR-030 | When moving to "Lost" stage, `lost_reason` is required. |

### 4.6 Opportunity Products

| Req ID | Requirement |
|--------|-------------|
| FR-031 | Each opportunity_product must store: opportunity_id, product_id, quantity (default 1). |
| FR-032 | Each opportunity_product must store warranty: `warranty_years` (nullable, overrides product default). |
| FR-033 | Each opportunity_product must store notes for line-item specific information. |

### 4.7 Quotations (New Entity)

| Req ID | Requirement |
|--------|-------------|
| FR-034 | The system must have a `quotations` table linked to opportunities (N:1). |
| FR-035 | Each quotation must have: version_number (auto-increment per opportunity), currency (enum: BRL, USD, EUR, GBP, etc.), status (enum: draft, sent, accepted, rejected). |
| FR-036 | Each quotation must have: quote_number (system-generated), created_at, sent_at (nullable), valid_until (date). |
| FR-037 | Only one quotation per opportunity can have status = "accepted" at a time. |
| FR-038 | Quotations must have a `quotation_items` junction table with: quotation_id, product_id, quantity, net_price, net_currency, sales_price, unit_discount_percent, unit_discount_amount, warranty_years, estimated_delivery_weeks, includes_installation (boolean), includes_training (boolean), notes. |
| FR-039 | The system must calculate line totals: `line_total = (sales_price - unit_discount_amount) * quantity * (1 - unit_discount_percent/100)`. |
| FR-040 | The system must calculate quotation totals by summing line totals. |

### 4.8 Incoterms (New Enum/Table)

| Req ID | Requirement |
|--------|-------------|
| FR-041 | The system must have an `incoterms` table (admin-configurable) with columns: id, code, description, is_active. |
| FR-042 | Default values must include: "EXW - Pompano Beach, Florida", "EXW - Factory", "FCA - Client agent", "CIP - GRU International Airport", "CIF - Client address", "FOB", "Inbound 5-days". |
| FR-043 | Admins can add, edit, or deactivate incoterms. |
| FR-044 | Opportunities must have an `incoterm_id` FK to this table (required at Quotation stage). |

### 4.9 Payment Terms (New Entity)

| Req ID | Requirement |
|--------|-------------|
| FR-045 | The system must have a `payment_term_templates` table with: id, name (e.g., "Net 30", "50% advance / 50% delivery"), is_active. |
| FR-046 | The system must have a `payment_term_installments` table with: template_id, installment_number, percentage, condition (enum: at_order, at_delivery, at_installation, days_after_order, days_after_delivery, days_after_installation), days (nullable, for days-based conditions). |
| FR-047 | Examples: "Net 30" = 1 installment, 100%, days_after_delivery, 30 days. "50/50" = 2 installments, 50% at_order, 50% at_delivery. |
| FR-048 | When payment terms are applied to an order/income, the system must generate `payment_schedule` records with calculated due dates. |

### 4.10 Orders (New Entity)

| Req ID | Requirement |
|--------|-------------|
| FR-049 | The system must have an `orders` table created when an opportunity is won. |
| FR-050 | One opportunity can generate multiple orders (typically one per manufacturer). |
| FR-051 | Each order must have: order_number (system-generated), opportunity_id, manufacturer_id, status (enum: pending, ordered, in_transit, delivered, completed, cancelled). |
| FR-052 | Each order must have: manufacturer_payment_terms_id, manufacturer_delivery_deadline, client_delivery_deadline, notes. |
| FR-053 | Each order must have an `order_items` table with: order_id, product_id, quantity, net_price, net_currency, warranty_years, warranty_start_date (set on delivery), notes. |
| FR-054 | The system must copy relevant quotation_item data to order_items when creating orders. |

### 4.11 Services (New Entity)

| Req ID | Requirement |
|--------|-------------|
| FR-055 | The system must have a `services` table with: id, service_number (system-generated), type (enum: installation, training, maintenance, repair, warranty_service, other). |
| FR-056 | Each service must have: status (enum: scheduled, in_progress, completed, cancelled), scheduled_date, completed_date, assigned_to (FK to users). |
| FR-057 | Each service can optionally link to: order_id (for post-delivery services), order_item_id (for specific product service), opportunity_id (for opportunity-linked services). |
| FR-058 | Each service must have: description, notes, service_report (text for technician report). |
| FR-059 | The system must determine warranty status by checking: if linked to order_item, check if current_date <= (warranty_start_date + warranty_years). |
| FR-060 | Services must have a `service_expenses` junction table linking to expenses. |

### 4.12 Expenses (New Entity)

| Req ID | Requirement |
|--------|-------------|
| FR-061 | The system must have an `expenses` table with: id, expense_number (system-generated), category (enum: product_cost, freight, customs, peripherals, travel, installation_materials, commission_to_agent, other). |
| FR-062 | Each expense must have: amount, currency, payment_method (enum: pix, boleto, wire_transfer, credit_card, cash, other), description. |
| FR-063 | Each expense must have: legal_entity (enum: TIA, TIC), paid_date (nullable), document_id (FK to documents for receipts/invoices). |
| FR-064 | Each expense must have: created_by (FK to users), created_at, updated_at. |
| FR-065 | Expenses can optionally link to: order_id, service_id, opportunity_id. |
| FR-066 | When an expense is linked to a service, and that service is linked to an order/opportunity, the expense must be visible in the opportunity's financial summary. |

### 4.13 Income (New Entity)

| Req ID | Requirement |
|--------|-------------|
| FR-067 | The system must have an `income` table with: id, income_number (system-generated), type (enum: client_payment, commission_received, other). |
| FR-068 | Each income must have: amount, currency, expected_date (based on payment schedule), received_date (nullable), legal_entity (enum: TIA, TIC). |
| FR-069 | Each income must have: document_id (FK to documents for invoices/remittances), notes. |
| FR-070 | Income can link to: order_id, opportunity_id, payment_schedule_id. |
| FR-071 | For commission income, must have: commission_percentage, expected_commission_date, manufacturer_id (to track which manufacturer owes commission). |

### 4.14 Payment Schedule (New Entity)

| Req ID | Requirement |
|--------|-------------|
| FR-072 | The system must have a `payment_schedules` table with: id, source_type (enum: client_order, manufacturer_order), source_id, installment_number. |
| FR-073 | Each schedule entry must have: amount, currency, due_date, status (enum: pending, partial, paid, overdue). |
| FR-074 | Each schedule entry must have: condition_met_date (for conditions like "at installation" - set when service is completed). |
| FR-075 | The system must automatically mark schedules as "overdue" when due_date < current_date and status is pending. |

### 4.15 Activities (New Entity)

| Req ID | Requirement |
|--------|-------------|
| FR-076 | The system must have an `activities` table with: id, type (enum: task, alert, follow_up, meeting, call, email). |
| FR-077 | Each activity must have: title, description, due_date, status (enum: pending, completed, cancelled). |
| FR-078 | Each activity must have: assigned_to (FK to users), created_by (FK to users or null for system-generated), source (enum: manual, automation). |
| FR-079 | Activities can link to: contact_id, company_id, opportunity_id, order_id, service_id, manufacturer_id. |
| FR-080 | Each activity must have: priority (enum: low, medium, high, urgent), completed_at (timestamp). |

### 4.16 Automation Rules (New Entity)

| Req ID | Requirement |
|--------|-------------|
| FR-081 | The system must have an `automation_rules` table with: id, name, description, is_active, created_by. |
| FR-082 | Each rule must have: trigger_type (enum: record_stale, date_approaching, date_passed, record_created, record_updated, stage_changed). |
| FR-083 | Each rule must have: trigger_entity (enum: opportunity, order, service, manufacturer, payment_schedule), trigger_conditions (JSONB for field-specific conditions). |
| FR-084 | Each rule must have: action_type (enum: create_activity, send_notification), action_config (JSONB with activity details). |
| FR-085 | Each rule must have: assign_to_type (enum: record_owner, owner_manager, specific_role, specific_user), assign_to_value (role name or user_id). |
| FR-086 | Default rules to create: (1) Manufacturer contract expiring in 30 days → alert to Directors, (2) Opportunity not updated in 7 days (not in Lead Backlog) → task to owner + alert to owner's manager, (3) Payment schedule overdue → alert to Finance team. |

### 4.17 Documents (New Entity)

| Req ID | Requirement |
|--------|-------------|
| FR-087 | The system must have a `documents` table with: id, filename, file_path (Supabase Storage path), mime_type, file_size_bytes. |
| FR-088 | Each document must have: uploaded_by (FK to users), uploaded_at, category (enum: contract, purchase_order, invoice, receipt, quotation, spec_sheet, exclusivity_letter, other). |
| FR-089 | Documents can link to: contact_id, company_id, manufacturer_id, opportunity_id, order_id, expense_id, income_id. |
| FR-090 | Specific entities must have dedicated document FKs: manufacturer.contract_document_id, manufacturer.exclusivity_document_id, opportunity.purchase_order_document_id. |
| FR-091 | Opportunities must have a generic "attachments" capability via the documents table (documents linked to opportunity_id with category = spec_sheet, quotation, other). |

### 4.18 Custom Fields (New Entity)

| Req ID | Requirement |
|--------|-------------|
| FR-092 | The system must have a `custom_field_definitions` table with: id, entity_type (enum: contact, company, product, opportunity), field_name, field_label, field_type. |
| FR-093 | Supported field_type values: text, number, currency, percentage, date, phone, email, url, single_select, multi_select, user_reference, record_reference, file. |
| FR-094 | Each definition must have: is_required (boolean), is_active (boolean), display_order (integer), options (JSONB for select fields), reference_entity (for record_reference type). |
| FR-095 | The system must have a `custom_field_values` table with: id, definition_id (FK), entity_type, entity_id, value_text, value_number, value_date, value_json (for multi-select, references). |
| FR-096 | Custom fields must be queryable for filtering (indexed appropriately). |

### 4.19 Audit Logging (New Entity)

| Req ID | Requirement |
|--------|-------------|
| FR-097 | The system must have an `audit_logs` table with: id, entity_type, entity_id, action (enum: create, update, delete). |
| FR-098 | Each log must have: user_id (who made the change), timestamp, ip_address (optional). |
| FR-099 | Each log must have: changes (JSONB) containing field_name, old_value, new_value for each changed field. |
| FR-100 | The system must log all changes to core entities: contacts, companies, manufacturers, products, opportunities, orders, services, expenses, income. |
| FR-101 | Audit logs must be immutable (no update/delete allowed). |
| FR-102 | The system must provide a timeline view of changes for any entity. |

### 4.20 Users & Permissions

| Req ID | Requirement |
|--------|-------------|
| FR-103 | The system must have a `user_profiles` table extending Supabase auth.users with: id (FK to auth.users), name, email, profile_picture_url, team (enum: administration, commercial, services, marketing), role (enum: director, manager, supervisor, technician, assistant). |
| FR-104 | Each user_profile must have: manager_id (FK to user_profiles, nullable for directors), is_active (boolean). |
| FR-105 | The system must maintain the existing `user_permissions` table with: user_id, resource_type, can_view, can_add, can_edit, can_delete. |
| FR-106 | resource_type enum must include: contacts, companies, manufacturers, products, opportunities, orders, services, expenses, income, documents, settings, users, automation_rules, custom_fields, audit_logs. |
| FR-107 | The system must have a `permission_defaults` table with: team, role, resource_type, can_view, can_add, can_edit, can_delete. |
| FR-108 | When a new user is created, permissions are copied from permission_defaults based on their team/role, then admins can modify per-user. |
| FR-109 | Only users with role = 'director' can modify other users' permissions. |

### 4.21 Type of Sale & Legal Entity

| Req ID | Requirement |
|--------|-------------|
| FR-110 | The `type_of_sale` enum must have values: direct_importation, nationalized, commissioned. |
| FR-111 | Type of sale is required at the Closing stage of an opportunity. |
| FR-112 | The system must have a `legal_entity` enum: TIA, TIC. |
| FR-113 | Each expense and income record must specify which legal_entity is involved. |
| FR-114 | For **direct_importation**: client pays TIC (foreign currency), TIC pays manufacturer. |
| FR-115 | For **nationalized**: client pays TIA (BRL), TIC pays manufacturer (foreign currency), other expenses split by entity. |
| FR-116 | For **commissioned**: commission income tracked separately, linked to manufacturer. |

### 4.22 Currency Support

| Req ID | Requirement |
|--------|-------------|
| FR-117 | The system must have a `currency` enum: BRL, USD, EUR, GBP, JPY, CNY, CHF, CAD, AUD, other. |
| FR-118 | All monetary values must store amount + currency. |
| FR-119 | The system must NOT auto-convert currencies. Users enter amounts in target currency manually. |
| FR-120 | Financial summaries must show totals grouped by currency (e.g., "Income: R$50,000 BRL + $10,000 USD"). |

---

## 5. Non-Goals (Out of Scope)

1. **Automatic currency conversion** - Users will enter converted values manually.
2. **Shipment/logistics module** - Orders will be designed to support future linking, but no `shipments` table in this phase.
3. **Price nationalization calculator** - This requires a separate PRD for tax rule configuration.
4. **Full service contract management** - Basic contract services supported; advanced SLA/renewal logic deferred.
5. **Email integration** - Activities/tasks are in-app only; no email sending.
6. **Notifications system** - Alerts create activities; push/email notifications are future scope.
7. **Reporting/dashboards** - Schema supports queries; visualization is separate work.
8. **API endpoints** - This PRD covers schema only; API design is separate.
9. **Multi-language field labels for custom fields** - Single language per deployment.
10. **Workflow automation beyond activities** - No automated stage transitions, only activity creation.

---

## 6. Design Considerations

### 6.1 Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CORE CRM                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    1:N    ┌──────────┐                                        │
│  │ Company  │◄──────────│ Contact  │ (or Contact is individual)             │
│  └────┬─────┘           └────┬─────┘                                        │
│       │ 1:1                  │                                              │
│       ▼                      │                                              │
│  ┌──────────────┐            │                                              │
│  │ Manufacturer │            │                                              │
│  └──────┬───────┘            │                                              │
│         │ 1:N                │ N:1                                          │
│         ▼                    ▼                                              │
│  ┌──────────┐    N:M    ┌─────────────┐    N:1    ┌────────────┐           │
│  │ Product  │◄─────────►│ Opportunity │◄──────────│ Quotation  │           │
│  └──────────┘           └──────┬──────┘           └─────┬──────┘           │
│                                │                        │                   │
│                                │ 1:N                    │ 1:N               │
│                                ▼                        ▼                   │
│                         ┌──────────┐           ┌───────────────┐           │
│                         │  Order   │           │ Quotation Item│           │
│                         └────┬─────┘           └───────────────┘           │
│                              │                                              │
└──────────────────────────────┼──────────────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────────────┐
│                         POST-SALE                                           │
├──────────────────────────────┼──────────────────────────────────────────────┤
│                              │                                              │
│                              │ 1:N                                          │
│              ┌───────────────┼───────────────┐                              │
│              ▼               ▼               ▼                              │
│       ┌──────────┐    ┌──────────┐    ┌──────────┐                         │
│       │ Service  │    │ Expense  │    │  Income  │                         │
│       └────┬─────┘    └──────────┘    └────┬─────┘                         │
│            │                               │                                │
│            │ N:M                           │ N:1                            │
│            ▼                               ▼                                │
│       ┌───────────────┐           ┌──────────────────┐                     │
│       │Service Expense│           │ Payment Schedule │                     │
│       └───────────────┘           └──────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────────────┐    ┌─────────────┐                   │
│  │ Activity │    │ Automation Rule  │    │  Document   │                   │
│  └──────────┘    └──────────────────┘    └─────────────┘                   │
│                                                                              │
│  ┌───────────────────────┐    ┌──────────────────────┐                     │
│  │ Custom Field Def/Val  │    │     Audit Log        │                     │
│  └───────────────────────┘    └──────────────────────┘                     │
│                                                                              │
│  ┌──────────────┐    ┌─────────────────────┐                               │
│  │ User Profile │    │  User Permissions   │                               │
│  └──────────────┘    └─────────────────────┘                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 UI/UX Notes

- **Filtering:** All list views must support filtering by any visible field (including custom fields). Reference Image 2 from the prompt for filter UI pattern.
- **Kanban:** Opportunity kanban board (Reference Image 1) must enforce stage transition validation.
- **Detail Pages:** Unified object visualization at `/database/object_type/ID` route pattern.
- **Timeline:** Each detail page must show audit log timeline of changes.
- **Forms:** Accordion-style stage sections for opportunities showing required fields per stage.
- **Quick Create:** Contextual inline creation of related objects (e.g., create Contact while creating Opportunity).

### 6.3 Design System

- Maintain existing minimalist black/white design with retractable side menus
- Light/dark theme support
- Responsive layouts for mobile/tablet

---

## 7. Technical Considerations

### 7.1 Database

- **Engine:** PostgreSQL (Supabase)
- **Soft Deletes:** All core tables use `deleted_at` timestamp pattern
- **Timestamps:** All tables have `created_at`, `updated_at` (auto-managed by triggers)
- **UUIDs:** All primary keys use `gen_random_uuid()`

### 7.2 Security

- **RLS Policies:** Must be updated for all new tables using `user_has_permission()` helper function
- **Sensitive Data:** Banking info stored as text (future: encrypt at rest)
- **File Access:** Documents in Supabase Storage must use signed URLs with expiration

### 7.3 Performance Indexes

Required indexes for common queries:
- `contacts.company_id`
- `contacts.is_individual`
- `products.manufacturer_id`
- `opportunities.stage_id`
- `opportunities.assigned_to`
- `opportunities.contact_id`
- `quotations.opportunity_id`
- `quotation_items.quotation_id`
- `orders.opportunity_id`
- `orders.manufacturer_id`
- `services.order_id`
- `expenses.order_id, service_id, opportunity_id`
- `income.order_id, opportunity_id`
- `payment_schedules.source_type, source_id, status`
- `activities.assigned_to, status, due_date`
- `audit_logs.entity_type, entity_id`
- `custom_field_values.definition_id, entity_type, entity_id`

### 7.4 Migrations Strategy

1. Create new tables first (manufacturers, quotations, orders, etc.)
2. Migrate existing data:
   - Create manufacturer records for companies with `manufacturer_*` fields populated
   - Update products.manufacturer_id to point to new manufacturer records
3. Add new columns to existing tables (non-breaking)
4. Update application code to use new schema
5. Remove deprecated columns (manufacturer_* fields from companies) in final cleanup migration

### 7.5 Dependencies

- Supabase Auth (existing)
- Supabase Storage (for documents)
- Google Places API (existing, for address autocomplete)

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Schema Migration** | Zero data loss | Compare record counts pre/post migration |
| **RLS Coverage** | 100% of tables | Audit that all tables have appropriate policies |
| **Query Performance** | < 200ms for list queries | Monitor Supabase dashboard |
| **Audit Log Coverage** | 100% of core entity changes logged | Spot check operations |
| **Custom Fields** | Admins can add field without code deploy | Manual testing |
| **Multi-currency Tracking** | Can see BRL and USD totals separately | Financial summary view |
| **Order Generation** | Won opportunity → Orders in < 5 seconds | Measure automation trigger time |

---

## 9. Open Questions

1. **Quote Number Format:** What format should system-generated quote numbers follow? (e.g., `QT-2025-00001`, `TIA-Q-00001`)?

2. **Order Number Format:** Same question for orders (e.g., `ORD-2025-00001`, `TIA-ORD-00001`)?

3. **Expense Number Format:** Same question for expenses?

4. **Audit Log Retention:** Should audit logs be retained indefinitely or have a retention policy (e.g., 5 years)?

5. **Custom Field Limits:** Should there be a maximum number of custom fields per entity type?

6. **Default Automation Rules:** Beyond the 3 listed (contract expiring, opportunity stale, payment overdue), are there other default rules to create?

7. **Commission Percentage Source:** For commissioned sales, where does the commission percentage come from? Is it defined per manufacturer agreement?

8. **Warranty Grace Period:** When checking warranty status for services, should there be a grace period (e.g., warranty expired 7 days ago but still honor it)?

9. **Payment Schedule Partial Payments:** Can a single schedule installment receive multiple partial payments, or is it all-or-nothing?

10. **Activity Recurrence:** Should manual activities support recurrence (e.g., "Call client every Friday")? Or is that out of scope?

---

## Appendix A: Enum Definitions

### A.1 lead_origin (existing, unchanged)
```sql
CREATE TYPE lead_origin AS ENUM (
  'website', 'social_media', 'email', 'phone_call', 
  'events', 'manufacturer', 'referral', 'other'
);
```

### A.2 type_of_sale (update existing)
```sql
CREATE TYPE type_of_sale AS ENUM (
  'direct_importation', 'nationalized', 'commissioned'
);
```

### A.3 legal_entity (new)
```sql
CREATE TYPE legal_entity AS ENUM ('TIA', 'TIC');
```

### A.4 currency (new)
```sql
CREATE TYPE currency AS ENUM (
  'BRL', 'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CHF', 'CAD', 'AUD', 'OTHER'
);
```

### A.5 quotation_status (new)
```sql
CREATE TYPE quotation_status AS ENUM (
  'draft', 'sent', 'accepted', 'rejected', 'expired'
);
```

### A.6 order_status (new)
```sql
CREATE TYPE order_status AS ENUM (
  'pending', 'ordered', 'in_transit', 'delivered', 'completed', 'cancelled'
);
```

### A.7 service_type (new)
```sql
CREATE TYPE service_type AS ENUM (
  'installation', 'training', 'maintenance', 'repair', 'warranty_service', 'other'
);
```

### A.8 service_status (new)
```sql
CREATE TYPE service_status AS ENUM (
  'scheduled', 'in_progress', 'completed', 'cancelled'
);
```

### A.9 expense_category (new)
```sql
CREATE TYPE expense_category AS ENUM (
  'product_cost', 'freight', 'customs', 'peripherals', 'travel', 
  'installation_materials', 'commission_to_agent', 'other'
);
```

### A.10 payment_method (new)
```sql
CREATE TYPE payment_method AS ENUM (
  'pix', 'boleto', 'wire_transfer', 'credit_card', 'cash', 'other'
);
```

### A.11 income_type (new)
```sql
CREATE TYPE income_type AS ENUM (
  'client_payment', 'commission_received', 'other'
);
```

### A.12 payment_condition (new)
```sql
CREATE TYPE payment_condition AS ENUM (
  'at_order', 'at_delivery', 'at_installation', 
  'days_after_order', 'days_after_delivery', 'days_after_installation'
);
```

### A.13 payment_schedule_status (new)
```sql
CREATE TYPE payment_schedule_status AS ENUM (
  'pending', 'partial', 'paid', 'overdue'
);
```

### A.14 activity_type (new)
```sql
CREATE TYPE activity_type AS ENUM (
  'task', 'alert', 'follow_up', 'meeting', 'call', 'email'
);
```

### A.15 activity_status (new)
```sql
CREATE TYPE activity_status AS ENUM (
  'pending', 'completed', 'cancelled'
);
```

### A.16 activity_priority (new)
```sql
CREATE TYPE activity_priority AS ENUM (
  'low', 'medium', 'high', 'urgent'
);
```

### A.17 activity_source (new)
```sql
CREATE TYPE activity_source AS ENUM ('manual', 'automation');
```

### A.18 trigger_type (new)
```sql
CREATE TYPE trigger_type AS ENUM (
  'record_stale', 'date_approaching', 'date_passed', 
  'record_created', 'record_updated', 'stage_changed'
);
```

### A.19 trigger_entity (new)
```sql
CREATE TYPE trigger_entity AS ENUM (
  'opportunity', 'order', 'service', 'manufacturer', 'payment_schedule'
);
```

### A.20 automation_action_type (new)
```sql
CREATE TYPE automation_action_type AS ENUM (
  'create_activity', 'send_notification'
);
```

### A.21 assign_to_type (new)
```sql
CREATE TYPE assign_to_type AS ENUM (
  'record_owner', 'owner_manager', 'specific_role', 'specific_user'
);
```

### A.22 document_category (new)
```sql
CREATE TYPE document_category AS ENUM (
  'contract', 'purchase_order', 'invoice', 'receipt', 
  'quotation', 'spec_sheet', 'exclusivity_letter', 'other'
);
```

### A.23 custom_field_type (new)
```sql
CREATE TYPE custom_field_type AS ENUM (
  'text', 'number', 'currency', 'percentage', 'date', 
  'phone', 'email', 'url', 'single_select', 'multi_select', 
  'user_reference', 'record_reference', 'file'
);
```

### A.24 custom_field_entity (new)
```sql
CREATE TYPE custom_field_entity AS ENUM (
  'contact', 'company', 'product', 'opportunity'
);
```

### A.25 audit_action (new)
```sql
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete');
```

### A.26 user_team (new)
```sql
CREATE TYPE user_team AS ENUM (
  'administration', 'commercial', 'services', 'marketing'
);
```

### A.27 user_role (new)
```sql
CREATE TYPE user_role AS ENUM (
  'director', 'manager', 'supervisor', 'technician', 'assistant'
);
```

### A.28 resource_type (update existing)
```sql
CREATE TYPE resource_type AS ENUM (
  'contacts', 'companies', 'manufacturers', 'products', 'opportunities',
  'orders', 'services', 'expenses', 'income', 'documents', 'settings', 
  'users', 'automation_rules', 'custom_fields', 'audit_logs'
);
```

---

## Appendix B: Table Definitions (Simplified)

### B.1 manufacturers (new)
```sql
CREATE TABLE manufacturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id),
  contract_validity DATE,
  contract_document_id UUID REFERENCES documents(id),
  has_exclusivity BOOLEAN DEFAULT FALSE,
  exclusivity_document_id UUID REFERENCES documents(id),
  banking_info TEXT,
  observation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

### B.2 quotations (new)
```sql
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id),
  version_number INTEGER NOT NULL,
  quote_number TEXT NOT NULL UNIQUE,
  currency currency NOT NULL,
  status quotation_status DEFAULT 'draft',
  valid_until DATE,
  sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(opportunity_id, version_number)
);
```

### B.3 quotation_items (new)
```sql
CREATE TABLE quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC DEFAULT 1,
  net_price NUMERIC,
  net_currency currency,
  sales_price NUMERIC NOT NULL,
  unit_discount_percent NUMERIC DEFAULT 0,
  unit_discount_amount NUMERIC DEFAULT 0,
  warranty_years NUMERIC,
  estimated_delivery_weeks INTEGER,
  includes_installation BOOLEAN DEFAULT FALSE,
  includes_training BOOLEAN DEFAULT FALSE,
  notes TEXT
);
```

### B.4 incoterms (new)
```sql
CREATE TABLE incoterms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### B.5 payment_term_templates (new)
```sql
CREATE TABLE payment_term_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### B.6 payment_term_installments (new)
```sql
CREATE TABLE payment_term_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES payment_term_templates(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  percentage NUMERIC NOT NULL,
  condition payment_condition NOT NULL,
  days INTEGER,
  UNIQUE(template_id, installment_number)
);
```

### B.7 orders (new)
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id),
  manufacturer_id UUID NOT NULL REFERENCES manufacturers(id),
  status order_status DEFAULT 'pending',
  manufacturer_payment_terms_id UUID REFERENCES payment_term_templates(id),
  manufacturer_delivery_deadline DATE,
  client_delivery_deadline DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

### B.8 order_items (new)
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC DEFAULT 1,
  net_price NUMERIC NOT NULL,
  net_currency currency NOT NULL,
  warranty_years NUMERIC,
  warranty_start_date DATE,
  notes TEXT
);
```

### B.9 services (new)
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_number TEXT NOT NULL UNIQUE,
  type service_type NOT NULL,
  status service_status DEFAULT 'scheduled',
  scheduled_date DATE,
  completed_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  order_item_id UUID REFERENCES order_items(id),
  opportunity_id UUID REFERENCES opportunities(id),
  description TEXT,
  notes TEXT,
  service_report TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

### B.10 expenses (new)
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_number TEXT NOT NULL UNIQUE,
  category expense_category NOT NULL,
  amount NUMERIC NOT NULL,
  currency currency NOT NULL,
  payment_method payment_method,
  description TEXT,
  legal_entity legal_entity NOT NULL,
  paid_date DATE,
  document_id UUID REFERENCES documents(id),
  order_id UUID REFERENCES orders(id),
  service_id UUID REFERENCES services(id),
  opportunity_id UUID REFERENCES opportunities(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

### B.11 service_expenses (new)
```sql
CREATE TABLE service_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  UNIQUE(service_id, expense_id)
);
```

### B.12 income (new)
```sql
CREATE TABLE income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  income_number TEXT NOT NULL UNIQUE,
  type income_type NOT NULL,
  amount NUMERIC NOT NULL,
  currency currency NOT NULL,
  expected_date DATE,
  received_date DATE,
  legal_entity legal_entity NOT NULL,
  document_id UUID REFERENCES documents(id),
  order_id UUID REFERENCES orders(id),
  opportunity_id UUID REFERENCES opportunities(id),
  payment_schedule_id UUID REFERENCES payment_schedules(id),
  -- Commission specific fields
  commission_percentage NUMERIC,
  manufacturer_id UUID REFERENCES manufacturers(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

### B.13 payment_schedules (new)
```sql
CREATE TABLE payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL, -- 'client_order' or 'manufacturer_order'
  source_id UUID NOT NULL,
  installment_number INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  currency currency NOT NULL,
  due_date DATE,
  condition_met_date DATE, -- For conditions like "at installation"
  status payment_schedule_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### B.14 activities (new)
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status activity_status DEFAULT 'pending',
  priority activity_priority DEFAULT 'medium',
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id), -- NULL for system-generated
  source activity_source DEFAULT 'manual',
  completed_at TIMESTAMPTZ,
  -- Polymorphic links
  contact_id UUID REFERENCES contacts(id),
  company_id UUID REFERENCES companies(id),
  opportunity_id UUID REFERENCES opportunities(id),
  order_id UUID REFERENCES orders(id),
  service_id UUID REFERENCES services(id),
  manufacturer_id UUID REFERENCES manufacturers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

### B.15 automation_rules (new)
```sql
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  trigger_type trigger_type NOT NULL,
  trigger_entity trigger_entity NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  action_type automation_action_type NOT NULL,
  action_config JSONB DEFAULT '{}',
  assign_to_type assign_to_type NOT NULL,
  assign_to_value TEXT, -- Role name or user ID
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### B.16 documents (new)
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  mime_type TEXT,
  file_size_bytes BIGINT,
  category document_category DEFAULT 'other',
  uploaded_by UUID REFERENCES auth.users(id),
  -- Polymorphic links (only one should be set typically)
  contact_id UUID REFERENCES contacts(id),
  company_id UUID REFERENCES companies(id),
  manufacturer_id UUID REFERENCES manufacturers(id),
  opportunity_id UUID REFERENCES opportunities(id),
  order_id UUID REFERENCES orders(id),
  expense_id UUID REFERENCES expenses(id),
  income_id UUID REFERENCES income(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

### B.17 custom_field_definitions (new)
```sql
CREATE TABLE custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type custom_field_entity NOT NULL,
  field_name TEXT NOT NULL, -- Internal name (snake_case)
  field_label TEXT NOT NULL, -- Display name
  field_type custom_field_type NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  options JSONB, -- For select fields: [{value, label}]
  reference_entity TEXT, -- For record_reference: 'contact', 'company', etc.
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, field_name)
);
```

### B.18 custom_field_values (new)
```sql
CREATE TABLE custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  entity_type custom_field_entity NOT NULL,
  entity_id UUID NOT NULL,
  value_text TEXT,
  value_number NUMERIC,
  value_date DATE,
  value_json JSONB, -- For multi-select, references, currency (amount+code)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(definition_id, entity_id)
);
```

### B.19 audit_logs (new)
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action audit_action NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  changes JSONB NOT NULL, -- [{field, old_value, new_value}]
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Make audit logs immutable
REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC;
```

### B.20 user_profiles (new)
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  profile_picture_url TEXT,
  team user_team,
  role user_role,
  manager_id UUID REFERENCES user_profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### B.21 permission_defaults (new)
```sql
CREATE TABLE permission_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team user_team NOT NULL,
  role user_role NOT NULL,
  resource_type resource_type NOT NULL,
  can_view BOOLEAN DEFAULT FALSE,
  can_add BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  UNIQUE(team, role, resource_type)
);
```

---

## Appendix C: Modifications to Existing Tables

### C.1 contacts
**Add columns:**
- (No new columns needed - already has is_individual and address fields per schema review)

**Update constraints:**
- Make `name` NOT NULL (if not already)
- Make `email` NOT NULL

### C.2 companies
**Remove columns (after migration):**
- `manufacturer_catalog_url`
- `manufacturer_contract_url`
- `manufacturer_contract_validity`
- `manufacturer_exclusivity`
- `manufacturer_exclusivity_letter_url`
- `manufacturer_primary_ncm`
- `manufacturer_product_categories`

### C.3 products
**Add columns:**
- `default_warranty_years NUMERIC`

**Update constraints:**
- Change `manufacturer_id` to reference `manufacturers(id)` instead of `companies(id)`
- Make `manufacturer_id` NOT NULL

### C.4 opportunities
**Add columns:**
- `usage_description TEXT`
- `incoterm_id UUID REFERENCES incoterms(id)`
- `client_payment_terms_id UUID REFERENCES payment_term_templates(id)`
- `estimated_delivery_weeks INTEGER`
- `purchase_order_document_id UUID REFERENCES documents(id)`
- `purchase_order_justification TEXT`
- `client_delivery_deadline DATE`
- `manufacturer_delivery_deadline DATE`

**Update columns:**
- `type_of_sale` - update enum values to lowercase with underscores

### C.5 opportunity_products
**Add columns:**
- `warranty_years NUMERIC`

### C.6 user_permissions
**Update:**
- Update `resource_type` enum to include new values

---

*End of PRD*
