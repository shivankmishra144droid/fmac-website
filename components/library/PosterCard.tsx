"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Movie } from "@prisma/client";
import { formatRuntime, movieCardThumbnail } from "@/lib/youtube";
import { movieHref } from "@/lib/slug";
import { toggleWatchlistId, getWatchlistIds } from "./WatchlistPage";

const EASE_PREMIUM = "cubic-bezier(0.22, 1, 0.36, 1)";

type LandscapeCardProps = {
  movie: Movie;
  awardWinner?: boolean;
  isAajaMarker?: boolean;
  isFreshers?: boolean;
  fluid?: boolean;
};

/**
 * Netflix-style landscape card (16:9).
 * Desktop: hover scale + expanded action panel.
 * Touch: tap navigates directly to film detail.
 */
export function LandscapeCard({
  movie,
  awardWinner,
  isAajaMarker,
  isFreshers,
  fluid,
}: LandscapeCardProps) {
  const router = useRouter();
  const [isTouch, setIsTouch] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [liked, setLiked] = useState(false);

  const thumb = movieCardThumbnail(movie);

  const href = movieHref(movie);
  const showLatest = movie.isLatestRelease;
  const showSelect = movie.isFmacSelect || awardWinner;
  const showAaja = isAajaMarker || movie.isAajaFilm;
  const showFreshers = isFreshers || movie.contentType === "FRESHERS";

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
    setInWatchlist(getWatchlistIds().includes(movie.id));
  }, [movie.id]);

  function onWatchlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleWatchlistId(movie.id);
    setInWatchlist(next.includes(movie.id));
  }

  function onLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLiked((v) => !v);
  }

  function onPlay(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    router.push(href);
  }

  const widthClass = fluid ? "w-full" : "w-[220px] shrink-0 sm:w-[260px]";

  if (isTouch) {
    return (
      <Link href={href} className={`block ${widthClass}`}>
        <CardThumbnail
          thumb={thumb}
          title={movie.title}
          showLatest={showLatest}
          showSelect={showSelect}
          showAaja={showAaja}
          showFreshers={showFreshers}
        />
        <CardMeta movie={movie} />
      </Link>
    );
  }

  return (
    <div className={`group/card relative ${widthClass}`}>
      <div
        className="relative origin-center will-change-transform group-hover/card:z-30 group-hover/card:scale-[1.17] group-hover/card:shadow-[0_22px_48px_rgba(0,0,0,0.58),0_0_32px_rgba(234,179,8,0.14)]"
        style={{
          transition: `transform 320ms ${EASE_PREMIUM}, box-shadow 320ms ${EASE_PREMIUM}`,
        }}
      >
        <CardThumbnail
          thumb={thumb}
          title={movie.title}
          showLatest={showLatest}
          showSelect={showSelect && !showAaja && !showFreshers}
          showAaja={showAaja}
          showFreshers={showFreshers}
        />

        <div
          className="pointer-events-none max-h-0 overflow-hidden opacity-0 group-hover/card:pointer-events-auto group-hover/card:max-h-36 group-hover/card:opacity-100"
          style={{ transition: `max-height 320ms ${EASE_PREMIUM}, opacity 280ms ${EASE_PREMIUM}` }}
        >
          <div className="rounded-b-md bg-[#141414] px-2 pb-3 pt-2.5">
            <div className="mb-2.5 flex items-center gap-2">
              <button
                type="button"
                aria-label="Play"
                onClick={onPlay}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0b0906] transition-transform duration-200 hover:scale-105"
              >
                <PlayIcon />
              </button>
              <CircleButton
                label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                onClick={onWatchlist}
                active={inWatchlist}
              >
                {inWatchlist ? <CheckIcon /> : <PlusIcon />}
              </CircleButton>
              <CircleButton label="Like" onClick={onLike} active={liked}>
                <ThumbsUpIcon filled={liked} />
              </CircleButton>
            </div>
            <CardMeta movie={movie} compact />
          </div>
        </div>
      </div>
    </div>
  );
}

export const PosterCard = LandscapeCard;

function CardThumbnail({
  thumb,
  title,
  showLatest,
  showSelect,
  showAaja,
  showFreshers,
}: {
  thumb: string | null;
  title: string;
  showLatest?: boolean;
  showSelect?: boolean;
  showAaja?: boolean;
  showFreshers?: boolean;
}) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-md bg-[#1a140c]">
      {thumb ? (
        <Image
          src={thumb}
          alt=""
          fill
          sizes="260px"
          className="object-cover transition-transform duration-500 ease-out group-hover/card:scale-[1.02]"
        />
      ) : (
        <div className="flex h-full items-center justify-center p-3 text-center text-xs text-white/30 film-title">
          {title}
        </div>
      )}
      {showAaja && (
        <span className="type-eyebrow absolute left-2 top-2 rounded-sm bg-marquee px-1.5 py-0.5 text-[0.58rem] text-ink">
          Aaja
        </span>
      )}
      {showFreshers && !showAaja && (
        <span className="type-eyebrow absolute left-2 top-2 rounded-sm bg-marquee px-1.5 py-0.5 text-[0.58rem] text-ink">
          Freshers
        </span>
      )}
      {showLatest && !showAaja && !showFreshers && (
        <span className="type-eyebrow absolute left-2 top-2 rounded-sm bg-marquee px-1.5 py-0.5 text-[0.58rem] text-ink">
          Latest
        </span>
      )}
      {showSelect && !showAaja && !showFreshers && !showLatest && (
        <span className="type-eyebrow absolute right-2 top-2 rounded-sm bg-marquee px-1.5 py-0.5 text-[0.58rem] text-ink">
          FMAC Select
        </span>
      )}
    </div>
  );
}

function CardMeta({ movie, compact }: { movie: Movie; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-0.5" : "mt-2 space-y-0.5 px-0.5"}>
      <h3
        className={`line-clamp-1 font-medium leading-snug text-white ${compact ? "text-label" : "text-body"}`}
      >
        {movie.title}
      </h3>
      <p className="type-meta text-caption text-white/45">
        {movie.releaseYear}
        {movie.runtimeSeconds ? ` · ${formatRuntime(movie.runtimeSeconds)}` : ""}
      </p>
    </div>
  );
}

function CircleButton({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${
        active
          ? "border-white/50 bg-white/10 text-white"
          : "border-white/25 text-white/80 hover:border-white/45 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12l4 4L19 6" />
    </svg>
  );
}

function ThumbsUpIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.75}
    >
      <path d="M7 10v12M7 10l-1.6-5.2A1.6 1.6 0 018.9 3H14v7l3 3H7z" strokeLinejoin="round" />
    </svg>
  );
}
