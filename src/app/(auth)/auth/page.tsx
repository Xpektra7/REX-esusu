import { PhoneInput } from "@/components/auth/phone-input";

export default function AuthPage() {
  return (
    <div>
      <h1 className="text-xl font-bold">Sign In</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your phone number to continue.
      </p>
      <div className="mt-6">
        <PhoneInput />
      </div>
    </div>
  );
}
