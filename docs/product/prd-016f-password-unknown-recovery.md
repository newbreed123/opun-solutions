# PRD-016F Password-Unknown Recovery

Use this procedure only when an activation challenge is in
`password_unknown` after the Supabase Auth password-update request returned no
definitive HTTP response. Do not resend the password mutation to determine its
outcome.

The password update and a server-only Auth `app_metadata` marker are submitted
in the same Admin Auth request. The marker value is the database reservation
operation ID. Support reconciliation reads that marker and compares it with the
locked challenge reservation:

- Matching marker: the password request was applied. Record
  `password_succeeded` and finalize the exact reserved membership operation
  without another password update.
- Missing marker: inconclusive. Keep `password_unknown`, preserve the blocked
  reservation, and do not retry or otherwise mutate the password. Absence is
  not reliable proof that Supabase did not apply the password update.
- Different marker: stop. Another operation touched the Auth user and requires
  security review.

## Support Procedure

1. Open a support/change ticket and record only the invitation ID, challenge
   ID, and reservation operation ID. Never record the password, OTP, raw
   invitation token, service-role key, or full activation URL.
2. Run the tool without `--apply`. It verifies the production project,
   invitation, organization, Auth user, email, challenge, reservation state,
   and operation binding. It prints no email address or token.
3. Have a second operator review the dry-run result and ticket reference.
4. Re-run with `--apply --support-reference <ticket-id>` only when the marker
   exactly matches the reserved operation. The tool refuses apply when the
   marker is absent or different.
5. Confirm the `customer_activation_password_reconciled` audit event exists.
6. Confirm the account is activated and direct the customer to sign in. If the
   marker is absent, leave the reservation blocked and escalate for reliable
   provider-side evidence; do not reset or retry the password mutation.

Disposable QA organizations are accepted by default. A real customer requires
the explicit `--allow-non-qa` flag in addition to the apply flag and ticket
reference. That flag is an operational approval gate; it does not weaken any
database binding checks.

```powershell
npm run support:reconcile-activation -- `
  --invitation-id <uuid> `
  --challenge-id <uuid> `
  --operation-id <uuid>

npm run support:reconcile-activation -- `
  --invitation-id <uuid> `
  --challenge-id <uuid> `
  --operation-id <uuid> `
  --support-reference <ticket-id> `
  --apply
```

The reconciliation RPC is service-role-only, accepts only an exact non-null
operation marker, locks the challenge, activation token, and invitation
records, revalidates their organization/Auth user/email binding, rejects
consumed or superseded state, and appends an immutable account audit event. It
never updates an Auth password.
