"use client";
import { useEffect, useReducer, useRef } from "react";
import type { ProjectItem, ProjectAction } from "@/domain/models/project";

const KEY = "orsal:project:v1";

const sig = (productId: string, values: Record<string, number>) =>
  productId + "|" + Object.keys(values).sort().map((k) => `${k}=${values[k]}`).join(",");

function reducer(state: ProjectItem[], a: ProjectAction): ProjectItem[] {
  switch (a.type) {
    case "hydrate":
      return a.items;
    case "add": {
      const s = sig(a.item.productId, a.item.values);
      const existing = state.find((i) => sig(i.productId, i.values) === s);
      const qty = a.quantity ?? 1;
      if (existing)
        return state.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + qty } : i
        );
      return [...state, { ...a.item, id: crypto.randomUUID(), quantity: qty }];
    }
    case "replace":
      return state.map((i) => (i.id === a.id ? { ...i, ...a.item } : i));
    case "setQty":
      return a.quantity < 1
        ? state.filter((i) => i.id !== a.id)
        : state.map((i) => (i.id === a.id ? { ...i, quantity: a.quantity } : i));
    case "remove":
      return state.filter((i) => i.id !== a.id);
    case "clear":
      return [];
  }
}

export function useProject() {
  const [items, dispatch] = useReducer(reducer, []);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) dispatch({ type: "hydrate", items: JSON.parse(raw) });
    } catch {}
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  return {
    items,
    totalUnits: items.reduce((n, i) => n + i.quantity, 0),
    add: (item: Omit<ProjectItem, "id" | "quantity">, quantity?: number) =>
      dispatch({ type: "add", item, quantity }),
    replace: (id: string, item: Omit<ProjectItem, "id" | "quantity">) =>
      dispatch({ type: "replace", id, item }),
    setQty: (id: string, quantity: number) => dispatch({ type: "setQty", id, quantity }),
    remove: (id: string) => dispatch({ type: "remove", id }),
    clear: () => dispatch({ type: "clear" }),
  };
}