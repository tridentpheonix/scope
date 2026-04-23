/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");

function loadPlaywright() {
  const playwrightPath = path.join(process.cwd(), ".tmp-playwright", "node_modules", "playwright");

  try {
    return require(playwrightPath);
  } catch (error) {
    throw new Error(
      `Playwright is not available at ${playwrightPath}. Run "npm install playwright" in .tmp-playwright first.`,
      { cause: error },
    );
  }
}

async function main() {
  const { chromium } = loadPlaywright();
  const baseUrl = process.env.SMOKE_BASE_URL ?? "https://scope-wheat.vercel.app";
  const email = process.env.SMOKE_EMAIL;
  const password = process.env.SMOKE_PASSWORD;

  if (!email || !password) {
    throw new Error("Set SMOKE_EMAIL and SMOKE_PASSWORD for the launch smoke.");
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);

  const results = [];

  try {
    await page.goto(`${baseUrl}/auth/sign-in`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.waitForTimeout(500);
    await Promise.all([
      page.waitForURL((url) => url.pathname === "/risk-check", { timeout: 30000 }),
      page.locator("form").getByRole("button", { name: "Sign in", exact: true }).click(),
    ]);
    results.push("email-password sign-in");

    for (const route of ["/risk-check", "/account", "/ops", "/pricing", "/support"]) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      await page.locator("body").waitFor({ state: "visible" });
      results.push(route);
    }

    const healthResponse = await page.request.get(`${baseUrl}/api/health`);
    const health = await healthResponse.json();
    if (!healthResponse.ok() || !health?.ok) {
      throw new Error(`Health check failed: ${JSON.stringify(health)}`);
    }
    results.push("/api/health");

    await page.goto(`${baseUrl}/auth/sign-in`, { waitUntil: "domcontentloaded" });
    const bodyText = await page.locator("body").innerText();
    if (!bodyText.includes("Continue with Google") && !bodyText.includes("You are already signed in")) {
      throw new Error("Google sign-in surface is not visible.");
    }
    results.push("google sign-in surface");

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          results,
          healthStatus: health.status,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error?.message ?? String(error) }, null, 2));
  process.exit(1);
});
