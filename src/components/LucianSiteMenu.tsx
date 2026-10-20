// Lucian UX/UI Prompt #045 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#045
"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { storeCategories, storeCategoryAnchor } from "@/lib/catalog";
import "./lucian-site-menu.css";

const links = [{ name: "Inicio", href: "#inicio" }, ...storeCategories.map((category) => ({ name: category.name, href: `#${storeCategoryAnchor(category.name)}` })), { name: "Contacto", href: "#club" }];

export function LucianSiteMenu({ children, onNavigate }: { children: ReactNode; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const [origin, setOrigin] = useState<CSSProperties>({});
  const pendingTarget = useRef<string | null>(null);
  useEffect(() => {
    if (open || !pendingTarget.current) return;
    const href = pendingTarget.current;
    pendingTarget.current = null;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => {
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      window.history.pushState(null, "", href);
      target.scrollIntoView({ block: "start", behavior: reduced ? "instant" : "smooth" });
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }, reduced ? 0 : 700);
    return () => clearTimeout(timer);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);
  function close() { setOpen(false); button.current?.focus({ preventScroll: true }); }
  function navigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    pendingTarget.current = href;
    onNavigate?.();
    setOpen(false);
  }
  function toggle() {
    const rect = button.current?.getBoundingClientRect();
    if (rect) setOrigin({ "--cx": `${rect.left + rect.width / 2}px`, "--cy": `${rect.top + rect.height / 2}px` } as CSSProperties);
    setOpen((value) => !value);
  }

  return <div ref={root} className={`ux u045 u045-site${open ? " is-open" : ""}`} style={origin} onKeyDown={(event) => {
    if (!open) return;
    if (event.key === "Escape") { event.preventDefault(); close(); }
    if (event.key === "Tab") {
      const focusables = [button.current, ...(root.current?.querySelectorAll<HTMLAnchorElement>('.u045-sheet a') ?? [])].filter((element): element is HTMLButtonElement | HTMLAnchorElement => element !== null);
      const current = focusables.findIndex((element) => element === document.activeElement);
      event.preventDefault();
      focusables[(current + (event.shiftKey ? -1 : 1) + focusables.length) % focusables.length]?.focus();
    }
  }}>
    <div className="u045-page" inert={open}>{children}</div>
    <div id={menuId} className="u045-sheet" role="dialog" aria-modal={open ? true : undefined} aria-label="Menú principal" aria-hidden={!open} inert={!open}>
      <small>PROARQUERO / MENÚ</small>
      <ul className="u045-nav">{links.map((link, index) => <li key={link.href}><a className="u045-ln" href={link.href} style={{ "--i": index } as CSSProperties} onClick={(event) => navigate(event, link.href)} tabIndex={open ? 0 : -1}><em>{String(index + 1).padStart(2, "0")}</em><span>{link.name}</span></a></li>)}</ul>
      <div className="u045-foot"><a href="https://wa.me/5492236326323" target="_blank" rel="noreferrer" onClick={close} tabIndex={open ? 0 : -1}>WhatsApp</a><a className="go" href="#coleccion" onClick={(event) => navigate(event, "#coleccion")} tabIndex={open ? 0 : -1}>Ver catálogo</a></div>
    </div>
    <div className="u045-top"><button ref={button} className="u045-ham" type="button" aria-expanded={open} aria-controls={menuId} aria-label={open ? "Cerrar menú" : "Abrir menú"} onClick={toggle}><i /><i /><i /></button></div>
  </div>;
}
