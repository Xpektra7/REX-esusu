import { OtpInput } from "@/components/auth/otp-input";

export default function OtpPage() {
  return (
    <div>
      <h1 className="text-xl font-bold">Verify OTP</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter the code sent to your email.
      </p>
      <div className="mt-6">
        <OtpInput />
      </div>
    </div>
  );
}
