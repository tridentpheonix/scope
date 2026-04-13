import { describe, expect, it } from "vitest";
import {
  maxAttachmentSizeBytes,
  riskCheckSchema,
  validateAttachment,
} from "./risk-check-schema";

describe("riskCheckSchema", () => {
  it("accepts a valid web design brief submission", () => {
    const result = riskCheckSchema.safeParse({
      name: "Satya",
      email: "satya@example.com",
      agencyName: "Northline Studio",
      websiteUrl: "https://northline.example",
      projectType: "marketing-redesign",
      briefSource: "transcript",
      summary:
        "The client needs a marketing website redesign for a B2B service business, wants clearer messaging, expects around seven pages, and is unsure who owns copy, CMS migration, and revision scope.",
      consent: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects summaries that are too short to scope safely", () => {
    const result = riskCheckSchema.safeParse({
      name: "Satya",
      email: "satya@example.com",
      agencyName: "Northline Studio",
      websiteUrl: "",
      projectType: "marketing-redesign",
      briefSource: "transcript",
      summary: "Need a website ASAP.",
      consent: true,
    });

    expect(result.success).toBe(false);
  });
});

describe("validateAttachment", () => {
  it("rejects unsupported attachment types", () => {
    const file = new File(["hello"], "brief.png", { type: "image/png" });
    expect(validateAttachment(file)).toBe("Upload a TXT, DOCX, or PDF file.");
  });

  it("rejects attachments that are too large", () => {
    const file = new File([new Uint8Array(maxAttachmentSizeBytes + 1)], "brief.txt", {
      type: "text/plain",
    });

    expect(validateAttachment(file)).toBe("Keep attachments under 5 MB for the first release.");
  });
});
