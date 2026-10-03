import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Profile",
};

export default function LibraryProfilePage() {
  return (
    <div className="flex min-h-[80svh] flex-col justify-center px-5 pt-28 md:px-24">
      <h1 className="headline text-[clamp(3rem,8vw,8rem)] text-bone">
        Profiles, <span className="italic text-bone/60">soon.</span>
      </h1>
      <Link
        href="/library"
        className="kicker mt-10 inline-flex w-fit items-center gap-3 border border-bone/30 px-5 py-3.5 text-bone transition-colors hover:border-bone"
      >
        ← Back to the library
      </Link>
    </div>
  );
}
