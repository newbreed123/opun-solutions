import fs from "fs/promises";
import path from "path";

const root = process.cwd();
const sitesFile = path.join(root, "scanner-validation-sites.json");
const resultsFile = path.join(root, "scanner-validation-results.json");
const reportFile = path.join(root, "scanner-validation-results.md");
const summaryFile = path.join(root, "scanner-validation-round-1.md");
const apiUrl = "http://localhost:3000/api/ecommerce-audit-scanner";

const expectedPlatformMap = {
  shopify: "Shopify",
  bigcommerce: "BigCommerce",
  woocommerce: "WooCommerce",
  magento: "Magento / Adobe Commerce",
  "magento / adobe commerce": "Magento / Adobe Commerce",
  "salesforce commerce cloud": "Salesforce Commerce Cloud",
  unknown: "Unknown",
};

function normalizePlatform(platform) {
  if (!platform || typeof platform !== "string") return "Unknown";
  const key = platform.trim().toLowerCase();
  return expectedPlatformMap[key] ?? platform.trim();
}

function platformMatches(expected, detected) {
  const normalizedExpected = normalizePlatform(expected);
  const normalizedDetected = normalizePlatform(detected);

  if (normalizedExpected === "Unknown") {
    return normalizedDetected === "Unknown" ? "yes" : "unknown";
  }

  if (normalizedDetected === "Unknown") {
    return "no";
  }

  if (normalizedExpected === "Salesforce Commerce Cloud") {
    return normalizedDetected === "Unknown" ? "unknown" : "no";
  }

  if (normalizedExpected === normalizedDetected) {
    return "yes";
  }

  if (normalizedExpected === "Magento / Adobe Commerce" && normalizedDetected === "Magento / Adobe Commerce") {
    return "yes";
  }

  return "no";
}

function detectedMarketingTools(technologyDetections) {
  return technologyDetections
    .filter((tool) =>
      tool.detected &&
      ["googleAnalytics", "googleTagManager", "metaPixel", "klaviyo", "mailchimp"].includes(tool.key),
    )
    .map((tool) => tool.label);
}

function categoryScores(categories) {
  return categories.map((category) => ({
    key: category.key,
    label: category.label,
    score: category.score,
    status: category.status,
  }));
}

function topPriorityIssues(topPriorityRisks) {
  return topPriorityRisks.map((risk) => ({
    title: risk.title,
    riskLabel: risk.riskLabel,
    severity: risk.severity,
    explanation: risk.explanation,
    recommendedFirstAction: risk.recommendedFirstAction,
  }));
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runValidation() {
  const sitesJson = await fs.readFile(sitesFile, "utf8");
  const sites = JSON.parse(sitesJson);
  const results = [];

  for (const [index, site] of sites.entries()) {
    console.log(`Running ${index + 1}/${sites.length}: ${site.name} - ${site.url}`);
    const item = {
      name: site.name,
      url: site.url,
      expectedPlatform: normalizePlatform(site.expectedPlatform),
      detectedPlatform: "Unknown",
      confidence: 0,
      platformMatch: "unknown",
      marketingTools: [],
      overallScore: null,
      categoryScores: [],
      topPriorityIssues: [],
      status: "failed",
      errorMessage: null,
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website: site.url }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok || !body || body.success !== true) {
        item.errorMessage = body?.error || `HTTP ${response.status}`;
      } else {
        const audit = body.audit;
        item.detectedPlatform = audit.diagnostics.platformDetection.name;
        item.confidence = audit.diagnostics.platformDetection.confidence;
        item.platformMatch = platformMatches(item.expectedPlatform, item.detectedPlatform);
        item.marketingTools = detectedMarketingTools(audit.diagnostics.technologyDetections);
        item.overallScore = audit.overallScore;
        item.categoryScores = categoryScores(audit.categories);
        item.topPriorityIssues = topPriorityIssues(audit.topPriorityRisks);
        item.status = "success";
      }
    } catch (error) {
      item.errorMessage = error?.message ?? String(error);
    }

    results.push(item);
    await wait(2500 + Math.floor(Math.random() * 2000));
  }

  await fs.writeFile(resultsFile, JSON.stringify(results, null, 2), "utf8");

  const total = results.length;
  const successCount = results.filter((item) => item.status === "success").length;
  const failedCount = total - successCount;
  const platformMatchCount = results.filter((item) => item.platformMatch === "yes").length;
  const platformMismatchCount = results.filter((item) => item.platformMatch === "no").length;

  const manualReviewSites = results
    .filter((item) => item.status !== "success" || item.platformMatch !== "yes")
    .map((item) => `${item.name} (${item.url})`);

  const commonIssues = results
    .flatMap((item) =>
      item.status === "success"
        ? item.topPriorityIssues.map((risk) => risk.riskLabel)
        : [],
    )
    .reduce((acc, label) => {
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

  const commonIssuesSorted = Object.entries(commonIssues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => `${label} (${count})`);

  const markdownLines = [
    "# Scanner Validation Round 1 Results",
    "",
    `- Total tested: ${total}`,
    `- Successful scans: ${successCount}`,
    `- Failed scans: ${failedCount}`,
    `- Platform matches: ${platformMatchCount}`,
    `- Platform mismatches: ${platformMismatchCount}`,
    "",
    "## Common issues",
    "",
  ];

  if (commonIssuesSorted.length > 0) {
    for (const issue of commonIssuesSorted) {
      markdownLines.push(`- ${issue}`);
    }
  } else {
    markdownLines.push("- No common top priority issue labels were found.");
  }

  markdownLines.push("", "## Sites needing manual review", "");
  if (manualReviewSites.length > 0) {
    manualReviewSites.forEach((site) => markdownLines.push(`- ${site}`));
  } else {
    markdownLines.push("- None");
  }

  await fs.writeFile(reportFile, markdownLines.join("\n"), "utf8");

  const summaryContent = [
    "# Scanner Validation Round 1",
    "",
    "This summary is updated after the latest validation sweep.",
    "",
    `- Total tested: ${total}`,
    `- Successful scans: ${successCount}`,
    `- Failed scans: ${failedCount}`,
    `- Platform matches: ${platformMatchCount}`,
    `- Platform mismatches: ${platformMismatchCount}`,
    "",
    "## Common issues",
    "",
  ];

  if (commonIssuesSorted.length > 0) {
    commonIssuesSorted.forEach((issue) => summaryContent.push(`- ${issue}`));
  } else {
    summaryContent.push("- No common top priority issue labels were found.");
  }

  summaryContent.push("", "## Sites needing manual review", "");
  if (manualReviewSites.length > 0) {
    manualReviewSites.forEach((site) => summaryContent.push(`- ${site}`));
  } else {
    summaryContent.push("- None");
  }

  await fs.writeFile(summaryFile, summaryContent.join("\n"), "utf8");

  console.log(`Saved results to ${resultsFile} and ${reportFile}`);
  console.log(`Updated summary in ${summaryFile}`);
}

runValidation().catch((error) => {
  console.error("Validation script failed:", error);
  process.exit(1);
});
