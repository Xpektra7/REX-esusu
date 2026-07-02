import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyPayment } from "./reconciliation";

// ---------------------------------------------------------------------------
// Classification tests (pure function, no DB needed)
// ---------------------------------------------------------------------------
describe("classifyPayment", () => {
  const expected = 10000;

  it("exact — ratio = 1.0", () => {
    assert.equal(classifyPayment(10000, expected), "exact");
  });

  it("exact — ratio ~1.0 within tolerance", () => {
    assert.equal(classifyPayment(10001, expected), "exact");
  });

  it("exact — large amounts and boundary", () => {
    assert.equal(classifyPayment(500000, 500000), "exact");
    assert.equal(classifyPayment(1, 1), "exact");
  });

  it("underpayment — ratio 0.5–0.99", () => {
    assert.equal(classifyPayment(5000, expected), "underpayment");
    assert.equal(classifyPayment(7500, expected), "underpayment");
    assert.equal(classifyPayment(9900, expected), "underpayment");
  });

  it("underpayment — ratio = 0.5 (edge)", () => {
    assert.equal(classifyPayment(5000, expected), "underpayment");
  });

  it("underpayment — ratio = 0.99 (edge)", () => {
    assert.equal(classifyPayment(9900, expected), "underpayment");
  });

  it("overpayment — ratio 1.01–1.5", () => {
    assert.equal(classifyPayment(10100, expected), "overpayment");
    assert.equal(classifyPayment(12500, expected), "overpayment");
    assert.equal(classifyPayment(15000, expected), "overpayment");
  });

  it("overpayment — ratio = 1.01 (edge)", () => {
    assert.equal(classifyPayment(10100, expected), "overpayment");
  });

  it("overpayment — ratio = 1.5 (edge)", () => {
    assert.equal(classifyPayment(15000, expected), "overpayment");
  });

  it("misdirected — ratio < 0.5", () => {
    assert.equal(classifyPayment(4999, expected), "misdirected");
    assert.equal(classifyPayment(1000, expected), "misdirected");
    assert.equal(classifyPayment(0, expected), "misdirected");
  });

  it("misdirected — ratio > 1.5", () => {
    assert.equal(classifyPayment(15001, expected), "misdirected");
    assert.equal(classifyPayment(20000, expected), "misdirected");
  });

  it("misdirected — expected is 0 or negative", () => {
    assert.equal(classifyPayment(1000, 0), "misdirected");
    assert.equal(classifyPayment(1000, -1), "misdirected");
  });

  it("misdirected — actual is 0", () => {
    assert.equal(classifyPayment(0, 10000), "misdirected");
  });

  it("misdirected — actual is negative", () => {
    assert.equal(classifyPayment(-100, 10000), "misdirected");
  });
});
