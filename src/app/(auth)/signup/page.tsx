"use client";

import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import { validatePassword } from "@/lib/validations/auth";

function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [initialEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("pending_email") || "";
    }
    return "";
  });

  const form = useForm({
    defaultValues: {
      email: initialEmail,
      firstName: "",
      lastName: "",
    },
    onSubmit: async ({ value }) => {
      setError(null);

      if (!value.firstName.trim() || !value.lastName.trim()) {
        setError("First and last name are required");
        return;
      }

      if (!value.email.trim()) {
        setError("Email is required");
        return;
      }

      const pwError = validatePassword(password);
      if (pwError) {
        setError(pwError);
        return;
      }

      const name = `${value.firstName.trim()} ${value.lastName.trim()}`;

      setLoading(true);
      try {
        await api.auth.sendOtp(value.email);
        sessionStorage.setItem("pending_password", password);
        sessionStorage.setItem("pending_name", name);
        sessionStorage.setItem("pending_email", value.email);
        router.push("/signup/otp");
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
        <CardTitle className="text-2xl">Welcome to Esusu</CardTitle>
        <CardDescription>Enter your details to get started.</CardDescription>
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
          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="firstName"
              children={(field) => (
                <div>
                  <label
                    htmlFor={field.name}
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    First Name
                  </label>
                  <input
                    id={field.name}
                    type="text"
                    placeholder="Chioma"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full rounded-xl bg-background px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
                    required
                  />
                </div>
              )}
            />
            <form.Field
              name="lastName"
              children={(field) => (
                <div>
                  <label
                    htmlFor={field.name}
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    Last Name
                  </label>
                  <input
                    id={field.name}
                    type="text"
                    placeholder="Okafor"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full rounded-xl bg-background px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
                    required
                  />
                </div>
              )}
            />
          </div>

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
            <input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-background px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
              required
              minLength={8}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            size="lg"
            className="w-full py-4 text-base"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Create Account"}
          </Button>
        </form>
      </CardContent>

      <CardContent className="pt-0">
        <Link
          href="/signin"
          className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Already have an account? Sign in
        </Link>
      </CardContent>
    </Card>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
