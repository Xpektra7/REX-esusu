import { InstallPrompt } from "@/components/shared/install-prompt";

export function InstallSection() {
  return (
    <section className="border-b border-border py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <InstallPrompt />
      </div>
    </section>
  );
}
