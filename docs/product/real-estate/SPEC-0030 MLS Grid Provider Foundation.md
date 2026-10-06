# SPEC-0030: MLS Grid Provider Foundation

Status: Implemented foundation

Owner: Opzix

## Scope

SPEC-0030 adds server-side raw provider access for MLS Grid v2. It does not connect MLS data to the public Brittany site, import listings, create replication tables, or expose listing search UI.

Provider configuration:

- Provider: MLS Grid
- API: v2
- Base URL: `https://api.mlsgrid.com/v2`
- MLS source: Canopy MLS
- `OriginatingSystemName`: `carolina`
- Organization: Opzix LLC
- Supported subscriptions: IDX and BO

## Environment

Use server-only environment variables:

```bash
MLS_GRID_BASE_URL=https://api.mlsgrid.com/v2
MLS_GRID_ORIGINATING_SYSTEM_NAME=carolina
MLS_GRID_IDX_ACCESS_TOKEN=
MLS_GRID_BO_ACCESS_TOKEN=
```

Do not create `NEXT_PUBLIC_*` MLS Grid variables. MLS Grid credentials must never be available to client components, browser requests, logs, analytics payloads, screenshots, or public build output.

## Access Separation

Create the provider client with an explicit use:

```ts
createMlsGridClient({ use: "idx" });
createMlsGridClient({ use: "bo" });
```

The Brittany public site must use IDX only. BO is supported as a separate server-side capability for approved future back-office workflows, but it is not a dependency for IDX public listing experiences.

Rotate IDX and BO tokens independently. A BO token must not be used as an IDX fallback, and an IDX token must not be used for BO workflows.

Legacy IDX Broker integrations may be deprecated and removed after MLS Grid-powered search reaches production readiness. That retirement does not remove, cancel, or replace the MLS Grid IDX data-use subscription, which remains required for Brittany's public listing display.

## Supported Resources

The foundation supports raw OData access to:

- `Property`
- `Member`
- `Office`
- `OpenHouse`

Property expansions supported by this client:

- `Media`
- `Rooms`
- `UnitTypes`

The query builder supports:

- `$filter`
- `$select`
- `$expand`
- `$top`
- `$skip`
- `$count`

Every resource query includes `OriginatingSystemName eq 'carolina'`. Metadata requests to `/v2/$metadata` do not include this filter.

## Query Guardrails

The client does not accept arbitrary OData from callers. Supported filters are limited to:

- `ModificationTimestamp gt`
- `MlgCanView eq true|false`
- `StandardStatus eq`
- `ListingId eq`
- approved `ListingId in (...)`

The foundation intentionally blocks timestamp ranges, arbitrary OR chains, and listing-by-listing OpenHouse query construction.

## Pagination

Pagination follows MLS Grid `@odata.nextLink` sequentially. The provider layer validates that next links are absolute HTTPS URLs on `api.mlsgrid.com` and applies a two requests per second scheduler.

Default maximum page size is `5000`. Default sync cursor guidance is `ModificationTimestamp` with a 15 minute overlap window for later replication work.

## Diagnostics

Run the local diagnostic only when a valid rotated token is already present in the environment:

```bash
npm run mls-grid:diagnostic
npm run mls-grid:diagnostic -- --bo
```

The diagnostic checks configuration, requests `$metadata`, requests `$top=1` for each approved resource, and reports availability, HTTP status, request duration, field names, required-field presence, and next-link presence.

The diagnostic does not print credentials, access tokens, refresh tokens, raw records, media URLs, email addresses, phone numbers, or other listing/member values.

## Tests

Run mocked provider tests with:

```bash
npm run test:mls-grid
```

The tests do not require live MLS Grid credentials. They cover token separation, missing config, required `OriginatingSystemName`, query encoding, approved expansions, next-link traversal, external host rejection, two requests per second scheduling, auth and rate-limit errors, malformed responses, and redaction.

## Error Handling

Provider errors are normalized to safe codes:

- `missing_configuration`
- `authentication_failure`
- `authorization_failure`
- `rate_limited`
- `invalid_query`
- `invalid_pagination_url`
- `provider_timeout`
- `malformed_provider_response`
- `upstream_server_failure`

Serialized errors redact bearer tokens, token query params, authorization headers, and media user-agent details.

## Not Implemented In SPEC-0030

The following belong to later specs:

- Full listing import
- Incremental sync jobs
- Replication database schema
- Media storage and image proxying
- Public search
- Listing detail pages
- Map search
- Buyer Advisor MLS context

For the initial import phase in later specs, request a Grace Period from `support@mlsgrid.com` before any high-volume replication.
