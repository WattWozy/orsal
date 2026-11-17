import { useState, useEffect, useMemo, useRef } from "react";
import { PRODUCTS } from "@/domain/catalog";
import { evaluateProduct } from "@/domain/calculations/evaluateProduct";
import { localDateValue } from "@/util/dateHelpers";
import { shareOrDownloadImage } from "@/util/svgExport";
import type { OrderMetadata } from "@/util/orderTypes"; // Adjust path if moved to domain

export function useVisualizerState() {
  const [order, setOrder] = useState<OrderMetadata>({
    orderDate: "",
    deliveryDate: "",
    customerName: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    setOrder((prev) =>
      prev.orderDate ? prev : { ...prev, orderDate: localDateValue() }
    );
  }, []);

  const [productId, setProductId] = useState(PRODUCTS[0].id);

  const [all, setAll] = useState<Record<string, Record<string, number>>>(() =>
    Object.fromEntries(PRODUCTS.map((p) => [p.id, { ...p.defaults }]))
  );

  const [isExporting, setIsExporting] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const product = PRODUCTS.find((p) => p.id === productId) ?? PRODUCTS[0];
  const v = all[product.id];

  const evaluation = useMemo(() => evaluateProduct(product, v), [product, v]);

  const setField = (k: string, n: number) =>
    setAll((prev) => ({
      ...prev,
      [product.id]: { ...prev[product.id], [k]: n },
    }));

  const resetValues = () =>
    setAll((prev) => ({
      ...prev,
      [product.id]: { ...product.defaults },
    }));

  const updateOrder = (key: keyof OrderMetadata, value: string) => {
    setOrder((prev) => ({ ...prev, [key]: value }));
  };

  const handleShare = async () => {
    setIsExporting(true);
    try {
      await shareOrDownloadImage(wrapRef.current, product.id, product.label, order);
    } finally {
      setIsExporting(false);
    }
  };

  return {
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
  };
}