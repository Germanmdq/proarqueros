"use client";
import { ArrowDownRight, Menu, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { LucianCatalogFilters } from "@/components/LucianCatalogFilters";
import { LucianProductCard } from "@/components/LucianProductCard";
import { LucianCartDrawer } from "@/components/LucianCartDrawer";
import { LucianHeroAction } from "@/components/LucianHeroAction";

const products = [
  { name: "ZERO CONTACT", type: "Guante profesional", category: "Guantes", price: "$ 119.900", tone: "#c6ff38", detail: "Palma contact / corte negativo" },
  { name: "PULSE HYBRID", type: "Guante match", category: "Guantes", price: "$ 89.900", tone: "#ff6b35", detail: "Grip híbrido / cierre elástico" },
  { name: "FORTRESS BASE", type: "Capa térmica", category: "Indumentaria", price: "$ 54.900", tone: "#d7d3c9", detail: "Segunda piel / ajuste compresivo" },
];

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const [added, setAdded] = useState<(typeof products)[number] | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState("Todo");
  const addToCart = (product: (typeof products)[number]) => { setAdded(product); setCartOpen(true); };
  const visibleProducts = filter === "Todo" ? products : products.filter((product) => product.category === filter);
  return <main>
    <header className="nav"><a className="brand" href="#inicio">ÚLTIMO <span>BASTIÓN</span></a><nav className={menuOpen ? "nav-links open" : "nav-links"}><a href="#coleccion" onClick={() => setMenuOpen(false)}>Colección</a><a href="#tecnologia" onClick={() => setMenuOpen(false)}>Tecnología</a><a href="#club" onClick={() => setMenuOpen(false)}>Club</a></nav><button className="bag" aria-label="Abrir carrito" onClick={() => setCartOpen(true)}><ShoppingBag size={18} /><span>{added ? "1" : "0"}</span></button><button className="menu" aria-label="Abrir menú" onClick={() => setMenuOpen(!menuOpen)}><Menu size={24} /></button></header>
    <section id="inicio" className="hero"><div className="hero-image" /><div className="hero-grain" /><div className="hero-copy"><p className="eyebrow reveal">01 — EQUIPO PARA LOS QUE DECIDEN</p><h1 className="reveal delay-1">NADIE<br /><i>CUENTA</i><br />LOS ATAJADOS.</h1><p className="hero-description reveal delay-2">Se recuerdan las que parecían imposibles. Diseñamos guantes e indumentaria para ese instante.</p><LucianHeroAction /></div><div className="hero-foot"><span>BUENOS AIRES · ARG</span><span>SCROLL PARA ENTRAR <b>↓</b></span></div></section>
    <section id="coleccion" className="collection section"><div className="section-top"><p className="eyebrow dark-text">02 — SELECCIÓN 2026</p><h2>HECHO PARA<br />EL ÁREA.</h2><p className="section-intro">Diseño sin exceso. Materiales que responden cuando el partido se rompe.</p></div><LucianCatalogFilters onChange={setFilter} /><div className="product-grid lucian-grid">{visibleProducts.map((product) => <LucianProductCard product={product} key={product.name} onAdd={addToCart} />)}</div></section>
    <section id="tecnologia" className="technology"><div className="tech-head"><p className="eyebrow">03 — CONSTRUIDO PARA RESPONDER</p><h2>EL GRIP NO<br />NEGOCIA.</h2></div><div className="tech-list"><div><span>01</span><h3>CONTACT<br />LATEX</h3><p>Espuma de alto agarre creada para condiciones húmedas y secas.</p></div><div><span>02</span><h3>SECOND<br />SKIN</h3><p>Corte negativo que acompaña la mano, sin volumen extra.</p></div><div><span>03</span><h3>LOCK<br />SYSTEM</h3><p>Muñequera envolvente para que el guante sea una extensión tuya.</p></div></div></section>
    <section id="club" className="club section"><div className="club-card"><p className="eyebrow dark-text">ÚLTIMO BASTIÓN / CLUB</p><h2>NO ES UN<br />PUESTO.<br /><i>ES UNA FORMA.</i></h2><p>Acceso anticipado a lanzamientos, guía de cuidado y conversaciones que sólo entienden los que se paran bajo los tres palos.</p><a className="button button-dark" href="mailto:hola@ultimobastion.ar">Sumarme al club <ArrowDownRight size={18} /></a></div></section>
    <footer><a className="brand" href="#inicio">ÚLTIMO <span>BASTIÓN</span></a><p>Equipo para quienes sostienen el resultado.</p><p>© 2026 · ARGENTINA</p></footer>
    <LucianCartDrawer item={added} open={cartOpen} onClose={() => setCartOpen(false)} />
  </main>;
}
