"use client";

export function OtpInput() {
  return (
    <form className="space-y-4">
      <div>
        <label htmlFor="otp" className="mb-1 block text-sm font-medium">
          OTP Code
        </label>
        <input
          id="otp"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground"
      >
        Verify
      </button>
    </form>
  );
}
