// Lucian UX/UI Prompt #223 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#223
"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import "./lucian-card-stack.css";

const cards = [
  { title: "Tus manos. Tu elección.", text: "VGFC, Reusch, Prostar, Adidas y más. Compará modelos de guantes y elegí el talle para tu próximo partido.", label: "GUANTES", background: "linear-gradient(150deg,#096def,#03429d)" },
  { title: "El entrenamiento también cuenta.", text: "Térmicas, calzas, pantalones y conjuntos. Equipamiento para adulto y junior, todo en el mismo catálogo.", label: "INDUMENTARIA", background: "linear-gradient(150deg,#153656,#081c32)" },
  { title: "Completá tu equipo.", text: "Pelotas, medias, bolsos y accesorios. Encontrá lo que necesitás antes de entrar a la cancha.", label: "CANCHA Y ACCESORIOS", background: "linear-gradient(150deg,#398dea,#1455ab)" },
  { title: "Elegimos con vos.", text: "¿Dudas con el modelo, el talle o el color? Armá tu carrito y mandanos tu consulta por WhatsApp.", label: "PROARQUERO", background: "linear-gradient(150deg,#233b60,#101c32)" },
];

export function LucianCardStack() {
  const scroller = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sc = scroller.current;
    const elements = [...(list.current?.querySelectorAll<HTMLElement>(".u223-c") ?? [])];
    if (!sc) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    function draw() {
      raf = 0;
      if (!sc) return;
      if (motion.matches) {
        elements.forEach((card) => { card.style.transform = "none"; const shade = card.querySelector<HTMLElement>(".u223-sh"); if (shade) shade.style.opacity = "0"; });
        return;
      }
      const top = sc.getBoundingClientRect().top;
      const scale = sc.offsetHeight / (sc.getBoundingClientRect().height || 1);
      const positions = elements.map((card) => (card.getBoundingClientRect().top - top) * scale);
      elements.forEach((card, index) => {
        let depth = 0;
        for (let next = index + 1; next < elements.length; next++) {
          depth += Math.max(0, Math.min(1, 1 - (positions[next] - (14 + next * 12)) / 330));
        }
        card.style.transform = `scale(${(1 - depth * 0.06).toFixed(3)})`;
        const shade = card.querySelector<HTMLElement>(".u223-sh");
        if (shade) shade.style.opacity = (depth * 0.18).toFixed(3);
      });
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(draw); }
    sc.addEventListener("scroll", schedule, { passive: true });
    motion.addEventListener("change", schedule);
    raf = requestAnimationFrame(draw);
    return () => { sc.removeEventListener("scroll", schedule); motion.removeEventListener("change", schedule); cancelAnimationFrame(raf); };
  }, []);

  return <section id="tecnologia" className="ux u223-section" aria-labelledby="stack-title">
    <div className="u223-heading"><p>EL EQUIPO DETRÁS DE CADA ATAJADA</p><h2 id="stack-title">Mucho más que guantes.</h2><span>Deslizá y descubrí lo que tenemos para vos.</span></div>
    <div className="u223"><div ref={scroller} className="u223-sc" tabIndex={0} aria-label="Descubrí Proarquero: desplazate para ver las tarjetas">
      <p className="u223-k">Encontrá tu próximo equipo</p><div ref={list} className="u223-list">{cards.map((card, index) => <article key={card.title} className="u223-c" style={{ top: `${14 + index * 12}px`, background: card.background } as CSSProperties}>
        <span className="u223-art" aria-hidden="true" /><i>{String(index + 1).padStart(2, "0")} / {card.label}</i><b>{card.title}</b><p>{card.text}</p><span className="u223-sh" aria-hidden="true" />
      </article>)}</div><div id="club" className="u223-end"><a href="https://wa.me/5492236326323" target="_blank" rel="noreferrer">Hablar con Proarquero</a></div>
    </div></div>
  </section>;
}
