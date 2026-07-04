import type { AppEnv } from "@/lib/utils/env";

export type GithubActionsWorkflowKind = "boundaryWorker" | "supabaseKeepalive";

export function getGithubActionsWorkflowLabel(
  workflowKind: GithubActionsWorkflowKind,
) {
  return workflowKind === "boundaryWorker"
    ? "Boundary Worker"
    : "Supabase Keepalive";
}

export function createGithubActionsDispatchMessage({
  address,
  appEnv,
  timestamp,
  workflowKind,
}: {
  address: string;
  appEnv: AppEnv;
  timestamp: string;
  workflowKind: GithubActionsWorkflowKind;
}) {
  return [
    "OiOi GitHub Actions Workflow Dispatch",
    "",
    `Workflow: ${workflowKind}`,
    `Environment: ${appEnv}`,
    `Address: ${address}`,
    `Timestamp: ${timestamp}`,
  ].join("\n");
}

export function isGithubActionsWorkflowKind(
  value: unknown,
): value is GithubActionsWorkflowKind {
  return value === "boundaryWorker" || value === "supabaseKeepalive";
}
