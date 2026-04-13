import { analyzeRiskCheckSubmission } from "./src/lib/risk-check-analysis";
import * as fs from "fs";
import * as path from "path";

async function runTest(fileName: string) {
  const filePath = path.join(process.cwd(), "samples", fileName);
  const content = fs.readFileSync(filePath, "utf-8");

  const input = {
    name: "Test User",
    email: "test@example.com",
    agencyName: "Test Agency",
    websiteUrl: "https://example.com",
    projectType: fileName.includes("redesign") ? "marketing-redesign" : "other",
    briefSource: "sample_file",
    summary: content,
    consent: true,
  };

  const analysis = analyzeRiskCheckSubmission(input as any);

  console.log(`\n==================================================`);
  console.log(`TESTING: ${fileName}`);
  console.log(`SUMMARY: ${analysis.internalSummary}`);
  console.log(`CONFIDENCE: ${analysis.pricingGuidance.pricingConfidence.toUpperCase()}`);
  console.log(`COMPLEXITY: ${analysis.pricingGuidance.complexity.toUpperCase()}`);
  console.log(`--------------------------------------------------`);
  console.log(`RISK FLAGS FOUND (${analysis.riskFlags.length}):`);
  analysis.riskFlags.forEach(flag => {
    console.log(`- [${flag.severity.toUpperCase()}] ${flag.label}: ${flag.reason}`);
  });
  console.log(`--------------------------------------------------`);
  console.log(`TOP QUESTIONS TO ASK:`);
  analysis.missingInfoPrompts.forEach(p => {
    console.log(`? ${p.question}`);
  });
  console.log(`==================================================\n`);
}

async function main() {
  await runTest("vague-retail-redesign.txt");
  await runTest("complex-cms-migration.txt");
  await runTest("clean-one-pager.txt");
}

main().catch(console.error);
