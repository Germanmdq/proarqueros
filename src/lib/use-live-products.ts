"use client";
import { useEffect, useState } from "react";
import { products as fallbackProducts, type Product } from "@/lib/catalog";
import { supabase } from "@/lib/supabase";

type DbRow = any;

const normalizeKey = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const fallbackImages = new Map(fallbackProducts.filter((product) => product.image).map((product) => [`${normalizeKey(product.brand)}|${normalizeKey(product.name)}`, product.image!]));
const allowedSizes = (category: string, audience: string) => category === "Guantes"
  ? (audience === "Junior" ? ["4", "5", "6", "7"] : ["8", "9", "10", "11"])
  : category === "Indumentaria"
    ? (audience === "Junior" ? ["8", "10", "12", "14", "16"] : ["XS", "S", "M", "L", "XL"])
    : null;
const sortVariantsByGuide = (variants: DbRow[], guide: string[] | null) => [...variants].sort((a, b) => {
  if (guide) return guide.indexOf(a.size) - guide.indexOf(b.size);
  return String(a.size ?? "").localeCompare(String(b.size ?? ""), "es", { numeric: true });
});

export function useLiveProducts() {
  const [liveProducts, setLiveProducts] = useState<Product[]>(fallbackProducts);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.from("products").select("id,name,description,audience,price_cash_ars,price_3_installments_ars,price_6_installments_ars,image_url,image_url_2,brands(name),categories(name),product_variants(id,size,color,stock)").eq("active", true).order("name").then(({ data, error }) => {
      if (!active || error || !data?.length) return;
      const mapped = (data as DbRow[]).map((row, index): Product => {
        const brand = Array.isArray(row.brands) ? row.brands[0]?.name : row.brands?.name;
        const category = Array.isArray(row.categories) ? row.categories[0]?.name : row.categories?.name;
        const audience = !row.audience || row.audience.toLowerCase() === "unisex" ? "Adulto" : row.audience;
        const guide = allowedSizes(category, audience);
        const variants = sortVariantsByGuide((row.product_variants ?? []).filter((variant: DbRow) => !guide || guide.includes(variant.size)), guide).map((variant: DbRow) => ({ id: variant.id, label: variant.size || "Único", size: variant.size, color: variant.color, sourceStock: variant.stock ?? 0 }));
        const resolvedBrand = brand || "Proarqueros";
        const localImage = fallbackImages.get(`${normalizeKey(resolvedBrand)}|${normalizeKey(row.name)}`) ?? null;
        const mainImage = row.image_url || localImage;
        const images = [mainImage, row.image_url_2].filter(Boolean).map((src, imageIndex) => ({ id: `${row.id}-foto-${imageIndex + 1}`, src, alt: `${resolvedBrand} ${row.name} · foto ${imageIndex + 1}` }));
        return { id: row.id, sourceRow: index + 1, name: row.name, brand: resolvedBrand, section: category || "Catálogo", category: category || "Accesorios", audience, price: row.price_cash_ars || 0, price3Installments: row.price_3_installments_ars, price6Installments: row.price_6_installments_ars, description: row.description || "Consultá disponibilidad.", image: mainImage, images, isReferenceImage: false, stock: variants.reduce((sum: number, v: any) => sum + (v.sourceStock || 0), 0), color: null, variantLabel: variants.some((v: any) => v.size !== "Único") ? "Talle" : "Cantidad", variantNote: "Elegí la variante disponible.", variants: variants.length ? variants : [{ id: `${row.id}-unico`, label: "Único", size: "Único", sourceStock: 0 }] };
      });
      setLiveProducts(mapped);
    });
    return () => { active = false; };
  }, []);
  return liveProducts;
}
