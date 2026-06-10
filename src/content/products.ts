// Product data — loaded from Keystatic content files (src/content/products/*/index.json)
// Editable via /keystatic admin UI

export interface ProductSpec {
  label: string;
  value: string;
  note?: string;
}

export interface ProductHandpiece {
  name: string;
  tipSize: string;
  depth: string;
  feature: string;
}

export interface Product {
  id: string;
  name: string;
  model: string;
  tagline: string;
  category: "medical-device" | "cosmetic";
  status: "available" | "coming-soon";
  featured?: boolean;

  overview: string;
  description: string;

  // Product images
  images?: {
    main?: string;           // Main product image
    logo?: string;           // Product logo
    gallery?: string[];      // Gallery images
    handpieces?: {           // Handpiece-specific images
      [key: string]: string;
    };
  };

  keyTechnologies: {
    name: string;
    description: string;
  }[];

  indications?: string[];

  specifications?: ProductSpec[];
  handpieces?: ProductHandpiece[];

  certifications?: {
    name: string;
    status: string;
    detail?: string;
  }[];

  clinicalBenefits?: string[];

  differentiators?: {
    feature: string;
    description: string;
  }[];
}

// Load product JSON files at build time (works in both static and SSR)
const productModules = import.meta.glob('./products/*/index.json', { eager: true });

function loadProducts(): Product[] {
  const IMAGE_PREFIX = '/images/products/';

  return Object.entries(productModules)
    .map(([path, mod]) => {
      const data = (mod as any).default || (mod as any);
      const id = path.match(/\/products\/([^/]+)\//)?.[1] || '';

      // Reconstruct handpiece images record from array
      const handpieceImagesRecord: Record<string, string> = {};
      if (data.handpieceImages) {
        for (const item of data.handpieceImages) {
          handpieceImagesRecord[item.key] = item.path;
        }
      }

      return {
        id,
        name: data.name,
        model: data.model,
        tagline: data.tagline,
        category: data.category,
        status: data.status,
        featured: data.featured || false,
        overview: data.overview,
        description: data.description,
        images: {
          main: data.mainImage ? `${IMAGE_PREFIX}${data.mainImage}` : undefined,
          logo: data.logo || undefined,
          gallery: data.gallery || [],
          handpieces: Object.keys(handpieceImagesRecord).length > 0 ? handpieceImagesRecord : undefined,
        },
        keyTechnologies: data.keyTechnologies || [],
        indications: data.indications || undefined,
        specifications: data.specifications || undefined,
        handpieces: data.handpieces?.length > 0 ? data.handpieces : undefined,
        certifications: data.certifications?.length > 0 ? data.certifications : undefined,
        clinicalBenefits: data.clinicalBenefits?.length > 0 ? data.clinicalBenefits : undefined,
        differentiators: data.differentiators?.length > 0 ? data.differentiators : undefined,
      } as Product;
    })
    // Maintain canonical product order
    .sort((a, b) => {
      const order = ['torr-rf', 'ulblanc', 'newchae-shot', 'lumino-wave'];
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      return (ia >= 0 ? ia : 999) - (ib >= 0 ? ib : 999);
    });
}

export const products: Product[] = loadProducts();

// Product Categories
export const productCategories = [
  {
    id: "medical-device",
    name: "Medical Devices",
    description: "MFDS-certified professional aesthetic medical devices",
  },
  {
    id: "cosmetic",
    name: "Medical Cosmetics",
    description: "Professional-grade home beauty devices",
  },
] as const;

// Get product by ID
export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

// Get products by category
export function getProductsByCategory(category: Product["category"]): Product[] {
  return products.filter(p => p.category === category);
}

// Get featured products
export function getFeaturedProducts(): Product[] {
  return products.filter(p => p.featured);
}

// Get available products
export function getAvailableProducts(): Product[] {
  return products.filter(p => p.status === "available");
}
