
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
import fs from "node:fs";
import path from "node:path";

const input = process.argv[2] || "./Cercados_Orsal_calculadora_presupuestos.xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const output = path.resolve(__dirname, "../data/generated.json");

const slugify = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const toRatio = (v) => (v > 1 ? v / 100 : v);
const round2 = (n) => Math.round(n * 100) / 100;

const sourceWorkbook = XLSX.readFile(input, {
    cellFormula: false,
    cellHTML: false,
    cellStyles: false,
    cellNF: false
});

// Adaptador para conservar la API de lectura que usaba ExcelJS.
const workbook = {
    getWorksheet(name) {
        const sheet = sourceWorkbook.Sheets[name];

        if (!sheet) {
            throw new Error(`No se encontró la hoja: ${name}`);
        }

        const range = sheet["!ref"]
            ? XLSX.utils.decode_range(sheet["!ref"])
            : { e: { r: 0 } };

        return {
            rowCount: range.e.r + 1,

            getRow(rowNumber) {
                const values = [undefined];

                for (let columnNumber = 1; columnNumber <= range.e.c + 1; columnNumber++) {
                    const address = XLSX.utils.encode_cell({
                        r: rowNumber - 1,
                        c: columnNumber - 1
                    });

                    values[columnNumber] = sheet[address]?.v ?? null;
                }

                return {values,
                    getCell(columnNumber) {
                        return {
                            value: values[columnNumber]
                        };
                    }
                };
            }
        };
    }
};

function readSheet(sheetName) {
  const sheet = workbook.getWorksheet(sheetName);

  if (!sheet) {
    throw new Error(`No existe la hoja: ${sheetName}`);
  }

  const headers = sheet.getRow(1).values.slice(1);

  return Array.from(
    { length: sheet.rowCount - 1 },
    (_, i) => {
      const row = sheet.getRow(i + 2);

      return Object.fromEntries(
        headers.map((header, index) => [
          header,
          row.getCell(index + 1).value
        ])
      );
    }
  ).filter(row => Object.values(row).some(v => v !== null && v !== undefined && v !== ""));
}

const parameters = readSheet("PARAMETROS");
const materials = readSheet("MATERIALES");
const recipes = readSheet("PIEZAS_PRODUCTO");
const products = readSheet("CATALOGO");

const getParam = (name) =>
  Number(parameters.find(p => p.Parámetro === name)?.Valor ?? 0);

const laborRate = getParam("Coste mano de obra (€/hora)");
const margin = getParam("Margen comercial (%)");

const materialMap = new Map(
  materials.map(m => [
    m.Código,
    {
      name: m["Material / componente"],
      unit: m["Unidad compra"],
      price: Number(m["Precio unitario (€)"] ?? 0)
    }
  ])
);

// Agrupar piezas por producto
const recipesByProduct = new Map();

for (const recipe of recipes) {
  if (!recipe["Código producto"] || !recipe["Código material"]) continue;

  const productId = recipe["Código producto"];
  const material = materialMap.get(recipe["Código material"]);

  if (!material) {
    throw new Error(
      `Material desconocido: ${recipe["Código material"]}`
    );
  }

  const quantity = Number(recipe["Cantidad por unidad producto"] ?? 0);
  const waste = toRatio(Number(recipe["Merma específica (%)"] ?? 0));
  const componentCost = quantity * (1 + waste) * material.price;

  const component = {
    materialId: recipe["Código material"],
    name: recipe["Pieza / material"],
    quantity,
    waste,
    unit: material.unit,
    unitPrice: material.price,
    totalCost: componentCost
  };

  if (!recipesByProduct.has(productId)) {
    recipesByProduct.set(productId, []);
  }

  recipesByProduct.get(productId).push(component);
}

// Calcular precios
const calculatedProducts = products.map(product => {
  const id = String(product["Código producto"]);
  const components = recipesByProduct.get(id) ?? [];

  const materialCost = components.reduce(
    (sum, component) => sum + component.totalCost,
    0
  );

  const hours = Number(
    product["Horas mano de obra por unidad"] ?? 0
  );

  const laborCost = hours * laborRate;
  const costPrice = materialCost + laborCost;
  const salePrice = costPrice * (1 + margin);

  return {
    id,
    name: product["Modelo / variante"],
    description: product["Descripción / configuración"] ?? "",
    family: product.Familia,
    subfamily: product.Subfamilia ?? null,
    unit: product["Unidad venta"],
    pricingConfigured: components.length > 0,
    components,
    materialCost: round2(materialCost),
    laborCost: round2(laborCost),
    costPrice: round2(costPrice),
    salePrice: components.length > 0 ? round2(salePrice) : null,
    laborHours: hours
  };
});

// Agrupar por familias para Next.js
const families = Object.values(
  calculatedProducts.reduce((groups, product) => {
    const key = product.family;

    if (!groups[key]) {
      groups[key] = { id: slugify(key), title: key, products: [] };
    }

    groups[key].products.push(product);
    return groups;
  }, {})
);

const result = {
  generatedAt: new Date().toISOString(),
  currency: "EUR",
  pricing: {
    laborRate,
    margin
  },
  families
};

fs.mkdirSync(path.dirname(output), { recursive: true });

fs.writeFileSync(
  output,
  JSON.stringify(result, null, 2),
  "utf8"
);

console.log(`Catálogo generado: ${output}`);
console.log(`Productos: ${calculatedProducts.length}`);
console.log(
  `Sin receta configurada: ${
    calculatedProducts.filter(p => !p.pricingConfigured).length
  }`
);
