// Lucian UX/UI Prompt #305 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#305
"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { categories, formatPrice, products, type Product } from "@/lib/catalog";
import "./lucian-filter-drawer.css";

const low = Math.min(...products.map((product) => product.price));
const high = Math.max(...products.map((product) => product.price));
const brands = [...new Set(products.map((product) => product.brand))].sort();
const sizes = [...new Set(products.flatMap((product) => product.variants.map((variant) => variant.label)))];
const colors = [...new Set(products.map((product) => product.color ?? "A confirmar"))];
const colorHex: Record<string, string> = { Negro: "#242424", Blanco: "#fff", Naranja: "#ff8c30", Amarillo: "#ecea3a", Rojo: "#dc4b4b", "A confirmar": "#b6baae" };
export type CatalogFilters = { min: number; max: number; categories: string[]; brands: string[]; sizes: string[]; colors: string[]; audiences: string[] };
export const emptyFilters = (): CatalogFilters => ({ min: low, max: high, categories: [], brands: [], sizes: [], colors: [], audiences: [] });
type SelectionKey = "categories" | "brands" | "sizes" | "colors" | "audiences";

export function matchesFilters(product: Product, filter: CatalogFilters) {
  return product.price >= filter.min && product.price <= filter.max
    && (!filter.categories.length || filter.categories.includes(product.category))
    && (!filter.brands.length || filter.brands.includes(product.brand))
    && (!filter.sizes.length || product.variants.some((variant) => filter.sizes.includes(variant.label)))
    && (!filter.colors.length || filter.colors.includes(product.color ?? "A confirmar"))
    && (!filter.audiences.length || filter.audiences.includes(product.audience));
}

export function LucianFilterDrawer({ source, value, onChange }: { source: Product[]; value: CatalogFilters; onChange: (filters: CatalogFilters) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const results = source.filter((product) => matchesFilters(product, draft)).length;
  const appliedCount = source.filter((product) => matchesFilters(product, value)).length;
  const chips = (["categories", "brands", "sizes", "colors", "audiences"] as SelectionKey[]).flatMap((key) => value[key].map((label) => ({ key, label })));
  const priceApplied = value.min !== low || value.max !== high;
  const count = chips.length + Number(priceApplied);

  useEffect(() => {
    const element = dialog.current;
    if (open) {
      element?.showModal();
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = previousOverflow; };
    }
    const timeout = setTimeout(() => element?.close(), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450);
    return () => clearTimeout(timeout);
  }, [open]);

  function close() { setOpen(false); dialog.current?.close(); trigger.current?.focus({ preventScroll: true }); }
  function toggle(key: SelectionKey, label: string) {
    setDraft((current) => ({ ...current, [key]: current[key].includes(label) ? current[key].filter((item) => item !== label) : [...current[key], label] }));
  }
  function changePrice(key: "min" | "max", amount: number) {
    setDraft((current) => ({ ...current, [key]: key === "min" ? Math.max(low, Math.min(amount, current.max)) : Math.min(high, Math.max(amount, current.min)) }));
  }
  function drag(event: PointerEvent<HTMLButtonElement>, key: "min" | "max") {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = track.current?.getBoundingClientRect();
    if (!rect) return;
    const value = low + Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * (high - low);
    changePrice(key, Math.round(value / 500) * 500);
  }
  function priceKeyboard(event: KeyboardEvent<HTMLButtonElement>, key: "min" | "max") {
    const delta = ["ArrowRight", "ArrowUp"].includes(event.key) ? 1000 : ["ArrowLeft", "ArrowDown"].includes(event.key) ? -1000 : 0;
    if (!delta && !["Home", "End"].includes(event.key)) return;
    event.preventDefault();
    changePrice(key, event.key === "Home" ? low : event.key === "End" ? high : draft[key] + delta);
  }

  return <div className={`ux u305${open ? " is-open" : ""}`}>
    <div className="u305-tp"><header><h3>Productos</h3><small aria-live="polite">{appliedCount} de {products.length}</small><button ref={trigger} type="button" className="u305-fb" aria-label="Filtros" aria-expanded={open} onClick={() => { setDraft(value); setOpen(true); }}><svg viewBox="0 0 13 13" aria-hidden="true"><path d="M1.5 3h10M3.5 6.5h6M5.5 10h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>Filtros<i aria-hidden="true" className={`u305-bd${count ? " is-on" : ""}`}>{count}</i></button></header>
      <div className="u305-ac">{chips.map(({ key, label }) => <button type="button" key={`${key}-${label}`} aria-label={`Quitar filtro ${label}`} onClick={() => onChange({ ...value, [key]: value[key].filter((item) => item !== label) })}>{label}<span aria-hidden="true">×</span></button>)}{priceApplied ? <button type="button" aria-label="Quitar filtro de precio" onClick={() => onChange({ ...value, min: low, max: high })}>{formatPrice(value.min)}–{formatPrice(value.max)} <span aria-hidden="true">×</span></button> : null}</div>
    </div>
    <dialog ref={dialog} className="u305-modal" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="u305-sh"><div className="u305-gr" aria-hidden="true" /><header><span id={titleId}>Filtrar productos</span><div><button type="button" className="u305-rs" onClick={() => setDraft(emptyFilters())}>Restablecer</button><button type="button" className="u305-rs" onClick={close} aria-label="Cerrar filtros">Cerrar ×</button></div></header>
        <h5>Precio al contado<span>{formatPrice(draft.min)} – {formatPrice(draft.max)}</span></h5>
        <div ref={track} className="u305-tr"><span className="u305-rg" style={{ left: `${(draft.min - low) / (high - low) * 100}%`, width: `${(draft.max - draft.min) / (high - low) * 100}%` }} />
          {(["min", "max"] as const).map((key) => <button key={key} type="button" className={key === "min" ? "u305-mn" : "u305-mx"} role="slider" aria-label={key === "min" ? "Precio mínimo" : "Precio máximo"} aria-valuemin={low} aria-valuemax={high} aria-valuenow={draft[key]} aria-valuetext={formatPrice(draft[key])} style={{ left: `${(draft[key] - low) / (high - low) * 100}%` }} onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={(event) => drag(event, key)} onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)} onKeyDown={(event) => priceKeyboard(event, key)} />)}
        </div>
        <h5>Categoría</h5><div className="u305-cs">{categories.filter((category) => category !== "Todo").map((label) => <button key={label} type="button" className="u305-sw" aria-pressed={draft.categories.includes(label)} onClick={() => toggle("categories", label)}>{label}</button>)}</div>
        <h5>Marca</h5><div className="u305-cs">{brands.map((label) => <button key={label} type="button" className="u305-sw" aria-pressed={draft.brands.includes(label)} onClick={() => toggle("brands", label)}>{label}</button>)}</div>
        <h5>Línea</h5><div className="u305-cs">{["Adulto", "Junior"].map((label) => <button key={label} type="button" className="u305-sw" aria-pressed={draft.audiences.includes(label)} onClick={() => toggle("audiences", label)}>{label}</button>)}</div>
        <h5>Color</h5><div className="u305-cs">{colors.map((label) => <button key={label} type="button" className="u305-sw" aria-pressed={draft.colors.includes(label)} onClick={() => toggle("colors", label)}><i style={{ background: colorHex[label] }} />{label}</button>)}</div>
        <h5>Talle / variante</h5><div className="u305-zs">{sizes.map((label) => <button key={label} type="button" className="u305-sz" aria-pressed={draft.sizes.includes(label)} onClick={() => toggle("sizes", label)}>{label}</button>)}</div>
        <button type="button" className="u305-ap" disabled={results === 0} onClick={() => { onChange(draft); close(); }}>{results ? <>Mostrar <b key={results} className="is-roll">{results}</b> productos</> : "Sin productos con estos filtros"}</button>
      </div>
    </dialog>
  </div>;
}
