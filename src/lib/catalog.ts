import catalog from "@/data/products.json";

export type ProductVariant = { id: string; label: string };
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

export const products: Product[] = catalog;
export const categories = ["Todo", "Guantes", "Indumentaria", "Pelotas", "Accesorios", "Calzado"];
export const formatPrice = (price: number) => new Intl.NumberFormat("es-AR", {
  style: "currency", currency: "ARS", maximumFractionDigits: 0,
}).format(price);
