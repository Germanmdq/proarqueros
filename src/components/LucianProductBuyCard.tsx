// Lucian UX/UI Prompt #221 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#221
"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { formatPrice, formatProductPrice, variantPrice, variantStock, type Product, type ProductVariant } from "@/lib/catalog";
import "./lucian-product-buy-card.css";

type Props = { product: Product; remainingStock: number; onAdd: (product: Product, variant: ProductVariant) => void; initialColor?: string; initiallyExpanded?: boolean };

export function LucianProductBuyCard(props: Props) {
  const [expanded, setExpanded] = useState(Boolean(props.initiallyExpanded));
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { product, remainingStock } = props;
  return <>
    <article className="ux u221 u221-preview" data-product-id={product.id}>
      <button className="u221-preview-open" type="button" onClick={() => setExpanded(true)} aria-label={`Ver producto ${product.brand} ${product.name} ${product.audience}`}>
        <div className="u221-ph has-image">{product.image ? <Image src={previewImage ?? product.image} alt={product.isReferenceImage ? "Imagen ilustrativa de guantes" : `${product.brand} ${product.name}`} width={450} height={340} sizes="(max-width:700px) 92vw, (max-width:1100px) 45vw, 30vw" unoptimized /> : null}
          <span className="u221-stock-badge">{remainingStock} disponibles</span>
          {product.isReferenceImage ? <span className="u221-reference">Imagen ilustrativa</span> : null}
        </div>
      </button>
      {product.colors?.length ? <div className="u221-preview-colors" aria-label={`Colores de ${product.name}`}>{product.colors.map((color) => {
        const image = product.variants.find((variant) => variant.color === color)?.image ?? product.image;
        return <button type="button" key={color} aria-label={`Ver color ${color} de ${product.name}`} aria-pressed={(previewImage ?? product.image) === image} onClick={() => setPreviewImage(image ?? null)}>{color}</button>;
      })}</div> : null}
      <div className="u221-if"><p className="u221-brand">{product.brand} · {product.audience}</p><h3>{product.name}</h3><div className="u221-pr"><b>{formatProductPrice(product.price)}</b><span>{product.price > 0 ? "al contado" : ""}</span></div><small>{remainingStock > 0 ? `${remainingStock} unidades disponibles` : "Sin unidades disponibles"}</small></div>
      {product.price3Installments ? <div className="u221-finance">3 cuotas de <b>{formatPrice(product.price3Installments / 3)}</b></div> : null}
      <button type="button" className="u221-mb" onClick={() => setExpanded(true)}>Ver producto y variantes</button>
    </article>
    {expanded ? <ProductDialog {...props} initialColor={product.variants.find((variant) => variant.image === previewImage)?.color ?? undefined} onClose={() => setExpanded(false)} /> : null}
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

function ColorChoices({ product, color, onSelect }: { product: Product; color: string; onSelect: (value: string) => void }) {
  return <div className="u221-color-photos" aria-label={`Colores de ${product.name}`}>{product.colors?.map((value) => {
    const image = product.variants.find((variant) => variant.color === value)?.image ?? product.image;
    return <button key={value} type="button" aria-label={`Color ${value}`} aria-pressed={color === value} onClick={() => onSelect(value)}>
      {image ? <Image src={image} alt={`${product.name} ${value}`} width={72} height={72} unoptimized /> : null}<span>{value}</span>
    </button>;
  })}</div>;
}

function ProductDetails({ product, remainingStock, onAdd, titleId, initialColor }: Props & { titleId: string }) {
  const [sheet, setSheet] = useState(false);
  const [gone, setGone] = useState(false);
  const [selected, setSelected] = useState<ProductVariant | null>(null);
  const [color, setColor] = useState(initialColor ?? product.colors?.[0] ?? "");
  const [activeImage, setActiveImage] = useState(product.variants.find((variant) => variant.color === initialColor)?.image ?? product.image);
  const [added, setAdded] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const mainButton = useRef<HTMLButtonElement>(null);
  const barButton = useRef<HTMLButtonElement>(null);
  const options = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sheetId = useId();
  const optionsTitleId = useId();
  const variants = color ? product.variants.filter((variant) => variant.color === color) : product.variants;
  const hasSizes = product.variants.some((variant) => variant.size);
  const price = selected ? variantPrice(product, selected) : product.price;
  const selectedStock = selected ? variantStock(product, selected) : remainingStock;

  function selectVariant(variant: ProductVariant) {
    setSelected(variant);
    if (variant.image) setActiveImage(variant.image);
  }

  function selectColor(value: string) {
    setColor(value);
    const matching = product.variants.filter((variant) => variant.color === value);
    setSelected(!hasSizes && matching.length === 1 ? matching[0] : null);
    setActiveImage(product.variants.find((variant) => variant.color === value)?.image ?? product.image);
  }

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
    if (!selected || added || selectedStock <= 0) return;
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
    <article className={`ux u221 u221-detail-content${product.colors?.length ? " has-colors" : ""}${gone || sheet ? " is-bar" : ""}${sheet ? " is-sheet" : ""}`} aria-label={`${product.brand} ${product.name}`}
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
          {activeImage
            ? <Image src={activeImage} alt={product.isReferenceImage ? `Imagen ilustrativa de guantes para ${product.brand} ${product.name}` : `${product.brand} ${product.name}${color ? ` · ${color}` : ""}`} width={600} height={450} sizes="(max-width:650px) 96vw, 600px" unoptimized />
            : null}
          {product.isReferenceImage ? <span className="u221-reference">Imagen ilustrativa</span> : null}
        </div>
        {product.images?.length ? <div className="u221-gallery" aria-label={`Fotos de ${product.name}`}>{product.images.map((image, index) => <button key={image.id} type="button" aria-label={`Ver foto ${index + 1} de ${product.name}`} aria-pressed={activeImage === image.src} onClick={() => setActiveImage(image.src)}><Image src={image.src} alt={image.alt} width={72} height={72} unoptimized /></button>)}</div> : null}
        <div className="u221-if">
          <p className="u221-brand">{product.brand} · {product.category} · {product.audience}</p>
          <h3 id={titleId}>{product.name}</h3>
          <div className="u221-pr"><b>{formatProductPrice(price)}</b><span>{price > 0 ? "al contado" : ""}</span></div>
          <small>{remainingStock > 0 ? `${remainingStock} unidades disponibles` : "Sin unidades disponibles"}</small>
        </div>
        {product.colors?.length ? <div className="u221-color-picker"><h4>Color: {color}</h4><ColorChoices product={product} color={color} onSelect={selectColor} /></div> : null}
        <button ref={mainButton} type="button" className="u221-mb" aria-expanded={sheet} aria-controls={sheetId} onClick={(event) => openSheet(event.currentTarget)}>Elegir variante</button>
        <div className="u221-sx"><h4>Detalles</h4><p>{product.description}</p><p>{product.variantNote}</p><p>Color: {color || product.color || "a confirmar"}.</p></div>
        <div className="u221-sx"><h4>Variantes</h4><p>{color ? `Talles de ${color}` : product.variantLabel}: {variants.map((variant) => variant.size ?? variant.label).join(" · ")}</p><p>{product.sourceUrl ? "Combinaciones originales del catálogo Rinat. Consultá disponibilidad antes de confirmar tu pedido." : "Los talles de referencia se confirman al consultar."}</p></div>
        <div className="u221-sx"><h4>Formas de pago</h4>
          <div className="u221-rv">Contado <b>{formatProductPrice(product.price)}</b></div>
          {product.price3Installments ? <div className="u221-rv">3 cuotas de <b>{formatPrice(product.price3Installments / 3)}</b><small>Total {formatPrice(product.price3Installments)}</small></div> : null}
          {product.price6Installments ? <div className="u221-rv">6 cuotas de <b>{formatPrice(product.price6Installments / 6)}</b><small>Total {formatPrice(product.price6Installments)}</small></div> : null}
        </div>
      </div>
      <div className="u221-ov" aria-hidden="true" onClick={closeSheet} />
      <div className="u221-br" inert={!gone && !sheet}>
        <div className="u221-rw" inert={sheet} aria-hidden={sheet}>
          <span className="u221-th" aria-hidden="true">{product.brand.slice(0, 2)}</span>
          <div><b>{formatProductPrice(price)}</b><small>{price > 0 ? "Al contado" : "Precio a confirmar"}</small></div>
          <button ref={barButton} type="button" className="u221-by" aria-expanded={sheet} aria-controls={sheetId} onClick={(event) => openSheet(event.currentTarget)}>Elegir</button>
        </div>
        <div ref={options} id={sheetId} className="u221-op" role="dialog" aria-labelledby={optionsTitleId} aria-hidden={!sheet} inert={!sheet}>
          <div className="u221-oh"><span id={optionsTitleId}>{product.colors?.length ? hasSizes ? "Elegí color y talle" : "Elegí color" : product.variantLabel}</span><button type="button" className="u221-x" aria-label="Cerrar opciones" onClick={closeSheet}><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></button></div>
          {product.colors?.length ? <><p className="u221-option-label">Color: {color}</p><ColorChoices product={product} color={color} onSelect={selectColor} />{hasSizes ? <p className="u221-option-label">Talle</p> : null}</> : null}
          {!product.colors?.length || hasSizes ? <div className="u221-ss" role="radiogroup" aria-label={`${product.variantLabel} de ${product.name}`}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const index = variants.findIndex((variant) => variant.id === selected?.id);
              const next = event.key === "Home" ? 0 : event.key === "End" ? variants.length - 1
                : (Math.max(index, 0) + (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1) + variants.length) % variants.length;
              selectVariant(variants[next]);
              event.currentTarget.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
            }}>
            {variants.map((variant, index) => <button key={variant.id} type="button" className="u221-sz" role="radio" aria-checked={selected?.id === variant.id} tabIndex={selected ? (selected.id === variant.id ? 0 : -1) : (index === 0 ? 0 : -1)} onClick={() => selectVariant(variant)}>{variant.size ?? variant.label}</button>)}
          </div> : null}
          <p className="u221-note">{color || product.color ? `Color ${color || product.color}. ` : "Color a confirmar. "}Consultá disponibilidad.</p>
          <button type="button" className={`u221-ad${added ? " is-ok" : ""}`} disabled={!selected || added || selectedStock <= 0} onClick={add}>
            <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 7.5l2.6 2.6L11 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span aria-live="polite">{added ? "Agregado" : selectedStock <= 0 ? "Sin stock" : selected ? "Agregar al carrito" : "Elegí una variante"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
