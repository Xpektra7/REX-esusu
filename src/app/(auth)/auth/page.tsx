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

const avatarInitials = [
  { initials: "CO", bg: "bg-blue-100", text: "text-blue-800" },
  { initials: "AA", bg: "bg-green-100", text: "text-green-800" },
  { initials: "TO", bg: "bg-amber-100", text: "text-amber-800" },
];

export default function AuthPage() {
  const router = useRouter();
  const [flow, setFlow] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      name: "",
    },

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
        await api.auth.sendOtp(value.email);

        sessionStorage.setItem("pending_password", password);

        if (flow === "signup") {
          sessionStorage.setItem("pending_name", value.name);
        }
        const params = new URLSearchParams({ email: value.email, flow });

        router.push(`/auth/otp?${params.toString()}`);
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
        <CardTitle className="text-2xl">
          {flow === "login" ? "Welcome back" : "Welcome to Esusu"}
        </CardTitle>

        <CardDescription>
          {flow === "login"
            ? "Enter your email to continue."
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
            <input
              id="password"
              type="password"
              placeholder={
                flow === "signup"
                  ? "At least 8 characters"
                  : "Enter your password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-background px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
              required
              minLength={8}
            />
          </div>

          {flow === "signup" && (
              <form.Field
                name="name"
                children={(field) => (
                  <div>
                    <label
                      htmlFor={field.name}
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
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
                      className="w-full rounded-xl bg-background px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
                    />
                  </div>
                )}
              />
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" size="lg" className="w-full py-4 text-base" disabled={loading}>
            {loading ? "Sending OTP..." : "Continue"}
          </Button>
        </form>
      </CardContent>

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

      {flow === "login" && (
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
      )}
    </Card>
  );
}
