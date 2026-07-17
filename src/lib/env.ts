const REQUIRED: string[] = [
  "DATABASE_URL",
  "JWT_SECRET",
  "NOMBA_BASE_URL",
  "NOMBA_PARENT_ACCOUNT_ID",
  "NOMBA_LIVE_CLIENT_ID",
  "NOMBA_LIVE_PRIVATE_KEY",
  "NOMBA_WEBHOOK_SECRET",
  "BVN_ENCRYPTION_KEY",
];

const OPTIONAL: string[] = [
  "JWT_EXPIRES_IN",
  "NOMBA_TEST_CLIENT_ID",
  "NOMBA_TEST_PRIVATE_KEY",
  "NOMBA_SUB_ACCOUNT_ID",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_PORT",
  "NODE_ENV",
];

let validated = false;

export function validateEnv(): void {
  if (validated) return;
  const missing = REQUIRED.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
  validated = true;
}

export function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

export function optionalEnv(name: string, fallback: string = ""): string {
  return process.env[name] || fallback;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
