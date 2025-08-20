# Admin Panel Enhancements - Request Management

## Current State Analysis

### Existing Features ✅
- Basic applications table with ID, National Number, Service, Date, Status
- Approve/Reject functionality with rejection reasons
- Rejection reasons are stored in database (`rejection_reason` field)
- Basic status badges (Pending, Approved, Rejected)

### Current Limitations ❌
- **No "View Request" toggle** - Cannot see detailed request information
- **No document viewing** - Cannot see attached documents or full request details
- **Limited request details** - Only basic info shown in table
- **No expandable rows** - All info cramped in table format

## Required Enhancements

### 1. "View Request" Toggle Functionality
**Requirement**: Admin must have a "View Request" toggle for each pending request.

**Implementation Plan**:
- Add expandable row functionality to [`ApplicationsTable`](src/components/admin/applications/ApplicationsTable.tsx)
- Create toggle button/icon for each row
- Implement collapsible detail section below each row
- Show/hide detailed information on toggle

### 2. Full Request Details Display
**Requirement**: When toggled, show full request details and attached documents.

**Current Available Data** (from [`ServiceApplication`](src/types/application.ts)):
- `application_id`: Application ID
- `national_number`: User's national number
- `service_id`: Service type (1=Passport, 2=National ID, etc.)
- `submitted_at`: Submission timestamp
- `application_status`: Current status
- `invoice_number`: Payment invoice number
- `office_location`: Selected office
- `emergency_reason`: Emergency/replacement reason

**Additional Data Needed**:
- User personal information (name, phone, email, address)
- Service-specific details
- Payment information
- Document attachments (if any)
- Application history/timeline

### 3. Enhanced Approve/Reject Workflow
**Requirement**: Admin must approve or reject the request before it is processed.

**Current State**: ✅ Already implemented
- Approve button creates document automatically
- Reject button requires reason input
- Rejection reasons saved to database

**Enhancement Needed**:
- Ensure no processing without admin action
- Add confirmation dialogs for both approve/reject
- Show processing status clearly

### 4. Document Viewing Capability
**Requirement**: Show attached documents in request details.

**Implementation Plan**:
- Check if document storage is implemented
- Add document preview/download functionality
- Display document metadata (type, size, upload date)
- Handle different document formats (PDF, images)

## Technical Implementation Plan

### Phase 1: Enhanced Table with View Toggle
1. **Update ApplicationsTable Component**:
   - Add expandable row state management
   - Create toggle button with eye icon
   - Implement smooth expand/collapse animation
   - Add detailed view section

2. **Create RequestDetailsView Component**:
   - Display comprehensive request information
   - Show user details, service specifics, payment info
   - Include timeline of application status changes
   - Add document preview section

### Phase 2: Data Enhancement
1. **Extend Database Queries**:
   - Join with `users` table for personal information
   - Join with `services` table for service details
   - Add payment status information
   - Include document attachments if available

2. **Update Types and Interfaces**:
   - Extend [`ServiceApplication`](src/types/application.ts) interface
   - Add detailed request information types
   - Include document attachment types

### Phase 3: Document Management
1. **Document Storage Integration**:
   - Check existing document storage setup
   - Implement document retrieval functionality
   - Add document preview capabilities
   - Handle security and access control

2. **Document Display Component**:
   - Create document viewer component
   - Support multiple file formats
   - Add download functionality
   - Include document metadata display

## Database Schema Considerations

### Current Schema ✅
```sql
service_applications (
  application_id,
  national_number,
  service_id,
  submitted_at,
  application_status,
  invoice_number,
  office_location,
  emergency_reason,
  rejection_reason  -- ✅ Already exists
)
```

### Potential Enhancements
- Document attachments table (if not exists)
- Application status history table
- Admin action logs table

## UI/UX Design

### Enhanced Table Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ ID │ User │ Service │ Date │ Status │ Actions │ [👁️ View] │
├─────────────────────────────────────────────────────────────────┤
│ 123│ John │ Passport│ Today│ Pending│ [✓][✗] │ [👁️ View] │
│    │ ▼ EXPANDED REQUEST DETAILS                                  │
│    │ ┌─────────────────────────────────────────────────────────┐ │
│    │ │ Personal Info: John Doe, +123456789, john@email.com    │ │
│    │ │ Service: Passport Application (New)                     │ │
│    │ │ Office: Central Office, Khartoum                        │ │
│    │ │ Payment: Invoice #INV123 - Paid                         │ │
│    │ │ Documents: [📄 ID Copy] [📄 Photo] [📄 Form]           │ │
│    │ │ Emergency: None                                         │ │
│    │ │ Submitted: 2024-01-15 10:30 AM                          │ │
│    │ │ ┌─────────────────────────────────────────────────────┐ │ │
│    │ │ │ [✅ Approve & Create Document] [❌ Reject]          │ │ │
│    │ │ └─────────────────────────────────────────────────────┘ │ │
│    │ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Success Criteria

### ✅ Must Have Features
1. **View Toggle**: Each pending request has a clickable "View Request" button/icon
2. **Expandable Details**: Clicking toggle shows/hides comprehensive request information
3. **Full Information**: Display all relevant request details including user info, service specifics, payment status
4. **Document Access**: Show and allow viewing/downloading of attached documents
5. **Approval Workflow**: Admin must explicitly approve or reject before processing
6. **Rejection Reasons**: Maintain existing rejection reason functionality

### 🎯 Enhanced User Experience
1. **Smooth Animations**: Expand/collapse with smooth transitions
2. **Clear Visual Hierarchy**: Well-organized information display
3. **Responsive Design**: Works on different screen sizes
4. **Loading States**: Clear feedback during data loading
5. **Error Handling**: Graceful handling of missing data or errors

## Implementation Priority

### High Priority (Must Implement)
1. ✅ View Request toggle functionality
2. ✅ Expandable request details display
3. ✅ Enhanced data fetching with user information

### Medium Priority (Should Implement)
1. 🔄 Document viewing capabilities
2. 🔄 Enhanced approval workflow with confirmations
3. 🔄 Application timeline/history

### Low Priority (Nice to Have)
1. 📋 Advanced filtering and search
2. 📋 Bulk operations
3. 📋 Export functionality