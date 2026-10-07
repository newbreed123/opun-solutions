# PRD-016C: Customer Invitations

## Deployment prerequisites

Apply `supabase/customer_invitation_flow.sql` after
`supabase/customer_accounts.sql`. The first script now seeds the `Custom` plan
with no implicit feature entitlements; the second script also ensures that plan
exists for databases where the first script was already applied.

Set these server-only production values:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (never expose it through a `NEXT_PUBLIC_*` value)
- `SUPABASE_ANON_KEY` and the existing public Supabase URL/key used by customer
  login and token verification
- `OPZIX_ADMIN_PASSCODE`
- `OPZIX_AUTH_REDIRECT_URL=https://opzix.io/accept-invite`
- `OPZIX_PASSWORD_RECOVERY_REDIRECT_URL=https://opzix.io/accept-invite?mode=recovery`
- `RESEND_API_KEY`
- `OPZIX_AUTH_FROM_EMAIL=hello@opzix.io` using a sender address on a verified
  Opzix domain. Application-side Resend emails explicitly format this as
  `Opzix <hello@opzix.io>`.

The invite action fails closed when the redirect value is missing or incorrect.
It never falls back to the public homepage.

## Supabase Auth and delivery setup

Supabase's default SMTP sender is intended for development/testing, has
significant rate limits, and is restricted to project-team recipients. External
production customer delivery requires custom SMTP. In the Supabase dashboard:

1. Set the Auth Site URL to `https://opzix.io`.
2. Add the exact redirect URL `https://opzix.io/accept-invite` to the Auth
   redirect allowlist. Keep localhost URLs limited to development.
   Password recovery also requires the exact redirect
   `https://opzix.io/accept-invite?mode=recovery`.
3. Enable custom SMTP using the Opzix/Resend transactional account:
   - Host: `smtp.resend.com`
   - Port: `465` (implicit TLS) or `587` (STARTTLS)
   - Username: `resend`
   - Password: the Resend SMTP credential/API key, stored only in the Supabase
     dashboard
  - Sender name: `Opzix`
  - Sender address: `hello@opzix.io`
4. Configure the Supabase Auth **Invite user** email template:
   - Subject: `You're invited to Opzix`
   - Use the explicit production URL below rather than `.SiteURL` or
     `.ConfirmationURL`. `/accept-invite` verifies the supplied token hash
     itself and must receive the invitation ID.
   - HTML:

```html
<div style="font-family:Arial,sans-serif;color:#132238;line-height:1.6">
  <p>Welcome to Opzix.</p>
  <p>Your account for <strong>{{ .Data.business_name }}</strong> is ready.</p>
  <p>Complete your account setup to begin onboarding your real estate platform.</p>
  <p>
    <a href="https://opzix.io/accept-invite?token_hash={{ .TokenHash }}&amp;type=invite&amp;invitation_id={{ .Data.organization_invitation_id }}"
       style="display:inline-block;background:#13b8d4;color:#06202a;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">
      Complete Account Setup
    </a>
  </p>
  <p>If you were not expecting this invitation, you can ignore this email.</p>
</div>
```

The application sends invitations with Supabase Auth Admin's supported
`inviteUserByEmail` operation (the server-side Auth Admin `POST /auth/v1/invite`
endpoint), using the service-role credential and an explicit `redirect_to`.
That redirect comes only from `OPZIX_AUTH_REDIRECT_URL`; production rejects a
missing value or any URL other than `https://opzix.io/accept-invite`, including
localhost, non-HTTPS, another host, and another path. The same validated
redirect is used for the Auth Admin replacement-link flow.
The service-role secret is never returned to the browser. Invitation tokens are
never displayed in Customer Hub or logged; a one-time token is present only in
the intended recipient's emailed link and is submitted to the server for
verification when the recipient sets a password.

When Supabase reports that the email already has an Auth account, the resend
path uses Supabase Auth Admin `generateLink` for a one-time magic link and
delivers the concise invitation through the Resend API. That path requires
`RESEND_API_KEY` and `OPZIX_AUTH_FROM_EMAIL`. The application uses
`OPZIX_AUTH_FROM_EMAIL` as the address only and constructs the customer-facing
sender explicitly as `Opzix <hello@opzix.io>`; it does not derive the display
name from the local-part. SMTP credentials and the Supabase Auth sender
name/address remain in the Supabase dashboard; no SMTP password is stored in
this application.

Official setup references:

- [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Auth Admin invite user](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)
- [Supabase Auth Admin generate link](https://supabase.com/docs/reference/javascript/auth-admin-generatelink)
- [Resend SMTP with Supabase](https://resend.com/docs/send-with-supabase-smtp)

## Invitation lifecycle and retry safety

Customer creation calls a database function that atomically creates the
organization, subscription, separate commercial-terms row, onboarding shell,
invitation shell, and audit event. A request UUID is idempotent; a retried form
submission with the same UUID reuses its original organization. Business-name
slugs are generated in Postgres and collision suffixes are allocated under an
advisory lock (`good-fortune-homes`, then `good-fortune-homes-2`, etc.).

The invitation state advances through `draft`, `invite_pending`, `invited`,
`activated`, or `invite_failed`. If provider delivery fails, the created
organization and onboarding data remain intact and the admin can resend from
the detail view. The failed provider response is represented internally by a
sanitized error code; no tokens or credentials are logged.

The invite records the exact Auth user ID after Supabase returns it. The
acceptance path verifies the one-time token, requires that Auth user ID to match
the invitation, and activates the matching owner membership in a transaction.
It creates the customer's `profiles` row from the invited name in that same
transaction. Email equality alone does not grant membership. Existing tenant
RLS checks continue to require an active membership for the requested
organization.

`organization_commercial_terms` stores negotiated setup and monthly amounts.
The plan and organization feature overrides continue to determine access;
price does not grant features. No card data is collected or stored.

## QA/test account handling

The protected QA seed marks organizations with `metadata.is_qa=true`, which
Customer Hub labels as `QA / Test`. Customer Hub offers a soft-archive action
only for records carrying that explicit marker. It suspends active/invited
memberships and blocks invitation activation, but never deletes organizations,
memberships, Auth users, or audit history. Do not mark or archive an older
unlabeled record until an admin has verified that it is a test account. In
particular, manually inspect the legacy `New Breed / adim-abua` record before
adding the QA marker; no automatic cleanup is performed.

For invitation delivery QA, use a newly controlled test mailbox and a fresh
request. Do not use a real customer's email. Verify delivery, one-time link
acceptance, name/profile creation, organization membership, resend behavior,
failure recovery, and tenant isolation before production customer onboarding.
