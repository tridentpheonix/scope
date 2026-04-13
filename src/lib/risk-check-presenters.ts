import type { briefSourceTypes, projectTypes } from "./risk-check-schema";

type ProjectType = (typeof projectTypes)[number];
type BriefSource = (typeof briefSourceTypes)[number];

export function getProjectTypeLabel(projectType: ProjectType) {
  switch (projectType) {
    case "brochure-site":
      return "Brochure website";
    case "marketing-redesign":
      return "Marketing website redesign";
    case "webflow-build":
      return "Webflow build";
    case "wordpress-redesign":
      return "WordPress redesign";
    case "other":
      return "Website project";
    default:
      return "Website project";
  }
}

export function getBriefSourceLabel(briefSource: BriefSource) {
  switch (briefSource) {
    case "call-notes":
      return "Call notes";
    case "transcript":
      return "Meeting transcript";
    case "client-brief":
      return "Client brief";
    case "email-thread":
      return "Email thread";
    case "loom-summary":
      return "Loom summary";
    case "other":
      return "Other source";
    default:
      return "Client materials";
  }
}

export function formatDateTimeLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getSummaryPreview(value: string, maxLength = 180) {
  const trimmed = value.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}
