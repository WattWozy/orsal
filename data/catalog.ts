export interface SpecificProduct {
  id: string;
  name: string;
  description: string;
  specs: string[];
  basePricePerMeter?: number; // Precio estimado base por metro lineal (€/m)
  basePriceUnit?: number;     // O precio estimado base por unidad (€)
  requiresAssembly?: boolean;
}

export interface ProductCategory {
  id: string;
  title: string;
  tagline: string;
  description: string;
  products: SpecificProduct[];
}

export const CATALOG_FAMILIES: ProductCategory[] = [
  {
    id: 'cercados-metalicos',
    title: 'Cercados Metálicos y Mallas',
    tagline: 'Cerramientos perimetrales flexibles y tradicionales',
    description: 'Sistemas clásicos para fincas, parcelas agrícolas, naves industriales y terrenos de gran extensión.',
    products: [
      {
        id: 'malla-simple-torsion',
        name: 'Malla Simple Torsión (Romboidal)',
        description: 'La opción más versátil e implantada. Fabricada con alambre galvanizado de alta resistencia o plastificado verde.',
        specs: ['Luz de malla: 50 mm', 'Diámetro alambre: 2.7 mm / 3.4 mm', 'Alturas disponibles: 1m, 1.5m, 2m'],
        basePricePerMeter: 18,
      },
      {
        id: 'malla-anudada-ganadera',
        name: 'Malla Anudada / Ganadera (Dehesa)',
        description: 'Especialmente diseñada para cerramientos agrícolas, forestales y contención de ganado.',
        specs: ['Galvanizado reforzado', 'Distribución progresiva de alambres', 'Alturas: 1.0m, 1.2m, 1.48m, 2.0m'],
        basePricePerMeter: 12,
      },
      {
        id: 'malla-electrosoldada-rollo',
        name: 'Malla Electrosoldada en Rollo',
        description: 'Malla rígida entregada en rollos para cerramientos avícolas, residenciales o de protección ligera.',
        specs: ['Cuadrícula: 50x50 mm / 100x50 mm', 'Alambre galvanizado anticorrosión'],
        basePricePerMeter: 15,
      }
    ]
  },
  {
    id: 'verjas-rigidas',
    title: 'Verjas Rígidas y Paneles Electrosoldados',
    tagline: 'Máxima resistencia mecánica y acabado estético',
    description: 'Sistemas modulares de paneles rígidos ideales para recintos industriales, colegios, viviendas y espacios públicos.',
    products: [
      {
        id: 'panel-plus-3d',
        name: 'Panel Rígido 3D (Plegado)',
        description: 'Panel rígido electrosoldado con pliegues longitudinales en forma de V que aportan rigidez estructural superior.',
        specs: ['Ancho estándar: 2.50 m', 'Varilla de 5 mm de diámetro', 'Tratamiento anticorrosión con termolacado en polvo'],
        basePricePerMeter: 28,
      },
      {
        id: 'verja-plana-2d',
        name: 'Verja Plana Doble Hilo 2D (Heavy Duty)',
        description: 'Panel de máxima seguridad con doble alambre horizontal, apto para zonas con alto riesgo de impacto o antivandalismo.',
        specs: ['Configuración 6/5/6 mm o 8/6/8 mm', 'Alta rigidez sin plegado', 'Resistencia extrema'],
        basePricePerMeter: 38,
      }
    ]
  },
  {
    id: 'puertas-automatizaciones',
    title: 'Puertas Metálicas y Automatismos',
    tagline: 'Cancelas, correderas y pasos vehiculares certificados',
    description: 'Fabricación propia de accesos residenciales e industriales en conformidad con el Marcado CE e ISO 9001.',
    products: [
      {
        id: 'puerta-corredera-industrial',
        name: 'Puerta Corredera Industrial / Autoportante',
        description: 'Estructura robusta sobre guía o suspendida para pasos de vehículos de gran tonelaje y gran luz de apertura.',
        specs: ['Paso útil: de 4m a 12m', 'Estructura de perfil hueco de acero', 'Opciones de automatización industrial'],
        basePriceUnit: 1850,
      },
      {
        id: 'puerta-batiente-cancelas',
        name: 'Puertas Batientes de 1 y 2 Hojas',
        description: 'Puertas de acceso peatonal o vehicular con cerramiento en malla o panel rígido a juego con el vallado.',
        specs: ['Cerradura de seguridad inoxidable', 'Hojas con marco perimetral reforzado', 'Bisagras regulables'],
        basePriceUnit: 420,
      }
    ]
  },
  {
    id: 'deportivas-ocultacion',
    title: 'Deportivos y Sistemas de Ocultación',
    tagline: 'Pistas deportivas, recintos de ocio y privacidad',
    description: 'Cerramientos adaptados a normativas deportivas e integración visual para recintos privados.',
    products: [
      {
        id: 'cerramiento-padel-deportes',
        name: 'Cerramiento para Pistas de Pádel y Campos',
        description: 'Estructuras modulares con bastidores electrosoldados anti-impacto e integración de redes parabalones.',
        specs: ['Bastidores de 2x1m en tubo estructural', 'Redes de polietileno de alta densidad', 'Pintura al horno antipólvora'],
        basePricePerMeter: 45,
      },
      {
        id: 'ocultacion-lamas-pvc',
        name: 'Sistemas de Ocultación (Lamas de PVC / Brezo)',
        description: 'Complementos de ocultación total o parcial integrables directamente sobre paneles 3D o verjas.',
        specs: ['Resistentes a rayos UV', 'Lamas imputrescibles de PVC rígido', 'Brezo natural de alto grosor'],
        basePricePerMeter: 16,
      }
    ]
  }
];