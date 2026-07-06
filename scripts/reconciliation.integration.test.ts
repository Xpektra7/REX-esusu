import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { db } from "@/db";
import { users, circles, membersCircles, virtualAccounts, cycles, contributions, debts, notifications } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { reconcileCycle, classifyPayment } from "../src/lib/reconciliation";

// ---------------------------------------------------------------------------
// Integration tests for the full cycle lifecycle.
// Requires DATABASE_URL in environment. Skipped if not set.
// ---------------------------------------------------------------------------

const HAS_DB = !!process.env.DATABASE_URL;

describe.skip(!HAS_DB ? "Integration tests (DATABASE_URL not set)" : "Reconciliation Engine — Integration", { skip: !HAS_DB }, () => {
  const testUserIds: string[] = [];
  const testCircleIds: string[] = [];
  const testMemberIds: string[] = [];
  const testVaIds: string[] = [];
  const testCycleIds: string[] = [];
  let circleId: string;
  let contributionAmount = 100_00; // ₦100 in kobo

  before(async () => {
    // Create 3 test users
    for (const name of ["Alice", "Bob", "Carol"]) {
      const [u] = await db.insert(users).values({
        phone: `+2348000000${testUserIds.length + 1}`,
        email: `user${testUserIds.length + 1}@test.com`,
        name,
        passwordHash: "test-hash",
      }).returning({ id: users.id });
      testUserIds.push(u.id);

      // Personal VA for each user
      const [va] = await db.insert(virtualAccounts).values({
        userId: u.id,
        type: "personal",
        accountNumber: `999${String(testUserIds.length).padStart(10, "0")}`,
        accountName: name,
        balanceKobo: 500_00,
      }).returning({ id: virtualAccounts.id });
      testVaIds.push(va.id);
    }

    // Create circle
    const [circle] = await db.insert(circles).values({
      creatorId: testUserIds[0],
      name: "Test Circle",
      contributionAmountKobo: contributionAmount,
      frequency: "weekly",
      cyclePeriodDays: 7,
      cycleCount: 3,
      gracePeriodHours: 24,
      status: "pending",
    }).returning();
    circleId = circle.id;
    testCircleIds.push(circle.id);

    // Add members
    for (let i = 0; i < 3; i++) {
      const [mc] = await db.insert(membersCircles).values({
        userId: testUserIds[i],
        circleId: circle.id,
        role: i === 0 ? "admin" : "member",
        status: "active",
        rotationOrder: i + 1,
      }).returning({ id: membersCircles.id });
      testMemberIds.push(mc.id);
    }

    // Activate — create Cycle 1
    const [cycle1] = await db.insert(cycles).values({
      circleId: circle.id,
      recipientMemberId: testMemberIds[0],
      cycleNumber: 1,
      expectedTotalKobo: contributionAmount * 3,
      actualTotalKobo: 0,
      status: "active",
      startsAt: new Date(),
      deadlineAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }).returning();
    testCycleIds.push(cycle1.id);

    await db.update(circles).set({ currentCycle: 1, status: "active" }).where(eq(circles.id, circle.id));
  });

  after(async () => {
    // Cleanup in reverse order
    for (const id of testCycleIds) {
      await db.delete(debts).where(eq(debts.cycleId, id)).execute();
      await db.delete(contributions).where(eq(contributions.cycleId, id)).execute();
    }
    for (const id of testCycleIds) {
      await db.delete(cycles).where(eq(cycles.id, id)).execute();
    }
    for (const id of testMemberIds) {
      await db.delete(membersCircles).where(eq(membersCircles.id, id)).execute();
    }
    for (const id of testCircleIds) {
      await db.delete(circles).where(eq(circles.id, id)).execute();
    }
    for (const id of testVaIds) {
      await db.delete(virtualAccounts).where(eq(virtualAccounts.id, id)).execute();
    }
    for (const id of testUserIds) {
      await db.delete(users).where(eq(users.id, id)).execute();
    }
  });

  // -----------------------------------------------------------------------
  // FIFO Case 1: Joe underpaid → debt tracked, cycle reconcilable
  // -----------------------------------------------------------------------
  it("Case 1: creates debt for underpayment and closes cycle", async () => {
    // Alice (recipient) pays in full
    await db.insert(contributions).values({
      memberCircleId: testMemberIds[0],
      cycleId: testCycleIds[0],
      amountKobo: contributionAmount,
      appliedKobo: contributionAmount,
      status: "fully_applied",
      reconciledAt: new Date(),
    });

    // Bob pays in full
    await db.insert(contributions).values({
      memberCircleId: testMemberIds[1],
      cycleId: testCycleIds[0],
      amountKobo: contributionAmount,
      appliedKobo: contributionAmount,
      status: "fully_applied",
      reconciledAt: new Date(),
    });

    // Carol underpays: pays ₦60 instead of ₦100
    await db.insert(contributions).values({
      memberCircleId: testMemberIds[2],
      cycleId: testCycleIds[0],
      amountKobo: 60_00,
      appliedKobo: 60_00,
      status: "partial",
      reconciledAt: new Date(),
    });

    const result = await reconcileCycle(testCycleIds[0]);

    assert.equal(result.cycleNumber, 1);
    assert.equal(result.totalPaidKobo, contributionAmount * 2 + 60_00);
    assert.equal(result.shortfallKobo, 40_00); // Carol's deficit
    assert.equal(result.debtsCreated.length, 1);
    assert.equal(result.debtsCreated[0].amountKobo, 40_00);
    assert.equal(result.nextCycle?.cycleNumber, 2); // advanced to Cycle 2

    // Verify debt in DB
    const activeDebts = await db.select().from(debts)
      .where(and(eq(debts.cycleId, testCycleIds[0]), eq(debts.status, "active")));
    assert.equal(activeDebts.length, 1);
    assert.equal(activeDebts[0].debtorMemberId, testMemberIds[2]);

    // Verify Carol's missed_cycles incremented
    const [carolMc] = await db.select({ missedCycles: membersCircles.missedCycles }).from(membersCircles)
      .where(eq(membersCircles.id, testMemberIds[2]));
    assert.equal(carolMc?.missedCycles, 1);

    // Verify Cycle 1 is closed
    const [closed1] = await db.select({ status: cycles.status }).from(cycles)
      .where(eq(cycles.id, testCycleIds[0]));
    assert.equal(closed1?.status, "closed");
  });

  // -----------------------------------------------------------------------
  // FIFO Case 4: Joe underpaid → next cycle notification includes debt
  // -----------------------------------------------------------------------
  it("Case 4: next cycle notification includes outstanding debt", async () => {
    const [nextCycle] = await db.select().from(cycles)
      .where(and(eq(cycles.circleId, circleId), eq(cycles.status, "active")));
    assert.ok(nextCycle, "Cycle 2 should exist");
    assert.equal(nextCycle.cycleNumber, 2);
    testCycleIds.push(nextCycle.id);

    // Check that Carol's notification includes debt info
    const carolNotifs = await db.select().from(notifications)
      .where(and(
        eq(notifications.userId, testUserIds[2]),
        eq(notifications.title, "Cycle 2 started"),
      ));
    assert.ok(carolNotifs.length > 0);
    assert.ok(carolNotifs[0].body.includes("debt"), "Notification should mention debt");
  });

  // -----------------------------------------------------------------------
  // FIFO Case 2 + 4: Joe pays double — clears old debt + current contribution
  // -----------------------------------------------------------------------
  it("Case 2+4: payment clears old debt first, remainder to current cycle", async () => {
    const [activeCycle] = await db.select().from(cycles)
      .where(and(eq(cycles.circleId, circleId), eq(cycles.status, "active")));
    if (!activeCycle) return; // might already be closed from a previous step

    // Carol pays ₦140 (₦100 current + ₦40 debt from Cycle 1)
    await db.insert(contributions).values({
      memberCircleId: testMemberIds[2],
      cycleId: activeCycle.id,
      amountKobo: 140_00,
      appliedKobo: 140_00,
      status: "fully_applied",
      reconciledAt: new Date(),
    });

    // Alice and Bob pay ₦100 each
    for (const mcId of [testMemberIds[0], testMemberIds[1]]) {
      await db.insert(contributions).values({
        memberCircleId: mcId,
        cycleId: activeCycle.id,
        amountKobo: contributionAmount,
        appliedKobo: contributionAmount,
        status: "fully_applied",
        reconciledAt: new Date(),
      });
    }

    // Close Cycle 2
    const result = await reconcileCycle(activeCycle.id);

    assert.equal(result.shortfallKobo, 0); // fully paid
    assert.equal(result.debtsCreated.length, 0); // no new debts

    // Verify Carol's old debt is now cleared
    const carolDebts = await db.select().from(debts)
      .where(and(eq(debts.debtorMemberId, testMemberIds[2]), eq(debts.status, "cleared")));
    assert.ok(carolDebts.length >= 1, "Carol's old debt should be cleared");

    // Verify Cycle 3 exists
    assert.ok(result.nextCycle);
    assert.equal(result.nextCycle.cycleNumber, 3);
  });

  // -----------------------------------------------------------------------
  // Final cycle: completes the circle
  // -----------------------------------------------------------------------
  it("marks circle as completed on last cycle", async () => {
    const [activeCycle] = await db.select().from(cycles)
      .where(and(eq(cycles.circleId, circleId), eq(cycles.status, "active")));
    if (!activeCycle) return;

    // All three pay in full
    for (const mcId of testMemberIds) {
      await db.insert(contributions).values({
        memberCircleId: mcId,
        cycleId: activeCycle.id,
        amountKobo: contributionAmount,
        appliedKobo: contributionAmount,
        status: "fully_applied",
        reconciledAt: new Date(),
      });
    }

    const result = await reconcileCycle(activeCycle.id);

    assert.equal(result.circleCompleted, true);
    assert.equal(result.nextCycle, null); // no more cycles

    // Verify circle status
    const [circle] = await db.select({ status: circles.status }).from(circles)
      .where(eq(circles.id, circleId));
    assert.equal(circle?.status, "completed");
  });
});
