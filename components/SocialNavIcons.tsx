const INSTAGRAM_URL = "https://www.instagram.com/fmac_bitsgoa/";
const YOUTUBE_URL = "https://www.youtube.com/@FilmmakingClubBITSGoa";

type SocialNavIconsProps = {
  className?: string;
};

export function SocialNavIcons({ className = "" }: SocialNavIconsProps) {
  return (
    <div className={`flex items-center gap-4 sm:gap-5 ${className}`}>
      <SocialLink href={INSTAGRAM_URL} label="FMAC on Instagram">
        <InstagramIcon />
      </SocialLink>
      <SocialLink href={YOUTUBE_URL} label="FMAC on YouTube">
        <YoutubeIcon />
      </SocialLink>
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="social-nav-link group"
    >
      {children}
    </a>
  );
}

/** Monotone brand-style Instagram mark — fills with marquee on hover via currentColor. */
function InstagramIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="block"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.427.403a4.92 4.92 0 011.725 1.123 4.92 4.92 0 011.123 1.725c.163.457.349 1.257.403 2.427.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.427a4.92 4.92 0 01-1.123 1.725 4.92 4.92 0 01-1.725 1.123c-.457.163-1.257.349-2.427.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.427-.403a4.92 4.92 0 01-1.725-1.123 4.92 4.92 0 01-1.123-1.725c-.163-.457-.349-1.257-.403-2.427C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.427a4.92 4.92 0 011.123-1.725 4.92 4.92 0 011.725-1.123c.457-.163 1.257-.349 2.427-.403C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.014 7.052.072 5.775.13 4.902.333 4.14.63a6.865 6.865 0 00-2.471 1.608A6.865 6.865 0 00.06 4.709C-.237 5.471-.44 6.344-.498 7.621.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.058 1.277.261 2.15.558 2.912a6.865 6.865 0 001.608 2.471 6.865 6.865 0 002.471 1.608c.762.297 1.635.5 2.912.558C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.277-.058 2.15-.261 2.912-.558a6.865 6.865 0 002.471-1.608 6.865 6.865 0 001.608-2.471c.297-.762.5-1.635.558-2.912.058-1.28.072-1.689.072-4.948s-.014-3.668-.072-4.948c-.058-1.277-.261-2.15-.558-2.912a6.865 6.865 0 00-1.608-2.471A6.865 6.865 0 0019.291.06C18.529-.237 17.656-.44 16.379-.498 15.099-.014 14.69 0 12 0z" />
      <path d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 11-2.881 0 1.44 1.44 0 012.881 0z" />
    </svg>
  );
}

/** Monotone YouTube mark — play bar reads as yellow accent on hover via currentColor. */
function YoutubeIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="block"
    >
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export { INSTAGRAM_URL, YOUTUBE_URL };
