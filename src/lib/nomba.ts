let cachedToken: { baseUrl: string; token: string; expiresAt: number } | null =
  null;

function isProduction(): boolean {
  const url = process.env.NOMBA_BASE_URL || "";
  return !url.includes("sandbox");
}

export async function getNombaToken(): Promise<string> {
  const baseUrl = process.env.NOMBA_BASE_URL || "";

  if (
    cachedToken &&
    cachedToken.baseUrl === baseUrl &&
    Date.now() < cachedToken.expiresAt
  ) {
    return cachedToken.token;
  }
  const accountId = process.env.NOMBA_PARENT_ACCOUNT_ID || "";
  const clientId = isProduction()
    ? process.env.NOMBA_LIVE_CLIENT_ID
    : process.env.NOMBA_TEST_CLIENT_ID;
  const secret = isProduction()
    ? process.env.NOMBA_LIVE_PRIVATE_KEY
    : process.env.NOMBA_TEST_PRIVATE_KEY;
  if (!baseUrl || !accountId || !clientId || !secret) {
    throw new Error("Nomba credentials not configured");
  }

  const res = await fetch(`${baseUrl}/v1/auth/token/issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accountId },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: secret,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`Nomba auth failed: ${res.status} ${await res.text()}`);
  }

  const result = await res.json();
  const token = result?.data?.access_token || result?.access_token;
  if (!token) throw new Error(`Nomba auth: no access_token in response`);

  cachedToken = { baseUrl, token, expiresAt: Date.now() + 55 * 60 * 1000 };
  return token;
}

export function nombaHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    accountId: process.env.NOMBA_SUB_ACCOUNT_ID || "",
    Authorization: `Bearer ${token}`,
  };
}

export async function nombaPost(
  path: string,
  body: unknown,
  baseUrlOverride?: string,
) {
  const token = await getNombaToken();
  const baseUrl = baseUrlOverride || process.env.NOMBA_BASE_URL || "";
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: nombaHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(`Nomba API error ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

export async function nombaGet(path: string, params?: Record<string, string>) {
  const token = await getNombaToken();
  const url = new URL(`${process.env.NOMBA_BASE_URL || ""}${path}`);
  if (params)
    Object.entries(params).forEach(([k, v]) => {
      url.searchParams.set(k, v);
    });
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: nombaHeaders(token),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(`Nomba API error ${res.status}: ${JSON.stringify(data)}`);
  return data;
}
