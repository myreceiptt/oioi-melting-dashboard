export type AppEnv = "sepolia" | "mainnet";

export function getAppEnv(): AppEnv {
  const value = process.env.NEXT_PUBLIC_APP_ENV || "sepolia";

  if (value !== "sepolia" && value !== "mainnet") {
    throw new Error(
      `Invalid NEXT_PUBLIC_APP_ENV="${value}". Expected "sepolia" or "mainnet".`,
    );
  }

  return value;
}

export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}
