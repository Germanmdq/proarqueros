import catalog from "@/data/products.json";
import rinatCatalog from "@/data/rinat-products.json";

export type ProductVariant = {
  id: string; label: string; color?: string | null; size?: string | null;
  image?: string; price?: number; sourceStock?: number | null; sourceAvailable?: boolean;
};
export type ProductImage = { id: string; src: string; alt: string };
export type Product = {
  id: string;
  sourceRow: number;
  name: string;
  brand: string;
  section: string;
  category: string;
  audience: string;
  price: number;
  price3Installments: number | null;
  price6Installments: number | null;
  description: string;
  image: string | null;
  images?: ProductImage[];
  colors?: string[];
  sourceUrl?: string;
  isReferenceImage: boolean;
  stock: number;
  color: string | null;
  variantLabel: string;
  variantNote: string;
  variants: ProductVariant[];
};

export type CartItem = {
  productId: string;
  variantId: string;
  quantity: number;
};

export const products: Product[] = [...rinatCatalog, ...catalog].map((product) => {
  // Legacy illustrative photos are gloves, never photos of other categories.
  if (product.isReferenceImage && product.category !== "Guantes") {
    return { ...product, image: null, isReferenceImage: false };
  }
  // Some of the imported legacy rows did not carry an audience field. Keep the
  // storefront taxonomy consistent while retaining the original source data.
  const audience = product.audience ?? (/JUNIOR|NIÑ|KIDS/i.test(product.section) ? "Junior" : "Adulto");
  return { ...product, audience };
});
export const categories = ["Todo", "Guantes", "Pelotas", "Indumentaria", "Accesorios", "Calzado"];
export const categoryAnchor = (category: string) => `categoria-${category.toLowerCase()}`;
export type StoreCategory = { name: string; description: string; matches: (product: Product) => boolean };
export const storeCategories: StoreCategory[] = [
  { name: "Guantes adultos", description: "Talles 8 al 11 · por marca", matches: (p) => p.category === "Guantes" && p.audience === "Adulto" },
  { name: "Guantes niños", description: "Talles 4 al 7 · por marca", matches: (p) => p.category === "Guantes" && p.audience === "Junior" },
  { name: "Indumentaria adultos", description: "Talles S a XL", matches: (p) => p.category === "Indumentaria" && p.audience === "Adulto" },
  { name: "Indumentaria niños", description: "Talles 8 a 16", matches: (p) => p.category === "Indumentaria" && p.audience === "Junior" },
  { name: "Accesorios", description: "Protección y entrenamiento", matches: (p) => p.category === "Accesorios" },
  { name: "Pelotas y bolsas", description: "Para cancha y traslados", matches: (p) => p.category === "Pelotas" || /bolso|bolsa/i.test(p.name) },
  { name: "Outlet", description: "Oportunidades disponibles", matches: (p) => /outlet|oferta|liquidaci/i.test(`${p.section} ${p.name}`) },
];
export const storeCategoryAnchor = (category: string) => `categoria-${category.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
export const productColors = (product: Product) => product.colors?.length ? product.colors : [product.color ?? "A confirmar"];
export const variantPrice = (product: Product, variant: ProductVariant) => variant.price ?? product.price;
export const variantStock = (product: Product, variant: ProductVariant) => Math.max(0, variant.sourceStock ?? product.stock);
export const productStock = (product: Product) => product.variants.reduce((total, variant) => total + variantStock(product, variant), 0);
export const formatPrice = (price: number) => new Intl.NumberFormat("es-AR", {
  style: "currency", currency: "ARS", maximumFractionDigits: 0,
}).format(price);
