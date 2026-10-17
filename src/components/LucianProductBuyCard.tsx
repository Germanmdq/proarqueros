// Lucian UX/UI Prompt #221 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#221
"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { formatPrice, type Product, type ProductVariant } from "@/lib/catalog";
import "./lucian-product-buy-card.css";

type Props = { product: Product; remainingStock: number; onAdd: (product: Product, variant: ProductVariant) => void };

export function LucianProductBuyCard(props: Props) {
  const [expanded, setExpanded] = useState(false);
  const { product, remainingStock } = props;
  return <>
    <article className="ux u221 u221-preview" data-product-id={product.id}>
      <button className="u221-preview-open" type="button" onClick={() => setExpanded(true)} aria-label={`Ver producto ${product.brand} ${product.name} ${product.audience}`}>
        <div className="u221-ph has-image">{product.image ? <Image src={product.image} alt={product.isReferenceImage ? "Imagen ilustrativa de guantes" : `${product.brand} ${product.name}`} width={450} height={340} sizes="(max-width:700px) 92vw, (max-width:1100px) 45vw, 30vw" unoptimized /> : null}
          <span className="u221-stock-badge">{remainingStock} disponibles</span>
          {product.isReferenceImage ? <span className="u221-reference">Imagen ilustrativa</span> : null}
        </div>
      </button>
      <div className="u221-if"><p className="u221-brand">{product.brand} · {product.audience}</p><h3>{product.name}</h3><div className="u221-pr"><b>{formatPrice(product.price)}</b><span>al contado</span></div><small>{remainingStock > 0 ? `${remainingStock} unidades disponibles` : "Sin unidades disponibles"}</small></div>
      {product.price3Installments ? <div className="u221-finance">3 cuotas de <b>{formatPrice(product.price3Installments / 3)}</b></div> : null}
      <button type="button" className="u221-mb" onClick={() => setExpanded(true)}>Ver producto y variantes</button>
    </article>
    {expanded ? <ProductDialog {...props} onClose={() => setExpanded(false)} /> : null}
  </>;
}

function ProductDialog(props: Props & { onClose: () => void }) {
  const modal = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = modal.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={modal} className="u221 u221-detail" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); props.onClose(); }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) props.onClose();
    }}>
    <button className="u221-detail-close" type="button" aria-label="Cerrar producto" onClick={props.onClose}>Cerrar ×</button>
    <ProductDetails {...props} titleId={titleId} />
  </dialog>;
}

function ProductDetails({ product, remainingStock, onAdd, titleId }: Props & { titleId: string }) {
  const [sheet, setSheet] = useState(false);
  const [gone, setGone] = useState(false);
  const [selected, setSelected] = useState<ProductVariant | null>(null);
  const [added, setAdded] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const mainButton = useRef<HTMLButtonElement>(null);
  const barButton = useRef<HTMLButtonElement>(null);
  const options = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sheetId = useId();
  const optionsTitleId = useId();

  useEffect(() => {
    if (!mainButton.current || !scroller.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      setGone(!entry.isIntersecting);
    }, { root: scroller.current });
    observer.observe(mainButton.current);
    return () => {
      observer.disconnect();
      timers.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!sheet) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => {
      const target = options.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')
        ?? options.current?.querySelector<HTMLButtonElement>('[role="radio"]');
      target?.focus({ preventScroll: true });
    }, reduced ? 0 : 320);
    return () => clearTimeout(timer);
  }, [sheet]);

  function closeSheet() {
    setSheet(false);
    (opener.current ?? mainButton.current)?.focus({ preventScroll: true });
  }

  function openSheet(button: HTMLButtonElement) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setAdded(false);
    opener.current = button;
    setSheet(true);
  }

  function add() {
    if (!selected || added || remainingStock <= 0) return;
    onAdd(product, selected);
    setAdded(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timers.current.push(setTimeout(() => {
      closeSheet();
      timers.current.push(setTimeout(() => {
        setAdded(false);
        setSelected(null);
      }, reduced ? 0 : 450));
    }, reduced ? 600 : 1100));
  }

  return (
    <article className={`ux u221 u221-detail-content${gone || sheet ? " is-bar" : ""}${sheet ? " is-sheet" : ""}`} aria-label={`${product.brand} ${product.name}`}
      onKeyDown={(event) => {
        if (!sheet) return;
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeSheet(); }
        if (event.key === "Tab") {
          const controls = options.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
          if (!controls?.length) return;
          const first = controls[0], last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }}>
      <div className="u221-sc" ref={scroller} tabIndex={0} aria-label={`Ficha de ${product.brand} ${product.name}`} inert={sheet}>
        <div className={`u221-ph${product.image ? " has-image" : ""}`}>
          {product.image
            ? <Image src={product.image} alt={product.isReferenceImage ? `Imagen ilustrativa de guantes para ${product.brand} ${product.name}` : `${product.brand} ${product.name}`} width={600} height={450} sizes="(max-width:650px) 96vw, 600px" unoptimized />
            : null}
          {product.isReferenceImage ? <span className="u221-reference">Imagen ilustrativa</span> : null}
        </div>
        <div className="u221-if">
          <p className="u221-brand">{product.brand} · {product.category} · {product.audience}</p>
          <h3 id={titleId}>{product.name}</h3>
          <div className="u221-pr"><b>{formatPrice(product.price)}</b><span>al contado</span></div>
          <small>{remainingStock > 0 ? `${remainingStock} unidades disponibles` : "Sin unidades disponibles"}</small>
        </div>
        <button ref={mainButton} type="button" className="u221-mb" aria-expanded={sheet} aria-controls={sheetId} onClick={(event) => openSheet(event.currentTarget)}>Elegir variante</button>
        <div className="u221-sx"><h4>Detalles</h4><p>{product.description}</p><p>{product.variantNote}</p><p>Color: {product.color ?? "a confirmar"}.</p></div>
        <div className="u221-sx"><h4>Variantes</h4><p>{product.variantLabel}: {product.variants.map((variant) => variant.label).join(" · ")}</p><p>Los talles de referencia se confirman al consultar.</p></div>
        <div className="u221-sx"><h4>Formas de pago</h4>
          <div className="u221-rv">Contado <b>{formatPrice(product.price)}</b></div>
          {product.price3Installments ? <div className="u221-rv">3 cuotas de <b>{formatPrice(product.price3Installments / 3)}</b><small>Total {formatPrice(product.price3Installments)}</small></div> : null}
          {product.price6Installments ? <div className="u221-rv">6 cuotas de <b>{formatPrice(product.price6Installments / 6)}</b><small>Total {formatPrice(product.price6Installments)}</small></div> : null}
        </div>
      </div>
      <div className="u221-ov" aria-hidden="true" onClick={closeSheet} />
      <div className="u221-br" inert={!gone && !sheet}>
        <div className="u221-rw" inert={sheet} aria-hidden={sheet}>
          <span className="u221-th" aria-hidden="true">{product.brand.slice(0, 2)}</span>
          <div><b>{formatPrice(product.price)}</b><small>Al contado</small></div>
          <button ref={barButton} type="button" className="u221-by" aria-expanded={sheet} aria-controls={sheetId} onClick={(event) => openSheet(event.currentTarget)}>Elegir</button>
        </div>
        <div ref={options} id={sheetId} className="u221-op" role="dialog" aria-labelledby={optionsTitleId} aria-hidden={!sheet} inert={!sheet}>
          <div className="u221-oh"><span id={optionsTitleId}>{product.variantLabel}</span><button type="button" className="u221-x" aria-label="Cerrar opciones" onClick={closeSheet}><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></button></div>
          <div className="u221-ss" role="radiogroup" aria-label={`${product.variantLabel} de ${product.name}`}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const index = product.variants.findIndex((variant) => variant.id === selected?.id);
              const next = event.key === "Home" ? 0 : event.key === "End" ? product.variants.length - 1
                : (Math.max(index, 0) + (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1) + product.variants.length) % product.variants.length;
              setSelected(product.variants[next]);
              event.currentTarget.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
            }}>
            {product.variants.map((variant, index) => <button key={variant.id} type="button" className="u221-sz" role="radio" aria-checked={selected?.id === variant.id} tabIndex={selected ? (selected.id === variant.id ? 0 : -1) : (index === 0 ? 0 : -1)} onClick={() => setSelected(variant)}>{variant.label}</button>)}
          </div>
          <p className="u221-note">{product.color ? `Color ${product.color.toLowerCase()}. ` : "Color a confirmar. "}Consultá disponibilidad.</p>
          <button type="button" className={`u221-ad${added ? " is-ok" : ""}`} disabled={!selected || added || remainingStock <= 0} onClick={add}>
            <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 7.5l2.6 2.6L11 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span aria-live="polite">{added ? "Agregado" : remainingStock <= 0 ? "Sin stock" : selected ? "Agregar al carrito" : "Elegí una variante"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
