import {
  ArrowLeft,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CopyButton } from "@/components/admin/CopyButton";
import {
  generateAndStoreConversationReview,
  getConversationDetail,
  type ConversationDetail,
  type ConversationMessage,
  type ConversationReview,
  type JourneyEvent,
} from "@/lib/founder-dashboard/conversations";

export const dynamic = "force-dynamic";

type ConversationPageProps = {
  params: Promise<{ conversationId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined> | undefined>;
};

async function reviewConversationAction(formData: FormData) {
  "use server";

  const passcode = String(formData.get("passcode") || "");
  const conversationId = String(formData.get("conversationId") || "");
  const configuredPasscode = process.env.OPZIX_ADMIN_PASSCODE?.trim();

  if (configuredPasscode && passcode !== configuredPasscode) {
    throw new Error("Unauthorized review request.");
  }

  await generateAndStoreConversationReview(conversationId);
  revalidatePath(`/admin/founder-dashboard/conversations/${conversationId}`);
  redirect(
    `/admin/founder-dashboard/conversations/${encodeURIComponent(conversationId)}${passcode ? `?passcode=${encodeURIComponent(passcode)}` : ""}`,
  );
}

export default async function ConversationDetailPage({
  params,
  searchParams,
}: ConversationPageProps) {
  const { conversationId } = await params;
  const query = (await searchParams) ?? {};
  const passcode = getParam(query, "passcode");
  const configuredPasscode = process.env.OPZIX_ADMIN_PASSCODE?.trim();

  if (configuredPasscode && passcode !== configuredPasscode) {
    return (
      <main className="min-h-screen bg-dark-bg py-8 md:py-10">
        <div className="container-wide">
          <LockedState />
        </div>
      </main>
    );
  }

  const result = await getConversationDetail(decodeURIComponent(conversationId));

  if (!result.ok) {
    return (
      <main className="min-h-screen bg-dark-bg py-8 md:py-10">
        <div className="container-wide">
          <BackLink passcode={passcode} />
          <div className="mt-6 rounded-2xl border border-red-300/30 bg-red-400/10 p-6 text-red-100">
            {result.error}
          </div>
        </div>
      </main>
    );
  }

  const conversation = result.data;
  const transcript = conversation.messages
    .map((message) => `${message.role === "user" ? "Visitor" : "Zora"} (${formatDate(message.createdAt)}):\n${message.text}`)
    .join("\n\n");

  return (
    <main className="min-h-screen bg-dark-bg py-8 md:py-10">
      <div className="container-wide">
        <BackLink passcode={passcode} />

        <div className="mt-6 rounded-2xl border border-dark-border bg-dark-card p-5 shadow-[0_24px_70px_rgba(2,8,23,0.32)] md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
                Zora Conversation
              </p>
              <h1 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
                {truncateId(conversation.id)}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                Factual events and persisted transcript data are separated from
                AI-generated review conclusions.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton value={conversation.id} label="Copy conversation ID" />
              <CopyButton value={transcript} label="Copy transcript" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewMetric icon={CalendarClock} label="Started" value={formatDate(conversation.startedAt)} />
            <OverviewMetric icon={Clock} label="Duration" value={`${conversation.durationMinutes} min`} />
            <OverviewMetric icon={MessageSquare} label="Messages" value={String(conversation.messageCount)} />
            <OverviewMetric icon={CheckCircle2} label="Transcript" value={transcriptStatusLabel(conversation.transcriptStatus)} />
          </div>
          <div className="mt-5 rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            Conversation data may contain visitor-provided information. Handle
            according to the Opzix privacy policy.
          </div>
        </div>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel title="Conversation Overview" eyebrow="Attribution">
            <DefinitionGrid conversation={conversation} />
          </Panel>
          <Panel title="Zora Quality Review" eyebrow="AI Analysis">
            <QualityReview
              review={conversation.review}
              conversationId={conversation.id}
              passcode={passcode}
              transcriptStatus={conversation.transcriptStatus}
            />
          </Panel>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel title="Transcript" eyebrow="Chronological Messages">
            <Transcript
              messages={conversation.messages}
              transcriptStatus={conversation.transcriptStatus}
            />
          </Panel>
          <div className="space-y-6">
            <Panel title="Visitor Journey" eyebrow="Factual Timeline">
              <Journey events={conversation.journey} />
            </Panel>
            <Panel title="Related Conversion Activity" eyebrow="Recorded Events">
              <RelatedConversions conversation={conversation} />
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}

function LockedState() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-dark-border bg-dark-card p-8">
      <ShieldAlert className="h-8 w-8 text-brand-cyan" />
      <h1 className="mt-3 text-3xl font-bold text-primary">Passcode required</h1>
      <form className="mt-6 space-y-3">
        <label className="block text-sm font-semibold text-secondary">
          Passcode
          <input
            type="password"
            name="passcode"
            className="mt-2 min-h-12 w-full rounded-xl border border-dark-border bg-dark-deep px-4 text-primary outline-none focus:border-brand-cyan"
          />
        </label>
        <button type="submit" className="btn btn-primary w-full">
          View conversation
        </button>
      </form>
    </div>
  );
}

function BackLink({ passcode }: { passcode: string }) {
  const href = `/admin/founder-dashboard${passcode ? `?passcode=${encodeURIComponent(passcode)}` : ""}#zora-conversations`;

  return (
    <a href={href} className="inline-flex items-center gap-2 text-sm font-bold text-brand-cyan">
      <ArrowLeft className="h-4 w-4" />
      Back to Founder Dashboard
    </a>
  );
}

function DefinitionGrid({ conversation }: { conversation: ConversationDetail }) {
  const rows = [
    ["Conversation ID", conversation.id],
    ["Visitor/session ID", conversation.sessionId || "untracked"],
    ["Source", conversation.source || "unknown"],
    ["Medium", conversation.medium || "untracked"],
    ["Campaign", conversation.campaign || "untracked"],
    ["Referrer", conversation.referrer || "untracked"],
    ["Landing page", conversation.landingPage || "untracked"],
    ["Final page", conversation.finalPage || "untracked"],
    ["Device", conversation.deviceType || "untracked"],
    ["Industry", conversation.industry || "unknown"],
    ["Business type", conversation.businessType || "unknown"],
    ["Website supplied", conversation.websiteUrl || "not supplied"],
    ["Biggest challenge", conversation.biggestChallenge || "unknown"],
    ["Qualification", conversation.qualificationStatus],
    ["Audit status", conversation.auditStatus],
    ["Booking status", conversation.bookingStatus],
    ["Prompt version", conversation.promptVersion],
    ["Model version", conversation.modelVersion],
  ];

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-dark-border bg-dark-deep/60 p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {label}
          </dt>
          <dd className="mt-2 break-words text-sm font-semibold text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function QualityReview({
  review,
  conversationId,
  passcode,
  transcriptStatus,
}: {
  review?: ConversationReview;
  conversationId: string;
  passcode: string;
  transcriptStatus: ConversationDetail["transcriptStatus"];
}) {
  return (
    <div>
      {transcriptStatus !== "complete" ? (
        <div className="rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
          Quality review is disabled for {transcriptStatusLabel(transcriptStatus).toLowerCase()}
          records. Legacy rows are not guaranteed complete enough for scoring.
        </div>
      ) : !review ? (
        <div className="rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
          This conversation has not been reviewed yet. Reviews are generated on
          demand and persisted; they do not run on every dashboard request.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <ReviewMetric label="Overall score" value={review.overallScore ?? "N/A"} />
            <ReviewMetric label="Confidence" value={review.reviewConfidence || "low"} />
            <ReviewMetric label="Reviewed" value={formatDate(review.reviewedAt)} />
          </div>
          <ReviewList title="What Zora did well" items={review.strengths} />
          <ReviewList title="What Zora missed" items={review.missedOpportunities} />
          <ReviewText title="Likely drop-off reason" text={review.likelyDropoffReason || "Insufficient evidence."} />
          <ReviewText title="Recommended improvement" text={review.recommendedImprovement || "No recommendation recorded."} />
          <ReviewText title="Suggested better response" text={review.suggestedBetterResponse || "No suggested response recorded."} />
          <p className="text-xs text-muted">
            Prompt: {review.promptVersion} | Model: {review.modelVersion}
          </p>
        </div>
      )}
      {transcriptStatus === "complete" ? (
        <form action={reviewConversationAction} className="mt-5">
          <input type="hidden" name="conversationId" value={conversationId} />
          {passcode ? <input type="hidden" name="passcode" value={passcode} /> : null}
          <button type="submit" className="btn btn-secondary min-h-11">
            <RefreshCw className="h-4 w-4" />
            {review ? "Re-review conversation" : "Review conversation"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

function Transcript({
  messages,
  transcriptStatus,
}: {
  messages: ConversationMessage[];
  transcriptStatus: ConversationDetail["transcriptStatus"];
}) {
  if (!messages.length) {
    return (
      <p className="rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
        No persisted visitor/assistant messages are available. This can happen
        when Zora was opened but no user message was sent, or when legacy
        persistence failed before transcript rows existed.
      </p>
    );
  }

  return (
    <div>
      {transcriptStatus === "legacy_partial" ? (
        <div className="mb-4 rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
          Legacy partial transcript. Earlier messages were not durably stored;
          only the latest available visitor and assistant pair is shown.
        </div>
      ) : null}
      <div className="max-h-[780px] space-y-4 overflow-y-auto pr-1">
      {messages.map((message) => (
        <article
          key={message.id}
          className={[
            "rounded-xl border p-4",
            message.role === "user"
              ? "border-brand-cyan/25 bg-brand-cyan/10"
              : "border-dark-border bg-dark-deep/70",
          ].join(" ")}
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">
            {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            {message.role === "user" ? "Visitor" : "Zora"}
            <span>{formatDate(message.createdAt)}</span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-primary">
            {message.text}
          </p>
        </article>
      ))}
      </div>
    </div>
  );
}

function transcriptStatusLabel(status: ConversationDetail["transcriptStatus"]) {
  if (status === "complete") return "Complete transcript";
  if (status === "legacy_partial") return "Legacy partial transcript";
  return "Analytics-only start";
}

function Journey({ events }: { events: JourneyEvent[] }) {
  if (!events.length) {
    return <p className="text-sm text-muted">No related journey events were recorded.</p>;
  }

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={`${event.id}-${event.label}`} className="rounded-xl border border-dark-border bg-dark-deep/60 p-4">
          <p className="text-sm font-bold text-primary">{event.label}</p>
          <p className="mt-1 text-xs text-muted">{formatDate(event.createdAt)} | {event.source}</p>
          {event.detail ? <p className="mt-2 break-words text-sm text-secondary">{event.detail}</p> : null}
        </li>
      ))}
    </ol>
  );
}

function RelatedConversions({ conversation }: { conversation: ConversationDetail }) {
  return (
    <div className="space-y-3">
      <ConversionRow label="Audit started" value={conversation.auditStatus !== "not started" ? "Yes" : "No"} />
      <ConversionRow label="Audit completed" value={conversation.auditStatus === "completed" ? "Yes" : "No"} />
      <ConversionRow label="Audit result ID" value={conversation.auditResultId || "Unavailable"} />
      <ConversionRow label="Strategy call started" value={conversation.bookingStatus !== "not started" ? "Yes" : "No"} />
      <ConversionRow label="Strategy call booked" value={conversation.bookingStatus === "completed" ? "Yes" : "No"} />
      <ConversionRow label="Session replay" value="Session replay unavailable for this visitor." />
      {conversation.replayUrl ? (
        <a href={conversation.replayUrl} className="inline-flex items-center gap-2 font-bold text-brand-cyan">
          <ExternalLink className="h-4 w-4" />
          Open session replay
        </a>
      ) : null}
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-dark-border bg-dark-card p-5 shadow-[0_24px_70px_rgba(2,8,23,0.32)] md:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-bold text-primary">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function OverviewMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-deep/60 p-4">
      <Icon className="h-5 w-5 text-brand-cyan" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold text-primary">{value}</p>
    </div>
  );
}

function ReviewMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-deep/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 text-xl font-black text-primary">{value}</p>
    </div>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-deep/60 p-4">
      <h3 className="text-sm font-bold text-primary">{title}</h3>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-secondary">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">No items recorded.</p>
      )}
    </div>
  );
}

function ReviewText({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-deep/60 p-4">
      <h3 className="text-sm font-bold text-primary">{title}</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-secondary">{text}</p>
    </div>
  );
}

function ConversionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-dark-border bg-dark-deep/60 p-4">
      <p className="text-sm font-bold text-primary">{label}</p>
      <p className="text-right text-sm text-secondary">{value}</p>
    </div>
  );
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function truncateId(value: string) {
  return value.length > 16 ? `${value.slice(0, 10)}...${value.slice(-6)}` : value;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
