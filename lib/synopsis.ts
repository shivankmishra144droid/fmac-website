export const SYNOPSIS_FALLBACK = "A film by FMAC, BITS Goa.";
export const MIN_SYNOPSIS_LENGTH = 20;

/** Decode common HTML entities from YouTube API descriptions. */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)));
}

/** Strip leading emoji, hashtags, and URLs from the start of a paragraph. */
export function stripLeadingNoise(text: string): string {
  let out = text.trim();
  let prev = "";

  while (out !== prev) {
    prev = out;
    out = out
      .replace(/^[\s\u200d\uFE0F]+/, "")
      .replace(/^(?:https?:\/\/\S+\s*)/i, "")
      .replace(/^(?:www\.\S+\s*)/i, "")
      .replace(/^(?:#\S+\s*)+/, "")
      .replace(
        /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]+\s*/u,
        ""
      );
  }

  return out.trim();
}

/** First paragraph only — split on double line-break. */
export function extractFirstParagraph(raw: string): string {
  const normalized = raw.replace(/\r\n/g, "\n");
  const first = normalized.split(/\n\n+/)[0] ?? "";
  return first.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}

export type SynopsisResult = {
  synopsis: string;
  usedFallback: boolean;
};

/** Build a clean synopsis from a raw YouTube description. */
export function buildSynopsis(rawDescription: string | null | undefined): SynopsisResult {
  if (!rawDescription?.trim()) {
    return { synopsis: SYNOPSIS_FALLBACK, usedFallback: true };
  }

  let paragraph = extractFirstParagraph(decodeHtmlEntities(rawDescription));
  paragraph = stripLeadingNoise(paragraph);

  if (paragraph.length < MIN_SYNOPSIS_LENGTH) {
    return { synopsis: SYNOPSIS_FALLBACK, usedFallback: true };
  }

  return { synopsis: paragraph, usedFallback: false };
}

/** First sentence for hero taglines when no manual tagline is set. */
export function firstSentence(text: string, maxLen = 140): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^[^.!?]+[.!?]/);
  if (match) return match[0]!.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen).replace(/\s+\S*$/, "")}…`;
}
