# PRD: Opportunity Detail Page

## 1. Introduction/Overview

Currently, when users click on an opportunity card in the Kanban view or a row in the List view, a modal popup displays basic opportunity information. This PRD defines a new **Opportunity Detail Page** - a dedicated full-page view for each sales opportunity that provides comprehensive information, editing capabilities, and activity tracking.

The TIMS CRM uses a **cumulative stage model**, meaning each stage (Lead Backlog → Qualification → Quotation → Closing → Won/Lost) has specific required fields that must be completed before advancing. The new detail page will visually represent this progression and make it clear what information is needed at each stage.

### Problem Statement

The current modal popup is insufficient for managing complex sales opportunities because:
- It lacks space to display all relevant information across multiple stages
- Users cannot see what fields will be required in future stages
- There is no activity tracking or timeline visibility
- Editing related entities (Contact, Company, Product, Manufacturer) requires navigating away
- File attachments and communication history are not accessible

### Solution

Replace the modal with a **slide-in drawer for quick preview** and a **full-page detail view for comprehensive management**. The full page will display stage-specific fields in columns, provide inline editing of related entities, track all activities in a timeline, and support file attachments.

---

## 2. Goals

1. **Improve opportunity visibility**: Users can see all opportunity information, related entities, and history in one place
2. **Clarify stage requirements**: Visual column-based layout shows required fields per stage, highlighting the current stage
3. **Enable efficient data entry**: Users can edit opportunity fields and related entities without navigating away
4. **Track all interactions**: Comprehensive timeline logs stage changes, field edits, and activities
5. **Support document management**: Users can attach and manage files relevant to each opportunity
6. **Streamline workflow**: Quick drawer preview for scanning, full page for detailed work

---

## 3. User Stories

### Quick Preview (Drawer)
- **US-1**: As a sales rep, I want to quickly preview an opportunity's key details by clicking on it in the Kanban/List view, so I can get context without leaving my current view.
- **US-2**: As a sales rep, I want to open the full detail page from the drawer, so I can access complete information when needed.

### Full Page - Stage Management
- **US-3**: As a sales rep, I want to see all stage columns with their required fields, so I know what information I need to collect as the opportunity progresses.
- **US-4**: As a sales rep, I want the current stage to be visually highlighted, so I can immediately identify where the opportunity stands.
- **US-5**: As a sales rep, I want to advance an opportunity to the next stage via a breadcrumb navigation, so I can progress deals efficiently.
- **US-6**: As a sales rep, I want the system to validate required fields before allowing stage advancement, so I don't accidentally skip important information.

### Full Page - Information Display
- **US-7**: As a sales rep, I want to see how many days since the opportunity was created, so I can track deal velocity.
- **US-8**: As a sales rep, I want to view and edit Contact information from the opportunity page, so I don't have to navigate to the Database module.
- **US-9**: As a sales rep, I want to view and edit Company information from the opportunity page, so I can update client details in context.
- **US-10**: As a sales rep, I want to view and edit Product information from the opportunity page, so I can reference and update product details.
- **US-11**: As a sales rep, I want to view and edit Manufacturer information from the opportunity page, so I can access supplier details.
- **US-12**: As a sales rep, I want to remove a Contact/Company/Product/Manufacturer association from an opportunity, so I can correct mistakes or update the deal scope.

### Full Page - Timeline & Activities
- **US-13**: As a sales rep, I want to see a timeline of all changes to the opportunity, so I can understand its history.
- **US-14**: As a sales rep, I want to log activities (Follow Up, Call, Email, Meeting) on an opportunity, so I can track my interactions.
- **US-15**: As a sales rep, I want to filter the timeline by activity type, so I can find specific interactions quickly.

### Full Page - Files
- **US-16**: As a sales rep, I want to attach files to an opportunity, so I can keep relevant documents organized.
- **US-17**: As a sales rep, I want to view, download, and delete attached files, so I can manage opportunity documentation.

### Full Page - Won/Lost
- **US-18**: As a sales rep, I want to mark an opportunity as Won and provide the client purchase order (or description of where the order was agreed), so I can close successful deals with proper documentation.
- **US-19**: As a sales rep, I want to mark an opportunity as Lost and select a reason from a predefined list, so I can track why deals are not closing.
- **US-20**: As an admin, I want to configure custom lost reasons in addition to the predefined ones, so I can tailor the system to our business needs.

---

## 4. Functional Requirements

### 4.1 Quick Preview Drawer

| ID | Requirement |
|----|-------------|
| FR-1 | When a user clicks an opportunity card (Kanban) or row (List view), a drawer panel shall slide in from the right side of the screen |
| FR-2 | The drawer shall display: Opportunity name, Current stage, Contact name, Company name, Product name, Lead Origin, Office (TIA/TIC), Days since creation |
| FR-3 | The drawer shall include a "View Full Details" button that navigates to the full Opportunity Detail Page |
| FR-4 | The drawer shall include a "Close" button (X) to dismiss without navigation |
| FR-5 | The drawer shall be read-only; no editing is permitted from the drawer |
| FR-6 | Clicking outside the drawer shall close it |

### 4.2 Full Page - Layout & Navigation

| ID | Requirement |
|----|-------------|
| FR-7 | The Opportunity Detail Page shall be accessible via URL pattern: `/crm/opportunities/{opportunity_id}` |
| FR-8 | The page shall include a back button/link to return to the previous view (Kanban or List) |
| FR-9 | The page header shall display the Opportunity name and a "Mark as Lost" button |
| FR-10 | Below the header, a **stage breadcrumb navigation** shall display all stages: Lead Backlog → Qualification → Quotation → Closing → Won |
| FR-11 | The current stage shall be visually highlighted in the breadcrumb (e.g., different background color, bold text, or indicator) |
| FR-12 | Completed stages shall be visually distinct from upcoming stages (e.g., checkmark, different color) |
| FR-13 | The page shall display "Days Open" - the number of days since the opportunity was created |

### 4.3 Full Page - Stage Fields (Column Layout)

| ID | Requirement |
|----|-------------|
| FR-14 | The main content area shall display stage-specific fields in a **column layout**, with one column per stage |
| FR-15 | Each column shall be labeled with the stage name |
| FR-16 | The current stage column shall be visually highlighted (e.g., border, background, or elevation) |
| FR-17 | Fields in the current stage column shall be editable |
| FR-18 | Fields in completed stages shall be editable (users may need to correct past data) |
| FR-19 | Fields in future stages shall be visible but disabled/greyed out until the opportunity reaches that stage |
| FR-20 | Required fields shall be clearly marked (e.g., asterisk, "Required" label) |

#### Stage: Lead Backlog (Required Fields)

| ID | Requirement |
|----|-------------|
| FR-21 | The Lead Backlog column shall include the field: **Contact** (relationship to Contacts entity) |
| FR-22 | The Lead Backlog column shall include the field: **Product** (relationship to Products entity) |
| FR-23 | The Lead Backlog column shall include the field: **Lead Origin** (selection from predefined options) |
| FR-24 | All three fields (Contact, Product, Lead Origin) are required before advancing to Qualification |

#### Stage: Qualification (Required Fields)

| ID | Requirement |
|----|-------------|
| FR-25 | The Qualification column shall be defined in a future update (fields TBD) |
| FR-26 | Placeholder text shall indicate "Fields to be defined" |

#### Stage: Quotation (Required Fields)

| ID | Requirement |
|----|-------------|
| FR-27 | The Quotation column shall be defined in a future update (fields TBD) |
| FR-28 | Placeholder text shall indicate "Fields to be defined" |

#### Stage: Closing (Required Fields)

| ID | Requirement |
|----|-------------|
| FR-29 | The Closing column shall be defined in a future update (fields TBD) |
| FR-30 | Placeholder text shall indicate "Fields to be defined" |

#### Stage: Won (Final Stage)

| ID | Requirement |
|----|-------------|
| FR-31 | When marking an opportunity as Won, the user shall be required to provide either: a) Client Purchase Order (file upload), OR b) Order Agreement Description (text field describing where/how the order was confirmed) |
| FR-32 | At least one of the two Won fields must be provided to complete the Won stage |

### 4.4 Stage Advancement

| ID | Requirement |
|----|-------------|
| FR-33 | Users shall advance to the next stage by clicking on the next stage in the breadcrumb navigation |
| FR-34 | When a user attempts to advance, the system shall validate that all required fields for the current stage are completed |
| FR-35 | If validation fails, the system shall display an error message listing the missing required fields |
| FR-36 | If validation passes, the system shall update the opportunity stage and log the change in the timeline |
| FR-37 | Users shall NOT be able to skip stages (e.g., cannot go from Lead Backlog directly to Quotation) |
| FR-38 | Users SHALL be able to move backward to previous stages (for corrections) |

### 4.5 Related Entities Panel

| ID | Requirement |
|----|-------------|
| FR-39 | A sidebar or panel shall display related entity information: Contact, Company, Product, Manufacturer |
| FR-40 | Each related entity section shall display key information (name, and 2-3 most relevant fields) |
| FR-41 | Each related entity section shall have an "Edit" button that opens an inline edit form or modal |
| FR-42 | Each related entity section shall have a "Remove" button to disassociate the entity from the opportunity |
| FR-43 | Removing a related entity shall require confirmation ("Are you sure you want to remove this Contact from the opportunity?") |
| FR-44 | If a required related entity is removed (e.g., Contact in Lead Backlog stage), the system shall warn the user that the opportunity will no longer meet stage requirements |
| FR-45 | Each related entity section shall have an "Add" or "Change" option to associate a different entity |
| FR-46 | Company and Manufacturer may be optional; the system shall allow opportunities without these associations |

### 4.6 Timeline

| ID | Requirement |
|----|-------------|
| FR-47 | The page shall include a Timeline section displaying the opportunity's history |
| FR-48 | The timeline shall log: Stage changes (with from/to stages and timestamp) |
| FR-49 | The timeline shall log: Field edits (field name, old value, new value, timestamp, user) |
| FR-50 | The timeline shall log: Activities (type, description, timestamp, user) |
| FR-51 | The timeline shall log: File uploads and deletions |
| FR-52 | The timeline shall log: Related entity changes (added, removed, edited) |
| FR-53 | Timeline entries shall display in reverse chronological order (newest first) |
| FR-54 | The timeline shall include filter options: All, Stage Changes, Field Edits, Activities, Files |
| FR-55 | Each timeline entry shall display the user who performed the action |

### 4.7 Activities Panel

| ID | Requirement |
|----|-------------|
| FR-56 | The page shall include an Activities section for logging interactions |
| FR-57 | Supported activity types: Follow Up, Call, Email, Meeting |
| FR-58 | To log an activity, the user shall select the type, enter a description, and optionally set a date/time |
| FR-59 | Activities shall be saved to the database and appear in the Timeline |
| FR-60 | Users shall be able to edit and delete their own logged activities |
| FR-61 | Note: Backend implementation for activities is pending; frontend should be built to integrate when ready |

### 4.8 Files Section

| ID | Requirement |
|----|-------------|
| FR-62 | The page shall include a Files section for document management |
| FR-63 | Users shall be able to upload files by clicking an "Add File" button or dragging and dropping |
| FR-64 | The system shall display uploaded files with: file name, file type icon, upload date, uploaded by |
| FR-65 | Users shall be able to download attached files |
| FR-66 | Users shall be able to delete attached files (with confirmation) |
| FR-67 | File uploads shall be logged in the Timeline |
| FR-68 | Accepted file types: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG (configurable) |
| FR-69 | Maximum file size: 10MB per file (configurable) |

### 4.9 Mark as Lost

| ID | Requirement |
|----|-------------|
| FR-70 | The "Mark as Lost" button shall be visible on the page header at all stages except Won |
| FR-71 | Clicking "Mark as Lost" shall open a modal/dialog |
| FR-72 | The modal shall require the user to select a Lost Reason from a dropdown |
| FR-73 | The dropdown shall include predefined reasons (to be configured) plus any admin-added custom reasons |
| FR-74 | The dropdown shall include an "Other" option |
| FR-75 | If "Other" is selected, a text field shall appear requiring a description |
| FR-76 | Upon confirmation, the opportunity stage shall change to "Lost" and be removed from active pipeline views |
| FR-77 | Lost opportunities shall remain accessible via search and filters |
| FR-78 | The lost action shall be logged in the Timeline with the selected reason |

### 4.10 Lost Reasons Administration

| ID | Requirement |
|----|-------------|
| FR-79 | Admins shall be able to add custom lost reasons via a settings/admin interface |
| FR-80 | Admins shall be able to edit and delete custom lost reasons |
| FR-81 | Predefined lost reasons shall not be deletable, but may be hidden/disabled |
| FR-82 | The system shall include the following predefined lost reasons: Price, Competitor, No Budget, No Response, Project Cancelled, Timeline Mismatch, Technical Requirements Not Met |

---

## 5. Non-Goals (Out of Scope)

The following items are explicitly **not** included in this feature:

1. **Email integration**: Automatically logging emails from Gmail/Outlook (future feature)
2. **WhatsApp integration**: Logging WhatsApp communications (future feature)
3. **Automated reminders**: Notifications for stale opportunities or upcoming activities
4. **Opportunity duplication**: Creating a copy of an existing opportunity
5. **Bulk actions**: Editing multiple opportunities at once
6. **Custom fields per stage**: Admin ability to add custom fields (stages have fixed fields for now)
7. **Approval workflows**: Requiring manager approval for stage advancement
8. **Defining Qualification, Quotation, and Closing stage fields**: These will be defined in subsequent PRDs
9. **Mobile-optimized layout**: Responsive design for mobile devices (may be addressed later)
10. **Printing/PDF export**: Generating a printable summary of the opportunity

---

## 6. Design Considerations

### Layout Reference
- The full-page layout should reference the Moskit CRM design (Image 5 from requirements) for general structure
- Stage breadcrumb at top (horizontal)
- Stage field columns in main content area
- Related entities panel on the right side
- Timeline/Activities in a dedicated section (bottom or tab-based)

### Visual Hierarchy
- Current stage column should have clear visual emphasis (e.g., highlighted border, elevated card)
- Completed stages should show completion indicators (checkmarks)
- Future stages should appear muted/disabled

### Color Coding (Suggestions)
- Lead Backlog: Neutral/Grey
- Qualification: Blue
- Quotation: Yellow/Amber
- Closing: Orange
- Won: Green
- Lost: Red

### Drawer Behavior
- Drawer should slide in from the right
- Width: approximately 400-450px
- Should not cover the entire screen
- Background should be slightly dimmed

### Responsiveness
- Primary target: Desktop (1280px+ width)
- Tablet support: Stack columns vertically if needed
- Mobile: Out of scope for initial release

---

## 7. Technical Considerations

### Frontend
- Built with existing React + TypeScript + Tailwind CSS stack
- New route: `/crm/opportunities/:opportunityId`
- State management for form data and validation
- Optimistic updates for better UX

### Backend/Database (Supabase)
- **opportunity_timeline** table needed for audit logging
- **opportunity_files** table for file attachments (linked to Supabase Storage)
- **opportunity_activities** table for activity logging (pending backend implementation)
- **lost_reasons** table for configurable lost reasons
- Row Level Security (RLS) policies for multi-office data access (TIA/TIC)

### File Storage
- Use Supabase Storage for file attachments
- Organize by opportunity ID: `opportunities/{opportunity_id}/files/`
- Implement secure signed URLs for downloads

### API Endpoints Needed
- `GET /opportunities/:id` - Full opportunity details with related entities
- `PATCH /opportunities/:id` - Update opportunity fields
- `POST /opportunities/:id/advance` - Advance to next stage (with validation)
- `POST /opportunities/:id/lost` - Mark as lost with reason
- `POST /opportunities/:id/won` - Mark as won with order details
- `GET /opportunities/:id/timeline` - Fetch timeline entries
- `POST /opportunities/:id/activities` - Log an activity
- `POST /opportunities/:id/files` - Upload file
- `DELETE /opportunities/:id/files/:fileId` - Delete file
- `GET /lost-reasons` - Fetch lost reasons
- `POST /lost-reasons` - Create custom reason (admin)

### Performance
- Lazy load timeline entries (pagination)
- Optimize related entity queries (avoid N+1)
- Consider caching frequently accessed data

### Security
- Validate all inputs server-side
- Implement RLS for opportunity access by office
- Secure file uploads (validate file types, scan for malware if possible)
- Audit all changes with user attribution

---

## 8. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Adoption of full page view | 80% of opportunity views use full page within 30 days | Analytics tracking |
| Time to update opportunity | Reduce average edit time by 25% | Compare before/after metrics |
| Stage advancement completion | 95% of advancement attempts succeed on first try | Track validation failures |
| Activity logging usage | Average 3+ activities logged per opportunity | Database query |
| File attachment usage | 50% of opportunities have at least one file | Database query |
| User satisfaction | Positive feedback from sales team | User interviews/surveys |

---

## 9. Open Questions

1. **Predefined Lost Reasons**: The PRD includes suggested reasons. Are these acceptable, or should they be modified?
   - Current list: Price, Competitor, No Budget, No Response, Project Cancelled, Timeline Mismatch, Technical Requirements Not Met

2. **Lead Origin Options**: What are the predefined options for Lead Origin field?
   - Suggested: Website, Referral, Trade Show, Cold Call, Manufacturer, Partner, Other

3. **Activity Backend**: When will the activity logging backend be available? Should the frontend be built with mock data first?

4. **Office (TIA/TIC) Field**: Is the office field automatically set based on the user's assignment, or should it be selectable per opportunity?

5. **Manufacturer Association**: Is Manufacturer always linked through Product, or can it be independently associated with an opportunity?

6. **Timeline Retention**: Should timeline entries be retained indefinitely, or is there a cleanup policy?

7. **File Storage Limits**: Is there a maximum total storage per opportunity or globally?

8. **Qualification/Quotation/Closing Fields**: When will requirements for these stages be defined? Is there a timeline?

9. **Concurrent Editing**: What happens if two users try to edit the same opportunity simultaneously? Should we implement locking or last-write-wins?

10. **Localization**: Should field labels and UI elements support both English and Portuguese from the start, or will localization be added later?

---

## Appendix: Stage Field Summary

| Stage | Required Fields | Status |
|-------|-----------------|--------|
| Lead Backlog | Contact, Product, Lead Origin | Defined |
| Qualification | TBD | Pending |
| Quotation | TBD | Pending |
| Closing | TBD | Pending |
| Won | Purchase Order OR Order Agreement Description | Defined |
| Lost | Lost Reason (from list) | Defined |

---

*Document Version: 1.0*
*Created: December 2024*
*Author: Claude (AI Assistant)*
*For: TIMS - Tennessine Integrative Management Software*
