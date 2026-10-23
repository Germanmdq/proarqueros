"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { LucianProductBuyCard } from "@/components/LucianProductBuyCard";
import { productStock, type Product, type ProductVariant } from "@/lib/catalog";
import { useLiveProducts } from "@/lib/use-live-products";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const products = useLiveProducts();
  const product = products.find((item) => item.id === params.id);

  if (!product) return <main style={{ padding: "48px 20px", maxWidth: 900, margin: "0 auto" }}><Link href="/">← Volver</Link><h1>Producto no encontrado</h1></main>;

  const add = (_product: Product, _variant: ProductVariant) => {};
  return <main style={{ padding: "28px 20px 64px", maxWidth: 900, margin: "0 auto" }}>
    <Link href="/" style={{ display: "inline-block", marginBottom: 20 }}>← Volver a productos</Link>
    <LucianProductBuyCard product={product} remainingStock={productStock(product)} onAdd={add} initiallyExpanded />
  </main>;
}
