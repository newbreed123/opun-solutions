# PRD-016 QA Customers Report

Generated: 2026-07-29T03:49:32.035Z

Status: passed

Seed method: `npm run seed:qa-customers`

Activation method: QA users are created or reused through Supabase Admin Auth. The seed sets locally configured QA passwords for those exact QA emails and does not send invitation email by default.

Auth method: Password sessions use POST /auth/v1/token?grant_type=password. The prior failure came from POST /auth/v1/admin/generate_link type=magiclink followed by POST /auth/v1/verify; generate_link does not send email.

No passwords, service-role keys, refresh tokens, access tokens, raw activation links, or authorization headers are included in this report.

Default QA seeding does not send invitation email. QA users authenticate with the locally configured QA credentials. Real customer invitation delivery remains a separate production-readiness task.

## Existing Data Audit

| Customer | Auth users by email | Auth user ID | Email confirmed at | Banned until | Password identity detectable | Profiles | Orgs by slug | Memberships | Subscriptions | Onboarding | Onboarding data rows |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Test Agent A | 1 | db5030ba-d7e4-4156-9afe-16a0fb1c4c8b | 2026-07-29T02:47:15.685342Z | none | no | 1 | 1 | 1 | 1 | 1 | 6 |
| Test Agent B | 1 | f12e5aef-65d0-466e-a959-10d8ee110285 | 2026-07-29T02:47:18.708334Z | none | no | 1 | 1 | 1 | 1 | 1 | 6 |

## Customers

| Customer | Auth user ID | Organization ID | Membership ID | Plan | Onboarding | Auth user | Profile | Organization | Subscription | Verification session |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Test Agent A | db5030ba-d7e4-4156-9afe-16a0fb1c4c8b | 65b9b089-b5f9-449b-b2e2-cf84d40eaef4 | 90bfb7e0-f491-4f01-ace5-be24b77eb34b | launch | 35% | reused | upserted | upserted | assigned | passed |
| Test Agent B | f12e5aef-65d0-466e-a959-10d8ee110285 | 19895348-727b-43c2-b112-9c65f4574b5e | a620405e-d0ee-4284-9b49-afb75fd7024f | growth | 65% | reused | upserted | upserted | assigned | passed |

## Entitlements

| Customer | Feature | Expected | Actual | Access level | Result |
| --- | --- | --- | --- | --- | --- |
| Test Agent A | idx_property_search | enabled | enabled | available | pass |
| Test Agent A | crm | enabled | enabled | available | pass |
| Test Agent A | ai_property_assistant | enabled | enabled | available | pass |
| Test Agent A | analytics | enabled | enabled | available | pass |
| Test Agent A | automated_follow_up | disabled | disabled | unavailable | pass |
| Test Agent A | advanced_crm | disabled | disabled | unavailable | pass |
| Test Agent A | ai_isa | disabled | disabled | unavailable | pass |
| Test Agent A | internal_ai | disabled | disabled | unavailable | pass |
| Test Agent A | team_management | disabled | disabled | unavailable | pass |
| Test Agent A | lead_routing | disabled | disabled | unavailable | pass |
| Test Agent A | brokerage_reporting | disabled | disabled | unavailable | pass |
| Test Agent B | idx_property_search | enabled | enabled | available | pass |
| Test Agent B | crm | enabled | enabled | available | pass |
| Test Agent B | ai_property_assistant | enabled | enabled | available | pass |
| Test Agent B | analytics | enabled | enabled | available | pass |
| Test Agent B | automated_follow_up | enabled | enabled | available | pass |
| Test Agent B | advanced_crm | enabled | enabled | available | pass |
| Test Agent B | ai_isa | disabled | disabled | unavailable | pass |
| Test Agent B | internal_ai | disabled | disabled | unavailable | pass |
| Test Agent B | team_management | disabled | disabled | unavailable | pass |
| Test Agent B | lead_routing | disabled | disabled | unavailable | pass |
| Test Agent B | brokerage_reporting | disabled | disabled | unavailable | pass |

## Tenant Isolation

| Check | Result | Details |
| --- | --- | --- |
| Agent A can read Agent A organization | pass | {"rowsReturned":1} |
| Agent A cannot read Agent B organization | pass | {"rowsReturned":0} |
| Agent A cannot read or update Agent B onboarding | pass | {"readRowsReturned":0,"updateRowsReturned":0,"unchangedCompletionPercent":65} |
| Agent A cannot read Agent B profile through customer APIs | pass | {"rowsReturned":0} |
| Agent A cannot access Agent B entitlements | pass | {"subscriptionRowsReturned":0} |
| Agent B cannot access Agent A records | pass | {"organizationRowsReturned":0,"onboardingRowsReturned":0,"profileRowsReturned":0} |
| Changing organization_id in a browser request does not bypass server authorization | pass | {"rowsReturned":0} |
| Launch-only restricted features remain blocked for Agent A | pass | {"features":[{"featureCode":"automated_follow_up","allowed":false},{"featureCode":"advanced_crm","allowed":false},{"featureCode":"ai_isa","allowed":false},{"featureCode":"internal_ai","allowed":false},{"featureCode":"team_management","allowed":false},{"featureCode":"lead_routing","allowed":false},{"featureCode":"brokerage_reporting","allowed":false}]} |
| Growth entitlements are available to Agent B | pass | {"features":[{"featureCode":"idx_property_search","allowed":true},{"featureCode":"crm","allowed":true},{"featureCode":"ai_property_assistant","allowed":true},{"featureCode":"analytics","allowed":true},{"featureCode":"automated_follow_up","allowed":true},{"featureCode":"advanced_crm","allowed":true}]} |
| Server-side authorization blocks restricted features even when manually constructed | pass | {"crossTenantAllowed":false,"ownLaunchRestrictedAllowed":false} |

