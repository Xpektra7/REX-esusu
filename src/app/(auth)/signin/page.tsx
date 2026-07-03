"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import { passwordSchema, phoneSchema } from "@/lib/validations";
import Link from "next/link";

const avatarInitials = [
  { initials: "CO", bg: "bg-blue-100", text: "text-blue-800" },
  { initials: "AA", bg: "bg-green-100", text: "text-green-800" },
  { initials: "TO", bg: "bg-amber-100", text: "text-amber-800" },
];

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const form = useForm({
    defaultValues: { phone: "" },
    onSubmit: async ({ value }) => {
      setError(null);

      const phoneResult = phoneSchema.safeParse({ phone: value.phone });
      if (!phoneResult.success) {
        setError("Enter a valid Nigerian phone number (+234...)");
        return;
      }

      const passwordResult = passwordSchema.safeParse({ password });
      if (!passwordResult.success) {
        setError("Password must be at least 8 characters");
        return;
      }

      const phone = phoneResult.data.phone;

      try {
        await api.auth.sendOtp(phone);
        sessionStorage.setItem("pending_password", password);
        router.push(`/signin/otp?phone=${encodeURIComponent(phone)}`);
      } catch {
        setError("Failed to send OTP. Try again.");
      }
    },
  });

  return (
    <Card className="relative w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Enter your phone number to continue.</CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col gap-5"
        >
          <form.Field
            name="phone"
            children={(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Phone Number
                </label>

                <div className="flex items-center rounded-xl border border-border bg-background px-4 py-3.5 focus-within:ring-2 focus-within:ring-ring transition-all">
                  <div className="flex items-center gap-2 pr-4 border-r border-border">
                    <div className="flex w-6 h-4 overflow-hidden rounded-sm shrink-0">
                      <div className="w-1/3 bg-green-700" />
                      <div className="w-1/3 bg-white" />
                      <div className="w-1/3 bg-green-700" />
                    </div>
                    <span className="text-base font-semibold text-foreground">
                      +234
                    </span>
                  </div>

                  <input
                    id={field.name}
                    type="tel"
                    placeholder="801 234 5678"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:ring-0 px-3 text-base tracking-widest placeholder:tracking-normal placeholder:text-muted-foreground/50 outline-none"
                  />
                </div>
              </div>
            )}
          />

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
              required
              minLength={8}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" size="lg" className="w-full py-4 text-base">
            Continue
          </Button>
        </form>
      </CardContent>

      <CardContent className="pt-0">
        <Link
          href="/signup"
          className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          New here? Create an account
        </Link>
      </CardContent>

      <CardContent className="pt-0 text-center">
        <div className="border-t border-border pt-6">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Trusted by savers across Nigeria
          </p>

          <div className="flex justify-center -space-x-2">
            {avatarInitials.map((a) => (
              <div
                className="size-8 rounded-full overflow-hidden border-2 border-background"
                key={a.initials}
              >
                <img
                  src={`https://api.dicebear.com/10.x/identicon/svg?rowColor=f5c211&backgroundColor=000000&seed=${a.initials}`}
                  alt={a.initials}
                  className="object-cover"
                />
              </div>
            ))}
            <div className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-foreground text-xs font-bold text-primary">
              +4k
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
