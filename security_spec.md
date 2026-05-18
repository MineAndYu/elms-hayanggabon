# Security Specification - EduTrack Pro

## Data Invariants
1. A user can only be created by an existing admin or on first setup (if no admins exist).
2. Students can only be managed by admins.
3. Attendance and Behavior logs can be written by teachers and admins.
4. Emergency closures can only be created by admins.
5. Users can only read their own profile, but admins can read all users.
6. Parents (not logged in) cannot read data directly; the system notifies them via secondary channels (server-side). However, for this MVP, I'll assume teachers/admins access the data.

## The "Dirty Dozen" Payloads (Denial Tests)
1. Creating a user with `role: 'admin'` as a non-admin.
2. Marking a student present with a future date.
3. Modifying `markedBy` to someone else's ID.
4. Deleting a student record as a teacher.
5. Creating an emergency closure notification as a teacher.
6. Reading `users` collection as a teacher (restricted to specific fields or own profile).
7. Injecting a 2MB string into `behaviorLog.comment`.
8. Updating `studentId` on an existing attendance record.
9. Creating a behavior log for a non-existent student.
10. Setting `role: 'admin'` in a user's own profile update.
11. Reading PII (phone numbers) of all students as a non-authenticated user.
12. Bulk deleting attendance records.

## Rules Logic
- `isSignedIn()`
- `isAdmin()`: Check if `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'`
- `isTeacher()`: Check if `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher'`
- `isValidUser(data)`
- `isValidStudent(data)`
- `isValidAttendance(data)`
- `isValidBehaviorLog(data)`
- `isValidEmergencyClosure(data)`

I'll now write the `DRAFT_firestore.rules`.
