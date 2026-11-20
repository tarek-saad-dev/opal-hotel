import mediaApproval from "@/config/hotel-media.json";

export type HotelImage = {
  src: string;
  alt: string;
  altAr: string;
  origin: "placeholder" | "third-party-reference" | "hotel-approved";
};

type ApprovalPhoto = {
  src: string | null;
  altEn: string | null;
  altAr: string | null;
  rightsConfirmed: boolean;
};
type ApprovalManifest = {
  mode: string;
  approval: {
    approvedBy: string | null;
    approvedOn: string | null;
    licenseEvidence: string | null;
    contentVerified: boolean;
  };
  logo: { src: string | null; rightsConfirmed: boolean };
  photos: Record<"exterior"|"garden"|"roomMain"|"roomSecondary"|"architecture"|"roomDetail", ApprovalPhoto>;
};
const official = mediaApproval as ApprovalManifest;
const photoOrder = ["exterior","garden","roomMain","roomSecondary","architecture","roomDetail"] as const;
const mediaRoot="/media/hotel/";
const safeLocalPath=(value:string|null):value is string=>
  typeof value==="string"
  && value.startsWith(mediaRoot)
  && /^[a-z0-9][a-z0-9._/-]*[.](webp|jpg|jpeg|png)$/.test(value.slice(mediaRoot.length))
  && !value.includes("..") && !value.includes("//");
const safeLogoPath=(value:string|null):value is string=>
  typeof value==="string"
  && value.startsWith(mediaRoot)
  && /^[a-z0-9][a-z0-9._/-]*[.](svg|webp|png)$/.test(value.slice(mediaRoot.length))
  && !value.includes("..") && !value.includes("//");

/**
 * OFFICIAL MEDIA RELEASE GATE
 * A half-complete handoff never silently swaps some mockup photography for
 * actual hotel photos. The whole set activates only after full written approval.
 * CI validates the files, rights, and content with scripts/verify-official-media.mjs.
 */
export const officialMediaActive =
  official.mode==="official"
  && Boolean(official.approval.approvedBy?.trim())
  && Boolean(official.approval.approvedOn?.trim())
  && Boolean(official.approval.licenseEvidence?.trim())
  && official.approval.contentVerified
  && official.logo.rightsConfirmed
  && safeLogoPath(official.logo.src)
  && photoOrder.every(key=>{
    const photo=official.photos[key];
    return photo.rightsConfirmed
      && safeLocalPath(photo.src)
      && Boolean(photo.altEn?.trim())
      && Boolean(photo.altAr?.trim());
  });


/**
 * Until the hotel's own photographs are uploaded through the CMS (or the
 * official manifest is activated), every photo slot shows a neutral brand
 * panel. It is decorative (empty alt) and never presented as a photograph.
 */
export const BRAND_PANEL_SRC="/media/brand-panel.svg";
const placeholderImages: HotelImage[] = Array.from({length:6},()=>({
  src:BRAND_PANEL_SRC,alt:"",altAr:"",origin:"placeholder" as const,
}));



/** One approved slot replaces the matching placeholder only when the
 * complete six-photo, logo, rights and factual-content approval is present. */
export const galleryImages: HotelImage[] = officialMediaActive
  ? placeholderImages.map((_,index)=>{
      const approved=official.photos[photoOrder[index]];
      return {
        src:approved.src!,
        alt:approved.altEn!,
        altAr:approved.altAr!,
        origin:"hotel-approved",
      };
    })
  : placeholderImages;

export function photoAlt(index:number,locale:"en"|"ar"):string {
  return locale==="ar"?galleryImages[index].altAr:galleryImages[index].alt;
}

/**
 * SINGLE PHOTO HANDOFF POINT
 * Populate src/config/hotel-media.json with authorized local hotel assets.
 * Run npm run media:check and npm run media:launch-check before switching
 * mode to official. Hero, gallery, rooms and booking reuse the same photos.
 *
 * The temporary "O" emblem is deliberately NOT represented as the official
 * hotel logo. The verified approval config activates the official logo.
 */
const previewBrand = {
  officialLogoSrc: null as string | null,
  wordmark: "OPAL LEGACY",
  tagline: "LUXOR · EGYPT",
};
export const hotelBrand = {
  ...previewBrand,
  officialLogoSrc: officialMediaActive ? official.logo.src : previewBrand.officialLogoSrc,
};

export const heroScenes = [
  { src: galleryImages[0].src, alt: galleryImages[0].alt, altAr: galleryImages[0].altAr, label: "01" },
  { src: galleryImages[1].src, alt: galleryImages[1].alt, altAr: galleryImages[1].altAr, label: "02" },
  { src: galleryImages[2].src, alt: galleryImages[2].alt, altAr: galleryImages[2].altAr, label: "03" },
] as const;

/** Responsive candidates for remote CDN images; local hotel photos are
 * pre-sized before upload (see docs/HOTEL_MEDIA_HANDOFF.md). */
export function responsivePhotoSrcSet(src: string): string | undefined {
  if (!src.startsWith("https://images.unsplash.com/")) return undefined;
  const image = src.split("?")[0];
  return [420, 800, 1200, 1800, 2200]
    .map(width => `${image}?auto=format&fit=crop&w=${width}&q=77 ${width}w`)
    .join(", ");
}

/** Original listing photo URLs, kept as a reference for the photo handoff. */
export const referencePhotoUrls = [
  "https://opal-legacy.luxor-hotels-eg.com/data/Photos/OriginalPhoto/17490/1749064/1749064282/luxor-opal-legacy-luxor-photo-22.JPEG",
  "https://opal-legacy.luxor-hotels-eg.com/data/Photos/OriginalPhoto/17490/1749037/1749037857/luxor-opal-legacy-luxor-photo-16.JPEG",
  "https://opal-legacy.luxor-hotels-eg.com/data/Photos/OriginalPhoto/17491/1749192/1749192355/luxor-opal-legacy-luxor-photo-5.JPEG",
  "https://opal-legacy.luxor-hotels-eg.com/data/Photos/OriginalPhoto/17490/1749074/1749074920/luxor-opal-legacy-luxor-photo-52.JPEG",
  "https://opal-legacy.luxor-hotels-eg.com/data/Photos/OriginalPhoto/17492/1749236/1749236351/luxor-opal-legacy-luxor-photo-9.JPEG",
  "https://opal-legacy.luxor-hotels-eg.com/data/Photos/OriginalPhoto/17490/1749037/1749037748/luxor-opal-legacy-luxor-photo-27.JPEG"
];
// Reference only: not loaded by the site. Use owned, local copies.
