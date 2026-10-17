"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

// Lucian UX/UI Prompt #010 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#010
export function LucianHeroAction() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("Ver colección");
  return <div className="ux u010-hero" data-open={open ? "1" : "0"}><div className="u010-grp"><a className="u010-main" href="#coleccion"><span className="u010-labs"><span>{label}</span></span></a><span className="u010-div" /><button className="u010-caret" type="button" aria-label="Opciones" aria-expanded={open} onClick={() => setOpen(!open)}><ChevronDown size={18} /></button></div><div className="u010-menu" role="menu"><button className="u010-opt" role="menuitem" onClick={() => { setLabel("Ver guantes"); setOpen(false); }}><span><b>Ver guantes</b><small>Modelos profesionales</small></span></button><button className="u010-opt" role="menuitem" onClick={() => { setLabel("Ver indumentaria"); setOpen(false); }}><span><b>Ver indumentaria</b><small>Equipo para entrenar</small></span></button></div></div>;
}
