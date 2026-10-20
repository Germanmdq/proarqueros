// Lucian UX/UI Prompt #247 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#247
"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./motiva.css";

const videos = [
  { title: "Las mejores atajadas en la década · #1", src: "/videos/motiva/atajadas-decada.mp4" },
  { title: "Las mejores atajadas de la historia", src: "/videos/motiva/atajadas-historia.mp4" },
];

export function Motiva({ open, onOpen, onClose }: { open: boolean; onOpen: () => void; onClose: () => void }) {
  return <><button className="motiva-trigger" onClick={onOpen}>Motivá</button>{open && <MotivaDialog onClose={onClose} />}</>;
}

function MotivaDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const expanded = useRef(false);
  const video = videos[index];

  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = overflow; opener?.focus({ preventScroll: true }); };
  }, []);

  function syncScroll() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const p = reduced ? 1 : Math.min(1, (scroller.current?.scrollTop ?? 0) / 260);
    setProgress(p);
    const full = p > .92;
    if (full !== expanded.current) {
      expanded.current = full;
      if (full && !reduced) void player.current?.play().catch(() => {});
      else player.current?.pause();
    }
  }

  function next() {
    player.current?.pause();
    setIndex((value) => (value + 1) % videos.length);
    setError(false);
    setPlaying(false);
  }

  return <dialog ref={dialog} className={`ux u247 motiva-dialog${playing ? " is-play" : ""}`} aria-labelledby="motiva-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose(); } }}>
    <button className="motiva-close" onClick={onClose} aria-label="Cerrar Motivá">Cerrar ×</button>
    <div className="u247-sc" ref={scroller} tabIndex={0} aria-label="Videos de atajadas: desplazate para ampliar" onScroll={syncScroll}>
      <div className="u247-hd"><small>MOTIVÁ · QUEGOLAZO · {index + 1}/{videos.length}</small><h3 id="motiva-title">{video.title}</h3></div>
      <div className="u247-pin"><div className="u247-st"><div className="u247-v" style={{ "--p": progress } as CSSProperties}>
        <video key={video.src} ref={player} src={video.src} controls playsInline muted preload="metadata" aria-label={video.title} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setError(true)} />
        <span className="u247-st2"><i aria-hidden="true" />{playing ? "Reproduciendo" : "Listo para ver"}</span>
      </div><div className="u247-hint" style={{ opacity: progress > .05 ? 0 : 1 }}>Deslizá para ampliar o tocá reproducir ↓</div>{error && <p role="alert">No se pudo cargar el video. Probá con el siguiente.</p>}</div></div>
      <div className="u247-ft"><b>Cada atajada empieza con vos.</b><span>Videos de QUEGOLAZO</span></div>
    </div>
    <div className="motiva-actions"><span>{index + 1} de {videos.length}</span><button onClick={next}>{index === videos.length - 1 ? "Volver al primero" : "Ver siguiente"}</button></div>
  </dialog>;
}
