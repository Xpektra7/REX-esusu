"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { createCircleSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loading01Icon, InformationCircleIcon } from "hugeicons-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FormErrors = Partial<Record<string, string>>;

const initial = {
  name: "",
  contribution_amount: 0,
  frequency: "weekly" as const,
  cycle_count: 0,
};

export default function CreateCirclePage() {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<FormErrors>({});

  const mutation = useMutation({
    mutationFn: (data: {
      name: string;
      contribution_amount: number;
      frequency: "weekly" | "monthly";
      cycle_count: number;
    }) => api.circles.create(data),
    onSuccess: (res: { data: { id: string } }) => {
      toast.success("Circle created!");
      router.push(`/circles/${res.data.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create circle");
    },
  });

  function handleChange(
    field: keyof typeof initial,
    value: string | number,
  ) {
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
    const { default_resolution_rule: _, ...apiData } = parsed.data;
    mutation.mutate({
      ...apiData,
      contribution_amount: apiData.contribution_amount * 100,
    });
  }

  const freqOptions = [
    { value: "weekly" as const, label: "Weekly" },
    { value: "monthly" as const, label: "Monthly" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Circle Basics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up the foundation for your savings group.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
            Circle Name
          </label>
          <Input
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
          <label className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
            Amount per Member (₦)
          </label>
          <Input
            type="number"
            min={1}
            placeholder="5000"
            value={form.contribution_amount || ""}
            onChange={(e) =>
              handleChange("contribution_amount", Number(e.target.value))
            }
            aria-invalid={!!errors.contribution_amount}
          />
          <p className="text-xs text-muted-foreground">
            Fixed contribution each cycle
          </p>
          {errors.contribution_amount && (
            <p className="text-sm text-destructive">
              {errors.contribution_amount}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
            Contribution Frequency
          </label>
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
          <label className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
            Number of Cycles
          </label>
          <Input
            type="number"
            min={2}
            max={100}
            placeholder="12"
            value={form.cycle_count || ""}
            onChange={(e) =>
              handleChange("cycle_count", Number(e.target.value))
            }
            aria-invalid={!!errors.cycle_count}
          />
          {errors.cycle_count && (
            <p className="text-sm text-destructive">{errors.cycle_count}</p>
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
