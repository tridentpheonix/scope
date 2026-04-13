import { ZodError } from "zod";
import {
  analyzeRiskCheckSubmission,
  createRiskCheckAnalysisPreview,
  type RiskCheckAnalysisPreview,
} from "./risk-check-analysis";
import {
  formatZodErrors,
  riskCheckSchema,
  validateAttachment,
  type FieldErrors,
} from "./risk-check-schema";
import {
  persistRiskCheckSubmission,
  type PersistRiskCheckSubmissionOptions,
  type SavedSubmission,
} from "./risk-check-storage";

type RiskCheckErrorCode =
  | "invalid_attachment"
  | "invalid_payload"
  | "storage_failed";

type RiskCheckFailure = {
  ok: false;
  status: 400 | 500;
  code: RiskCheckErrorCode;
  message: string;
  fieldErrors?: FieldErrors;
  cause?: unknown;
};

type RiskCheckSuccess = {
  ok: true;
  status: 201;
  submission: SavedSubmission;
  preview: RiskCheckAnalysisPreview;
};

export type RiskCheckSubmitResult = RiskCheckFailure | RiskCheckSuccess;

function getTextField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getAttachment(formData: FormData) {
  const attachment = formData.get("attachment");
  return attachment instanceof File ? attachment : null;
}

export async function submitRiskCheck(
  formData: FormData,
  options: PersistRiskCheckSubmissionOptions = {},
): Promise<RiskCheckSubmitResult> {
  const attachment = getAttachment(formData);
  const attachmentError = validateAttachment(attachment);

  if (attachmentError) {
    return {
      ok: false,
      status: 400,
      code: "invalid_attachment",
      message: attachmentError,
      fieldErrors: { attachment: attachmentError },
    };
  }

  try {
    const parsed = riskCheckSchema.parse({
      name: getTextField(formData, "name"),
      email: getTextField(formData, "email"),
      agencyName: getTextField(formData, "agencyName"),
      websiteUrl: getTextField(formData, "websiteUrl"),
      projectType: getTextField(formData, "projectType"),
      briefSource: getTextField(formData, "briefSource"),
      summary: getTextField(formData, "summary"),
      consent: getTextField(formData, "consent") === "true",
    });
    const analysis = analyzeRiskCheckSubmission(parsed);

    const submission = await persistRiskCheckSubmission(
      parsed,
      attachment,
      analysis,
      options,
    );

    return {
      ok: true,
      status: 201,
      submission,
      preview: createRiskCheckAnalysisPreview(analysis),
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        status: 400,
        code: "invalid_payload",
        message: "Please fix the highlighted fields and try again.",
        fieldErrors: formatZodErrors(error),
        cause: error,
      };
    }

    return {
      ok: false,
      status: 500,
      code: "storage_failed",
      message:
        "We could not save this Scope Risk Check submission. Please retry in a moment.",
      cause: error,
    };
  }
}
