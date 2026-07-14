"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Check, Clock, Loader2 } from "lucide-react";
import { trackConversion } from "@/lib/analytics/trackConversion";
import type { AvailabilitySlot } from "@/lib/scheduling/types";

type BookingContext = {
  website?: string;
  businessType?: string;
  challenge?: string;
  industry?: string;
  serviceRequested?: string;
  scanId?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  gclid?: string;
  sessionId?: string;
};

type BookingForm = {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  website: string;
  businessType: string;
  challenge: string;
  message: string;
};

type BookingResponse = {
  ok: boolean;
  error?: string;
  appointmentId?: string;
  appointmentToken?: string;
  confirmationUrl?: string;
};

const BOOKING_SESSION_PREFIX = "opzix-confirmed-booking:";

export default function StrategySessionBookingClient({
  context,
  defaultTimezone,
}: {
  context: BookingContext;
  defaultTimezone: string;
}) {
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [form, setForm] = useState<BookingForm>({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    website: context.website || "",
    businessType: context.businessType || "",
    challenge: context.challenge || "",
    message: "",
  });
  const dateOptions = useMemo(() => buildDateOptions(), []);

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) setTimezone(detected);
  }, []);

  useEffect(() => {
    trackConversion("strategy_call_booking_viewed", safePayload(context));
  }, [context]);

  useEffect(() => {
    let ignore = false;
    setLoadingSlots(true);
    setSlotError("");
    setSelectedSlot(null);

    fetch(
      `/api/scheduling/availability?${new URLSearchParams({
        date: selectedDate,
        timezone,
      }).toString()}`,
    )
      .then((response) => response.json())
      .then((payload: { ok?: boolean; slots?: AvailabilitySlot[]; error?: string }) => {
        if (ignore) return;
        if (!payload.ok) {
          setSlots([]);
          setSlotError("Available times could not be loaded. Please try another date.");
          return;
        }
        setSlots(payload.slots || []);
      })
      .catch(() => {
        if (!ignore) {
          setSlots([]);
          setSlotError("Available times could not be loaded. Please try another date.");
        }
      })
      .finally(() => {
        if (!ignore) setLoadingSlots(false);
      });

    return () => {
      ignore = true;
    };
  }, [selectedDate, timezone]);

  const canSubmit =
    selectedSlot &&
    form.name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    timezone &&
    !booking;

  async function submitBooking() {
    if (!selectedSlot || booking) return;

    setBooking(true);
    setBookingError("");
    trackConversion("strategy_call_booking_started", safePayload(context));

    try {
      const response = await fetch("/api/scheduling/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          startAt: selectedSlot.startAt,
          timezone,
          ...context,
          ...form,
        }),
      });
      const payload = (await response.json()) as BookingResponse;

      if (!response.ok || !payload.ok || !payload.confirmationUrl) {
        setIdempotencyKey(crypto.randomUUID());
        trackConversion("strategy_call_booking_failed", {
          ...safePayload(context),
          failureReason: "api_rejected",
        });
        setBookingError(payload.error || "The booking could not be completed. Please try again.");
        return;
      }

      if (payload.appointmentId) {
        try {
          sessionStorage.setItem(
            `${BOOKING_SESSION_PREFIX}${payload.appointmentId}`,
            JSON.stringify(safePayload(context)),
          );
        } catch {
          // Confirmation tracking can safely skip when session storage is unavailable.
        }
      }

      window.location.assign(payload.confirmationUrl);
    } catch {
      setIdempotencyKey(crypto.randomUUID());
      trackConversion("strategy_call_booking_failed", {
        ...safePayload(context),
        failureReason: "network_error",
      });
      setBookingError("The booking could not be completed. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  function chooseSlot(slot: AvailabilitySlot) {
    setSelectedSlot(slot);
    trackConversion("strategy_call_slot_selected", {
      ...safePayload(context),
      selectedDate,
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-xl border border-dark-border bg-dark-card p-5 shadow-card-glow md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
              Appointment Summary
            </p>
            <h2 className="mt-2 text-2xl font-bold text-primary">Opzix Strategy Session</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">
              30 minutes focused on your website, ecommerce system, AI assistant,
              automation, tracking, or customer journey.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 text-sm">
          <SummaryRow label="Selected time" value={selectedSlot?.label || "Choose a time"} />
          <SummaryRow label="Timezone" value={timezone} />
          <SummaryRow label="Context" value={contextLabel(context)} />
        </div>

        <label className="mt-6 block text-sm font-semibold text-secondary">
          Detected visitor timezone
          <input
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-lg border border-dark-border bg-dark-deep px-4 text-primary outline-none focus:border-brand-cyan"
          />
        </label>
      </section>

      <section className="rounded-xl border border-dark-border bg-dark-card p-5 shadow-card-glow md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
          Choose Time
        </p>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {dateOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => setSelectedDate(option.value)}
              className={[
                "min-h-12 min-w-[6.5rem] rounded-lg border px-3 text-left text-sm font-bold",
                selectedDate === option.value
                  ? "border-brand-cyan bg-brand-cyan text-dark-bg"
                  : "border-dark-border bg-dark-deep text-secondary hover:border-brand-cyan hover:text-primary",
              ].join(" ")}
            >
              <span className="block text-xs opacity-80">{option.weekday}</span>
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-5 min-h-[11rem]">
          {loadingSlots ? (
            <div className="flex min-h-[11rem] items-center justify-center rounded-lg border border-dark-border bg-dark-deep/60 text-secondary">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading times
            </div>
          ) : slotError ? (
            <div className="rounded-lg border border-amber-300/30 bg-amber-400/10 p-4 text-sm font-semibold text-amber-100">
              {slotError}
            </div>
          ) : slots.length === 0 ? (
            <div className="rounded-lg border border-dark-border bg-dark-deep/60 p-4 text-sm text-secondary">
              No bookable times are available on this date.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((slot) => (
                <button
                  type="button"
                  key={slot.startAt}
                  onClick={() => chooseSlot(slot)}
                  className={[
                    "inline-flex min-h-12 items-center justify-center rounded-lg border px-3 text-sm font-bold",
                    selectedSlot?.startAt === slot.startAt
                      ? "border-brand-cyan bg-brand-cyan text-dark-bg"
                      : "border-dark-border bg-dark-deep text-secondary hover:border-brand-cyan hover:text-primary",
                  ].join(" ")}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {slot.timeLabel}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-dark-border bg-dark-card p-5 shadow-card-glow md:p-6 xl:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
          Contact and Business Information
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Name" required value={form.name} onChange={(value) => setField("name", value)} />
          <Field label="Email" required type="email" value={form.email} onChange={(value) => setField("email", value)} />
          <Field label="Phone" required type="tel" value={form.phone} onChange={(value) => setField("phone", value)} />
          <Field label="Business name" value={form.businessName} onChange={(value) => setField("businessName", value)} />
          <Field label="Website" value={form.website} onChange={(value) => setField("website", value)} />
          <Field label="Business type" value={form.businessType} onChange={(value) => setField("businessType", value)} />
          <Field label="Primary challenge" value={form.challenge} onChange={(value) => setField("challenge", value)} />
          <label className="block text-sm font-semibold text-secondary md:col-span-2">
            Short message
            <textarea
              value={form.message}
              onChange={(event) => setField("message", event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-lg border border-dark-border bg-dark-deep px-4 py-3 text-primary outline-none focus:border-brand-cyan"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-dark-border bg-dark-card p-5 shadow-card-glow md:p-6 xl:col-span-2">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
              Final Review
            </p>
            <h2 className="mt-2 text-2xl font-bold text-primary">
              {selectedSlot ? selectedSlot.label : "Choose a time to continue"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-secondary">
              The appointment is not booked until the server confirms the time,
              creates the record, and sends the confirmation.
            </p>
            {bookingError ? (
              <p className="mt-3 rounded-lg border border-red-300/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100">
                {bookingError}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={submitBooking}
            className="btn btn-primary min-h-12 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {booking ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Confirming
              </>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                Confirm Booking
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );

  function setField(key: keyof BookingForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-lg border border-dark-border bg-dark-deep/60 p-3 sm:grid-cols-[9rem_1fr]">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <span className="font-semibold text-primary">{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-secondary">
      {label}
      {required ? <span className="text-brand-cyan"> *</span> : null}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-12 w-full rounded-lg border border-dark-border bg-dark-deep px-4 text-primary outline-none focus:border-brand-cyan"
      />
    </label>
  );
}

function buildDateOptions() {
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      value: dateKey(date),
      weekday: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(date),
    };
  });
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function contextLabel(context: BookingContext) {
  const values = [
    context.source,
    context.serviceRequested,
    context.website,
    context.businessType,
    context.challenge,
    context.scanId ? "audit context" : "",
  ].filter(Boolean);

  return values.length > 0 ? values.join(" | ") : "Direct booking";
}

function safePayload(context: BookingContext) {
  return {
    source: context.source || "direct",
    serviceRequested: context.serviceRequested,
    websiteUrl: context.website,
    businessType: context.businessType,
    challenge: context.challenge,
    industry: context.industry,
    scanId: context.scanId,
    sessionId: context.sessionId,
    utmSource: context.utm_source,
    utmMedium: context.utm_medium,
    utmCampaign: context.utm_campaign,
    gclid: context.gclid,
  };
}
