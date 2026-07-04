"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SocialNavIcons } from "@/components/SocialNavIcons";

export function LibraryTopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="type-display-heading text-display-sm tracking-display text-white transition-colors hover:text-marquee">
          FMAC
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <SocialNavIcons />
          <button
            type="button"
            aria-label="Search films"
            className="flex h-9 w-9 items-center justify-center border border-white/10 text-white/70 transition hover:border-marquee/50 hover:text-marquee focus-visible:border-marquee focus-visible:text-marquee"
          >
            <SearchIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/library", label: "Library", icon: LibraryIcon },
    { href: "/library/watchlist", label: "Watchlist", icon: WatchlistIcon },
    { href: "/library/profile", label: "Profile", icon: ProfileIcon },
  ];

  return (
    <nav className="fixed inset-x-4 bottom-4 z-50 md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around rounded-full border border-white/10 bg-[#141414]/80 px-2 py-2 shadow-2xl backdrop-blur-xl">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : href === "/library"
                ? pathname === "/library" || (pathname.startsWith("/library/") && !pathname.startsWith("/library/watchlist") && !pathname.startsWith("/library/profile"))
                : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${
                active ? "text-marquee" : "text-white/45 hover:text-white/70"
              }`}
            >
              {active && (
                <span className="absolute inset-1 rounded-full bg-marquee/15 ring-1 ring-marquee/30" aria-hidden />
              )}
              <span className="relative">
                <Icon filled={active} />
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3l9 8v10h-6v-6H9v6H3V11l9-8z" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" />
    </svg>
  );
}

function LibraryIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 4h6v16H4V4zm10 0h6v16h-6V4z" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="4" y="4" width="6" height="16" rx="1" />
      <rect x="14" y="4" width="6" height="16" rx="1" />
    </svg>
  );
}

function WatchlistIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 4h10l1 14-6 4-6-4L7 4z" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M7 4h10l1 14-6 4-6-4L7 4z" />
    </svg>
  );
}

function ProfileIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0H5z" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0114 0" />
    </svg>
  );
}
