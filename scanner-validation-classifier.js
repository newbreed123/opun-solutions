import fs from "fs/promises";
import path from "path";

const root = process.cwd();
const resultsFile = path.join(root, "scanner-validation-results.json");
const reportFile = path.join(root, "scanner-validation-classified-report.md");

async function classifyValidationResults() {
  const resultsJson = await fs.readFile(resultsFile, "utf8");
  const results = JSON.parse(resultsJson);

  const classification = {
    total: results.length,
    successful: 0,
    failed: 0,
    matches: [],
    mismatches: [],
    needsReview: [],
    failedScans: [],
  };

  for (const item of results) {
    if (item.status === "failed") {
      classification.failed++;
      classification.failedScans.push({
        name: item.name,
        url: item.url,
        expected: item.expectedPlatform,
        reason: item.errorMessage,
      });
    } else {
      classification.successful++;
      
      if (item.platformMatch === "yes") {
        classification.matches.push({
          name: item.name,
          url: item.url,
          platform: item.detectedPlatform,
          confidence: item.confidence,
        });
      } else if (item.confidence === 0 || item.detectedPlatform === "Unknown") {
        classification.needsReview.push({
          name: item.name,
          url: item.url,
          expected: item.expectedPlatform,
          detected: item.detectedPlatform,
          confidence: item.confidence,
          reason: "Platform not confidently identified",
        });
      } else {
        classification.mismatches.push({
          name: item.name,
          url: item.url,
          expected: item.expectedPlatform,
          detected: item.detectedPlatform,
          confidence: item.confidence,
        });
      }
    }
  }

  const markdownLines = [
    "# Scanner Validation Classification Report",
    "",
    "## Summary",
    "",
    `- Total tested: ${classification.total}`,
    `- Successful scans: ${classification.successful}`,
    `- Failed scans: ${classification.failed}`,
    `- Platform matches: ${classification.matches.length}`,
    `- Platform mismatches: ${classification.mismatches.length}`,
    `- Platform needs review: ${classification.needsReview.length}`,
    "",
    "## Platform Matches",
    "",
    `Found ${classification.matches.length} sites with platform detection matches:`,
    "",
  ];

  if (classification.matches.length > 0) {
    for (const match of classification.matches) {
      markdownLines.push(
        `- **${match.name}** (${match.platform} @ ${match.confidence}%)`
      );
    }
  } else {
    markdownLines.push("- None");
  }

  markdownLines.push(
    "",
    "## Platform Mismatches",
    "",
    `Found ${classification.mismatches.length} sites with platform detection mismatches:`,
    ""
  );

  if (classification.mismatches.length > 0) {
    for (const mismatch of classification.mismatches) {
      markdownLines.push(
        `- **${mismatch.name}**: expected ${mismatch.expected}, detected ${mismatch.detected} @ ${mismatch.confidence}%`
      );
    }
  } else {
    markdownLines.push("- None");
  }

  markdownLines.push(
    "",
    "## Platform Needs Manual Review",
    "",
    `Found ${classification.needsReview.length} sites where platform was not confidently identified:`,
    ""
  );

  if (classification.needsReview.length > 0) {
    for (const review of classification.needsReview) {
      markdownLines.push(
        `- **${review.name}**: expected ${review.expected}, detected ${review.detected} (confidence: ${review.confidence}%)`
      );
    }
  } else {
    markdownLines.push("- None");
  }

  markdownLines.push(
    "",
    "## Failed Scans",
    "",
    `Found ${classification.failedScans.length} sites where scanning failed:`,
    ""
  );

  if (classification.failedScans.length > 0) {
    for (const failed of classification.failedScans) {
      markdownLines.push(
        `- **${failed.name}**: ${failed.reason}`
      );
    }
  } else {
    markdownLines.push("- None");
  }

  await fs.writeFile(reportFile, markdownLines.join("\n"), "utf8");
  console.log(`Wrote classified report to ${reportFile}`);
}

classifyValidationResults().catch((error) => {
  console.error("Classification failed:", error);
  process.exit(1);
});
