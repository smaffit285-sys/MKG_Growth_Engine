# MKG Growth Engine — Inquiry Pipeline MVP

A browser-based first iteration for tracking Miami Knife Guy sharpening inquiries, drafting approval-required follow-ups, and retaining completed customers.

## Included

- New inquiry intake and customer matching by phone number
- Lead stages from new inquiry through completed service, dropped conversation, dormancy, and do-not-contact
- Automatic reopening when an inbound customer reply is added
- Conversation timeline and service snapshot
- Status-aware follow-up drafts
- Copy-to-clipboard workflow for sending through Microsoft Phone Link
- Manual **Mark as sent** logging
- Follow-up scheduling constrained to 9:00 a.m.–9:00 p.m.
- Existing-customer and seasonal campaign eligibility display
- Local browser persistence using `localStorage`

## Run

Open `index.html` in a browser or deploy the repository as a static site. Click **Load demo lead** to load the Zarina example inquiry.

## Important Phase 1 limitations

This build deliberately does not send texts, read Phone Link automatically, call an AI model, or sync to a cloud database. It is an approval-first workflow for validating statuses, drafts, and operating behavior before automation.

## Planned next iteration

1. Replace local storage with authenticated cloud persistence.
2. Add offer and campaign management with frequency caps.
3. Add date-driven draft queues and overdue reminders.
4. Build a Windows companion importer for the currently open Phone Link thread, with phone-number verification and duplicate detection.
5. Add watched MKG-thread ingestion only after assisted import is proven reliable.
