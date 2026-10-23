import { products } from "@/lib/catalog";
import { ProductPageClient } from "./product-page-client";

export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductPageClient id={id} />;
}
