#!/usr/bin/env python3
"""
Send test webhook events to the Nomba webhook endpoint.

Usage:
  # Payment success (matches a VA account_number + triggers reconciliation)
  python3 scripts/test-webhook.py payment_success

  # Payout success (updates payout_txns + cycle status to paid_out)
  python3 scripts/test-webhook.py payout_success

  # Payout failed (updates payout_txns + cycle status to settling)
  python3 scripts/test-webhook.py payout_failed

  # Custom URL
  WEBHOOK_URL="http://localhost:3000/api/v1/webhooks/nomba" python3 scripts/test-webhook.py payment_success
"""

import json
import os
import time
import hmac
import hashlib
import base64
import urllib.request
import sys

WEBHOOK_URL = os.environ.get(
    "WEBHOOK_URL",
    "https://rex-esusu.vercel.app/api/v1/webhooks/nomba",
)

WEBHOOK_SECRET = os.environ.get(
    "WEBHOOK_SECRET",
    "NombaHackathon2026",
)

EVENT_TYPES = {
    "payment_success": {
        "event_type": "payment_success",
        "data": {
            "merchant": {
                "userId": "f666ef9b-888e-4799-85ce-acb505b28023",
                "walletId": "ec722f9d-2eff-416b-b549-06c6d4befe59",
            },
            "transaction": {
                "transactionId": f"txn_{int(time.time())}",
                "type": "credit",
                "time": f"{int(time.time())}000",
                "responseCode": "00",
                "aliasAccountNumber": "3617155860",
                "aliasAccountName": "Nomba/Test User",
                "aliasAccountReference": "test_user_ref",
                "transactionAmount": 100000,
                "narration": "CONTRIB_TEST_123",
                "fee": 0,
            },
            "customer": {
                "bankCode": "000001",
                "senderName": "Test User",
                "bankName": "Test Bank",
                "accountNumber": "1234567890",
            },
        },
    },
    "payout_success": {
        "event_type": "payout_success",
        "data": {
            "merchant": {
                "userId": "f666ef9b-888e-4799-85ce-acb505b28023",
                "walletId": "ec722f9d-2eff-416b-b549-06c6d4befe59",
            },
            "transaction": {
                "transactionId": f"txn_{int(time.time())}",
                "type": "debit",
                "time": f"{int(time.time())}000",
                "responseCode": "00",
                "merchantTxRef": "WITHDRAW_TEST_123",
                "transactionRef": "nomba_ref_123",
                "amount": 100000,
                "status": "success",
            },
        },
    },
    "payout_failed": {
        "event_type": "payout_failed",
        "data": {
            "merchant": {
                "userId": "f666ef9b-888e-4799-85ce-acb505b28023",
                "walletId": "ec722f9d-2eff-416b-b549-06c6d4befe59",
            },
            "transaction": {
                "transactionId": f"txn_{int(time.time())}",
                "type": "debit",
                "time": f"{int(time.time())}000",
                "responseCode": "02",
                "merchantTxRef": "WITHDRAW_TEST_123",
                "transactionRef": "nomba_ref_123",
                "amount": 100000,
                "status": "failed",
            },
        },
    },
}


def build_signature(payload: dict, timestamp: str) -> str:
    data = payload.get("data", {})
    merchant = data.get("merchant", {})
    transaction = data.get("transaction", {})

    response_code = transaction.get("responseCode", "")
    if response_code == "null":
        response_code = ""

    sig_parts = [
        payload.get("event_type", ""),
        payload.get("requestId", ""),
        merchant.get("userId", ""),
        merchant.get("walletId", ""),
        transaction.get("transactionId", ""),
        transaction.get("type", ""),
        transaction.get("time", ""),
        response_code,
        timestamp,
    ]
    sig_string = ":".join(sig_parts)
    digest = hmac.new(
        WEBHOOK_SECRET.encode(),
        sig_string.encode(),
        hashlib.sha256,
    ).digest()
    return base64.b64encode(digest).decode()


def send_webhook(event_type: str):
    if event_type not in EVENT_TYPES:
        print(f"Unknown event type: {event_type}")
        print(f"Available: {', '.join(EVENT_TYPES.keys())}")
        sys.exit(1)

    timestamp = f"{int(time.time())}000"
    payload = dict(EVENT_TYPES[event_type])
    payload["requestId"] = f"test_{event_type}_{int(time.time())}"

    signature = build_signature(payload, timestamp)
    body = json.dumps(payload)

    print(f"=== Sending {event_type} webhook ===")
    print(f"URL:        {WEBHOOK_URL}")
    print(f"RequestId:  {payload['requestId']}")
    print(f"Signature:  {signature}")
    print(f"Timestamp:  {timestamp}")
    print(f"Payload:\n{json.dumps(payload, indent=2)}")
    print()

    req = urllib.request.Request(
        WEBHOOK_URL,
        data=body.encode(),
        headers={
            "Content-Type": "application/json",
            "nomba-signature": signature,
            "nomba-timestamp": timestamp,
        },
    )

    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Response ({resp.status}):")
            print(json.dumps(json.loads(resp.read()), indent=2))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error ({e.code}):")
        print(e.read().decode())


if __name__ == "__main__":
    event = sys.argv[1] if len(sys.argv) > 1 else "payment_success"
    send_webhook(event)
