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
import Link from "next/link";
import { ViewIcon, ViewOffSlashIcon } from "hugeicons-react";

const avatarInitials = [
  { initials: "CO", bg: "bg-blue-100", text: "text-blue-800" },
  { initials: "AA", bg: "bg-green-100", text: "text-green-800" },
  { initials: "TO", bg: "bg-amber-100", text: "text-amber-800" },
];

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      setError(null);

      if (!value.email.trim()) {
        setError("Enter a valid email address");
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }

      setLoading(true);
      try {
        const res = await api.auth.sendOtp(value.email, password);
        if (res.data.isNewUser) {
          sessionStorage.setItem("pending_email", value.email);
          router.push("/signup");
          return;
        }
        sessionStorage.setItem("pending_password", password);
        sessionStorage.setItem("pending_email", value.email);
        router.push("/signin/otp");
      } catch {
        setError("Failed to send OTP. Try again.");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Card className="relative w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Enter your email to continue.</CardDescription>
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
            name="email"
            children={(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Email
                </label>
                <input
                  id={field.name}
                  type="email"
                  placeholder="chioma@example.com"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full rounded-xl bg-background px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
                  required
                />
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
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-background px-4 py-3.5 pr-11 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
               {showPassword ? <ViewOffSlashIcon className="h-4 w-4" /> : <ViewIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" size="lg" className="w-full py-4 text-base" disabled={loading}>
            {loading ? "Sending OTP..." : "Continue"}
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
                  loading="lazy"
                  decoding="async"
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
