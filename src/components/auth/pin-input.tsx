"use client";

export function PinInput() {
  return (
    <form className="space-y-4">
      <div>
        <label htmlFor="pin" className="mb-1 block text-sm font-medium">
          Create PIN
        </label>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          maxLength={6}
          placeholder="••••••"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground"
      >
        Set PIN
      </button>
    </form>
  );
}
