import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Profile",
};

export default function LibraryProfilePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 pb-28 text-center">
      <p className="text-sm text-white/50">Profile coming soon.</p>
      <Link href="/" className="mt-4 text-sm text-[#c9a86c] hover:underline">
        Back to Home
      </Link>
    </div>
  );
}
