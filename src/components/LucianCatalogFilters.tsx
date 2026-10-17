"use client";

import { useState } from "react";

// Lucian UX/UI Prompt #292 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#292
const filters = ["Todo", "Guantes", "Indumentaria"];

type Props = { onChange: (filter: string) => void };

export function LucianCatalogFilters({ onChange }: Props) {
  const [active, setActive] = useState("Todo");

  function choose(filter: string) {
    setActive(filter);
    onChange(filter);
  }

  return (
    <div className="ux u292 catalog-filter" aria-label="Filtrar productos">
      <div className="u292-fs" role="group" aria-label="Tipo de producto">
        {filters.map((filter) => (
          <button
            aria-pressed={active === filter}
            className="u292-f"
            key={filter}
            onClick={() => choose(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>
      <p className="u292-n" aria-live="polite">
        {active === "Todo" ? "Toda la colección" : `Mostrando ${active.toLowerCase()}`}
      </p>
    </div>
  );
}
