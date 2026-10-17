"use client";

import { useState } from "react";
import { categories, categoryAnchor, products, type CartItem, type Product, type ProductVariant } from "@/lib/catalog";
import { LucianFilterDrawer, emptyFilters, matchesFilters } from "./LucianFilterDrawer";
import { LucianProductBuyCard } from "./LucianProductBuyCard";
import styles from "./product-catalog.module.css";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function ProductCatalog({ items, onAdd }: { items: CartItem[]; onAdd: (product: Product, variant: ProductVariant) => void }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [order, setOrder] = useState("default");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const search = normalize(query.trim());
  const source = products.filter((product) => !search || normalize(`${product.name} ${product.brand} ${product.section}`).includes(search));
  const shown = source.filter((product) => matchesFilters(product, filters)).sort((a, b) => order === "price-asc" ? a.price - b.price : order === "price-desc" ? b.price - a.price : order === "name" ? a.name.localeCompare(b.name, "es") : a.sourceRow - b.sourceRow);
  const quantities = new Map<string, number>();
  for (const item of items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  const grouped = !search && order === "default" && ![filters.categories, filters.brands, filters.sizes, filters.colors, filters.audiences].some((value) => value.length)
    && filters.min === emptyFilters().min && filters.max === emptyFilters().max;

  function card(product: Product) {
    return <LucianProductBuyCard key={product.id} product={product} remainingStock={Math.max(0, product.stock - (quantities.get(product.id) ?? 0))} onAdd={onAdd} />;
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
    {grouped ? categories.filter((category) => category !== "Todo").map((category) => {
      const categoryProducts = shown.filter((product) => product.category === category);
      const expanded = expandedCategories.includes(category);
      return <section key={category} id={categoryAnchor(category)} className={styles.categorySection} aria-labelledby={`${categoryAnchor(category)}-title`}>
        <div className={styles.categoryTitle}><h3 id={`${categoryAnchor(category)}-title`}>{category}</h3><span>{categoryProducts.length} productos</span></div>
        <div className={`${styles.grid} ${styles.seriesGrid}`}>{(expanded ? categoryProducts : categoryProducts.slice(0, 6)).map(card)}</div>
        <div className={styles.categoryFooter}><button type="button" aria-expanded={expanded} aria-label={`${expanded ? "Ver menos" : "Ver todo"} de ${category}`} onClick={() => {
          setExpandedCategories((current) => expanded ? current.filter((value) => value !== category) : [...current, category]);
          if (expanded) document.getElementById(categoryAnchor(category))?.scrollIntoView({ block: "start" });
        }}>{expanded ? `Ver menos ${category.toLowerCase()}` : `Ver todo de ${category.toLowerCase()} (${categoryProducts.length})`} <span aria-hidden="true">{expanded ? "−" : "→"}</span></button></div>
      </section>;
    }) : <div className={styles.grid}>{shown.map(card)}</div>}
    {shown.length === 0 ? <div className={styles.empty}><p>No encontramos productos con esos filtros.</p><button type="button" onClick={() => { setFilters(emptyFilters()); setQuery(""); }}>Ver los {products.length} productos</button></div> : null}
    </div></div>
  </div>;
}
