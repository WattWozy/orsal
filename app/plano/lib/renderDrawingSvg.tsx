import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import type { ProductDefinition, Values } from "@/domain/models/product";
import type { EvaluationResult } from "@/domain/calculations/evaluateProduct";
import { getProductDrawing } from "../renderers";

/** Renders a product drawing off-screen and returns a detached copy of its <svg>. */
export function renderDrawingSvg(
  product: ProductDefinition,
  values: Values,
  evaluation: EvaluationResult
): SVGSVGElement | null {
  const Drawing = getProductDrawing(product.id);
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;width:1000px;visibility:hidden";
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    flushSync(() =>
      root.render(
        <Drawing v={values} o={evaluation.outputs} summarized={evaluation.tooMany} />
      )
    );
    const svg = host.querySelector("svg");
    return svg ? (svg.cloneNode(true) as SVGSVGElement) : null;
  } finally {
    root.unmount();
    host.remove();
  }
}