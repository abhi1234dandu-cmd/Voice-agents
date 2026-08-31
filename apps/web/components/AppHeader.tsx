import Link from "next/link";
import { AudioLines, ChevronRight, ShieldCheck } from "lucide-react";

const navItems = [
  "Product",
  "Industries",
  "Voice Gallery",
  "Hotel Agent",
  "Pricing",
  "Developers",
  "Security",
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071018]/78 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="Votell home"
        >
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[linear-gradient(135deg,#19d3c5,#8b5cf6)] text-graphite-950 shadow-glow">
            <AudioLines aria-hidden="true" size={22} />
          </span>
          <span>
            <span className="block text-lg font-black tracking-normal">
              Votell
            </span>
            <span className="hidden text-xs text-slate-400 sm:block">
              Voice agents for always-on teams
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-6 lg:flex"
          aria-label="Public navigation"
        >
          {navItems.map((item) => (
            <a
              key={item}
              href={
                item === "Hotel Agent"
                  ? "/hotel-reservation-agent"
                  : `/#${item.toLowerCase().replaceAll(" ", "-")}`
              }
              className="text-sm font-semibold text-slate-300 hover:text-white"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/sign-in" className="btn-ghost hidden sm:inline-flex">
            Sign in
          </Link>
          <Link href="/onboarding" className="btn-secondary">
            <ShieldCheck aria-hidden="true" size={18} />
            Get started
            <ChevronRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </header>
  );
}
