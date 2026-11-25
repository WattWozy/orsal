"use client";

import type { Field } from "@/domain/models/product";
import {ProjectItems} from "@/components/ProjectItems";
import { PRODUCTS } from "@/domain/catalog";
import { getProductDrawing } from "./renderers";
import { useVisualizerState } from "./hooks/useVisualizerState";
import { VISUALIZER_CSS } from "@/util/visualizerStyles";
import { StripSvg, fmt } from "@/lib/scene";

function NumInput({
  value,
  onChange,
  client,
  bad,
  id,
}: {
  value: number;
  onChange: (n: number) => void;
  client?: boolean;
  bad?: boolean;
  id: string;
}) {
  return (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      step="any"
      className={(client ? "client " : "") + (bad ? "bad" : "")}
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? NaN : Number(e.target.value))
      }
    />
  );
}

export default function ProductVisualizerPage() {
  const {
    order,
    updateOrder,
    product,
    productId,
    setProductId,
    v,
    evaluation,
    wrapRef,
    isExporting,
    setField,
    resetValues,
    handleShare,
    isExportingProject, 
    handleShareProject,
    project, 
    editingId, 
    handleAdd, 
    handleEdit, 
    cancelEdit,
  } = useVisualizerState();

  const { inputsOk, outputs: o, checksOk, tooMany, canDraw } = evaluation;
  const Drawing = getProductDrawing(product.id);
  const families: Array<"Vallas" | "Puertas"> = ["Vallas", "Puertas"];

  const renderFields = (fields: Field[], client: boolean) =>
    fields.map((f) => (
      <div className="row" key={f.key}>
        <label htmlFor={`f-${f.key}`}>
          <span className="l">
            {f.label}
            {f.hint && <small>{f.hint}</small>}
          </span>
        </label>

        <NumInput
          id={`f-${f.key}`}
          value={v[f.key]}
          client={client}
          bad={!Number.isFinite(v[f.key])}
          onChange={(n) => setField(f.key, n)}
        />
      </div>
    ));

  return (
    <main className="ov">
      <style>{VISUALIZER_CSS}</style>

      <h1>Visualizador de producto</h1>
      <p className="sub">
        Medidas en milímetros. Cambia las medidas del cliente o las holguras y
        el plano se actualiza.
      </p>

      <div className="ov-grid">
        <div className="ov-side">
          <section className="ov-panel" aria-label="Datos del pedido y producto">
            <fieldset>
              <legend>Datos del pedido</legend>

              <label className="sel">
                Nombre del cliente
                <input
                  type="text"
                  value={order.customerName}
                  onChange={(e) => updateOrder("customerName", e.target.value)}
                  placeholder="Nombre del cliente"
                />
              </label>

              <label className="sel">
                Fecha de pedido
                <input
                  type="date"
                  value={order.orderDate}
                  onChange={(e) => updateOrder("orderDate", e.target.value)}
                />
              </label>

              <label className="sel">
                Fecha de entrega
                <input
                  type="date"
                  value={order.deliveryDate}
                  onChange={(e) => updateOrder("deliveryDate", e.target.value)}
                />
              </label>

              <label className="sel">
                Ubicación
                <input
                  type="text"
                  value={order.location}
                  onChange={(e) => updateOrder("location", e.target.value)}
                  placeholder="Ubicación"
                />
              </label>

              <label className="sel">
                Notas ({order.notes.length}/500)
                <textarea
                  maxLength={500}
                  rows={4}
                  value={order.notes}
                  onChange={(e) => updateOrder("notes", e.target.value)}
                  placeholder="Observaciones del pedido..."
                />
              </label>
            </fieldset>

            <label className="sel">
              Producto
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                {families.map((fam) => (
                  <optgroup key={fam} label={fam}>
                    {PRODUCTS.filter((p) => p.family === fam).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <fieldset>
              <legend>Medidas del cliente (mm)</legend>
              {renderFields(product.client, true)}
            </fieldset>

            <fieldset>
              <legend>Holguras y márgenes (mm)</legend>
              {renderFields(product.margins, false)}
            </fieldset>

            <div className="ov-actions">
              <button
                type="button"
                className="primary"
                onClick={handleAdd}
                disabled={!canDraw}
              >
                {editingId ? "Guardar cambios" : "Añadir al proyecto"}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit}>
                  Cancelar edición
                </button>
              )}
              <button type="button" onClick={resetValues}>
                Restablecer valores de ejemplo
              </button>
            </div>
          </section>

          <ProjectItems
            items={project.items}
            editingId={editingId}
            onEdit={handleEdit}
            onQty={project.setQty}
            onRemove={project.remove}
            onClear={project.clear}
            onShare={handleShareProject}
            sharing={isExportingProject}
          />
        </div>

        <section aria-label="Plano y resultados">
          <div className="sheetbar">
            <h2>
              {product.family === "Vallas" ? "Valla" : "Puerta"} ·{" "}
              {product.label}
            </h2>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span className={"status " + (checksOk ? "ok" : "bad")}>
                {checksOk ? "OK" : "REVISAR"}
              </span>

              <button
                type="button"
                onClick={handleShare}
                disabled={!canDraw || isExporting}
              >
                {isExporting ? "Generando..." : "Compartir plano"}
              </button>
            </div>
          </div>

          {!inputsOk && (
            <div className="warn">
              Falta algún valor numérico. Rellena todos los campos para ver el
              plano.
            </div>
          )}

          {inputsOk && !checksOk && (
            <div className="warn">
              Alguna medida resultante es cero o negativa: las holguras no
              caben en el hueco indicado. Revisa los valores.
            </div>
          )}

          {tooMany && (
            <div className="info">
              Plano resumido: se muestran el primer y último tramo con el corte
              intermedio ({o.pt ?? o.v} postes/vanos en total).
            </div>
          )}

          {canDraw && (
            <>
              <div className="sheet" ref={wrapRef}>
                <Drawing v={v} o={o} summarized={tooMany} />
              </div>

              <div className="legend" aria-hidden>
                <span>
                  <i style={{ background: "#cfd6de" }} />
                  Poste / pilar
                </span>
                <span>
                  <i style={{ background: "#dbe7f5" }} />
                  Panel / hoja / malla
                </span>
                <span>
                  <i style={{ background: "#ffe3a3" }} />
                  Holgura
                </span>
              </div>

              <div className="strips">
                {product.strips(v, o).map((st) => (
                  <div className="sheet" key={st.title}>
                    <StripSvg strip={st} />
                  </div>
                ))}
              </div>
            </>
          )}

          {inputsOk && (
            <table>
              <tbody>
                {product.outputs.map((r, index) => (
                  <tr
                    key={`${product.id}-${r.key}-${index}`}
                    className={r.main ? "main" : undefined}
                  >
                    <td>{r.label}</td>
                    <td className="n">{fmt(o[r.key])}</td>
                    <td className="u">{r.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}