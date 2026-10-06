import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.HOMES_QA_BASE_URL || "http://localhost:3005";
const screenshotDir = path.join(process.cwd(), "tmp-opzix-qa");

await fs.mkdir(screenshotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await desktop.goto(`${baseUrl}/homes`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await expectVisibleText(desktop, "Find Your Next Home");
  await expectVisibleText(desktop, "6 Homes");
  await assertNoHorizontalOverflow(desktop, "desktop homes");
  await assertNoBrokenImages(desktop, "desktop homes");
  await desktop.screenshot({
    path: path.join(screenshotDir, "spec-0030b-homes-desktop.png"),
    fullPage: true,
  });

  await desktop.getByLabel("Location").fill("Matthews");
  await desktop.getByRole("button", { name: "Search Homes" }).click();
  await desktop.waitForURL("**/homes?**", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await expectVisibleText(desktop, "1 Home");
  await assertNoHorizontalOverflow(desktop, "desktop filtered homes");

  await desktop.goto(`${baseUrl}/listings/old-idx-route`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  if (new URL(desktop.url()).pathname !== "/homes") {
    throw new Error("/listings/* did not redirect safely to /homes");
  }

  await desktop.goto(`${baseUrl}/homes/preview-charlotte-001`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await expectVisibleText(desktop, "$475,000");
  await expectVisibleText(desktop, "Call Brittany");
  await assertContactHref(desktop, "Call Brittany", "tel:+19808800732");
  await assertContactHref(desktop, "Text Brittany", "sms:+19808800732");
  await assertNoBrokenImages(desktop, "desktop detail");
  await desktop.screenshot({
    path: path.join(screenshotDir, "spec-0030b-detail-desktop.png"),
    fullPage: true,
  });

  await desktop.keyboard.press("Tab");
  await desktop.keyboard.press("Tab");
  const focusedElement = await desktop.evaluate(() => {
    const active = document.activeElement;
    return {
      tag: active?.tagName ?? "",
      text: active?.textContent?.trim().slice(0, 80) ?? "",
      href: active instanceof HTMLAnchorElement ? active.href : "",
    };
  });
  if (!focusedElement.tag) {
    throw new Error("Keyboard navigation did not move focus to a visible element");
  }

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(`${baseUrl}/homes`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await assertNoHorizontalOverflow(mobile, "mobile homes");
  await assertNoBrokenImages(mobile, "mobile homes");
  await mobile.screenshot({
    path: path.join(screenshotDir, "spec-0030b-homes-mobile.png"),
    fullPage: true,
  });

  await mobile.goto(`${baseUrl}/homes/preview-charlotte-001`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await expectVisibleText(mobile, "Call");
  await expectVisibleText(mobile, "Text");
  await expectVisibleText(mobile, "Tour");
  await assertNoHorizontalOverflow(mobile, "mobile detail");
  await assertNoBrokenImages(mobile, "mobile detail");
  await mobile.screenshot({
    path: path.join(screenshotDir, "spec-0030b-detail-mobile.png"),
    fullPage: true,
  });

  console.log("Home search browser QA passed.");
  console.log(`Screenshots written to ${screenshotDir}`);
} finally {
  await browser.close();
}

async function expectVisibleText(page, text) {
  const locator = page.getByText(text, { exact: false });
  const count = await locator.count();
  if (count < 1) {
    throw new Error(`Expected visible text not found: ${text}`);
  }
}

async function assertContactHref(page, label, expectedPrefix) {
  const locator = page.getByRole("link", { name: label });
  const count = await locator.count();
  if (count !== 1) {
    throw new Error(`Expected one ${label} link, found ${count}`);
  }
  const href = await locator.getAttribute("href");
  if (!href?.startsWith(expectedPrefix)) {
    throw new Error(`${label} link has unexpected href: ${href}`);
  }
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  if (
    overflow.documentWidth > overflow.viewport + 1 ||
    overflow.bodyWidth > overflow.viewport + 1
  ) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(overflow)}`);
  }
}

async function assertNoBrokenImages(page, label) {
  const brokenImages = await page.evaluate(() =>
    Array.from(document.images)
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.alt || image.currentSrc || image.src),
  );
  if (brokenImages.length > 0) {
    throw new Error(`${label} has broken images: ${brokenImages.join(", ")}`);
  }
}
