import { PinInput } from "@/components/auth/pin-input";

export default function PinPage() {
  return (
    <div>
      <h1 className="text-xl font-bold">Set Your PIN</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a 4-6 digit PIN to secure your account.
      </p>
      <div className="mt-6">
        <PinInput />
      </div>
    </div>
  );
}
