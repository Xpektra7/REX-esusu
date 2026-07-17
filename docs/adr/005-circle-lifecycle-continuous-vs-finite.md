# ADR 005: Circle Lifecycle — Continuous and Finite Modes

**Date:** 2026-07-17

## Context

Previously unclear whether circles should be one-time (auto-delete after completion) or continuous (keep running with new cycles). Real Ajo groups run continuously — they don't disband after one rotation.

## Decision

Circles support two modes:

- **Continuous** (`cycleCount = null`): After the last cycle, a new one auto-starts. Circle persists indefinitely. Members can join/leave at cycle boundaries.
- **Finite** (`cycleCount = N`): After N cycles, circle completes. Members can archive or re-create.

### Key behaviors

- The **circle** entity persists forever (or until admin dissolves) — member history, trust scores, and contributions are preserved
- The **cycle** is one rotation through all members
- A continuous circle auto-starts a new cycle when the previous one completes
- A finite circle shows a "completed" status, members can choose to re-create or archive
- Cycle wrapping logic already handles this — `(nextCycleNumber - 1) % members.length` works for any cycle count

## Consequences

- Continuous circles match real-world Ajo behavior
- No data loss between cycles (trust scores, history preserved)
- Admin can still dissolve a circle at any time
- Finite circles serve goal-specific use cases (wedding, project)
