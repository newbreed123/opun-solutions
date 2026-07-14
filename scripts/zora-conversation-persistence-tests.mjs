import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const assistant = readFileSync("src/components/OpzixAIAssistant.tsx", "utf8");
const zoraChatRoute = readFileSync("src/app/api/zora-chat/route.ts", "utf8");
const zoraConversionRoute = readFileSync("src/app/api/zora-conversion/route.ts", "utf8");
const zoraConversationLog = readFileSync("src/lib/zora-conversation-log.ts", "utf8");

assert.match(assistant, /const sessionId = zoraSessionId\(\);/);
assert.match(assistant, /trackConversion\("zora_conversation_started", \{[\s\S]*sessionId,/);
assert.match(assistant, /trackZoraEvent\("conversation_started"\)/);

assert.match(zoraConversionRoute, /"conversation_started"/);
assert.match(zoraConversionRoute, /error: result\.ok \? undefined : result\.error/);

assert.match(zoraChatRoute, /const conversationLog = await logZoraConversation/);
assert.doesNotMatch(zoraChatRoute, /void logZoraConversation/);
assert.match(zoraChatRoute, /Zora conversation persistence failed/);

assert.match(zoraConversationLog, /supabaseAdminFetch<null>\("zora_conversations"/);
assert.match(zoraConversationLog, /latest_user_message: userMessage\.slice\(0, 1000\)/);
assert.match(zoraConversationLog, /latest_assistant_message: assistantMessage\.slice\(0, 1200\)/);

console.log("Zora conversation persistence smoke tests passed.");
