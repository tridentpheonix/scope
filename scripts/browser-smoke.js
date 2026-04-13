/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");

function loadPlaywright() {
  const playwrightPath = path.join(process.cwd(), ".tmp-playwright", "node_modules", "playwright");

  try {
    return require(playwrightPath);
  } catch (error) {
    throw new Error(
      `Playwright is not available at ${playwrightPath}. Re-run the local browser setup or install playwright.`,
      { cause: error },
    );
  }
}

async function main() {
  const { chromium } = loadPlaywright();
  const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3001";
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);

  const uniqueAgencyName = `GA Smoke ${Date.now()}`;
  const uniqueEmail = `ga-smoke-${Date.now()}@scopeos.local`;
  const uniquePassword = `SmokeTest!${Date.now()}`;
  const uniqueName = "GA Smoke User";
  const briefText =
    "We need a redesign of our marketing website with five pages, content migration, one CMS integration, and two revision rounds. Timeline is six weeks and the client can provide final copy after kickoff.";

  try {
    await page.goto(`${baseUrl}/auth/sign-in`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.locator("button").filter({ hasText: "Create account" }).first().click();
    await page.waitForTimeout(1000);
    await page.getByText("Create your ScopeOS account").waitFor({ state: "visible", timeout: 10000 });
    await page.getByLabel("Name").fill(uniqueName);
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Password").fill(uniquePassword);
    await Promise.all([
      page.waitForURL((url) => url.pathname === "/risk-check", { timeout: 30000 }),
      page.locator("form").getByRole("button", { name: "Create account", exact: true }).click(),
    ]);

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.getByText("Signed-in workspace launchpad").waitFor({ state: "visible" });
    await page.getByRole("link", { name: "Start a Scope Risk Check", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/risk-check", { timeout: 30000 });

    await page.getByLabel("Your name").fill(uniqueName);
    await page.getByLabel("Work email").fill(uniqueEmail);
    await page.getByLabel("Agency or studio name").fill(uniqueAgencyName);
    await page.getByLabel("Brief, transcript, or notes").fill(briefText);
    await page.getByLabel(
      "I confirm this material can be reviewed for a Scope Risk Check and I understand the first response is manual.",
    ).check();

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/risk-check") &&
          response.request().method() === "POST" &&
          response.status() === 201,
      ),
      page.getByRole("button", { name: "Submit for a free Scope Risk Check" }).click(),
    ]);

    await page.getByText("Brief received.").waitFor({ state: "visible" });
    const reviewHref = await page.getByRole("link", { name: "Review extracted scope" }).getAttribute("href");
    if (!reviewHref) {
      throw new Error("Could not find the extraction review link after submission.");
    }

    const submissionId = reviewHref.split("/").filter(Boolean).pop();
    if (!submissionId) {
      throw new Error(`Could not parse submission ID from ${reviewHref}.`);
    }

    await page.goto(`${baseUrl}/extraction-review/${submissionId}`, { waitUntil: "domcontentloaded" });
    await page.getByText("Extraction review", { exact: true }).waitFor({ state: "visible" });
    const continueToProposal = page.getByRole("link", { name: "Continue to proposal pack" });
    await continueToProposal.waitFor({ state: "visible" });
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      continueToProposal.click(),
    ]);
    await page.getByText("Proposal pack draft", { exact: true }).waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Copy full pack" }).waitFor({ state: "visible" });

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.getByText("Signed-in workspace launchpad").waitFor({ state: "visible" });
    await page.getByText(uniqueAgencyName, { exact: true }).waitFor({ state: "visible" });

    console.log(
      JSON.stringify({
        ok: true,
        baseUrl,
        submissionId,
        agencyName: uniqueAgencyName,
        email: uniqueEmail,
        path: "auth sign-up -> auth sign-in -> launchpad -> risk-check -> extraction-review -> proposal-pack -> launchpad",
      }),
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error?.message ?? String(error) }, null, 2));
  process.exit(1);
});
