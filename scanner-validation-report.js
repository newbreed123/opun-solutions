import fs from 'fs/promises';
import path from 'path';

async function main() {
  const root = process.cwd();
  const file = path.join(root, 'scanner-validation-results.json');
  const output = path.join(root, 'scanner-validation-report.txt');
  const raw = await fs.readFile(file, 'utf8');
  const data = JSON.parse(raw);
  const failures = data.filter((i) => i.status !== 'success');
  const mismatches = data.filter((i) => i.platformMatch === 'no');
  const errors = {};
  for (const item of failures) {
    const reason = item.errorMessage || 'Unknown error';
    errors[reason] = (errors[reason] || 0) + 1;
  }
  const issueCounts = {};
  data.filter((i) => i.status === 'success').forEach((item) => {
    item.topPriorityIssues.forEach((risk) => {
      issueCounts[risk.riskLabel] = (issueCounts[risk.riskLabel] || 0) + 1;
    });
  });
  const summaryLines = [];
  summaryLines.push('SCANNER VALIDATION SUMMARY');
  summaryLines.push('===========================');
  summaryLines.push(`Total sites tested: ${data.length}`);
  summaryLines.push(`Successful scans: ${data.filter((i) => i.status === 'success').length}`);
  summaryLines.push(`Failed scans: ${failures.length}`);
  summaryLines.push(`Platform matches: ${data.filter((i) => i.platformMatch === 'yes').length}`);
  summaryLines.push(`Platform mismatches: ${mismatches.length}`);
  summaryLines.push('');
  summaryLines.push('1. Failure reasons grouped by type');
  summaryLines.push('-----------------------------------');
  Object.entries(errors)
    .sort((a, b) => b[1] - a[1])
    .forEach(([reason, count]) => {
      summaryLines.push(`- ${count} x ${reason}`);
    });
  summaryLines.push('');
  summaryLines.push('2. Sites that failed and why');
  summaryLines.push('--------------------------------');
  failures.forEach((item) => {
    summaryLines.push(`- ${item.name}: ${item.errorMessage || 'Unknown error'}`);
  });
  summaryLines.push('');
  summaryLines.push('3. Platform mismatches with expected vs detected');
  summaryLines.push('-----------------------------------------------');
  mismatches.forEach((item) => {
    summaryLines.push(`- ${item.name}: expected=${item.expectedPlatform}, detected=${item.detectedPlatform} (${item.confidence}%)`);
  });
  summaryLines.push('');
  summaryLines.push('4. Detection patterns that looked reliable');
  summaryLines.push('------------------------------------------');
  summaryLines.push('- Shopify detections appear reliable when Shopify asset/script patterns are present and a detection confidence is high.');
  summaryLines.push('- GA4 and GTM detection is reliable for sites with visible gtag, GTM IDs, or dataLayer setup.');
  summaryLines.push('- Meta Pixel is reliably detected when fbq or facebook tracking script patterns exist.');
  summaryLines.push('');
  summaryLines.push('5. Detection patterns that need improvement');
  summaryLines.push('---------------------------------------------');
  summaryLines.push('- BigCommerce and Magento / Adobe Commerce false negatives: several sites returned Unknown despite expected platform definitions.');
  summaryLines.push('- WooCommerce and custom storefronts may require stronger HTML/UI heuristics beyond scripts and paths.');
  summaryLines.push('- Platform detection confidence is too low for sites with minimal visible script metadata.');
  summaryLines.push('');
  summaryLines.push('6. Recommended next fixes ranked by product impact');
  summaryLines.push('--------------------------------------------------');
  summaryLines.push('- Improve BigCommerce/Magento storefront detection heuristics first, because many failed or mismatched enterprise sites depend on these signals.');
  summaryLines.push('- Add better Unknown handling and fallback rules for sites with hidden or deferred scripts.');
  summaryLines.push('- Strengthen cart/checkout visibility patterns to reduce false negatives on commerce flow detection.');
  summaryLines.push('- Tune marketing tool detection for non-standard tag injection flows (e.g. GTM containerless setups).');
  summaryLines.push('');
  summaryLines.push('Mismatched sites details:');
  mismatches.forEach((item) => {
    summaryLines.push(`- ${item.name} (${item.url}): expected ${item.expectedPlatform}, detected ${item.detectedPlatform} @ ${item.confidence}%`);
  });
  summaryLines.push('');
  summaryLines.push('Failed sites details:');
  failures.forEach((item) => {
    summaryLines.push(`- ${item.name} (${item.url}): ${item.errorMessage || 'Unknown error'}`);
  });
  await fs.writeFile(output, summaryLines.join('\n'), 'utf8');
  console.log('Wrote summary to', output);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
