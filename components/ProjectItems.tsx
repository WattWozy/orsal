import { PRODUCTS } from "@/domain/catalog";
import { evaluateProduct } from "@/domain/calculations/evaluateProduct";
import { fmt } from "@/lib/scene";
import type { ProjectItem } from "@/domain/models/project";

export function ProjectItems({
  items, editingId, onEdit, onQty, onRemove, onClear, onShare, sharing
}: {
  items: ProjectItem[];
  editingId: string | null;
  onEdit: (id: string) => void;
  onQty: (id: string, q: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onShare: () => void; 
  sharing: boolean;
}) {
  const units = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <section className="ov-project" aria-label="Productos del proyecto">
      <div className="proj-head">
        <h2>Proyecto · {units} {units === 1 ? "ud." : "uds."}</h2>
        {items.length > 0 && (
          <div className="proj-head-actions">
            <button type="button" onClick={onShare} disabled={sharing}>
              {sharing ? "Generando..." : "Compartir proyecto"}
            </button>
            <button type="button" onClick={onClear}>Vaciar</button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="proj-empty">
          Aún no hay productos. Configura uno y pulsa «Añadir al proyecto».
        </p>
      ) : (
        <ul className="proj">
          {items.map((it) => {
            const p = PRODUCTS.find((x) => x.id === it.productId);
            if (!p) return null;
            const { outputs, checksOk } = evaluateProduct(p, it.values);
            const meta = p.outputs
              .filter((r) => r.main)
              .map((r) => `${r.label}: ${fmt(outputs[r.key])} ${r.unit}`)
              .join(" · ");

            return (
              <li key={it.id} className={it.id === editingId ? "editing" : undefined}>
                <button type="button" className="proj-name" onClick={() => onEdit(it.id)}>
                  {p.family === "Vallas" ? "Valla" : "Puerta"} · {p.label}
                </button>

                <div className="qty">
                  <button type="button" aria-label="Quitar una unidad"
                    onClick={() => onQty(it.id, it.quantity - 1)}>−</button>
                  <span>{it.quantity}</span>
                  <button type="button" aria-label="Añadir una unidad"
                    onClick={() => onQty(it.id, it.quantity + 1)}>+</button>
                </div>

                <button type="button" className="proj-del" aria-label="Eliminar"
                  onClick={() => onRemove(it.id)}>✕</button>

                <div className="proj-meta">
                  {meta}{!checksOk && " · ⚠ revisar"}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}