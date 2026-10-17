"use client";

import { Check, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";

// Lucian UX/UI Prompt #051 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#051
type Product = { name: string; type: string; category: string; price: string; tone: string; detail: string };

export function LucianProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  const [done, setDone] = useState(false);
  function add() {
    setDone(true);
    onAdd(product);
    window.setTimeout(() => setDone(false), 1400);
  }
  return <article className="ux u051">
    <div className="u051-stage" style={{ "--c1": product.tone } as React.CSSProperties}>
      <div className="u051-top"><span className="u051-new">NUEVO</span><span className="u051-cart"><ShoppingBag size={19} /></span></div>
      <div className="u051-glove" aria-hidden="true"><div /><div /><div /><div /><div /></div>
    </div>
    <div className="u051-info"><div className="u051-row"><span className="u051-name">{product.name}</span><span className="u051-price">{product.price}</span></div><div className="u051-sub">{product.type} · {product.detail}</div><button className={`u051-add ${done ? "done" : ""}`} type="button" onClick={add}>{done ? <><Check size={18} /> Agregado</> : <><Plus size={18} /> Agregar al carrito</>}</button></div>
  </article>;
}
