"use client";

import { useEffect, useState } from "react";
import { categories, productStock, storeCategories, storeCategoryAnchor, type CartItem, type Product, type ProductVariant } from "@/lib/catalog";
import { LucianFilterDrawer, emptyFilters, matchesFilters } from "./LucianFilterDrawer";
import { LucianProductBuyCard } from "./LucianProductBuyCard";
import styles from "./product-catalog.module.css";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function ProductCatalog({ products, items, onAdd }: { products: Product[]; items: CartItem[]; onAdd: (product: Product, variant: ProductVariant) => void }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [order, setOrder] = useState("default");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    const openRequestedProduct = (event?: Event) => {
      const requestedId = event instanceof CustomEvent ? event.detail?.productId : undefined;
      const id = requestedId ?? new URLSearchParams(window.location.search).get("producto");
      if (!id) return;
      const product = products.find((item) => item.id === id);
      if (!product) return;
      setQuery(product.name);
      setFilters(emptyFilters());
      setOrder("default");
      document.getElementById("coleccion")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => {
        const card = document.querySelector<HTMLElement>(`[data-product-id="${id}"]`);
        card?.scrollIntoView({ behavior: "smooth", block: "center" });
        card?.querySelector<HTMLButtonElement>(".u221-preview-open")?.click();
      }, 350);
    };
    openRequestedProduct();
    window.addEventListener("proarqueros:open-product", openRequestedProduct);
    return () => window.removeEventListener("proarqueros:open-product", openRequestedProduct);
  }, [products]);
  const search = normalize(query.trim());
  const source = products.filter((product) => !search || normalize(`${product.name} ${product.brand} ${product.section}`).includes(search));
  const shown = source.filter((product) => matchesFilters(product, filters)).sort((a, b) => order === "price-asc" ? a.price - b.price : order === "price-desc" ? b.price - a.price : order === "name" ? a.name.localeCompare(b.name, "es") : a.sourceRow - b.sourceRow);
  const quantities = new Map<string, number>();
  for (const item of items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  const grouped = !search && order === "default" && ![filters.categories, filters.brands, filters.sizes, filters.colors, filters.audiences].some((value) => value.length)
    && filters.min === emptyFilters().min && filters.max === emptyFilters().max;

  function card(product: Product) {
    return <LucianProductBuyCard key={product.id} product={product} remainingStock={Math.max(0, productStock(product) - (quantities.get(product.id) ?? 0))} onAdd={onAdd} />;
  }

  return <div className={styles.catalog}>
    <div className={styles.controls}>
      <label>Buscar producto<input type="search" placeholder="Modelo, marca o producto" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <label>Ordenar por<select value={order} onChange={(event) => setOrder(event.target.value)}><option value="default">Destacados</option><option value="name">Nombre A–Z</option><option value="price-asc">Menor precio</option><option value="price-desc">Mayor precio</option></select></label>
    </div>
    <div className={styles.layout}>
    <aside className={styles.sidebar} aria-label="Filtros de categorías"><h3>Filtros</h3><h4>Categoría</h4>{categories.map((category) => <button key={category} type="button" aria-pressed={category === "Todo" ? !filters.categories.length : filters.categories.includes(category)} onClick={() => setFilters((current) => ({ ...current, categories: category === "Todo" ? [] : [category] }))}>{category === "Todo" ? "Todos los productos" : category}<span>{category === "Todo" ? products.length : products.filter((product) => product.category === category).length}</span></button>)}<button className={styles.reset} type="button" onClick={() => { setFilters(emptyFilters()); setQuery(""); }}>Borrar filtros</button><p>Encontrá tu modelo, abrí la ficha y elegí tu talle.</p></aside>
    <div className={styles.results}>
    <LucianFilterDrawer source={source} value={filters} onChange={setFilters} />
    <p className={styles.pricing}>Precios al contado en pesos argentinos. Consultá las opciones de cuotas y talles dentro de cada ficha.</p>
    {grouped ? storeCategories.map((category) => {
      const categoryProducts = shown.filter(category.matches);
      const expanded = expandedCategories.includes(category.name);
      const anchor = storeCategoryAnchor(category.name);
      return <section key={category.name} id={anchor} className={styles.categorySection} aria-labelledby={`${anchor}-title`}>
        <div className={styles.categoryTitle}><div><h3 id={`${anchor}-title`}>{category.name}</h3><p>{category.description}</p></div><span>{categoryProducts.length} productos</span></div>
        {!categoryProducts.length ? <p className={styles.emptyCategory}>Próximamente vas a encontrar productos en esta categoría.</p> : null}
        <div className={`${styles.grid} ${styles.seriesGrid}`}>{(expanded ? categoryProducts : categoryProducts.slice(0, 6)).map(card)}</div>
        {categoryProducts.length > 6 ? <div className={styles.categoryFooter}><button type="button" aria-expanded={expanded} aria-label={`${expanded ? "Ver menos" : "Ver todo"} de ${category.name}`} onClick={() => {
          setExpandedCategories((current) => expanded ? current.filter((value) => value !== category.name) : [...current, category.name]);
          if (expanded) document.getElementById(anchor)?.scrollIntoView({ block: "start" });
        }}>{expanded ? `Ver menos ${category.name.toLowerCase()}` : `Ver todo de ${category.name.toLowerCase()} (${categoryProducts.length})`} <span aria-hidden="true">{expanded ? "−" : "→"}</span></button></div> : null}
      </section>;
    }) : <div className={styles.grid}>{shown.map(card)}</div>}
    {shown.length === 0 ? <div className={styles.empty}><p>No encontramos productos con esos filtros.</p><button type="button" onClick={() => { setFilters(emptyFilters()); setQuery(""); }}>Ver los {products.length} productos</button></div> : null}
    </div></div>
  </div>;
}
