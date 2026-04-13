import { z } from "zod";

export const projectTypes = [
  "brochure-site",
  "marketing-redesign",
  "webflow-build",
  "wordpress-redesign",
  "other",
] as const;

export const briefSourceTypes = [
  "call-notes",
  "transcript",
  "client-brief",
  "email-thread",
  "loom-summary",
  "other",
] as const;

export const acceptedAttachmentMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

export const acceptedAttachmentExtensions = [".pdf", ".docx", ".txt"] as const;
export const maxAttachmentSizeBytes = 5 * 1024 * 1024;

export const riskCheckSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your name.")
    .max(80, "Keep your name under 80 characters."),
  email: z.email("Enter a valid email address."),
  agencyName: z
    .string()
    .trim()
    .min(2, "Enter your agency or studio name.")
    .max(120, "Keep the agency name under 120 characters."),
  websiteUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? "")
    .refine((value) => value.length === 0 || z.url().safeParse(value).success, {
      message: "Enter a valid website URL or leave it blank.",
    }),
  projectType: z.enum(projectTypes, {
    error: "Choose the closest website project type.",
  }),
  briefSource: z.enum(briefSourceTypes, {
    error: "Choose the source that best matches the client material.",
  }),
  summary: z
    .string()
    .trim()
    .min(120, "Add at least 120 characters so ScopeOS can assess the brief safely.")
    .max(6000, "Keep the summary under 6000 characters for the first release."),
  consent: z.literal(true, {
    error: "You need to confirm that ScopeOS can review this material.",
  }),
});

export type RiskCheckInput = z.infer<typeof riskCheckSchema>;

export type FieldErrors = Partial<Record<keyof RiskCheckInput | "attachment", string>>;

export function validateAttachment(file: File | null | undefined): string | null {
  if (!file || file.size === 0) {
    return null;
  }

  const lowerName = file.name.toLowerCase();
  const hasValidExtension = acceptedAttachmentExtensions.some((extension) =>
    lowerName.endsWith(extension),
  );
  const hasValidMimeType = acceptedAttachmentMimeTypes.includes(file.type as (typeof acceptedAttachmentMimeTypes)[number]);

  if (!hasValidExtension || !hasValidMimeType) {
    return "Upload a TXT, DOCX, or PDF file.";
  }

  if (file.size > maxAttachmentSizeBytes) {
    return "Keep attachments under 5 MB for the first release.";
  }

  return null;
}

export function formatZodErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const key = (issue.path[0] ?? "summary") as keyof FieldErrors;
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}
