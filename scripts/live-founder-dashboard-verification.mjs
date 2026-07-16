import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const env = loadEnv(".env.local");
const supabaseUrl = env.SUPABASE_URL?.replace(/\/$/, "");
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl =
  process.env.OPZIX_LIVE_URL ||
  env.NEXT_PUBLIC_SITE_URL ||
  env.NEXT_PUBLIC_APP_URL ||
  "https://opzix.io";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const testId = `founder-live-${Date.now()}`;
const sessionId = `${testId}-${randomUUID()}`;
const campaign = `founder_dashboard_live_${Date.now()}`;
const sourcePath = `/?utm_source=codex_live_test&utm_medium=qa&utm_campaign=${campaign}`;
const startedAt = new Date().toISOString();

const messages = [
  "I run a Shopify store and my traffic is growing, but sales are not improving.",
  "My website is https://example.com and I think the product pages are the problem.",
];

let leadProfile = {};
const history = [];

for (const message of messages) {
  const response = await fetch(`${siteUrl.replace(/\/$/, "")}/api/zora-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Opzix founder dashboard live verification",
    },
    body: JSON.stringify({
      message,
      messages: history,
      leadProfile,
      sessionId,
      sourcePath,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Zora chat failed with ${response.status}: ${JSON.stringify(payload).slice(0, 300)}`);
  }

  leadProfile = payload.leadProfile || leadProfile;
  history.push({ role: "user", content: message });
  history.push({ role: "assistant", content: String(payload.reply || "").slice(0, 500) });
}

await wait(1800);

const conversations = await rest(
  "zora_conversations",
  {
    select:
      "id,created_at,session_id,visitor_session_id,business_type,challenge,website_url,industry,source,medium,campaign,prompt_version,conversation_flow_version,model_version,latest_user_message,latest_assistant_message",
    session_id: `eq.${sessionId}`,
    order: "created_at.asc",
  },
);
const durableMessages = await rest(
  "zora_messages",
  {
    select:
      "id,created_at,conversation_row_id,conversation_id,visitor_session_id,session_id,role,message_text,page_url,source_path,source,medium,campaign,prompt_version,model_version,redaction_applied",
    conversation_id: `eq.${sessionId}`,
    order: "created_at.asc,role.desc",
  },
);

const roleCounts = durableMessages.reduce(
  (counts, row) => {
    counts[row.role] = (counts[row.role] || 0) + 1;
    return counts;
  },
  {},
);
const firstConversation = conversations[0] || {};
const lastConversation = conversations[conversations.length - 1] || {};
const output = {
  siteUrl,
  supabaseProjectRef: new URL(supabaseUrl).host.split(".")[0],
  testId,
  startedAt,
  sessionId,
  campaign,
  zoraConversationRows: conversations.length,
  zoraMessageRows: durableMessages.length,
  roleCounts,
  consistentConversationId: durableMessages.every((row) => row.conversation_id === sessionId),
  sessionIdPresent: Boolean(firstConversation.session_id || firstConversation.visitor_session_id),
  websiteCaptured: lastConversation.website_url || "",
  businessTypeCaptured: lastConversation.business_type || "",
  challengeCaptured: lastConversation.challenge || "",
  promptVersionCaptured: lastConversation.prompt_version || "",
  flowVersionCaptured: lastConversation.conversation_flow_version || "",
  modelVersionCaptured: lastConversation.model_version || "",
  sourceCaptured: lastConversation.source || "",
  mediumCaptured: lastConversation.medium || "",
  campaignCaptured: lastConversation.campaign || "",
  messageOrder: durableMessages.map((row) => ({
    role: row.role,
    createdAt: row.created_at,
    containsShopify: /shopify/i.test(row.message_text || ""),
    containsExampleDomain: /example\.com/i.test(row.message_text || ""),
    redactionApplied: row.redaction_applied,
  })),
};

console.log(JSON.stringify(output, null, 2));

function loadEnv(path) {
  const values = {};

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#][^=]+)=(.*)$/);
    if (!match) continue;
    values[match[1].trim()] = match[2].trim();
  }

  return values;
}

async function rest(table, query) {
  const endpoint = new URL(`${supabaseUrl}/rest/v1/${table}`);
  Object.entries(query).forEach(([key, value]) => endpoint.searchParams.set(key, String(value)));
  const response = await fetch(endpoint, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
    },
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${table} query failed with ${response.status}: ${text.slice(0, 300)}`);
  }

  return text ? JSON.parse(text) : [];
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
