export type ProjectItem = {
  id: string;
  productId: string;
  values: Record<string, number>; // same shape as `v`
  quantity: number;
};

export type ProjectAction =
  | { type: "hydrate"; items: ProjectItem[] }
  | { type: "add"; item: Omit<ProjectItem, "id" | "quantity">; quantity?: number }
  | { type: "replace"; id: string; item: Omit<ProjectItem, "id" | "quantity"> }
  | { type: "setQty"; id: string; quantity: number }
  | { type: "remove"; id: string }
  | { type: "clear" };