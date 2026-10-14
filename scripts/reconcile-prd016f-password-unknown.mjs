const EXPECTED_PROJECT_REF = "qskrnivgfmymvtuaefmt";
const OPERATION_MARKER = "opzix_activation_password_operation_id";

const args = parseArgs(process.argv.slice(2));
const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

if (projectRef !== EXPECTED_PROJECT_REF) {
  throw new Error(`Refusing unexpected Supabase project ${projectRef}.`);
}

for (const key of ["invitationId", "challengeId", "operationId"]) {
  if (!isUuid(args[key])) throw new Error(`--${toKebab(key)} must be a UUID.`);
}
if (args.apply && !args.supportReference) {
  throw new Error("--support-reference is required with --apply.");
}

const challenge = await one("customer_activation_email_challenges", {
  select:
    "id,activation_token_id,invitation_id,organization_id,auth_user_id,email,reservation_operation_id,reservation_state,consumed_at",
  id: `eq.${args.challengeId}`,
});
const invitation = await one("organization_invitations", {
  select: "id,organization_id,auth_user_id,email,invitation_state",
  id: `eq.${args.invitationId}`,
});
const organization = await one("organizations", {
  select: "id,status,metadata,is_test_account",
  id: `eq.${invitation.organization_id}`,
});
const activationToken = await one("customer_activation_invitation_tokens", {
  select:
    "id,invitation_id,organization_id,auth_user_id,email,token_hash,consumed_at,revoked_at,superseded_at",
  id: `eq.${challenge.activation_token_id}`,
});

assert(challenge.invitation_id === invitation.id, "Challenge invitation mismatch.");
assert(challenge.organization_id === invitation.organization_id, "Organization mismatch.");
assert(challenge.auth_user_id === invitation.auth_user_id, "Auth user mismatch.");
assert(challenge.email === invitation.email.toLowerCase(), "Email binding mismatch.");
assert(activationToken.invitation_id === invitation.id, "Token invitation mismatch.");
assert(activationToken.organization_id === invitation.organization_id, "Token organization mismatch.");
assert(activationToken.auth_user_id === invitation.auth_user_id, "Token Auth user mismatch.");
assert(activationToken.email === invitation.email.toLowerCase(), "Token email mismatch.");
assert(!activationToken.consumed_at, "Activation token is already consumed.");
assert(!activationToken.revoked_at, "Activation token is revoked.");
assert(!activationToken.superseded_at, "Activation token is superseded.");
assert(challenge.reservation_operation_id === args.operationId, "Operation mismatch.");
assert(
  ["password_unknown", "password_succeeded"].includes(challenge.reservation_state),
  "Reservation is not recoverable by this procedure.",
);
assert(!challenge.consumed_at, "Challenge is already consumed.");
assert(invitation.invitation_state !== "activated", "Invitation is already activated.");

const isQa =
  organization.is_test_account === true ||
  organization.metadata?.is_qa === true;
if (!isQa && !args.allowNonQa) {
  throw new Error("Organization is not QA-marked. Use --allow-non-qa only under an approved customer support change.");
}

const authUser = await authAdminGet(invitation.auth_user_id);
const observedMarker = authUser.app_metadata?.[OPERATION_MARKER] ?? null;
if (observedMarker === null) {
  console.log(JSON.stringify({
    projectRef,
    mode: args.apply ? "apply-refused" : "dry-run",
    qaMarked: isQa,
    currentState: challenge.reservation_state,
    markerMatchesReservation: false,
    outcome: "inconclusive",
    reservationPreserved: true,
  }));
  if (args.apply) {
    throw new Error("Auth operation marker is absent. Outcome remains uncertain; reservation was not changed.");
  }
  console.log("Inconclusive outcome. Keep the reservation blocked and do not repeat the password update.");
  process.exit(0);
}
if (observedMarker !== args.operationId) {
  throw new Error("Auth operation marker belongs to another activation operation.");
}

const resolution = "password_succeeded";

console.log(JSON.stringify({
  projectRef,
  mode: args.apply ? "apply" : "dry-run",
  qaMarked: isQa,
  currentState: challenge.reservation_state,
  markerMatchesReservation: observedMarker === args.operationId,
  proposedResolution: resolution,
}));

if (!args.apply) {
  console.log("Dry run only. Re-run with --apply and --support-reference after peer review.");
  process.exit(0);
}

if (challenge.reservation_state === "password_unknown") {
  const result = await rpc("reconcile_customer_activation_password_setup", {
    p_invitation_id: args.invitationId,
    p_challenge_id: args.challengeId,
    p_operation_id: args.operationId,
    p_observed_operation_id: observedMarker,
    p_support_reference: args.supportReference,
  });
  assert(result === resolution, "Database reconciliation returned an unexpected state.");
}
const finalized = await rpc("finalize_customer_activation_with_reservation", {
  p_token_hash: activationToken.token_hash,
  p_challenge_id: args.challengeId,
  p_operation_id: args.operationId,
  p_user_id: invitation.auth_user_id,
  p_email: invitation.email,
});
assert(finalized === true, "Activation finalization did not succeed.");
console.log(JSON.stringify({
  applied: true,
  resolution,
  activationFinalized: true,
}));

function parseArgs(values) {
  const parsed = {
    invitationId: "",
    challengeId: "",
    operationId: "",
    supportReference: "",
    apply: false,
    allowNonQa: false,
  };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--apply") parsed.apply = true;
    else if (value === "--allow-non-qa") parsed.allowNonQa = true;
    else if (value === "--invitation-id") parsed.invitationId = values[++index] || "";
    else if (value === "--challenge-id") parsed.challengeId = values[++index] || "";
    else if (value === "--operation-id") parsed.operationId = values[++index] || "";
    else if (value === "--support-reference") parsed.supportReference = values[++index] || "";
    else throw new Error(`Unknown argument ${value}.`);
  }
  return parsed;
}

async function one(table, query) {
  const endpoint = new URL(`${supabaseUrl}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(query)) endpoint.searchParams.set(key, value);
  endpoint.searchParams.set("limit", "1");
  const response = await fetch(endpoint, { headers: adminHeaders() });
  if (!response.ok) throw new Error(`${table} lookup failed with HTTP ${response.status}.`);
  const rows = await response.json();
  if (!rows[0]) throw new Error(`${table} record was not found.`);
  return rows[0];
}

async function authAdminGet(userId) {
  const response = await fetch(
    `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
    { headers: adminHeaders() },
  );
  if (!response.ok) throw new Error(`Auth user lookup failed with HTTP ${response.status}.`);
  return response.json();
}

async function rpc(name, body) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Reconciliation RPC failed with HTTP ${response.status}.`);
  return response.json();
}

function adminHeaders() {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toKebab(value) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
