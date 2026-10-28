"use client";
import { useEffect, useState } from "react";
import { products as fallbackProducts, type Product } from "@/lib/catalog";
import { supabase } from "@/lib/supabase";

type DbRow = any;

export function useLiveProducts() {
  const [liveProducts, setLiveProducts] = useState<Product[]>(fallbackProducts);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.from("products").select("id,name,description,audience,price_cash_ars,price_3_installments_ars,price_6_installments_ars,image_url,brands(name),categories(name),product_variants(id,size,color,stock)").eq("active", true).order("name").then(({ data, error }) => {
      if (!active || error || !data?.length) return;
      const mapped = (data as DbRow[]).map((row, index): Product => {
        const brand = Array.isArray(row.brands) ? row.brands[0]?.name : row.brands?.name;
        const category = Array.isArray(row.categories) ? row.categories[0]?.name : row.categories?.name;
        const variants = (row.product_variants ?? []).map((variant: DbRow) => ({ id: variant.id, label: variant.size || "Único", size: variant.size, color: variant.color, sourceStock: variant.stock ?? 0 }));
        const audience = !row.audience || row.audience.toLowerCase() === "unisex" ? "Adulto" : row.audience;
        return { id: row.id, sourceRow: index + 1, name: row.name, brand: brand || "Proarqueros", section: category || "Catálogo", category: category || "Accesorios", audience, price: row.price_cash_ars || 0, price3Installments: row.price_3_installments_ars, price6Installments: row.price_6_installments_ars, description: row.description || "Consultá disponibilidad.", image: row.image_url, isReferenceImage: false, stock: variants.reduce((sum: number, v: any) => sum + (v.sourceStock || 0), 0), color: null, variantLabel: "Talle", variantNote: "Elegí la variante disponible.", variants: variants.length ? variants : [{ id: `${row.id}-unico`, label: "Único", size: "Único", sourceStock: 0 }] };
      });
      setLiveProducts(mapped);
    });
    return () => { active = false; };
  }, []);
  return liveProducts;
}
