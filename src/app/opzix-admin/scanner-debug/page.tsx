import {
  getScannerRuntimeInfo,
} from "@/lib/ecommerce-audit-scanner";
import { readLatestScannerDebugRecord } from "@/lib/scanner-debug-store";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

type SearchParams = Promise<
  Record<string, string | string[] | undefined> | undefined
>;

type ScannerDebugPageProps = {
  searchParams?: SearchParams;
};

export default async function ScannerDebugPage({
  searchParams,
}: ScannerDebugPageProps) {
  const params = (await searchParams) ?? {};
  const passcode = process.env.OPZIX_ADMIN_PASSCODE?.trim();
  const providedPasscode = getParam(params, "passcode");

  if (!passcode) {
    return (
      <AdminShell>
        <LockedState
          title="Scanner debug is not configured"
          message="Set OPZIX_ADMIN_PASSCODE before this page can show internal scanner diagnostics."
        />
      </AdminShell>
    );
  }

  if (providedPasscode !== passcode) {
    return (
      <AdminShell>
        <LockedState
          title="Passcode required"
          message="Enter the internal passcode to view scanner diagnostics."
        />
      </AdminShell>
    );
  }

  const runtime = getScannerRuntimeInfo();
  const lastScan = await readLatestScannerDebugRecord();

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            Internal
          </p>
          <h1 className="mt-3 text-4xl font-bold text-primary">
            Scanner Debug
          </h1>
          <p className="mt-3 max-w-3xl leading-relaxed text-secondary">
            Runtime, Playwright, browser, and latest persisted scanner diagnostic details.
          </p>
        </div>
        <form>
          <input type="hidden" name="passcode" value={providedPasscode} />
          <button type="submit" className="btn btn-primary min-h-11">
            Refresh debug status
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DebugPanel title="Environment">
          <KeyValue label="NODE_ENV" value={runtime.nodeEnv} />
          <KeyValue label="NEXT_RUNTIME" value={runtime.nextRuntime} />
          <KeyValue label="Platform" value={runtime.platform} />
          <KeyValue label="Playwright" value={runtime.playwrightVersion} />
          <KeyValue
            label="Browser executable"
            value={runtime.browserExecutablePath}
          />
        </DebugPanel>

        <DebugPanel title="Last Scan Result">
          {lastScan ? (
            <>
              <KeyValue label="Scan ID" value={lastScan.scanId ?? "n/a"} />
              <KeyValue label="URL" value={lastScan.url} />
              <KeyValue label="Final URL" value={lastScan.finalUrl ?? "n/a"} />
              <KeyValue label="Success" value={String(lastScan.success)} />
              <KeyValue label="Score" value={lastScan.score === null ? "n/a" : String(lastScan.score)} />
              <KeyValue label="Status" value={lastScan.status} />
              <KeyValue label="Current stage" value={lastScan.currentStage} />
              <KeyValue label="Screenshot success" value={String(lastScan.screenshotSuccess)} />
              <KeyValue label="Screenshot mode" value={lastScan.screenshotModeUsed} />
              <KeyValue label="Screenshot warnings" value={String(lastScan.screenshotWarnings.length)} />
              <KeyValue label="Created" value={lastScan.createdAt} />
            </>
          ) : (
            <p className="text-secondary">No scanner debug record found yet.</p>
          )}
        </DebugPanel>

        <DebugPanel title="Timing Metrics">
          {lastScan ? (
            <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-secondary">
              {JSON.stringify(lastScan.timingMetrics, null, 2)}
            </pre>
          ) : (
            <p className="text-secondary">No timing metrics available.</p>
          )}
        </DebugPanel>

        <DebugPanel title="Last Scan Error">
          {lastScan?.rootCause ? (
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-sm text-secondary">
              {JSON.stringify(lastScan.rootCause, null, 2)}
            </pre>
          ) : lastScan?.screenshotWarnings.length ? (
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-sm text-secondary">
              {JSON.stringify(
                {
                  message: "No fatal scanner error recorded. Screenshot warnings were captured separately.",
                  screenshotWarnings: lastScan.screenshotWarnings,
                },
                null,
                2,
              )}
            </pre>
          ) : (
            <p className="text-secondary">No scanner error recorded.</p>
          )}
        </DebugPanel>

        <DebugPanel title="Navigation Status">
          {lastScan ? (
            <>
              <KeyValue label="Status" value={lastScan.navigation.status} />
              <KeyValue label="HTTP status" value={lastScan.navigation.httpStatus === null ? "n/a" : String(lastScan.navigation.httpStatus)} />
              <KeyValue label="Final URL" value={lastScan.navigation.finalUrl ?? "n/a"} />
              <KeyValue label="Error" value={lastScan.navigation.error ?? "n/a"} />
            </>
          ) : (
            <p className="text-secondary">No navigation status available.</p>
          )}
        </DebugPanel>

        <DebugPanel title="DOM Extraction Status">
          {lastScan ? (
            <>
              <KeyValue label="Status" value={lastScan.domExtraction.status} />
              <KeyValue label="Desktop metrics" value={String(lastScan.domExtraction.desktopMetricsCaptured)} />
              <KeyValue label="Mobile metrics" value={String(lastScan.domExtraction.mobileMetricsCaptured)} />
              <KeyValue label="Full-page links" value={lastScan.domExtraction.fullPageLinkCount === null ? "n/a" : String(lastScan.domExtraction.fullPageLinkCount)} />
              <KeyValue label="Error" value={lastScan.domExtraction.error ?? "n/a"} />
            </>
          ) : (
            <p className="text-secondary">No DOM extraction status available.</p>
          )}
        </DebugPanel>

        <DebugPanel title="Screenshot Warnings">
          {lastScan?.screenshotWarnings.length ? (
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-sm text-secondary">
              {JSON.stringify(lastScan.screenshotWarnings, null, 2)}
            </pre>
          ) : lastScan ? (
            <p className="text-secondary">No screenshot warnings recorded.</p>
          ) : (
            <p className="text-secondary">No screenshot warning data available.</p>
          )}
        </DebugPanel>
      </div>

      {lastScan ? (
        <DebugPanel title="Stage Logs" className="mt-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="border-b border-dark-border text-xs uppercase tracking-[0.16em] text-muted">
                <tr>
                  <th className="px-3 py-2">Elapsed</th>
                  <th className="px-3 py-2">Level</th>
                  <th className="px-3 py-2">Stage</th>
                  <th className="px-3 py-2">Viewport</th>
                  <th className="px-3 py-2">Message</th>
                </tr>
              </thead>
              <tbody>
                {lastScan.stageLogs.map((log) => (
                  <tr key={`${log.timestamp}-${log.stage}-${log.elapsedTimeMs}`} className="border-b border-dark-border">
                    <td className="px-3 py-2 text-secondary">{log.elapsedTimeMs}ms</td>
                    <td className="px-3 py-2 text-secondary">{log.level}</td>
                    <td className="px-3 py-2 text-primary">{log.stage}</td>
                    <td className="px-3 py-2 text-secondary">{log.viewport ?? "n/a"}</td>
                    <td className="px-3 py-2 text-secondary">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DebugPanel>
      ) : null}
    </AdminShell>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-dark-bg py-10">
      <div className="container-wide">{children}</div>
    </main>
  );
}

function DebugPanel({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-dark-border bg-dark-card p-6 ${className}`}>
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className="mt-1 break-all text-sm text-secondary">{value}</p>
    </div>
  );
}

function LockedState({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-dark-border bg-dark-card p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
        Opzix Admin
      </p>
      <h1 className="mt-3 text-3xl font-bold text-primary">{title}</h1>
      <p className="mt-3 leading-relaxed text-secondary">{message}</p>
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
          View Debug
        </button>
      </form>
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
