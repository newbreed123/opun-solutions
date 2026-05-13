import fs from 'fs/promises';
import path from 'path';

async function main() {
  const file = path.join(process.cwd(), 'scanner-validation-results.json');
  const raw = await fs.readFile(file, 'utf8');
  const data = JSON.parse(raw);
  const failures = data.filter((i) => i.status !== 'success');
  const mismatches = data.filter((i) => i.platformMatch === 'no');
  const reasons = {};
  const patterns = {
    successful: 0,
    failed: 0,
    platformMatches: 0,
    platformMismatches: 0,
  };
  for (const item of data) {
    if (item.status !== 'success') {
      const reason = item.errorMessage || 'Unknown error';
      reasons[reason] = (reasons[reason] || 0) + 1;
      patterns.failed += 1;
    } else {
      patterns.successful += 1;
      if (item.platformMatch === 'yes') patterns.platformMatches += 1;
      if (item.platformMatch === 'no') patterns.platformMismatches += 1;
    }
  }
  const issueCounts = {};
  data.filter((i) => i.status === 'success').forEach((item) => {
    item.topPriorityIssues.forEach((risk) => {
      issueCounts[risk.riskLabel] = (issueCounts[risk.riskLabel] || 0) + 1;
    });
  });
  const issueSorted = Object.entries(issueCounts).sort((a, b) => b[1] - a[1]);

  console.log('SUMMARY');
  console.log('total', data.length);
  console.log('success', patterns.successful);
  console.log('failed', patterns.failed);
  console.log('platformMatches', patterns.platformMatches);
  console.log('platformMismatches', patterns.platformMismatches);
  console.log('FAILURE_REASONS', JSON.stringify(reasons, null, 2));
  console.log('MISMATCHES', JSON.stringify(mismatches, null, 2));
  console.log('FAILURES', JSON.stringify(failures, null, 2));
  console.log('ISSUES', JSON.stringify(issueSorted.slice(0, 20), null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
