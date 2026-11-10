export interface ServiceCategory {
  id: string;
  title: string;
  description: string;
  features: string[];
}

export const CATEGORIES: ServiceCategory[] = [
  {
    id: 'cercados-metalicos',
    title: 'Cercados Metálicos',
    description: 'Soluciones de cerramiento perimetral para parcelas residenciales e industriales con alta durabilidad.',
    features: ['Malla simple torsión', 'Malla anudada/ganadera', 'Postes galvanizados o lacados']
  },
  {
    id: 'verjas-rigidas',
    title: 'Verjas Rígidas y Paneles',
    description: 'Sistemas de paneles electrosoldados de alta seguridad y estética contemporánea.',
    features: ['Panel Plus 3D', 'Alta resistencia a impactos', 'Acabados anticorrosivos']
  },
  {
    id: 'puertas-automatizacion',
    title: 'Puertas y Automatizaciones',
    description: 'Fabricación propia de puertas correderas, batientes y automatismos certificados ISO 9001.',
    features: ['Puertas industriales y residenciales', 'Sistemas de automatización', 'Marcado CE']
  },
  {
    id: 'instalaciones-deportivas',
    title: 'Instalaciones Deportivas',
    description: 'Cerramientos especializados para pistas de pádel, campos de fútbol y polideportivos.',
    features: ['Barandillas deportivas', 'Redes de protección', 'Estructuras anti-impacto']
  },
  {
    id: 'sistemas-ocultacion',
    title: 'Sistemas de Ocultación',
    description: 'Integración estética para privacidad en recintos privados y comerciales.',
    features: ['Brezo natural y mallas', 'Lamas de PVC/Aluminio', 'Setos artificiales']
  }
];