import { NextRequest, NextResponse } from "next/server";
import { getAddress, isAddress, verifyMessage } from "viem";
import {
  createGithubActionsDispatchMessage,
  getGithubActionsWorkflowLabel,
  isGithubActionsWorkflowKind,
} from "@/lib/admin/githubActionsDispatch";
import { getAppEnv, getRequiredEnv } from "@/lib/utils/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIGNATURE_AGE_MS = 2 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 30 * 1000;

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function getWorkflowFile({
  appEnv,
  workflowKind,
}: {
  appEnv: "sepolia" | "mainnet";
  workflowKind: "boundaryWorker" | "supabaseKeepalive";
}) {
  if (appEnv === "mainnet") {
    return workflowKind === "boundaryWorker"
      ? "mainnet-boundary-worker.yml"
      : "mainnet-supabase-keepalive.yml";
  }

  return workflowKind === "boundaryWorker"
    ? "boundary-worker.yml"
    : "supabase-keepalive.yml";
}

function assertFreshTimestamp(timestamp: string) {
  const timestampMs = Date.parse(timestamp);

  if (!Number.isFinite(timestampMs)) {
    throw new Error("Invalid workflow dispatch timestamp.");
  }

  const ageMs = Date.now() - timestampMs;

  if (ageMs > MAX_SIGNATURE_AGE_MS) {
    throw new Error("Workflow dispatch signature expired. Please try again.");
  }

  if (ageMs < -MAX_FUTURE_SKEW_MS) {
    throw new Error("Workflow dispatch timestamp is too far in the future.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const appEnv = getAppEnv();
    const workflowKind = payload.workflowKind;
    const address = payload.address;
    const timestamp = payload.timestamp;
    const signature = payload.signature;

    if (!isGithubActionsWorkflowKind(workflowKind)) {
      return jsonResponse(
        {
          ok: false,
          error: "Unsupported GitHub Actions workflow dispatch request.",
        },
        400,
      );
    }

    if (
      typeof address !== "string" ||
      !isAddress(address) ||
      typeof timestamp !== "string" ||
      typeof signature !== "string"
    ) {
      return jsonResponse(
        {
          ok: false,
          error: "Invalid GitHub Actions workflow dispatch payload.",
        },
        400,
      );
    }

    assertFreshTimestamp(timestamp);

    const normalizedAddress = getAddress(address);
    const expectedAdmin = getAddress(getRequiredEnv("DEPLOYER_ADDRESS"));

    if (normalizedAddress !== expectedAdmin) {
      return jsonResponse(
        {
          ok: false,
          error: "Only the configured admin wallet can run GitHub workflows.",
        },
        403,
      );
    }

    const message = createGithubActionsDispatchMessage({
      address: normalizedAddress,
      appEnv,
      timestamp,
      workflowKind,
    });
    const verified = await verifyMessage({
      address: normalizedAddress,
      message,
      signature: signature as `0x${string}`,
    });

    if (!verified) {
      return jsonResponse(
        {
          ok: false,
          error: "Workflow dispatch signature verification failed.",
        },
        403,
      );
    }

    const owner = getRequiredEnv("GITHUB_ACTIONS_REPO_OWNER");
    const repo = getRequiredEnv("GITHUB_ACTIONS_REPO_NAME");
    const ref = process.env.GITHUB_ACTIONS_REF?.trim() || "main";
    const token = getRequiredEnv("GITHUB_ACTIONS_DISPATCH_TOKEN");
    const workflowFile = getWorkflowFile({ appEnv, workflowKind });
    const githubResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ ref }),
      },
    );

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();

      throw new Error(
        `GitHub workflow dispatch failed (${githubResponse.status}): ${errorText}`,
      );
    }

    return jsonResponse({
      ok: true,
      environment: appEnv,
      workflow: workflowFile,
      message: `${appEnv === "mainnet" ? "Mainnet" : "Testnet"} ${getGithubActionsWorkflowLabel(
        workflowKind,
      )} dispatch accepted by GitHub Actions.`,
    });
  } catch (error) {
    console.error(error);

    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected GitHub Actions workflow dispatch API error.",
      },
      500,
    );
  }
}
