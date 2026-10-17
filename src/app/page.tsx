"use client";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { ProductCatalog } from "@/components/ProductCatalog";
import { LucianCartDrawer } from "@/components/LucianCartDrawer";
import { LucianHeroAction } from "@/components/LucianHeroAction";
import { LucianSiteMenu } from "@/components/LucianSiteMenu";
import { LucianCardStack } from "@/components/LucianCardStack";

import { products, type CartItem, type Product, type ProductVariant } from "@/lib/catalog";
import catalogStyles from "@/components/product-catalog.module.css";

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [notice, setNotice] = useState("");
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  function addToCart(product: Product, variant: ProductVariant) {
    setItems((current) => {
      const total = current.filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0);
      if (total >= product.stock) return current;
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
      const others = current.filter((item) => item.productId === target.productId && item.variantId !== target.variantId).reduce((sum, item) => sum + item.quantity, 0);
      return current.map((item) => item.variantId === target.variantId ? { ...item, quantity: Math.min(quantity, product.stock - others) } : item);
    });
  }
  return <LucianSiteMenu><main>
    <header className="nav"><a className="brand" href="#inicio" aria-label="Proarquero, inicio"><Image className="site-logo" src="/images/proarquero-logo.png" alt="Proarquero" width={210} height={104} priority unoptimized /></a><nav className="nav-links"><a href="#inicio">Inicio</a><a href="#coleccion">Productos</a><a href="#club">Contacto</a></nav><button className="bag" aria-label={`Abrir carrito, ${count} productos`} onClick={() => setCartOpen(true)}><ShoppingBag size={20} /><span>{count}</span></button></header>
    <section id="inicio" className="hero"><div className="hero-image" /><div className="hero-grain" /><div className="hero-copy"><p className="eyebrow reveal">PROARQUERO · EQUIPAMIENTO PARA ARQUEROS</p><h1 className="reveal delay-1">TODO PARA<br /><i>DEFENDER</i><br />EL ARCO.</h1><p className="hero-description reveal delay-2">Encontrá tus guantes, tu indumentaria y el equipo para entrar a la cancha.</p><LucianHeroAction /></div><div className="hero-foot"><span>BUENOS AIRES · ARG</span><span>DESCUBRÍ LA COLECCIÓN <b>↓</b></span></div></section>
    <section id="coleccion" className="collection section"><div className="section-top"><p className="eyebrow dark-text">Inicio / Productos</p><h2>Equipamiento para arqueros</h2><p className="section-intro">Guantes, indumentaria, pelotas, accesorios y calzado. Elegí tu modelo y talle.</p></div><ProductCatalog items={items} onAdd={addToCart} /></section>
    <LucianCardStack />
    <footer><a className="brand" href="#inicio" aria-label="Proarquero, inicio"><Image className="site-logo" src="/images/proarquero-logo.png" alt="Proarquero" width={160} height={82} unoptimized /></a><p>Equipo para quienes defienden el arco.</p><p>© 2026 PROARQUERO · ARGENTINA</p></footer>
    {notice ? <button className={catalogStyles.notice} type="button" onClick={() => setCartOpen(true)} aria-live="polite">{notice} Ver carrito ({count})</button> : null}
    <LucianCartDrawer items={items} open={cartOpen} onClose={() => setCartOpen(false)} onQuantityChange={changeQuantity} />
  </main></LucianSiteMenu>;
}
