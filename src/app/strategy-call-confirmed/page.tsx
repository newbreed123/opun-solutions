import type { Metadata } from "next";
import type { ReactNode } from "react";
import Button from "@/components/Button";
import StrategyCallConfirmedTracker from "@/components/StrategyCallConfirmedTracker";
import { getPublicAppointmentSummary } from "@/lib/scheduling/appointments";
import { formatTimezoneLabel } from "@/lib/scheduling/display";
import CopyMeetingLinkButton from "./CopyMeetingLinkButton";

export const metadata: Metadata = {
  title: "Strategy Session Booked",
  description:
    "Thanks for booking a strategy session with Opzix. You will receive confirmation and calendar details shortly.",
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined> | undefined>;
};

export default async function StrategyCallConfirmedPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const appointmentId = getParam(params, "appointment");
  const token = getParam(params, "token");
  const appointment =
    appointmentId && token
      ? await getPublicAppointmentSummary(appointmentId, token)
      : null;
  const checklist = [
    "Bring your website URL if one exists.",
    "Be prepared to discuss the current business challenge.",
    "Have any existing audit report nearby.",
    "Think about what success should look like after the project.",
  ];

  return (
    <section className="hero-atmosphere py-20 md:py-24">
      <StrategyCallConfirmedTracker appointmentId={appointment?.id} />
      <div className="container-wide max-w-[90%] md:max-w-4xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-brand-cyan">
          Strategy call
        </p>
        <h1 className="heading-1 mb-6">Strategy Session Booked</h1>
        <p className="body-lg mb-8 max-w-2xl text-secondary">
          Thanks for booking a strategy session with Opzix. You will receive a
          confirmation email and calendar details shortly.
        </p>

        {appointment ? (
          <div className="card-elevated mb-8 p-6 md:p-8">
            <h2 className="mb-4 text-xl font-bold text-primary">Session Details</h2>
            <div className="grid gap-3 text-sm text-secondary">
              <DetailRow label="Date and time" value={appointment.dateTimeLabel} />
              <DetailRow
                label="Timezone"
                value={formatTimezoneLabel(appointment.timezone)}
              />
              <DetailRow
                label="Meeting"
                value={
                  appointment.meetingUrl ? (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        href={appointment.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="primary"
                        size="md"
                        className="mx-0 w-full sm:w-auto"
                      >
                        Join Google Meet
                      </Button>
                      <CopyMeetingLinkButton meetingUrl={appointment.meetingUrl} />
                    </div>
                  ) : (
                    "Your meeting link is being prepared and will be emailed separately."
                  )
                }
              />
              <DetailRow
                label="Email"
                value="Check your inbox for your confirmation email."
              />
            </div>
          </div>
        ) : null}

        <div className="card-elevated mb-8 p-6 md:p-8">
          <h2 className="mb-5 text-xl font-bold text-primary">Before the call</h2>
          <ul className="space-y-4">
            {checklist.map((item) => (
              <li key={item} className="flex gap-3 text-left text-secondary">
                <span className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-brand-cyan shadow-[0_0_18px_rgba(6,182,212,0.55)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/" variant="primary" size="lg">
            Return to Home
          </Button>
          {!appointment?.hasAuditContext ? (
            <Button href="/tools/ecommerce-audit-scanner" variant="secondary" size="lg">
              Run Free Audit
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 rounded-lg border border-dark-border bg-dark-deep/60 p-3 sm:grid-cols-[9rem_1fr]">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <div className="font-semibold text-primary">{value}</div>
    </div>
  );
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
