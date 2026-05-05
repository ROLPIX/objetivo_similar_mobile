# Firebase Security Specification

## Data Invariants
1. A `TimeLog` must belong to an existing `AppUser`.
2. A `DailyAttendance` record must be linked to a `WorkLocation`.
3. Users can only see their own `NotificationItem` and `TimeLog` (unless they are a manager).
4. `LeaveRequest` status can only be modified by a manager (`role === 'gestor'`).
5. `WorkLocation` data can only be modified by a manager.

## The "Dirty Dozen" Payloads (Red Team Test Cases)

1. **Identity Spoofing**: User A attempts to create a `TimeLog` with `app_user_id` of User B.
2. **State Shortcutting**: User attempts to approve their own `LeaveRequest` by setting `status` to 'approved'.
3. **Ghost Field Injection**: User attempts to update their profile with a field `role: 'gestor'`.
4. **Denial of Wallet**: User attempts to inject a 1MB string as a `reason` in a `LeaveRequest`.
5. **Unauthorized Multi-User Delete**: User attempts to delete all `TimeLog` records.
6. **Relation Breaking**: User attempts to create a `TimeLog` for a non-existent `work_location_id`.
7. **Bypassing Invariants**: User attempts to set `valid: true` on a `TimeLog` even if they are outside the geofence (client logic bypassed).
8. **PII Leak**: Non-manager attempts to read all `AppUser` emails.
9. **History Tampering**: User attempts to write to `AuditLog` directly.
10. **Resource Poisoning**: User attempts to use a document ID containing special characters or extremely long strings.
11. **Timestamp Spoofing**: User attempts to set a custom `created_at` timestamp in the past.
12. **Blanket Read Attack**: User attempts to list all `location_history` for all users.

## Security Rules Audit

| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
| :--- | :--- | :--- | :--- |
| users | Protected (role immutable) | N/A | Protected (size checks) |
| work_locations | Protected (Manager only) | Protected (Manager only) | Protected (size checks) |
| time_logs | Protected (Auth ID match) | N/A | Protected (size checks) |
| attendances | Protected (Auth ID match) | N/A | Protected (size checks) |
| leave_requests | Protected (Auth ID match) | Manager only status | Protected (size checks) |
| notifications | Protected (User match) | N/A | Protected (size checks) |
| location_history | Protected (User match) | N/A | Protected (size checks) |
| devices | Protected (User match) | N/A | Protected (size checks) |
