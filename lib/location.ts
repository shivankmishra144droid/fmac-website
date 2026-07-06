import { prisma } from "./prisma";
import type { LocationInfo } from "@prisma/client";

/** Sensible default so the page renders even before the DB is seeded. */
export const DEFAULT_LOCATION: Omit<LocationInfo, "updatedAt"> = {
  id: "default",
  name: "FMAC Screening Room",
  address:
    "Auditorium Complex, BITS Pilani, K.K. Birla Goa Campus, NH-17B, Zuarinagar, Goa 403726, India",
  // Generic campus map embed; replace via the DB / admin later.
  mapEmbedUrl:
    "https://www.google.com/maps?q=BITS+Pilani+KK+Birla+Goa+Campus&output=embed",
  description:
    "Screenings and club meets happen here. Doors open just before showtime. Come early, the good seats fill fast.",
};

/** Fetch the (single-row) location info, falling back to a default. */
export async function getLocationInfo(): Promise<
  Omit<LocationInfo, "updatedAt"> & { updatedAt?: Date }
> {
  try {
    const info = await prisma.locationInfo.findFirst({
      orderBy: { updatedAt: "desc" },
    });
    return info ?? DEFAULT_LOCATION;
  } catch {
    return DEFAULT_LOCATION;
  }
}
