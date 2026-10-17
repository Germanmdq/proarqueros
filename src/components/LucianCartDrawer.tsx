"use client";

import { Minus, Plus, ShoppingBag, X } from "lucide-react";

// Lucian UX/UI Prompt #240 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#240
type Item = { name: string; price: string; tone: string };
export function LucianCartDrawer({ item, open, onClose }: { item: Item | null; open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <div className="ux u240-shell"><button className="u240-ov" aria-label="Cerrar carrito" onClick={onClose} /><aside className="u240-dr" role="dialog" aria-modal="true"><div className="u240-dh"><b>Carrito<i>1</i></b><button className="u240-x" onClick={onClose} aria-label="Cerrar"><X size={16} /></button></div><div className="u240-fs"><b>Envío gratis desbloqueado</b><div className="u240-bar"><i /></div></div>{item && <div className="u240-in"><span className="u240-th" style={{ background: item.tone }} /><div className="u240-tx"><b>{item.name}</b><small>1 unidad</small><div className="u240-qt"><button aria-label="Quitar"><Minus size={13} /></button><span>1</span><button aria-label="Agregar"><Plus size={13} /></button></div></div><strong>{item.price}</strong></div>}<div className="u240-ft"><div className="u240-sm">Subtotal <b>{item?.price ?? "$ 0"}</b></div><button className="u240-ck"><ShoppingBag size={16} /> Finalizar compra</button></div></aside></div>;
}
