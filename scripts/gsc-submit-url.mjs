/**
 * Submit a URL to Google Search Console for indexing.
 * Uses AppleScript System Events (keyboard simulation) to control Chrome.
 * No Chrome JS permission needed.
 */

import { execSync } from "child_process";

const SITE_URL = "sc-domain:nanobananastudio.com";
const TARGET_URL =
  "https://nanobananastudio.com/en/blog/why-ai-struggles-with-text-in-images";

function osascript(script) {
  return execSync(`osascript <<'APPLESCRIPT'\n${script}\nAPPLESCRIPT`, {
    encoding: "utf-8",
    timeout: 60000,
  }).trim();
}

function sleep(ms) {
  execSync(`sleep ${ms / 1000}`);
}

async function main() {
  console.log(`🔗 Target URL: ${TARGET_URL}`);

  const encodedResource = encodeURIComponent(SITE_URL);

  // Step 1: Open GSC URL Inspection page in Chrome
  const gscUrl = `https://search.google.com/search-console/inspect?resource_id=${encodedResource}`;
  console.log("📄 Opening GSC URL Inspection in Chrome...");

  osascript(`
    tell application "Google Chrome"
      activate
      open location "${gscUrl}"
    end tell
  `);

  console.log("⏳ Waiting for GSC to load (10s)...");
  sleep(10000);

  // Check current URL to verify we're on GSC
  const currentUrl = osascript(`
    tell application "Google Chrome"
      get URL of active tab of front window
    end tell
  `);
  console.log(`🌐 Current URL: ${currentUrl}`);

  if (currentUrl.includes("accounts.google.com")) {
    console.log("⚠️  Not logged in. Please log in and re-run.");
    return;
  }

  // Step 2: Click on the URL inspection input bar using mouse
  // The inspect bar is at the top center of the GSC page
  // First, get Chrome window position and size
  const windowBounds = osascript(`
    tell application "Google Chrome"
      set winBounds to bounds of front window
      return (item 1 of winBounds) & "," & (item 2 of winBounds) & "," & (item 3 of winBounds) & "," & (item 4 of winBounds)
    end tell
  `);
  console.log(`📐 Window bounds: ${windowBounds}`);

  const [x1, y1, x2, y2] = windowBounds.split(",").map(Number);
  const winWidth = x2 - x1;

  // The search/inspection bar is roughly at the top center of the page
  // Approximately: center X, about 80px from top of the window content area
  const clickX = x1 + Math.floor(winWidth / 2);
  const clickY = y1 + 80;

  console.log(`🖱️  Clicking URL inspection bar at (${clickX}, ${clickY})...`);

  osascript(`
    tell application "System Events"
      click at {${clickX}, ${clickY}}
    end tell
  `);

  sleep(1000);

  // Step 3: Select all and type the URL
  console.log("⌨️  Typing URL...");
  osascript(`
    tell application "System Events"
      keystroke "a" using command down
      delay 0.3
      keystroke "${TARGET_URL}"
      delay 0.5
      key code 36
    end tell
  `);

  // Step 4: Wait for URL inspection to complete
  console.log("⏳ Waiting for URL inspection results (25s)...");
  sleep(25000);

  // Step 5: Try to find and click "Request Indexing"
  // Use Cmd+F to search for the text on page, then Escape and click near it
  // Or: Tab through the page elements to find it

  // Let's try clicking where "Request Indexing" typically appears
  // It's usually a link in the middle-lower portion of the inspection results
  // Try using Cmd+F to find it first
  console.log("🔎 Searching for 'Request Indexing' on page...");
  osascript(`
    tell application "System Events"
      keystroke "f" using command down
      delay 0.5
      keystroke "Request Indexing"
      delay 1
      key code 53
      delay 0.5
    end tell
  `);

  sleep(1000);

  // The search should have scrolled to "Request Indexing"
  // Now press Escape to close find bar and try to click the highlighted area
  // Use Tab to navigate to the link
  console.log("🖱️  Attempting to click 'Request Indexing'...");

  // Take a screenshot for debugging
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const screenshotPath = `scripts/gsc-${timestamp}.png`;
  execSync(
    `screencapture -x "${screenshotPath}"`,
    { timeout: 5000 }
  );
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
  console.log("");
  console.log("🖥️  GSC page is open with inspection results.");
  console.log("   If 'Request Indexing' is visible, please click it manually.");
  console.log("   The screenshot above shows the current state.");
}

main();
