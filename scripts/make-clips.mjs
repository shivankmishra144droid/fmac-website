/**
 * Cut self-hosted video loops from YouTube for the site (see media/clips.config.json).
 *
 *   npm run media:clips            # build anything missing
 *   npm run media:clips -- --force # rebuild everything
 *
 * Needs yt-dlp on PATH; ffmpeg comes from the ffmpeg-static devDependency.
 * Writes public/media/{hero,previews}/… and lib/media-manifest.json (read by the app).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const root = process.cwd();
const force = process.argv.includes("--force");
const config = JSON.parse(readFileSync(path.join(root, "media/clips.config.json"), "utf8"));
const manifestPath = path.join(root, "lib/media-manifest.json");
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, "utf8"))
  : { hero: {}, previews: {} };

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] }).toString();
const kb = (f) => `${Math.round(statSync(f).size / 1024)} KB`;
const url = (id) => `https://www.youtube.com/watch?v=${id}`;

function duration(id) {
  return Number(run("yt-dlp", ["--no-update", "--skip-download", "--print", "%(duration)s", url(id)]).trim());
}

/** Download [start, start+len) at ≤1080p (video only) to a temp file. */
function fetchSegment(id, start, len) {
  const out = path.join(tmpdir(), `fmac-${id}-${start}.mp4`);
  rmSync(out, { force: true });
  run("yt-dlp", [
    "--no-update",
    "-f", "bv*[height<=1080][ext=mp4]/bv*[height<=1080]",
    "--download-sections", `*${start}-${start + len}`,
    "--force-keyframes-at-cuts",
    "--ffmpeg-location", ffmpeg,
    "--remux-video", "mp4",
    "-o", out,
    url(id),
  ]);
  return out;
}

/** Detect letterbox bars so loops are pure picture (cover-fit then never shows black). */
function crop(file) {
  // cropdetect reports on stderr; keep the last (most settled) suggestion.
  const { stderr } = spawnSync(ffmpeg, ["-hide_banner", "-i", file, "-vf", "cropdetect=24:2:0", "-f", "null", "-"], {
    encoding: "utf8",
  });
  const all = String(stderr).match(/crop=\d+:\d+:\d+:\d+/g);
  return all ? all[all.length - 1] : null;
}

const fade = (len) => `fade=t=in:st=0:d=0.4,fade=t=out:st=${(len - 0.4).toFixed(2)}:d=0.4`;

function buildHero({ youtubeId, start, duration: len = 12 }) {
  const dir = path.join(root, "public/media/hero");
  mkdirSync(dir, { recursive: true });
  const base = path.join(dir, youtubeId);
  if (!force && existsSync(`${base}.mp4`) && manifest.hero[youtubeId]) return console.log(`  hero ${youtubeId}: up to date`);

  const s = start ?? Math.round(duration(youtubeId) * 0.35);
  const src = fetchSegment(youtubeId, s, len);
  const c = crop(src);
  const vf = [c, "scale=1600:-2", fade(len)].filter(Boolean).join(",");

  run(ffmpeg, ["-y", "-i", src, "-t", String(len), "-vf", vf, "-an", "-c:v", "libx264", "-crf", "26", "-preset", "slow",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${base}.mp4`]);
  run(ffmpeg, ["-y", "-i", src, "-t", String(len), "-vf", vf, "-an", "-c:v", "libvpx-vp9", "-crf", "38", "-b:v", "0",
    "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", `${base}.webm`]);
  run(ffmpeg, ["-y", "-ss", "1", "-i", src, "-vf", [c, "scale=1600:-2"].filter(Boolean).join(","), "-frames:v", "1",
    "-q:v", "4", `${base}.jpg`]);
  rmSync(src, { force: true });

  manifest.hero[youtubeId] = {
    mp4: `/media/hero/${youtubeId}.mp4`,
    webm: `/media/hero/${youtubeId}.webm`,
    poster: `/media/hero/${youtubeId}.jpg`,
  };
  console.log(`  hero ${youtubeId}: mp4 ${kb(`${base}.mp4`)}, webm ${kb(`${base}.webm`)}`);
}

function buildPreview({ youtubeId, start }) {
  const dir = path.join(root, "public/media/previews");
  mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${youtubeId}.mp4`);
  if (!force && existsSync(out) && manifest.previews[youtubeId]) return console.log(`  preview ${youtubeId}: up to date`);

  const len = 5;
  const s = start ?? Math.round(duration(youtubeId) * 0.35);
  const src = fetchSegment(youtubeId, s, len);
  const c = crop(src);
  const vf = [c, "scale=640:-2", fade(len)].filter(Boolean).join(",");
  run(ffmpeg, ["-y", "-i", src, "-t", String(len), "-vf", vf, "-an", "-c:v", "libx264", "-crf", "28", "-preset", "slow",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);
  rmSync(src, { force: true });

  manifest.previews[youtubeId] = `/media/previews/${youtubeId}.mp4`;
  console.log(`  preview ${youtubeId}: ${kb(out)}`);
}

console.log("Hero loops:");
for (const h of config.hero) {
  try { buildHero(h); } catch (e) { console.error(`  hero ${h.youtubeId} failed:`, String(e.stderr ?? e).slice(-400)); }
}
console.log("Preview loops:");
for (const p of config.previews) {
  try { buildPreview(p); } catch (e) { console.error(`  preview ${p.youtubeId} failed:`, String(e.stderr ?? e).slice(-400)); }
}

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`\nWrote ${path.relative(root, manifestPath)}`);
