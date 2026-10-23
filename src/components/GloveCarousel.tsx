// Lucian UX/UI Prompt #339 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#339
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatProductPrice, type Product } from "@/lib/catalog";
import "./glove-carousel.css";

export function GloveCarousel({ products }: { products: Product[] }) {
  const gloves = useMemo(
    () => products.filter((product) => product.category === "Guantes" && product.image).slice(0, 16),
    [],
  );
  const trackRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(0);
  const draggingRef = useRef<{ startX: number; startPosition: number } | null>(null);
  const didDragRef = useRef(false);
  const [position, setPosition] = useState(0);
  const [loopWidth, setLoopWidth] = useState(1);

  function measure() {
    const row = rowRef.current;
    if (!row) return;
    const card = row.querySelector<HTMLElement>(".u339-cd");
    const gap = Number.parseFloat(window.getComputedStyle(row).gap) || 0;
    setLoopWidth(Math.max(1, ((card?.offsetWidth ?? 260) + gap) * gloves.length));
  }

  function moveTo(next: number) {
    const width = loopWidth || 1;
    const looped = ((next % width) + width) % width;
    positionRef.current = looped;
    setPosition(looped);
  }

  function moveBy(direction: number) {
    const firstCard = rowRef.current?.querySelector<HTMLElement>(".u339-cd");
    moveTo(positionRef.current + direction * ((firstCard?.offsetWidth ?? 260) + 14));
  }

  useEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let animationFrame = 0;
    let previous = performance.now();
    const animate = (now: number) => {
      const elapsed = Math.min(now - previous, 64);
      previous = now;
      if (!draggingRef.current) moveTo(positionRef.current + elapsed * 0.034);
      animationFrame = window.requestAnimationFrame(animate);
    };
    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [loopWidth]);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = { startX: event.clientX, startPosition: positionRef.current };
    didDragRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("is-drag");
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = draggingRef.current;
    if (drag) {
      if (Math.abs(event.clientX - drag.startX) > 8) didDragRef.current = true;
      moveTo(drag.startPosition + drag.startX - event.clientX);
    }
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = null;
    event.currentTarget.classList.remove("is-drag");
  }

  const carouselProducts = [...gloves, ...gloves];
  return <section className="glove-carousel-section" aria-labelledby="glove-carousel-title">
    <div className="ux u339 glove-carousel">
      <div className="u339-hd"><div><p>GUANTES DESTACADOS</p><b id="glove-carousel-title">Elegí tu próximo par</b></div><div className="u339-actions"><button type="button" className="u339-pv" aria-label="Ver productos anteriores" onClick={() => moveBy(-1)}><span aria-hidden="true">←</span></button><button type="button" className="u339-nx" aria-label="Ver más productos" onClick={() => moveBy(1)}><span aria-hidden="true">→</span></button></div></div>
      <div ref={trackRef} className="u339-tr" tabIndex={0} aria-label="Carrusel continuo de guantes. Cambia automáticamente y también podés arrastrarlo hacia los costados." onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onKeyDown={(event) => { if (event.key === "ArrowRight") { event.preventDefault(); moveBy(1); } if (event.key === "ArrowLeft") { event.preventDefault(); moveBy(-1); } }}>
        <div ref={rowRef} className="u339-rw" style={{ transform: `translateX(${-position}px)` }}>
          {carouselProducts.map((product, index) => {
            const duplicate = index >= gloves.length;
            return <a key={`${product.id}-${index}`} className="u339-cd" href={`#producto-${product.id}`} onClick={(event) => { event.preventDefault(); if (didDragRef.current) { didDragRef.current = false; return; } window.dispatchEvent(new CustomEvent("proarqueros:open-product", { detail: { productId: product.id } })); }} aria-label={duplicate ? undefined : `Ver ${product.brand} ${product.name}`} aria-hidden={duplicate || undefined} tabIndex={duplicate ? -1 : undefined}>
              <div className="u339-th"><Image src={product.image!} alt="" fill sizes="(max-width: 720px) 72vw, 260px" unoptimized /><span>{product.category}</span></div>
              <div className="u339-mt"><b>{product.name}</b><span><span>{product.brand}</span><strong>{formatProductPrice(product.price)}</strong></span></div>
            </a>;
          })}
        </div>
      </div>
      <div className="u339-pg" aria-hidden="true"><i /></div>
    </div>
  </section>;
}
