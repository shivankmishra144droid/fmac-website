import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { uniqueSlug } from "../lib/slug";
import {
  channelVideoToMovie,
  findChannelVideo,
  parseYtDlpJsonl,
  priorityOverrideToMovie,
  PRIORITY_FILM_OVERRIDES,
  type ChannelVideo,
} from "../lib/youtube";

const prisma = new PrismaClient();

function loadChannelVideos(): ChannelVideo[] {
  const file = path.join(process.cwd(), "youtube-channel.jsonl");
  if (existsSync(file)) {
    const raw = readFileSync(file, "utf-8");
    const parsed = parseYtDlpJsonl(raw);
    if (parsed.length > 0) return parsed;
  }
  return [
    {
      id: "QqpWt_h96n0",
      title: "Nishachar | Spree '26 | FMaC BITS Goa",
      url: "https://www.youtube.com/watch?v=QqpWt_h96n0",
      duration: 717,
    },
    {
      id: "dJFUC_qrvyg",
      title: "Portrait of My Grandfather - Slice of Life Drama | Short Film | FMaC BITS Goa",
      url: "https://www.youtube.com/watch?v=dJFUC_qrvyg",
      duration: 583,
    },
    {
      id: "fyRWAgOiYwA",
      title: "Bansuri | FMaC BITS Goa",
      url: "https://www.youtube.com/watch?v=fyRWAgOiYwA",
      duration: 1794,
    },
    {
      id: "rECHXAmsubw",
      title: "summer | Filmmaking Club BITS Goa",
      url: "https://www.youtube.com/watch?v=rECHXAmsubw",
      duration: 928,
    },
  ];
}

type MovieSeedData = Omit<Prisma.MovieCreateInput, "slug"> & { slug?: string };

async function upsertMovie(data: MovieSeedData, slugRegistry: Set<string>) {
  const slug =
    data.slug ??
    uniqueSlug(typeof data.title === "string" ? data.title : "film", slugRegistry);
  const payload = { ...data, slug };

  const byYoutube = payload.youtubeId
    ? await prisma.movie.findFirst({ where: { youtubeId: payload.youtubeId } })
    : null;
  const byTitle = await prisma.movie.findFirst({
    where: { title: { equals: payload.title, mode: "insensitive" } },
  });
  const existing = byYoutube ?? byTitle;
  if (existing) {
    slugRegistry.add(existing.slug);
    return prisma.movie.update({
      where: { id: existing.id },
      data: { ...payload, slug: existing.slug },
    });
  }
  return prisma.movie.create({ data: payload });
}

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@fmac.club").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme123";

  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { hashedPassword },
    create: { email: adminEmail, hashedPassword, role: "ADMIN" },
  });
  console.log(`✓ Admin: ${admin.email}`);

  const videos = loadChannelVideos();
  console.log(`✓ Loaded ${videos.length} videos from YouTube channel`);

  await prisma.movie.updateMany({
    where: { isLatestRelease: true },
    data: { isLatestRelease: false },
  });

  const existingSlugs = await prisma.movie.findMany({ select: { slug: true } });
  const slugRegistry = new Set(existingSlugs.map((m) => m.slug));

  let seeded = 0;
  for (let i = 0; i < videos.length; i++) {
    const mapped = channelVideoToMovie(videos[i]!, i);
    if (!mapped) continue;
    await upsertMovie(mapped, slugRegistry);
    seeded += 1;
  }
  console.log(`✓ Seeded ${seeded} films from channel (skipped promos/trailers)`);

  console.log("\nApplying priority film overrides:");
  for (const override of PRIORITY_FILM_OVERRIDES) {
    const matched = findChannelVideo(videos, override.matchKey);
    const data = priorityOverrideToMovie(override, matched);
    await upsertMovie(data, slugRegistry);
    console.log(
      `  • ${override.displayTitle} (${override.releaseYear}) — ${
        matched ? `YouTube matched (${matched.id})` : "manual (no YouTube match)"
      }${override.isLatestRelease ? " [LATEST]" : ""}`
    );
  }

  const latest = await prisma.movie.findFirst({
    where: { title: { equals: "Portrait of My Grandfather", mode: "insensitive" } },
  });
  if (latest) {
    await prisma.movie.updateMany({ data: { isLatestRelease: false } });
    await prisma.movie.update({
      where: { id: latest.id },
      data: { isLatestRelease: true, releaseYear: 2026 },
    });
  }

  const locData = {
    name: "FMAC Screening Room",
    address:
      "Auditorium Complex, BITS Pilani — K.K. Birla Goa Campus, NH-17B, Zuarinagar, Goa 403726, India",
    mapEmbedUrl:
      "https://www.google.com/maps?q=BITS+Pilani+KK+Birla+Goa+Campus&output=embed",
    description:
      "Screenings and club meets happen here. Doors open just before showtime — come early, the good seats fill fast.",
  };
  const existingLoc = await prisma.locationInfo.findFirst();
  if (existingLoc) {
    await prisma.locationInfo.update({ where: { id: existingLoc.id }, data: locData });
  } else {
    await prisma.locationInfo.create({ data: locData });
  }

  const achievements = [
    {
      title: "Spree '26 Premiere",
      year: 2026,
      laurel: "BITS Goa Spree",
      movieTitle: "Portrait of My Grandfather",
      description: "Latest FMAC slice-of-life short premiered in 2026.",
      sortOrder: 0,
    },
    {
      title: "JIFF 2024 — Best Film",
      year: 2024,
      laurel: "Jaipur International Film Festival",
      movieTitle: "Rakshasa",
      description: "Award-winning horror short from FMAC at JIFF 2024.",
      sortOrder: 1,
    },
    {
      title: "IFP Nominee",
      year: 2024,
      laurel: "Independent Filmmaker Project",
      movieTitle: "Zeher",
      description: "Campus thriller nominated at IFP.",
      sortOrder: 2,
    },
  ];

  for (const a of achievements) {
    const existing = await prisma.achievement.findFirst({ where: { title: a.title } });
    if (existing) {
      await prisma.achievement.update({ where: { id: existing.id }, data: a });
    } else {
      await prisma.achievement.create({ data: a });
    }
  }

  const titles = await prisma.movie.findMany({
    select: { title: true, releaseYear: true, isLatestRelease: true },
    orderBy: [{ releaseYear: "desc" }, { title: "asc" }],
    take: 15,
  });
  console.log("\nTop films by release year:");
  titles.forEach((m) =>
    console.log(`  • ${m.title} (${m.releaseYear})${m.isLatestRelease ? " ★ latest" : ""}`)
  );

  console.log(`\nLogin: /admin/login — ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
