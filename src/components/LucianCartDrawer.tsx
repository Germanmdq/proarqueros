// Lucian UX/UI Prompt #240 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#240
"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { formatPrice, products, variantPrice, variantStock, type CartItem } from "@/lib/catalog";
import "./lucian-cart-catalog.css";

type Props = { items: CartItem[]; open: boolean; onClose: () => void; onQuantityChange: (item: CartItem, quantity: number) => void };

export function LucianCartDrawer(props: Props) {
  if (!props.open) return null;
  return <CartPanel {...props} />;
}

function CartPanel({ items, onClose, onQuantityChange }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  const lines = items.flatMap((item) => {
    const product = products.find((value) => value.id === item.productId);
    const variant = product?.variants.find((value) => value.id === item.variantId);
    return product && variant ? [{ ...item, product, variant }] : [];
  });
  const total = lines.reduce((sum, line) => sum + variantPrice(line.product, line.variant) * line.quantity, 0);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const freeShipping = total > 100000;
  const message = [
    "👋 ¡Hola! Quisiera consultar por este Producto de *Proarqueros* 🧤⚽",
    ...lines.map((line) => [
      `🧤 *Producto:* ${line.product.brand} ${line.product.name}`,
      `👤 *Categoría:* ${line.product.audience}`,
      `📏 *${line.product.variantLabel}:* ${line.variant.label}`,
      `🎨 *Color:* ${line.variant.color ?? line.product.color ?? "A confirmar"}`,
      `📦 *Cantidad:* ${line.quantity}`,
      `💵 *Subtotal:* ${formatPrice(variantPrice(line.product, line.variant) * line.quantity)}`,
    ].join("\n")),
    `💰 *Total estimado: ${formatPrice(total)}*`,
    freeShipping ? "🚚 *¡Envío gratis aplicado!*" : "📲 ¿Me podrían confirmar disponibilidad, talles y colores? 🙌",
    "¡Muchas gracias! 💚⚽",
  ].join("\n\n");

  return <div className="ux u240-shell u240-catalog" onKeyDown={(event) => {
    if (event.key === "Escape") { event.preventDefault(); onClose(); }
    if (event.key === "Tab") {
      const controls = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }}>
    <button className="u240-ov" aria-label="Cerrar carrito" onClick={onClose} tabIndex={-1} />
    <aside ref={panel} className="u240-dr" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      <div className="u240-dh"><b id="cart-title">Tu carrito<i>{count}</i></b><button ref={closeButton} className="u240-x" onClick={onClose} aria-label="Cerrar carrito">×</button></div>
      <p className="u240-info">Elegí tus variantes y consultá el pedido por WhatsApp.</p>
      <div className="u240-items">
        {lines.length === 0 ? <p className="u240-empty">Tu carrito está vacío. Elegí un producto y su variante para comenzar.</p> : null}
        {lines.map((line) => {
          const allocated = items.filter((item) => item.variantId === line.variantId).reduce((sum, item) => sum + item.quantity, 0);
          return <div className="u240-in" key={line.variantId}>
            {line.product.image ? <Image className="u240-th" src={line.variant.image ?? line.product.image} alt={line.product.isReferenceImage ? "Imagen ilustrativa" : line.product.name} width={54} height={62} unoptimized /> : null}
            <div className="u240-tx"><b>{line.product.brand} {line.product.name}</b><small>{line.product.audience} · {line.variant.label}</small><small>Color: {line.variant.color ?? line.product.color ?? "a confirmar"}</small>
              <div className="u240-qt"><button type="button" aria-label={`Quitar una unidad de ${line.product.name} ${line.variant.label}`} onClick={() => onQuantityChange(line, line.quantity - 1)}>−</button><span>{line.quantity}</span><button type="button" aria-label={`Agregar una unidad de ${line.product.name} ${line.variant.label}`} disabled={allocated >= variantStock(line.product, line.variant)} onClick={() => onQuantityChange(line, line.quantity + 1)}>+</button></div>
              <button className="u240-remove" type="button" onClick={() => onQuantityChange(line, 0)}>Eliminar</button>
            </div><strong>{formatPrice(variantPrice(line.product, line.variant) * line.quantity)}</strong>
          </div>;
        })}
      </div>
      <div className="u240-ft"><div className="u240-sm">Total estimado <b>{formatPrice(total)}</b></div><p className="u240-shipping">{freeShipping ? "✓ Envío gratis aplicado" : `Te faltan ${formatPrice(100001 - total)} para envío gratis`}</p>
        {lines.length ? <a className="u240-ck" href={`https://wa.me/5492236326323?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">Consultar pedido por WhatsApp</a> : <button className="u240-ck" type="button" onClick={onClose}>Ver productos</button>}
      </div>
    </aside>
  </div>;
}
