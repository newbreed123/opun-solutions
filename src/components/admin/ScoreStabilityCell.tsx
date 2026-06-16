import type { ScoreStabilitySummary } from "@/lib/score-stability";

export function ScoreStabilityCell({
  summary,
}: {
  summary: ScoreStabilitySummary | undefined;
}) {
  if (!summary) {
    return <span className="text-xs text-muted">unknown</span>;
  }

  const tone = stabilityTone(summary.scoreStability);
  const latestChanges = summary.scanChanges.slice(0, 3);

  return (
    <div className="min-w-[15rem] max-w-sm space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${tone}`}
        >
          {summary.scoreStability}
        </span>
        <span className="text-xs text-muted">
          {summary.scanCount} scan{summary.scanCount === 1 ? "" : "s"} | range{" "}
          {summary.minScore}-{summary.maxScore}
        </span>
      </div>
      <p className="text-xs text-secondary">
        Avg {summary.averageScore.toFixed(1)} | variance{" "}
        {summary.scoreVariance.toFixed(1)} | std dev{" "}
        {summary.scoreStdDev.toFixed(1)}
      </p>
      <details className="group text-xs text-muted">
        <summary className="cursor-pointer font-semibold text-brand-cyan">
          Score change reasons
        </summary>
        <div className="mt-2 space-y-2 rounded-lg border border-dark-border bg-dark-deep/60 p-3">
          {latestChanges.length === 0 ? (
            <p>Only one scan is available for this domain.</p>
          ) : (
            latestChanges.map((change) => (
              <div key={`${change.fromScanId}-${change.toScanId}`}>
                <p className="font-semibold text-secondary">
                  {change.fromScore}
                  {" -> "}
                  {change.toScore} (
                  {formatSignedNumber(change.scoreDelta)})
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {change.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </details>
    </div>
  );
}

function stabilityTone(label: ScoreStabilitySummary["scoreStability"]) {
  if (label === "Stable") {
    return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
  }

  if (label === "Moderate") {
    return "border-amber-300/30 bg-amber-400/10 text-amber-100";
  }

  return "border-red-300/30 bg-red-400/10 text-red-100";
}

function formatSignedNumber(value: number) {
  return value > 0 ? `+${value}` : String(value);
}
