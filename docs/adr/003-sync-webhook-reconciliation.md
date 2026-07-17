# ADR 003: Synchronous Webhook Reconciliation (No Async Queue)

**Date:** 2026-07-17

## Context

Nomba sends payment webhooks. The reconciliation engine processes them (classify payment, apply FIFO debt clearing, create cycle if complete) and responds to Nomba.

## Decision

- Reconciliation runs **synchronously** in the webhook handler
- Idempotency via `webhook_events` table ensures safe Nomba retries
- Fix N+1 query perf first (batching) to keep latency <200ms
- If scale makes reconciliation >5s even batched, add a queue (Bull/inngest)

## Consequences

- Simpler architecture (no queue infra, no eventual consistency)
- Direct feedback: return `"00"` on success, `"09"` on failure → Nomba retries
- N+1 fix is prerequisite for sync to be viable at scale
