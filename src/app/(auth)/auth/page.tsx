"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { phoneSchema } from "@/lib/validations";
import { api } from "@/lib/api";

/**
 * Landing page for the auth flow.
 *
 * Shows a phone input (signup also shows name + email).
 * On submit, normalises the phone number, sends OTP, and redirects
 * to /auth/otp with phone, flow, name, and email as query params.
 */
export default function AuthPage() {
  const router = useRouter();
  const [flow, setFlow] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      phone: "",
      name: "",
      email: "",
    },

    onSubmit: async ({ value }) => {
      setError(null);

      // Validate + normalise phone number.
      const result = phoneSchema.safeParse({ phone: value.phone });
      if (!result.success) {
        setError("Enter a valid Nigerian phone number (+234...)");
        return;
      }

      // Use the normalised version (e.g. +2348012345678).
      const phone = result.data.phone;

      try {
        await api.auth.sendOtp(phone);

        // Forward data to the OTP page via query params.
        const params = new URLSearchParams({ phone, flow });
        if (flow === "signup") {
          params.set("name", value.name);
          params.set("email", value.email);
        }

        router.push(`/auth/otp?${params.toString()}`);
      } catch {
        setError("Failed to send OTP. Try again.");
      }
    },
  });

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <Card>
      <CardHeader>
        <CardTitle>{flow === "login" ? "Sign In" : "Create Account"}</CardTitle>
        <CardDescription>
          {flow === "login"
            ? "Enter your phone number to continue."
            : "Enter your details to get started."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* Phone number */}
          <form.Field
            name="phone"
            children={(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="mb-1 block text-sm font-medium"
                >
                  Phone Number
                </label>
                <input
                  id={field.name}
                  type="tel"
                  placeholder="+234 801 234 5678"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            )}
          />

          {/* Name + Email (signup only) */}
          {flow === "signup" && (
            <>
              <form.Field
                name="name"
                children={(field) => (
                  <div>
                    <label
                      htmlFor={field.name}
                      className="mb-1 block text-sm font-medium"
                    >
                      Full Name
                    </label>
                    <input
                      id={field.name}
                      type="text"
                      placeholder="Chioma Okafor"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                )}
              />

              <form.Field
                name="email"
                children={(field) => (
                  <div>
                    <label
                      htmlFor={field.name}
                      className="mb-1 block text-sm font-medium"
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
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                )}
              />
            </>
          )}

          {/* Error message */}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full">
            Send OTP
          </Button>
        </form>
      </CardContent>

      {/* Toggle between login / signup */}
      <CardContent className="pt-0">
        <button
          type="button"
          onClick={() => {
            setFlow(flow === "login" ? "signup" : "login");
            setError(null);
          }}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {flow === "login"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </CardContent>
    </Card>
  );
}
