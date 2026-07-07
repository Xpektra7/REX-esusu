import { Shield01Icon } from "hugeicons-react";

export function Security() {
  return (
    <section className="border-b border-border py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-card">
          <Shield01Icon className="size-5 text-primary" />
        </div>
        <h2 className="mt-4 text-2xl font-bold md:text-3xl">Built on Nomba</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Every user gets their own Nomba virtual account — a real Nigerian bank
          account number provided by a CBN-licensed fintech. All money moves
          through regulated infrastructure.
        </p>
      </div>
    </section>
  );
}
