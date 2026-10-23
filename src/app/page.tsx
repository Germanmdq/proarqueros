"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ProductCatalog } from "@/components/ProductCatalog";
import { LucianCartDrawer } from "@/components/LucianCartDrawer";
import { LucianSiteMenu } from "@/components/LucianSiteMenu";
import { LucianCardStack } from "@/components/LucianCardStack";
import { Motiva } from "@/components/Motiva";
import { MobileNavigation } from "@/components/MobileNavigation";
import { GloveCarousel } from "@/components/GloveCarousel";

import { products, storeCategories, storeCategoryAnchor, variantStock, type CartItem, type Product, type ProductVariant } from "@/lib/catalog";
import catalogStyles from "@/components/product-catalog.module.css";

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [notice, setNotice] = useState("");
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [motivaOpen, setMotivaOpen] = useState(false);
  const [mobileTarget, setMobileTarget] = useState<{ id: string } | null>(null);
  useEffect(() => {
    if (!mobileTarget) return;
    const target = document.getElementById(mobileTarget.id);
    window.history.pushState(null, "", `#${mobileTarget.id}`);
    target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }, [mobileTarget]);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  function addToCart(product: Product, variant: ProductVariant) {
    setItems((current) => {
      const total = current.filter((item) => item.variantId === variant.id).reduce((sum, item) => sum + item.quantity, 0);
      if (total >= variantStock(product, variant)) return current;
      const existing = current.find((item) => item.variantId === variant.id);
      return existing ? current.map((item) => item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { productId: product.id, variantId: variant.id, quantity: 1 }];
    });
    setNotice(`${product.brand} ${product.name}, variante ${variant.label}, agregado al carrito.`);
  }
  function changeQuantity(target: CartItem, quantity: number) {
    setItems((current) => {
      if (quantity <= 0) return current.filter((item) => item.variantId !== target.variantId);
      const product = products.find((product) => product.id === target.productId);
      if (!product) return current;
      const variant = product.variants.find((value) => value.id === target.variantId);
      if (!variant) return current;
      return current.map((item) => item.variantId === target.variantId ? { ...item, quantity: Math.min(quantity, variantStock(product, variant)) } : item);
    });
  }
  return <LucianSiteMenu onNavigate={() => setCatalogVersion((version) => version + 1)}><main>
    <header className="nav"><a className="brand" href="#inicio" aria-label="Proarquero, inicio"><span className="site-brand-clean" aria-hidden="true"><span className="site-brand-mark"><i></i><b></b><em></em></span><strong>PROARQUEROS</strong></span></a><nav className="nav-links"><a href="#inicio">Inicio</a><a href="#coleccion">Productos</a><a href="#club">Contacto</a></nav><button className="bag" aria-label={`Abrir carrito, ${count} productos`} onClick={() => setCartOpen(true)}>Carrito<span>{count}</span></button></header>
    <div className="promo-ticker" aria-label="Beneficios de Proarquero"><div>{["ENVÍO GRATIS EN COMPRAS SUPERIORES A $100.000", "CONSULTÁ LAS PROMOCIONES VIGENTES", "OFERTAS Y DESCUENTOS ESPECIALES", "NUEVOS INGRESOS", "ENVÍO GRATIS EN COMPRAS SUPERIORES A $100.000", "CONSULTÁ LAS PROMOCIONES VIGENTES", "OFERTAS Y DESCUENTOS ESPECIALES", "NUEVOS INGRESOS", "ENVÍO GRATIS EN COMPRAS SUPERIORES A $100.000", "CONSULTÁ LAS PROMOCIONES VIGENTES", "OFERTAS Y DESCUENTOS ESPECIALES", "NUEVOS INGRESOS"].map((promotion, index) => <span key={`${promotion}-${index}`} aria-hidden={index >= 4}>{promotion}</span>)}</div></div>
    <section id="inicio" className="hero"><div className="hero-image" /><div className="hero-grain" /><div className="hero-copy"><p className="eyebrow reveal">PROARQUERO · EQUIPAMIENTO PARA ARQUEROS</p><h1 className="reveal delay-1">TODO PARA<br /><i>DEFENDER</i><br />EL ARCO.</h1><p className="hero-description reveal delay-2">Guantes, indumentaria y equipamiento para jugar con confianza.</p><a className="hero-cta" href="#coleccion">Ver productos <span aria-hidden="true">↓</span></a></div></section>
    <GloveCarousel />
    <section className="quick-categories" aria-labelledby="quick-categories-title"><div><p className="eyebrow dark-text">Elegí tu equipo</p><h2 id="quick-categories-title">Encontrá lo que buscás</h2></div><div className="quick-category-grid">{storeCategories.slice(0, 6).map((category, index) => <a key={category.name} href={`#${storeCategoryAnchor(category.name)}`} className={`quick-category quick-category-${index}`}><span>0{index + 1}</span><strong>{category.name}</strong><small>{category.description}</small><b aria-hidden="true">→</b></a>)}</div></section>
    <section id="coleccion" className="collection section"><div className="section-top"><p className="eyebrow dark-text">Inicio / Productos</p><h2>Equipamiento para arqueros</h2><p className="section-intro"><strong>Guantes, pelotas, indumentaria y accesorios. Descubrí cada categoría.</strong></p></div><ProductCatalog key={catalogVersion} items={items} onAdd={addToCart} /></section>
    <LucianCardStack />
    <Motiva open={motivaOpen} onOpen={() => setMotivaOpen(true)} onClose={() => setMotivaOpen(false)} />
    <MobileNavigation count={count} onCart={() => setCartOpen(true)} onMotiva={() => setMotivaOpen(true)} onCategory={(id) => { setCatalogVersion((value) => value + 1); setMobileTarget({ id }); }} />
    <footer id="club"><a className="brand" href="#inicio" aria-label="Proarquero, inicio"><span className="site-brand-clean footer-brand-clean" aria-hidden="true"><span className="site-brand-mark"><i></i><b></b><em></em></span><strong>PROARQUEROS</strong></span></a><p>Equipo para quienes defienden el arco.<br /><a href="https://wa.me/5492236326323" target="_blank" rel="noreferrer">Contactanos por WhatsApp</a></p><p>© 2026 PROARQUEROS · ARGENTINA</p></footer>
    {notice ? <button className={catalogStyles.notice} type="button" onClick={() => setCartOpen(true)} aria-live="polite">{notice} Ver carrito ({count})</button> : null}
    <LucianCartDrawer items={items} open={cartOpen} onClose={() => setCartOpen(false)} onQuantityChange={changeQuantity} />
  </main></LucianSiteMenu>;
}
