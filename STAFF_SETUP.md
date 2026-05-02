# Staff User Setup — Required Before Launch

## Purpose
The Growth Engine now uses role-aware Firestore security rules tied to the `staffUsers` collection.

Without proper staff setup, admin dashboards may authenticate successfully but still fail Firestore reads/writes.

---

# First Required Step

After creating your Firebase Auth admin account, manually create a Firestore document:

```txt
staffUsers/{YOUR_FIREBASE_AUTH_UID}
```

Example:
```txt
staffUsers/abc123xyz
```

---

## Required Fields

```json
{
  "role": "owner",
  "createdAt": "serverTimestamp",
  "createdBy": "initial_setup"
}
```

---

# Available Roles

## owner
Full system control.

## admin
Administrative management.

## staff
Operational staff.

## marketing
Content/proof systems.

## readonly
Metrics visibility only.

---

# Recommended Initial Setup

### Founder Account:
```txt
role: owner
```

### Future Operations Manager:
```txt
role: admin
```

### Sharpeners:
```txt
role: staff
```

### Content Team:
```txt
role: marketing
```

---

# Security Principle

Do not rely only on Firebase Auth.

Firebase Auth = identity
staffUsers role = permissions

---

# Common Failure Mode

## Symptom:
Login works, but dashboard data fails.

## Cause:
Authenticated user missing `staffUsers/{uid}` document.

---

# Before Deployment
- [ ] Founder account exists in Firebase Auth
- [ ] Founder `staffUsers/{uid}` exists
- [ ] Founder role = owner
- [ ] Test `/dashboard`
- [ ] Test `/commercial`
- [ ] Test `/invoices`
