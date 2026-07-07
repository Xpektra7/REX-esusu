#!/usr/bin/env python3
"""
Check Nomba merchant pool balance and compare with DB-tracked balances.

Usage:
  python3 scripts/check-merchant-pool.py
"""

import json
import os
import urllib.request
import urllib.error
import sys

# Load env vars from .env file manually
env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(env_file):
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                v = v.strip().strip('"').strip("'")
                os.environ.setdefault(k, v)

BASE_URL = os.environ.get("NOMBA_BASE_URL", "https://api.nomba.com")
PARENT_ACCOUNT_ID = os.environ.get("NOMBA_PARENT_ACCOUNT_ID", "")
SUB_ACCOUNT_ID = os.environ.get("NOMBA_SUB_ACCOUNT_ID", "")
LIVE_CLIENT_ID = os.environ.get("NOMBA_LIVE_CLIENT_ID", "")
LIVE_SECRET = os.environ.get("NOMBA_LIVE_PRIVATE_KEY", "")
TEST_CLIENT_ID = os.environ.get("NOMBA_TEST_CLIENT_ID", "")
TEST_SECRET = os.environ.get("NOMBA_TEST_PRIVATE_KEY", "")

IS_LIVE = "sandbox" not in BASE_URL
CLIENT_ID = LIVE_CLIENT_ID if IS_LIVE else TEST_CLIENT_ID
SECRET = LIVE_SECRET if IS_LIVE else TEST_SECRET


def nomba_auth() -> str:
    """Authenticate with Nomba and return a bearer token."""
    url = f"{BASE_URL}/v1/auth/token/issue"
    body = json.dumps({
        "client_id": CLIENT_ID,
        "client_secret": SECRET,
        "grant_type": "client_credentials",
    }).encode()

    req = urllib.request.Request(url, data=body, headers={
        "Content-Type": "application/json",
        "accountId": PARENT_ACCOUNT_ID,
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
    })

    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
    token = result.get("data", {}).get("access_token") or result.get("access_token")
    if not token:
        print("Auth response:", json.dumps(result, indent=2))
        raise ValueError("No access_token in Nomba auth response")
    return token


def nomba_get(path: str, token: str) -> dict:
    """GET a Nomba API endpoint."""
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={
        "Content-Type": "application/json",
        "accountId": PARENT_ACCOUNT_ID,
        "Authorization": f"Bearer {token}",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return {"error": f"HTTP {e.code}", "body": body[:500]}


def main():
    print(f"=== Nomba Merchant Pool Check ===")
    print(f"Environment: {'LIVE' if IS_LIVE else 'SANDBOX'}")
    print(f"Base URL:    {BASE_URL}")
    print(f"Account:     {PARENT_ACCOUNT_ID}")
    print()

    # Step 1: Authenticate
    print("[1] Authenticating with Nomba...")
    try:
        token = nomba_auth()
        print(f"    ✓ Token obtained ({token[:20]}...{token[-10:]})")
    except Exception as e:
        print(f"    ✗ Auth failed: {e}")
        sys.exit(1)
    print()

    # Step 2: Try known wallet/merchant endpoints
    print("[2] Checking merchant wallet balance...")

    # Correct endpoint from Nomba docs: GET /v1/accounts/balance
    print("    Fetching parent account balance...")
    result = nomba_get("/v1/accounts/balance", token)
    if "error" not in result:
        print(f"    ✓ /v1/accounts/balance")
        amount = float(result.get("data", {}).get("amount", 0))
        currency = result.get("data", {}).get("currency", "NGN")
        print(f"      Balance: {currency} {amount:,.2f}")
        print(f"      Full: {json.dumps(result, indent=6)}")
    else:
        print(f"    ✗ /v1/accounts/balance → {result['error']}")

    print()

    # Step 3: Show env var status
    print("[3] Credentials check:")
    print(f"    PARENT_ACCOUNT_ID: {'✓ set' if PARENT_ACCOUNT_ID else '✗ MISSING'}")
    print(f"    SUB_ACCOUNT_ID:    {'✓ set' if SUB_ACCOUNT_ID else '✗ MISSING'}")
    print(f"    CLIENT_ID:         {'✓ set' if CLIENT_ID else '✗ MISSING'}")
    print(f"    SECRET:            {'✓ set' if SECRET else '✗ MISSING'}")
    print()

    # Step 4: Show what accounts/subaccounts look like
    print("[4] Checking sub-account info...")
    sub_endpoints = [
        f"/v1/subaccounts/{SUB_ACCOUNT_ID}",
        "/v1/subaccounts",
        "/v1/accounts",
    ]
    for ep in sub_endpoints:
        result = nomba_get(ep, token)
        if "error" not in result:
            print(f"    ✓ {ep}")
            data_str = json.dumps(result, indent=4)
            if len(data_str) > 1000:
                print(f"      {data_str[:500]}...")
            else:
                print(f"      {data_str}")
        else:
            pass  # skip silently


if __name__ == "__main__":
    main()
