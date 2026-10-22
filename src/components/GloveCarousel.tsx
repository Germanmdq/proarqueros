// Lucian UX/UI Prompt #339 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#339
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatProductPrice, products } from "@/lib/catalog";
import "./glove-carousel.css";

export function GloveCarousel() {
  const featuredProducts = useMemo(() => products.filter((product) => product.image).slice(0, 16), []);
  const trackRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(0);
  const [position, setPosition] = useState(0);
  const [maxPosition, setMaxPosition] = useState(0);
  const dragRef = useRef<{ startX: number; startPosition: number } | null>(null);

  function metrics() {
    const track = trackRef.current;
    const row = rowRef.current;
    if (!track || !row) return { step: 0, max: 0 };
    const firstCard = row.querySelector<HTMLElement>(".u339-cd");
    const step = firstCard ? firstCard.offsetWidth + 14 : 0;
    return { step, max: Math.max(0, row.scrollWidth - track.clientWidth + 24) };
  }

  function moveTo(next: number) {
    const { max } = metrics();
    const safe = Math.max(0, Math.min(max, next));
    positionRef.current = safe;
    setMaxPosition(max);
    setPosition(safe);
  }

  function moveBy(direction: number) {
    const { step, max } = metrics();
    if (!step) return;
    const next = positionRef.current + direction * step;
    moveTo(next > max && direction > 0 ? 0 : next);
  }

  useEffect(() => {
    const updateMetrics = () => moveTo(positionRef.current);
    updateMetrics();
    window.addEventListener("resize", updateMetrics);
    return () => window.removeEventListener("resize", updateMetrics);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => moveBy(1), 4200);
    return () => window.clearInterval(timer);
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = { startX: event.clientX, startPosition: positionRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("is-drag");
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    moveTo(drag.startPosition + drag.startX - event.clientX);
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    dragRef.current = null;
    event.currentTarget.classList.remove("is-drag");
    const { step } = metrics();
    if (step) moveTo(Math.round(positionRef.current / step) * step);
  }

  return <section className="glove-carousel-section" aria-labelledby="glove-carousel-title">
    <div className="ux u339 glove-carousel">
      <div className="u339-hd"><div><p>PRODUCTOS DESTACADOS</p><b id="glove-carousel-title">Descubrí productos para tu próximo partido</b></div><div className="u339-actions"><button type="button" className="u339-pv" aria-label="Ver productos anteriores" onClick={() => moveBy(-1)}><span aria-hidden="true">←</span></button><button type="button" className="u339-nx" aria-label="Ver más productos" onClick={() => moveBy(1)}><span aria-hidden="true">→</span></button></div></div>
      <div ref={trackRef} className="u339-tr" tabIndex={0} aria-label="Carrusel de productos. Cambia automáticamente y también podés arrastrarlo hacia los costados." onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onKeyDown={(event) => { if (event.key === "ArrowRight") { event.preventDefault(); moveBy(1); } if (event.key === "ArrowLeft") { event.preventDefault(); moveBy(-1); } }}>
        <div ref={rowRef} className="u339-rw" style={{ transform: `translateX(${-position}px)` }}>
          {featuredProducts.map((product) => <a key={product.id} className="u339-cd" href="#coleccion" aria-label={`Ver ${product.brand} ${product.name}`}>
            <div className="u339-th">{product.image ? <Image src={product.image} alt={`${product.brand} ${product.name}`} fill sizes="(max-width: 720px) 72vw, 260px" unoptimized /> : null}<span>{product.category}</span></div>
            <div className="u339-mt"><b>{product.name}</b><span><span>{product.brand}</span><strong>{formatProductPrice(product.price)}</strong></span></div>
          </a>)}
        </div>
      </div>
      <div className="u339-pg" aria-hidden="true"><i style={{ width: `${maxPosition ? Math.max(18, Math.min(100, ((position / maxPosition) * 82) + 18)) : 100}%` }} /></div>
    </div>
  </section>;
}
