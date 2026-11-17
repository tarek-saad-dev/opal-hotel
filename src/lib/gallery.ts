export type HotelImage = { src: string; alt: string; origin: "design-demo" | "third-party-reference" };

/**
 * Visual prototyping imagery from Unsplash. These are NOT photographs of Opal Legacy.
 * Clearly labelled as illustrative in the hero and project docs. Replace the entire
 * manifest with hotel-owned, approved and locally served photos before launching.
 */
export const galleryImages: HotelImage[] = [
  {src:"https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80",alt:"Illustrative boutique hotel exterior (design preview, not Opal Legacy)",origin:"design-demo"},
  {src:"https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80",alt:"Illustrative landscaped hotel pool (design preview)",origin:"design-demo"},
  {src:"https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",alt:"Illustrative guest bedroom (design preview)",origin:"design-demo"},
  {src:"https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",alt:"Illustrative hotel guest bedroom (design preview)",origin:"design-demo"},
  {src:"https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",alt:"Illustrative resort architecture (design preview)",origin:"design-demo"},
  {src:"https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",alt:"Illustrative hotel suite (design preview)",origin:"design-demo"},
];

/**
 * Old external image URLs are retained as source references only. They are not
 * used in this design preview; rights and availability must be verified.
 */
export const referencePhotoUrls = [
  "https://opal-legacy.luxor-hotels-eg.com/data/Photos/OriginalPhoto/17490/1749064/1749064282/luxor-opal-legacy-luxor-photo-22.JPEG",
  "https://opal-legacy.luxor-hotels-eg.com/data/Photos/OriginalPhoto/17490/1749037/1749037857/luxor-opal-legacy-luxor-photo-16.JPEG",
  "https://opal-legacy.luxor-hotels-eg.com/data/Photos/OriginalPhoto/17491/1749192/1749192355/luxor-opal-legacy-luxor-photo-5.JPEG",
  "https://opal-legacy.luxor-hotels-eg.com/data/Photos/OriginalPhoto/17490/1749074/1749074920/luxor-opal-legacy-luxor-photo-52.JPEG",
  "https://opal-legacy.luxor-hotels-eg.com/data/Photos/OriginalPhoto/17492/1749236/1749236351/luxor-opal-legacy-luxor-photo-9.JPEG",
  "https://opal-legacy.luxor-hotels-eg.com/data/Photos/OriginalPhoto/17490/1749037/1749037748/luxor-opal-legacy-luxor-photo-27.JPEG"
];
// Replace with owned, local copies before production. Never imply demo imagery is of the hotel.
