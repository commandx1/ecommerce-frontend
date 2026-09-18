export interface FeaturedCategoryAsset {
  image: string
}

export const FEATURED_CATEGORY_FALLBACK_IMAGE = "/categories/_fallback.webp"

export const FEATURED_CATEGORY_FALLBACK: FeaturedCategoryAsset = {
  image: FEATURED_CATEGORY_FALLBACK_IMAGE,
}

// Every top-level category_tree.json root maps to a category photo shown on the featured cards
// and category tiles.
export const FEATURED_CATEGORY_IMAGES: Readonly<Record<string, string>> = {
  Disposables: "/categories/disposables.webp",
  "Infection control - personal products": "/categories/infection-control-personal-products.webp",
  "Cosmetic dentistry products": "/categories/cosmetic-dentistry-products.webp",
  "Endodontic products": "/categories/endodontic-products.webp",
  "Cements, liners & adhesives": "/categories/cements-liners-adhesives.webp",
  Instruments: "/categories/instruments.webp",
  "Burs & diamonds": "/categories/burs-diamonds.webp",
  Preventives: "/categories/preventives.webp",
  "Impression materials": "/categories/impression-materials.webp",
  "Anesthetic products": "/categories/anesthetic-products.webp",
  Equipment: "/categories/equipment.webp",
  Handpieces: "/categories/handpieces.webp",
  "Infection control - clinical products": "/categories/infection-control-clinical-products.webp",
  "Implant related products": "/categories/implant-related-products.webp",
  "Laboratory products": "/categories/laboratory-products.webp",
  "Finishing & polishing products": "/categories/finishing-polishing-products.webp",
  "Core materials": "/categories/core-materials.webp",
  "Evacuation products": "/categories/evacuation-products.webp",
  "CAD CAM products": "/categories/cad-cam-products.webp",
  "Crowns, bands & shells": "/categories/crowns-bands-shells.webp",
  "Rubber dam products": "/categories/rubber-dam-products.webp",
  "Alloys & accessories": "/categories/alloys-accessories.webp",
  "Emergency products": "/categories/emergency-products.webp",
  "Dental health education products": "/categories/dental-health-education-products.webp",
  "Acrylics, reline & tray materials": "/categories/acrylics-reline-tray-materials.webp",
  "Articulating materials & accessories": "/categories/articulating-materials-accessories.webp",
  "Matrix materials & wedges": "/categories/matrix-materials-wedges.webp",
  "Orthodontic products": "/categories/orthodontic-products.webp",
  "Pins & posts": "/categories/pins-posts.webp",
  "Mixing materials": "/categories/mixing-materials.webp",
  "Surgical supplies": "/categories/surgical-supplies.webp",
  "X-Ray products": "/categories/x-ray-products.webp",
  "Retraction materials": "/categories/retraction-materials.webp",
  Waxes: "/categories/waxes.webp",
  "Miscellaneous products": "/categories/miscellaneous-products.webp",
  "Unique gifts": "/categories/unique-gifts.webp",
  "Medical syringes and needles": "/categories/medical-syringes-and-needles.webp",
  "Loupes, magnifiers & headlamps": "/categories/loupes-magnifiers-headlamps.webp",
  "Patient comfort & protection products": "/categories/patient-comfort-protection-products.webp",
  "Office supplies & accessories": "/categories/office-supplies-accessories.webp",
  "Pharmaceutical products": "/categories/pharmaceutical-products.webp",
}

export function getFeaturedCategoryAsset(name: string): FeaturedCategoryAsset {
  const image = Object.hasOwn(FEATURED_CATEGORY_IMAGES, name) ? FEATURED_CATEGORY_IMAGES[name] : undefined
  if (!image) {
    return FEATURED_CATEGORY_FALLBACK
  }
  return { image }
}
