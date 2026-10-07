import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

async function capture() {
  const outputDir = path.resolve(
    "C:/Users/chari/.gemini/antigravity-ide/brain/3a2a454a-da9d-4d5f-b035-18223c347153/scratch"
  );
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch();

  // 1. Desktop Verification (1280x800)
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const desktopPage = await desktopContext.newPage();
  
  const consoleErrors: string[] = [];
  desktopPage.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  desktopPage.on("pageerror", (err) => consoleErrors.push(err.message));
  desktopPage.on("response", (res) => {
    if (res.status() >= 400) console.log("Failed request:", res.url(), res.status());
  });

  await desktopPage.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await desktopPage.screenshot({
    path: path.join(outputDir, "desktop-discovery-1280x800.png"),
    fullPage: false,
  });
  console.log("Captured desktop-discovery-1280x800.png");

  // Detail Page Desktop
  await desktopPage.goto("http://localhost:3000/properties/b0000000-0000-0000-0000-000000000001", {
    waitUntil: "networkidle",
  });
  await desktopPage.screenshot({
    path: path.join(outputDir, "desktop-detail-1280x800.png"),
    fullPage: false,
  });
  console.log("Captured desktop-detail-1280x800.png");

  await desktopContext.close();

  // 2. Mobile Verification (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await mobilePage.screenshot({
    path: path.join(outputDir, "mobile-discovery-390x844.png"),
    fullPage: false,
  });
  console.log("Captured mobile-discovery-390x844.png");

  // Check horizontal overflow
  const overflowingElements = await mobilePage.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const elements: { tag: string; className: string; scrollWidth: number; clientWidth: number; offsetWidth: number }[] = [];
    document.querySelectorAll("*").forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.offsetWidth > docWidth) {
        elements.push({
          tag: htmlEl.tagName,
          className: htmlEl.className,
          scrollWidth: htmlEl.scrollWidth,
          clientWidth: htmlEl.clientWidth,
          offsetWidth: htmlEl.offsetWidth,
        });
      }
    });
    return elements;
  });

  const isOverflowing = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log("Mobile horizontal overflow:", isOverflowing ? "YES (FAIL)" : "NONE (PASS)");
  if (overflowingElements.length > 0) {
    console.log("Overflowing elements:", JSON.stringify(overflowingElements.slice(0, 5), null, 2));
  }

  await mobileContext.close();
  await browser.close();

  console.log("Console errors count:", consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log("Console errors:", consoleErrors);
  }
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
