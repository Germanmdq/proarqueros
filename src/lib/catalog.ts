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

export const products: Product[] = [...rinatCatalog, ...catalog];
export const categories = ["Todo", "Guantes", "Pelotas", "Indumentaria", "Accesorios", "Calzado"];
export const categoryAnchor = (category: string) => `categoria-${category.toLowerCase()}`;
export const productColors = (product: Product) => product.colors?.length ? product.colors : [product.color ?? "A confirmar"];
export const variantPrice = (product: Product, variant: ProductVariant) => variant.price ?? product.price;
export const formatPrice = (price: number) => new Intl.NumberFormat("es-AR", {
  style: "currency", currency: "ARS", maximumFractionDigits: 0,
}).format(price);
