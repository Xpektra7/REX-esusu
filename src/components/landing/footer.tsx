import Image from "next/image";
import Link from "next/link";

const productLinks = [
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const legalLinks = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/security", label: "Security" },
];

export function Footer() {
  return (
    <footer className="py-12">
      <div className="landing-container">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/icon-192.svg"
                alt="Esusu"
                width={24}
                height={24}
                className="size-6"
              />
              <span className="text-base font-bold">Esusu</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Digital group savings, built for the Nomba Hackathon.
            </p>
          </div>

          <div className="flex gap-10 sm:gap-16">
            <div className="flex flex-col gap-2">
              <p className="eyebrow text-muted-foreground">Product</p>
              {productLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <p className="eyebrow text-muted-foreground">Legal</p>
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Esusu. Built for the Nomba
            Hackathon.
          </p>
        </div>
      </div>
    </footer>
  );
}
