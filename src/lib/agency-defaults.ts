import type { PricingComplexity } from "./risk-check-analysis";
import type { RiskCheckInput } from "./risk-check-schema";

export type AgencyDefaults = {
  depositSchedule: string[];
  revisionRounds: {
    design: number;
    build: number;
    note: string;
  };
  changeOrder: {
    hourlyRateUsd: number;
    minimumHours: number;
    note: string;
  };
  clientFacingTerms: string[];
  internalSummary: string[];
};

function roundToFive(value: number) {
  return Math.round(value / 5) * 5;
}

export function getAgencyDefaults(
  projectType: RiskCheckInput["projectType"],
  complexity: PricingComplexity,
): AgencyDefaults {
  const baseRate =
    complexity === "high" ? 165 : complexity === "medium" ? 145 : 125;
  const projectAdjustment =
    projectType === "wordpress-redesign"
      ? 10
      : projectType === "webflow-build"
        ? 5
        : projectType === "other"
          ? 5
          : 0;

  const hourlyRateUsd = roundToFive(baseRate + projectAdjustment);
  const minimumHours = complexity === "high" ? 2 : 1;
  const depositSchedule =
    complexity === "high"
      ? [
          "40% deposit to start the project",
          "30% due at design signoff",
          "30% due before launch",
        ]
      : complexity === "medium"
        ? [
            "50% deposit to reserve the project slot",
            "25% due at design signoff",
            "25% due before launch",
          ]
        : [
            "50% deposit to start the project",
            "50% due before launch",
          ];

  const revisionRounds =
    projectType === "wordpress-redesign" || complexity === "high"
      ? {
          design: 2,
          build: 2,
          note: "Extra revisions, extra migration passes, or content rework fall into change-order scope.",
        }
      : {
          design: 2,
          build: 1,
          note: "Extra design iterations, post-signoff content changes, or extra QA loops fall into change-order scope.",
        };

  return {
    depositSchedule,
    revisionRounds,
    changeOrder: {
      hourlyRateUsd,
      minimumHours,
      note: `Additional work is billed at $${hourlyRateUsd}/hour with a ${minimumHours}-hour minimum per approved change order.`,
    },
    clientFacingTerms: [
      `Deposit schedule: ${depositSchedule.join("; ")}`,
      `Included revisions: ${revisionRounds.design} design round(s) and ${revisionRounds.build} build / QA round(s)`,
      `Change-order rate: $${hourlyRateUsd}/hour with a ${minimumHours}-hour minimum`,
    ],
    internalSummary: [
      `Use ${depositSchedule.join(", ")} as the default payment structure for this deal.`,
      `Hold revisions to ${revisionRounds.design} design round(s) and ${revisionRounds.build} build / QA round(s).`,
      `Default change-order rate: $${hourlyRateUsd}/hour, ${minimumHours}-hour minimum.`,
    ],
  };
}
