"use client";

export function PhoneInput() {
  return (
    <form className="space-y-4">
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium">
          Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          placeholder="080 1234 5678"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground"
      >
        Send OTP
      </button>
    </form>
  );
}
