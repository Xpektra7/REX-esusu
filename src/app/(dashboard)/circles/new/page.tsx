"use client";

import { useMutation } from "@tanstack/react-query";
import { InformationCircleIcon, Loading01Icon } from "hugeicons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { createCircleSchema } from "@/lib/validations";

type FormErrors = Partial<Record<string, string>>;

const initial = {
  name: "",
  contributionAmount: 0,
  frequency: "weekly" as const,
  cycleCount: 0,
};

export default function CreateCirclePage() {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<FormErrors>({});

  const mutation = useMutation({
    mutationFn: (data: {
      name: string;
      contributionAmount: number;
      frequency: "weekly" | "monthly";
      cycleCount: number;
    }) => api.circles.create(data),
    onSuccess: (res: { data: { id: string } }) => {
      toast.success("Circle created!");
      router.push(`/circles/${res.data.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create circle");
    },
  });

  function handleChange(field: keyof typeof initial, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createCircleSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    const { defaultResolutionRule: _, ...apiData } = parsed.data;
    mutation.mutate({
      ...apiData,
      contributionAmount: apiData.contributionAmount * 100,
    });
  }

  const freqOptions = [
    { value: "weekly" as const, label: "Weekly" },
    { value: "monthly" as const, label: "Monthly" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Circles", href: "/circles" },
          { label: "New Circle" },
        ]}
      />

      <div>
        <h1 className="text-xl font-bold">Circle Basics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up the foundation for your savings group.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="circleName"
            className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase"
          >
            Circle Name
          </label>
          <Input
            id="circleName"
            placeholder="e.g. Lagos Travelers Savings"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="amount"
            className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase"
          >
            Amount per Member (₦)
          </label>
          <Input
            id="amount"
            type="number"
            min={1}
            placeholder="5000"
            value={form.contributionAmount || ""}
            onChange={(e) =>
              handleChange("contributionAmount", Number(e.target.value))
            }
            aria-invalid={!!errors.contributionAmount}
          />
          <p className="text-xs text-muted-foreground">
            Fixed contribution each cycle
          </p>
          {errors.contributionAmount && (
            <p className="text-sm text-destructive">
              {errors.contributionAmount}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
            Contribution Frequency
          </span>
          <div className="flex gap-2">
            {freqOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleChange("frequency", opt.value)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold tracking-wider transition-colors",
                  form.frequency === opt.value
                    ? "bg-primary text-card-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {errors.frequency && (
            <p className="text-sm text-destructive">{errors.frequency}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="cycleCount"
            className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase"
          >
            Number of Cycles
          </label>
          <Input
            id="cycleCount"
            type="number"
            min={2}
            max={100}
            placeholder="12"
            value={form.cycleCount || ""}
            onChange={(e) => handleChange("cycleCount", Number(e.target.value))}
            aria-invalid={!!errors.cycleCount}
          />
          {errors.cycleCount && (
            <p className="text-sm text-destructive">{errors.cycleCount}</p>
          )}
        </div>

        {/* Tip Card */}
        <Card className="flex gap-3 bg-muted/50 p-4">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <InformationCircleIcon className="size-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
              Quick Tip
            </span>
            <p className="mt-1 text-xs text-muted-foreground">
              Shorter cycles (weekly) keep momentum high. Longer cycles
              (monthly) work better for larger contributions.
            </p>
          </div>
        </Card>

        <Button
          type="submit"
          className="mt-2 w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending && (
            <Loading01Icon className="size-4 animate-spin" />
          )}
          {mutation.isPending ? "Creating..." : "Create Circle"}
        </Button>
      </form>
    </div>
  );
}
