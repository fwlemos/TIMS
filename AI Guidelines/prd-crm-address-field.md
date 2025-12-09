# PRD: CRM Address Field for Quotation Stage

## 1. Introduction/Overview

This feature adds an **Address field** to the CRM Quotation stage as a required field before advancing to the Closing stage. The address represents the client's location and is essential for quotations, logistics planning, and future business analytics (filtering by region).

The address follows a **hierarchical source of truth** based on a new `is_individual` flag on the Contact entity:
- **If `is_individual = false`** (default): Address is pulled from the related **Company**
- **If `is_individual = true`**: Address is pulled from the **Contact** directly

When displayed on an Opportunity, the address auto-populates from the appropriate source. Users can edit the address inline on the Opportunity, and changes are **saved back to the source entity** (Company or Contact).

To ensure high-quality, structured address data, the feature integrates with **Google Places API (Autocomplete)** for address input, storing addresses in discrete fields that enable filtering and reporting by city, state, country, etc. Google's free tier (~10,000 requests/month) is more than sufficient for low-volume usage, with excellent coverage for both Brazil and US addresses.

---

## 2. Goals

1. **Capture client address** as a required field in the Quotation stage before advancing to Closing.
2. **Distinguish individual clients from company-associated contacts** via a new `is_individual` flag on Contacts.
3. **Maintain a single source of truth** for addresses: Company (for company-associated contacts) or Contact (for individual clients).
4. **Enable address-based filtering and reporting** by storing structured address components (city, state, country, etc.).
5. **Improve data entry experience** through Google Places API Autocomplete integration.
6. **Create a reusable Address component** that can be embedded in Company, Contact, and Opportunity forms.

---

## 3. User Stories

### US-01: Sales Rep Advances Opportunity with Company Address
**As a** sales representative,  
**I want** the client's address to auto-populate from the Company when I reach the Quotation stage,  
**So that** I don't have to re-enter information that already exists in the system.

**Acceptance Criteria:**
- When viewing an Opportunity in Quotation stage where the Contact has `is_individual = false`, the Address field displays the Company's address if available.
- The address is shown in a readable format with all components visible.
- The field is marked as required (red asterisk) but satisfied if auto-populated.

---

### US-02: Sales Rep Enters Address for Company Without One
**As a** sales representative,  
**I want** to enter an address when the related Company doesn't have one,  
**So that** I can complete the Quotation stage requirements and the Company record gets updated for future use.

**Acceptance Criteria:**
- When the Company has no address, the Address field on the Opportunity is empty and editable.
- User can type in the address field to trigger Google Places autocomplete.
- Upon selecting an address, structured fields (city, state, country, etc.) are populated automatically from the API response.
- When the Opportunity is saved, the address is persisted to the Company record.
- A subtle indicator shows that the address will be saved to the Company (e.g., "Will be saved to [Company Name]").

---

### US-03: Sales Rep Marks Contact as Individual Client
**As a** sales representative,  
**I want** to mark a Contact as an "Individual Client" when they're purchasing for themselves (not through a company),  
**So that** the system knows to use the Contact's address instead of requiring a Company.

**Acceptance Criteria:**
- The Contact form includes an `is_individual` checkbox/toggle (default: unchecked).
- When checked, the Contact can have its own address fields.
- When checked, Company association becomes optional (not required).
- The Opportunity respects this flag when determining where to pull the address from.

---

### US-04: Sales Rep Works with Individual Client (No Company)
**As a** sales representative,  
**I want** to capture an address for individual clients who are marked as `is_individual`,  
**So that** I can still complete the Quotation stage for B2C or individual sales.

**Acceptance Criteria:**
- When the Opportunity's Contact has `is_individual = true`, the system looks for the Contact's address (ignores Company).
- If the Contact has an address, it auto-populates into the Opportunity's Address field.
- If the Contact has no address, the user can enter one, which saves back to the Contact record.
- Indicator shows "Will be saved to [Contact Name]" when editing.

---

### US-05: Sales Rep Edits Auto-Populated Address
**As a** sales representative,  
**I want** to edit the auto-populated address directly on the Opportunity,  
**So that** I can correct outdated information without navigating away from my workflow.

**Acceptance Criteria:**
- An "Edit" button or icon appears next to the auto-populated address.
- Clicking edit enables the Google Places autocomplete input.
- User can search for and select a new address.
- Changes are saved back to the source entity (Company if `is_individual = false`, Contact if `is_individual = true`) upon saving the Opportunity.
- A confirmation or indicator warns that this will update the source record.

---

### US-06: Manager Filters Companies by Location
**As a** sales manager,  
**I want** to filter and search Companies by city, state, or country,  
**So that** I can analyze regional performance and assign territories.

**Acceptance Criteria:**
- Company list view includes filter options for: City, State/Province, Country.
- Filters support multi-select (e.g., show Companies in "São Paulo" OR "Rio de Janeiro").
- Address components are stored as separate, indexed fields in the database.

---

### US-07: User Gets Address Suggestions via Autocomplete
**As a** user entering an address,  
**I want** to see suggestions as I type from Google Places,  
**So that** I can quickly select accurate, standardized addresses.

**Acceptance Criteria:**
- Address input field triggers Google Places Autocomplete after 3+ characters.
- Suggestions appear in a dropdown below the input field.
- Selecting a suggestion populates all structured fields automatically from the API response (city, state, country, postal code are inferred—user does not manually select these).
- Works for both Brazilian and US address formats.
- Graceful fallback if API is unavailable (manual entry of individual fields).

---

## 4. Functional Requirements

### 4.1 Data Model

| # | Requirement |
|---|-------------|
| FR-01 | The system must store addresses with the following structured fields: `street` (street name + number), `complement` (apartment, suite, unit - optional), `neighborhood` (optional, important for Brazil), `city` (required), `state_province` (required), `country` (required), `postal_code` (required), `formatted_address` (full string from Google API), `place_id` (Google Place ID for reference - optional). |
| FR-02 | The `Company` entity must have an `address` object containing all fields from FR-01. |
| FR-03 | The `Contact` entity must have an `is_individual` boolean field (default: `false`). |
| FR-04 | The `Contact` entity must have an `address` object containing all fields from FR-01 (only used when `is_individual = true`). |
| FR-05 | Address fields (`city`, `state_province`, `country`) must be indexed to support filtering queries. |

### 4.2 Individual Client Logic

| # | Requirement |
|---|-------------|
| FR-06 | The Contact form must include an `is_individual` toggle/checkbox with label "Individual Client". |
| FR-07 | When `is_individual = true`, the Contact's Company association must become optional. |
| FR-08 | When `is_individual = true`, the Contact form and Contact detail page must display address input fields (editable). |
| FR-09 | When `is_individual = false` (default), the Contact's address fields must be hidden (address comes from Company). |
| FR-10 | Existing Contacts without a Company must NOT be automatically flagged as `is_individual = true`. Users must explicitly set this flag. |

### 4.3 Address Resolution Logic

| # | Requirement |
|---|-------------|
| FR-11 | When displaying an Opportunity's address, the system must resolve the address using this logic: (1) If Contact's `is_individual = true`, use Contact's address; (2) If Contact's `is_individual = false`, use the related Company's address. |
| FR-12 | The system must display the source of the address (e.g., "From: Acme Corp" or "From: John Doe (Individual)"). |
| FR-13 | If the resolved source entity has no address, the Address field must be empty and editable. |

### 4.4 Address Input & Editing

| # | Requirement |
|---|-------------|
| FR-14 | The system must integrate with Google Places API (Autocomplete) for address input. |
| FR-15 | The autocomplete input must trigger suggestions after the user types 3 or more characters. |
| FR-16 | When a user selects a suggestion, the system must call Google Place Details API and automatically populate all structured fields (street, city, state_province, country, postal_code, neighborhood) from the `address_components` response. The user does NOT manually select these—they are inferred from the API. |
| FR-17 | The system must provide a manual entry fallback with individual fields if Google API is unavailable or user prefers manual entry. |
| FR-18 | When an address is edited on an Opportunity, the system must save the changes back to the source entity (Company if `is_individual = false`, Contact if `is_individual = true`). |
| FR-19 | The system must display a non-blocking indicator when editing: "Changes will be saved to [Entity Name]". |

### 4.5 Stage Validation (Quotation → Closing)

| # | Requirement |
|---|-------------|
| FR-20 | The Address field must be a required field for the Quotation stage. |
| FR-21 | The system must prevent advancement from Quotation to Closing if the Address field is empty. |
| FR-22 | Validation must work consistently on both the detail page (accordion view) and Kanban view (drag attempt). |

### 4.6 Filtering & Search

| # | Requirement |
|---|-------------|
| FR-23 | The Company list view must support filtering by `city`, `state_province`, and `country`. |
| FR-24 | Filters must support multi-select (OR logic within a field). |
| FR-25 | The Contact list view should also support address filtering for individual clients (where `is_individual = true`). |

### 4.7 Reusable Component

| # | Requirement |
|---|-------------|
| FR-26 | The Address input/display must be implemented as a reusable `AddressField` component. |
| FR-27 | The component must support two modes: `view` (read-only display) and `edit` (autocomplete input). |
| FR-28 | The component must accept props for: `value` (address object), `onChange` (callback), `source` (entity name to display), `required` (boolean), `disabled` (boolean). |
| FR-29 | The component must be usable in Company forms, Contact forms (when `is_individual = true`), and Opportunity stage fields. |

---

## 5. Non-Goals (Out of Scope)

1. **Multiple addresses per entity** (e.g., billing vs. shipping) - only one address per Company/Contact for MVP.
2. **Address validation/verification** beyond Google's autocomplete (no postal service validation).
3. **Geocoding for map visualization** - storing `place_id` enables future implementation but maps are not in scope.
4. **Address history/audit trail** - changes overwrite the existing address without versioning.
5. **Bulk address import/update** - addresses are entered one at a time through the UI.
6. **Offline address entry** - Google Places API requires internet connectivity.

---

## 6. Design Considerations

### 6.1 UI Layout in Quotation Stage

The Address field should appear in the Quotation accordion section alongside existing fields (Net Price, Sales Price):

```
┌─────────────────────────────────────────────────────────────┐
│ ● Quotation                                    ⊙ Upcoming ∧ │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Address *                                    From: Acme Corp│
│  ┌─────────────────────────────────────────────────┐  [✎]  │
│  │ 123 Main Street, Suite 400                      │       │
│  │ São Paulo, SP 01310-100, Brazil                 │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  Net Price              Sales Price                         │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │ 800          │      │ 1200         │                    │
│  └──────────────┘      └──────────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Edit Mode with Autocomplete

When editing, the field transforms into an autocomplete input:

```
┌─────────────────────────────────────────────────────────────┐
│  Address *                          Will save to: Acme Corp │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 123 Main Street, São Paulo                          🔍 ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 📍 123 Main Street, Bela Vista, São Paulo, SP, Brazil  ││
│  │ 📍 123 Main Street, Jardins, São Paulo, SP, Brazil     ││
│  │ 📍 123 Main Street North, Miami, FL, USA               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Cancel] [Apply]              [Enter manually instead →]   │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Manual Entry Fallback

If user clicks "Enter manually instead" or API is unavailable:

```
┌─────────────────────────────────────────────────────────────┐
│  Address *                          Will save to: Acme Corp │
│                                                             │
│  Street *                                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 123 Main Street                                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Complement                        Neighborhood             │
│  ┌────────────────────┐           ┌────────────────────┐   │
│  │ Suite 400          │           │ Bela Vista         │   │
│  └────────────────────┘           └────────────────────┘   │
│                                                             │
│  City *                            State/Province *         │
│  ┌────────────────────┐           ┌────────────────────┐   │
│  │ São Paulo          │           │ SP               ▼ │   │
│  └────────────────────┘           └────────────────────┘   │
│                                                             │
│  Country *                         Postal Code *            │
│  ┌────────────────────┐           ┌────────────────────┐   │
│  │ Brazil           ▼ │           │ 01310-100         │   │
│  └────────────────────┘           └────────────────────┘   │
│                                                             │
│  [Cancel] [Apply]                    [Use autocomplete →]   │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 Contact Form with Individual Client Toggle

When creating/editing a Contact, the `is_individual` toggle controls the form behavior:

```
┌─────────────────────────────────────────────────────────────┐
│  Contact Details                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Name *                            Email                    │
│  ┌────────────────────┐           ┌────────────────────┐   │
│  │ John Doe           │           │ john@example.com   │   │
│  └────────────────────┘           └────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ Individual Client                                 │   │
│  │   This contact purchases directly, not through a    │   │
│  │   company. Address will be stored on the contact.   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─── Address (visible when Individual Client = true) ───   │
│                                                             │
│  Address                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Type to search...                               🔍  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─── Company (hidden when Individual Client = true) ────   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

When `is_individual = false` (default), the Company field is shown and required, and the Address section is hidden.

---

## 7. Technical Considerations

### 7.1 Google Places API Integration

- **API Used:** Google Places API (New) - Autocomplete + Place Details
- **Free Tier:** ~10,000 Autocomplete requests/month + ~10,000 Place Details requests/month
- **Cost:** $0 for free tier; pay-as-you-go beyond that
- **Billing Requirement:** Must enable billing on Google Cloud project (even for free tier)
- **Rate Limiting:** Implement debouncing (300ms) on autocomplete requests to minimize API calls
- **Session Tokens:** Use session tokens to bundle Autocomplete + Place Details requests for billing optimization

### 7.2 Google Places API Response Structure

Google returns structured `address_components` in the Place Details response. Example:

```json
{
  "result": {
    "formatted_address": "Avenida Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100, Brazil",
    "place_id": "ChIJrTLr-GyuEmsRBfy61i59si0",
    "address_components": [
      { "long_name": "1000", "short_name": "1000", "types": ["street_number"] },
      { "long_name": "Avenida Paulista", "short_name": "Av. Paulista", "types": ["route"] },
      { "long_name": "Bela Vista", "short_name": "Bela Vista", "types": ["sublocality", "sublocality_level_1"] },
      { "long_name": "São Paulo", "short_name": "São Paulo", "types": ["administrative_area_level_2", "political"] },
      { "long_name": "São Paulo", "short_name": "SP", "types": ["administrative_area_level_1", "political"] },
      { "long_name": "Brazil", "short_name": "BR", "types": ["country", "political"] },
      { "long_name": "01310-100", "short_name": "01310-100", "types": ["postal_code"] }
    ]
  }
}
```

Map Google fields to TIMS fields as follows:

| Google Component Type | TIMS Field |
|-----------------------|------------|
| `street_number` + `route` | `street` |
| (user input or empty) | `complement` |
| `sublocality` or `neighborhood` | `neighborhood` |
| `locality` or `administrative_area_level_2` | `city` |
| `administrative_area_level_1` | `state_province` |
| `country` | `country` |
| `postal_code` | `postal_code` |
| `formatted_address` | `formatted_address` |
| `place_id` | `place_id` |

### 7.3 Database Schema Changes

```sql
-- Add is_individual flag to contacts table
ALTER TABLE contacts ADD COLUMN is_individual BOOLEAN DEFAULT FALSE;

-- Add address fields to companies table
ALTER TABLE companies ADD COLUMN address_street TEXT;
ALTER TABLE companies ADD COLUMN address_complement TEXT;
ALTER TABLE companies ADD COLUMN address_neighborhood TEXT;
ALTER TABLE companies ADD COLUMN address_city TEXT;
ALTER TABLE companies ADD COLUMN address_state_province TEXT;
ALTER TABLE companies ADD COLUMN address_country TEXT;
ALTER TABLE companies ADD COLUMN address_postal_code TEXT;
ALTER TABLE companies ADD COLUMN address_formatted TEXT;
ALTER TABLE companies ADD COLUMN address_place_id TEXT;

-- Add indexes for filtering
CREATE INDEX idx_companies_city ON companies(address_city);
CREATE INDEX idx_companies_state ON companies(address_state_province);
CREATE INDEX idx_companies_country ON companies(address_country);

-- Add address fields to contacts table (for individual clients)
ALTER TABLE contacts ADD COLUMN address_street TEXT;
ALTER TABLE contacts ADD COLUMN address_complement TEXT;
ALTER TABLE contacts ADD COLUMN address_neighborhood TEXT;
ALTER TABLE contacts ADD COLUMN address_city TEXT;
ALTER TABLE contacts ADD COLUMN address_state_province TEXT;
ALTER TABLE contacts ADD COLUMN address_country TEXT;
ALTER TABLE contacts ADD COLUMN address_postal_code TEXT;
ALTER TABLE contacts ADD COLUMN address_formatted TEXT;
ALTER TABLE contacts ADD COLUMN address_place_id TEXT;

-- Add indexes for filtering individual client addresses
CREATE INDEX idx_contacts_individual ON contacts(is_individual) WHERE is_individual = TRUE;
CREATE INDEX idx_contacts_city ON contacts(address_city) WHERE is_individual = TRUE;
CREATE INDEX idx_contacts_state ON contacts(address_state_province) WHERE is_individual = TRUE;
CREATE INDEX idx_contacts_country ON contacts(address_country) WHERE is_individual = TRUE;
```

### 7.4 Dependencies

- **Google Maps JavaScript API** (Places library)
- **@googlemaps/js-api-loader** (recommended for TypeScript integration)
- Existing: Supabase, React, TypeScript

### 7.5 Environment Variables

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-api-key>
```

Note: The API key should be restricted by HTTP referrer in the Google Cloud Console for security. Since autocomplete runs client-side, the key will be exposed in the browser, but referrer restrictions prevent unauthorized use.

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Address completion rate in Quotation stage | 95%+ | % of Opportunities with address before Closing |
| Autocomplete usage | 80%+ | % of addresses entered via Google autocomplete vs. manual |
| Data quality (structured fields populated) | 100% | % of addresses with city, state, country filled |
| User efficiency | -50% time | Time to enter address vs. manual entry baseline |
| Filter adoption | Track usage | # of filter queries using address fields (city/state/country) |
| API usage within free tier | <10,000/month | Monthly Google API calls (should stay well within free tier) |

---

## 9. Design Decisions

The following decisions were made during PRD development:

1. **Individual Client UI Placement:** Left to developer discretion during implementation. The toggle should be placed where it makes the most sense for form flow and user experience.

2. **Existing Contacts Migration:** Existing Contacts without a Company will **NOT** be automatically flagged as `is_individual = true`. This will be a manual process—users must explicitly mark contacts as individual clients.

3. **Contact Address Visibility:** When a Contact is marked as `is_individual = true`, their address **will be visible and editable** on the Contact detail page (not just through Opportunities).
