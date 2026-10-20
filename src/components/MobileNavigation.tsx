// Lucian UX/UI Prompt #041 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#041
"use client";
import { useEffect, useRef, useState } from "react";
import { categories, categoryAnchor } from "@/lib/catalog";
import "./mobile-navigation.css";

const labels = ["Inicio", "Productos", "Contacto", "Carro", "Motivación"];
const icons = [
  <path key="home" d="M4 11l8-6.5 8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />,
  <g key="products"><circle cx="12" cy="12" r="8.5" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></g>,
  <path key="contact" d="M4 5h16v12H9l-5 4V5zM8 9h8M8 13h5" />,
  <path key="cart" d="M3 4h2l3 12h10l3-8H6M9 20h.01M18 20h.01" />,
  <g key="play"><circle cx="12" cy="12" r="8.5" /><path d="m10 8 6 4-6 4z" /></g>,
];

export function MobileNavigation({ count, onCart, onMotiva, onCategory }: { count: number; onCart: () => void; onMotiva: () => void; onCategory: (id: string) => void }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [productsOpen, setProductsOpen] = useState(false);
  const motion = useRef({ x: 0, v: 0 });
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let raf = 0;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    function update() {
      cancelAnimationFrame(raf);
      const button = element!.querySelectorAll<HTMLButtonElement>('.u041-tab')[active];
      if (!button) return;
      const target = button.getBoundingClientRect().left - element!.getBoundingClientRect().left + button.offsetWidth / 2;
      function step() {
        const state = motion.current;
        state.v += (target - state.x) * .16 - state.v * .42;
        state.x += state.v;
        if (media.matches || Math.abs(target - state.x) < .3 && Math.abs(state.v) < .3) { state.x = target; state.v = 0; }
        else raf = requestAnimationFrame(step);
        element!.style.setProperty('--x', `${state.x.toFixed(2)}px`);
      }
      step();
    }
    const resize = new ResizeObserver(update);
    resize.observe(element);
    media.addEventListener('change', update);
    update();
    return () => { cancelAnimationFrame(raf); resize.disconnect(); media.removeEventListener('change', update); };
  }, [active]);
  function choose(index: number) {
    setActive(index);
    setProductsOpen(index === 1 ? !productsOpen : false);
    if (index === 0) onCategory('inicio');
    if (index === 2) onCategory('club');
    if (index === 3) onCart();
    if (index === 4) onMotiva();
  }
  return <nav ref={root} className="ux u041 mobile-navigation" aria-label="Navegación móvil" onKeyDown={(event) => { if (event.key === 'Escape') { setProductsOpen(false); root.current?.querySelectorAll<HTMLButtonElement>('.u041-tab')[1]?.focus(); } }}>
    {productsOpen && <div className="u041-products" id="mobile-products"><b>Productos</b>{["Todo", ...categories.filter((c) => c !== "Todo")].map((category) => <button key={category} onClick={() => { setProductsOpen(false); onCategory(category === "Todo" ? "coleccion" : categoryAnchor(category)); }}>{category === 'Todo' ? 'Ver todos' : category}</button>)}</div>}
    <span className="u041-shadow" aria-hidden="true" /><div className="u041-bar" aria-hidden="true" /><span className="u041-bub" aria-hidden="true" />
    <ul className="u041-tabs">{labels.map((label, index) => <li key={label}><button className="u041-tab" type="button" aria-label={index === 3 ? `Carro, ${count} productos` : label} aria-pressed={active === index} aria-expanded={index === 1 ? productsOpen : undefined} aria-controls={index === 1 ? 'mobile-products' : undefined} onClick={() => choose(index)} onKeyDown={(event) => { const d = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0; if (d) { event.preventDefault(); root.current?.querySelectorAll<HTMLButtonElement>('.u041-tab')[(index + d + labels.length) % labels.length]?.focus(); } }}><span className="u041-ic" aria-hidden="true"><svg viewBox="0 0 24 24">{icons[index]}</svg></span>{index === 3 && count > 0 ? <em className="u041-bd">{count}</em> : null}<span className="u041-lab">{label}</span></button></li>)}</ul>
  </nav>;
}
