import type { CustomizableCategory } from '../types/types';

export interface CustomizableProductCategoryInfo {
  id: CustomizableCategory;
  name: string;
  description: string;
  basePrice: number;
  bgColor: string;
}

export interface ChoiceTransform {
  posX: number;
  posY: number;
  zoom: number;
  rotate: number;
}

export interface OptionChoice {
  id: string;
  name: string;
  priceDelta: number;
  colorSwatch?: string;
  iconVisual?: string;
  imageUrl?: string;
  transform?: ChoiceTransform;
}

export interface CategoryOptionGroup {
  key: string;
  label: string;
  choices: OptionChoice[];
  transform?: ChoiceTransform;
}

export function isSpatialAttribute(key: string, label: string): boolean {
  const k = key.toLowerCase();
  const l = label.toLowerCase();

  const nonSpatialKeywords = [
    'color', 'metal', 'acabado', 'largo', 'talle', 'tamano', 'tamaño', 
    'material', 'laminado', 'corte', 'estilo', 'enganch', 'anzuelo'
  ];

  const spatialKeywords = [
    'forma', 'figura', 'cuerpo', 'orejas', 'dije', 'ojos', 'costuras', 
    'accesorio', 'estampa', 'posicion', 'ubicacion', 'silueta', 'modelo'
  ];

  const matchesNonSpatial = nonSpatialKeywords.some((kw) => k.includes(kw) || l.includes(kw));
  const matchesSpatial = spatialKeywords.some((kw) => k.includes(kw) || l.includes(kw));

  if (matchesNonSpatial && !matchesSpatial) {
    return false;
  }

  return true;
}

export const CUSTOMIZABLE_CATEGORIES_DATA: CustomizableProductCategoryInfo[] = [
  {
    id: 'COLLARES',
    name: 'COLLARES',
    description: 'Elige el tipo de cadena, dije principal, metal y dijes adicionales.',
    basePrice: 4200,
    bgColor: 'bg-yellow-100 hover:bg-yellow-200',
  },
  {
    id: 'ARITOS',
    name: 'ARITOS',
    description: 'Combina dijes colgantes con materiales hipoalergénicos como Plata 925 o Clips.',
    basePrice: 3500,
    bgColor: 'bg-purple-100 hover:bg-purple-200',
  },
  {
    id: 'LLAVEROS / PELUCHES',
    name: 'LLAVEROS Y PELUCHES',
    description: 'Diseña la criatura, color de felpa, ojos de botón y accesorios.',
    basePrice: 7800,
    bgColor: 'bg-pink-100 hover:bg-pink-200',
  },
  {
    id: 'PINES',
    name: 'PINES METÁLICOS',
    description: 'Elige tamaño, acabado brillante o mate y sube tu propio diseño.',
    basePrice: 1200,
    bgColor: 'bg-cyan-100 hover:bg-cyan-200',
  },
  {
    id: 'STICKERS',
    name: 'STICKERS Y CALCOS',
    description: 'Stickers impermeables en vinilo o holográficos. Sube tu imagen.',
    basePrice: 800,
    bgColor: 'bg-green-100 hover:bg-green-200',
  },
  {
    id: 'REMERAS',
    name: 'REMERAS',
    description: 'Elige color de remera, talle, ubicación y sube tu estampa.',
    basePrice: 12500,
    bgColor: 'bg-orange-100 hover:bg-orange-200',
  },
  {
    id: 'POSTERS',
    name: 'POSTERS',
    description: 'Elige tamaño, papel brutalist, enmarcado y sube tu ilustración.',
    basePrice: 4500,
    bgColor: 'bg-yellow-100 hover:bg-yellow-200',
  },
  {
    id: 'PINTURAS',
    name: 'PINTURAS EN LIENZO',
    description: 'Obra artesanal a medida. Elige tamaño, estilo y solicita tu presupuesto.',
    basePrice: 18000,
    bgColor: 'bg-pink-100 hover:bg-pink-200',
  },
];

export const CATEGORY_OPTIONS_MAP: Record<CustomizableCategory, CategoryOptionGroup[]> = {
  COLLARES: [
    {
      key: 'cadena',
      label: 'Tipo de Cadena',
      choices: [
        { id: 'gargantilla', name: 'Gargantilla Negro Velvet', priceDelta: 0, colorSwatch: '#18181B' },
        { id: 'eslabon', name: 'Eslabón Grueso Gothic', priceDelta: 800, colorSwatch: '#71717A' },
        { id: 'fina', name: 'Cadena Fina Acero 316L', priceDelta: 500, colorSwatch: '#E5E7EB' },
        { id: 'cuero', name: 'Cordón de Cuero Negro', priceDelta: 0, colorSwatch: '#27272A' },
      ],
    },
    {
      key: 'dije',
      label: 'Dije Principal',
      choices: [
        { id: 'gatito', name: 'Gatito Buttoncat', priceDelta: 0 },
        { id: 'cruz', name: 'Cruz Gothic Magenta', priceDelta: 600, colorSwatch: '#FF007F' },
        { id: 'corazon', name: 'Corazón Espinado', priceDelta: 700, colorSwatch: '#B91C1C' },
        { id: 'ojo', name: 'Ojo Místico Neón', priceDelta: 650, colorSwatch: '#00F0FF' },
        { id: 'luna', name: 'Luna Carmesí', priceDelta: 500, colorSwatch: '#E11D48' },
        { id: 'calavera', name: 'Calavera de Acero', priceDelta: 800, colorSwatch: '#9CA3AF' },
      ],
    },
    {
      key: 'metal',
      label: 'Acabado de Metal',
      choices: [
        { id: 'plateado', name: 'Plateado Brillante', priceDelta: 0, colorSwatch: '#E5E7EB' },
        { id: 'negro', name: 'Negro Mate Oxidado', priceDelta: 400, colorSwatch: '#18181B' },
        { id: 'bronce', name: 'Bronce Vintage', priceDelta: 300, colorSwatch: '#D97706' },
      ],
    },
    {
      key: 'largo',
      label: 'Largo de Cadena',
      choices: [
        { id: '40cm', name: '40 cm (Corto)', priceDelta: 0 },
        { id: '45cm', name: '45 cm (Standard)', priceDelta: 0 },
        { id: '50cm', name: '50 cm (Largo)', priceDelta: 0 },
        { id: '60cm', name: '60 cm (Extra Largo)', priceDelta: 300 },
      ],
    },
  ],

  ARITOS: [
    {
      key: 'dije',
      label: 'Dije Colgante',
      choices: [
        { id: 'gatito', name: 'Gatito Buttoncat', priceDelta: 0 },
        { id: 'murcielago', name: 'Murciélago Kawaii', priceDelta: 0 },
        { id: 'corazon', name: 'Corazón Sangrante', priceDelta: 0, colorSwatch: '#FF007F' },
        { id: 'imperdible', name: 'Imperdible con Perla', priceDelta: 400 },
        { id: 'telarana', name: 'Telaraña Gótica', priceDelta: 300 },
      ],
    },
    {
      key: 'anzuelo',
      label: 'Tipo de Enganche',
      choices: [
        { id: 'acero', name: 'Acero Quirúrgico 316L', priceDelta: 0, colorSwatch: '#9CA3AF' },
        { id: 'plata925', name: 'Plata 925 Certificada', priceDelta: 2500, colorSwatch: '#F3F4F6' },
        { id: 'clip', name: 'Clip (Sin Perforación)', priceDelta: 500, colorSwatch: '#FFE600' },
      ],
    },
    {
      key: 'metal',
      label: 'Acabado de Metal',
      choices: [
        { id: 'plateado', name: 'Plateado Brillante', priceDelta: 0, colorSwatch: '#E5E7EB' },
        { id: 'negro', name: 'Negro Mate Oxidado', priceDelta: 300, colorSwatch: '#18181B' },
        { id: 'bronce', name: 'Bronce Vintage', priceDelta: 300, colorSwatch: '#D97706' },
      ],
    },
    {
      key: 'estilo',
      label: 'Configuración del Par',
      choices: [
        { id: 'simetrico', name: 'Par Simétrico (2 iguales)', priceDelta: 0 },
        { id: 'asimetrico', name: 'Par Asimétrico (1+1 diferente)', priceDelta: 500 },
        { id: 'individual', name: 'Aro Individual (1 solo)', priceDelta: -1000 },
      ],
    },
  ],

  'LLAVEROS / PELUCHES': [
    {
      key: 'forma',
      label: 'Figura de la Criatura',
      choices: [
        { id: 'gato', name: 'Gato Buttoncat', priceDelta: 0 },
        { id: 'murcielago', name: 'Murciélago Kawaii', priceDelta: 600 },
        { id: 'conejito', name: 'Conejito Cosido', priceDelta: 0 },
        { id: 'osito', name: 'Osito Franken', priceDelta: 800 },
      ],
    },
    {
      key: 'cuerpo',
      label: 'Estilo de Cuerpo',
      choices: [
        { id: 'sentado', name: 'Sentado Clásico', priceDelta: 0 },
        { id: 'depie', name: 'De Pie (Chibi)', priceDelta: 500 },
        { id: 'vudu', name: 'Muñeco Vudú', priceDelta: 600 },
        { id: 'fantasma', name: 'Fantasma Flotante', priceDelta: 400 },
      ],
    },
    {
      key: 'color',
      label: 'Color de Tela',
      choices: [
        { id: 'negro', name: 'Negro Azabache', priceDelta: 0, colorSwatch: '#18181B' },
        { id: 'violeta', name: 'Violeta Neón', priceDelta: 300, colorSwatch: '#7E22CE' },
        { id: 'rosa', name: 'Rosa Pastel', priceDelta: 300, colorSwatch: '#FF007F' },
        { id: 'rojo', name: 'Rojo Sangre', priceDelta: 300, colorSwatch: '#B91C1C' },
      ],
    },
    {
      key: 'ojos',
      label: 'Ojos de Botón',
      choices: [
        { id: 'amarillos', name: 'Botones Amarillos', priceDelta: 0, colorSwatch: '#FFE600' },
        { id: 'cruz', name: 'Botones Negros Cruz', priceDelta: 300, colorSwatch: '#18181B' },
        { id: 'desparejos', name: 'Ojos Desparejos', priceDelta: 400, colorSwatch: '#00F0FF' },
      ],
    },
    {
      key: 'costuras',
      label: 'Costuras y Parches',
      choices: [
        { id: 'sin', name: 'Sin Costuras Extra', priceDelta: 0 },
        { id: 'zigzag', name: 'Costuras Zigzag', priceDelta: 200 },
        { id: 'escocesa', name: 'Parche Escocés', priceDelta: 300 },
        { id: 'magenta', name: 'Cicatriz Magenta', priceDelta: 250, colorSwatch: '#FF007F' },
      ],
    },
    {
      key: 'accesorio',
      label: 'Accesorio Extra',
      choices: [
        { id: 'sin', name: 'Sin Accesorio', priceDelta: 0 },
        { id: 'alas_bat', name: 'Alas de Murciélago (Atrás)', priceDelta: 500 },
        { id: 'alas_angel', name: 'Alas de Ángel (Atrás)', priceDelta: 500 },
        { id: 'capa', name: 'Capa Vampiro (Atrás)', priceDelta: 450 },
        { id: 'anteojos', name: 'Anteojos de Sol (Adelante)', priceDelta: 350 },
        { id: 'picos', name: 'Collar de Picos', priceDelta: 400 },
        { id: 'parche', name: 'Parche Pirata', priceDelta: 300 },
        { id: 'corazon', name: 'Corazón Colgante', priceDelta: 350, colorSwatch: '#FF007F' },
      ],
    },
  ],

  PINES: [
    {
      key: 'tamano',
      label: 'Tamaño del Pin',
      choices: [
        { id: '38mm', name: '38 mm (Standard)', priceDelta: 0 },
        { id: '55mm', name: '55 mm (Grande)', priceDelta: 400 },
        { id: '75mm', name: '75 mm (Extra Grande)', priceDelta: 800 },
      ],
    },
    {
      key: 'acabado',
      label: 'Acabado',
      choices: [
        { id: 'brillante', name: 'Brillante Clásico', priceDelta: 0, colorSwatch: '#FFE600' },
        { id: 'mate', name: 'Mate Soft-Touch', priceDelta: 300, colorSwatch: '#18181B' },
        { id: 'holografico', name: 'Holográfico Brillo', priceDelta: 600, colorSwatch: '#00F0FF' },
      ],
    },
  ],

  STICKERS: [
    {
      key: 'material',
      label: 'Material de Vinilo',
      choices: [
        { id: 'vinilo', name: 'Vinilo Impermeable', priceDelta: 0, colorSwatch: '#FFE600' },
        { id: 'holografico', name: 'Holográfico Estelar', priceDelta: 300, colorSwatch: '#00F0FF' },
        { id: 'transparente', name: 'Transparente', priceDelta: 200, colorSwatch: '#F3F4F6' },
      ],
    },
    {
      key: 'tamano',
      label: 'Tamaño',
      choices: [
        { id: 'mini', name: 'Mini (5 cm)', priceDelta: 0 },
        { id: 'standard', name: 'Standard (8 cm)', priceDelta: 200 },
        { id: 'max', name: 'Grande (12 cm)', priceDelta: 450 },
      ],
    },
    {
      key: 'corte',
      label: 'Tipo de Corte',
      choices: [
        { id: 'troquelado', name: 'Troquelado Die-Cut', priceDelta: 0 },
        { id: 'circular', name: 'Corte Circular', priceDelta: 0 },
        { id: 'rectangular', name: 'Corte Rectangular', priceDelta: 0 },
      ],
    },
    {
      key: 'laminado',
      label: 'Laminado Protector',
      choices: [
        { id: 'brillante', name: 'Glossy Brillante', priceDelta: 0 },
        { id: 'mate', name: 'Mate Soft-Touch', priceDelta: 150, colorSwatch: '#18181B' },
        { id: 'glitter', name: 'Glitter Brillos', priceDelta: 300, colorSwatch: '#FFE600' },
      ],
    },
  ],

  REMERAS: [
    {
      key: 'color',
      label: 'Color de la Remera',
      choices: [
        { id: 'negro', name: 'Negro Azabache', priceDelta: 0, colorSwatch: '#18181B' },
        { id: 'blanco', name: 'Blanco Puro', priceDelta: 0, colorSwatch: '#FFFFFF' },
        { id: 'violeta', name: 'Violeta Neón', priceDelta: 500, colorSwatch: '#7E22CE' },
        { id: 'rosa', name: 'Rosa Pastel', priceDelta: 500, colorSwatch: '#FF007F' },
      ],
    },
    {
      key: 'talle',
      label: 'Talle',
      choices: [
        { id: 's', name: 'S (Small)', priceDelta: 0 },
        { id: 'm', name: 'M (Medium)', priceDelta: 0 },
        { id: 'l', name: 'L (Large)', priceDelta: 0 },
        { id: 'xl', name: 'XL (Extra Large)', priceDelta: 600 },
      ],
    },
    {
      key: 'ubicacion',
      label: 'Ubicación de Estampa',
      choices: [
        { id: 'frente', name: 'Frente (Pecho)', priceDelta: 0 },
        { id: 'espalda', name: 'Espalda', priceDelta: 0 },
      ],
    },
  ],

  POSTERS: [
    {
      key: 'tamano',
      label: 'Tamaño de Poster',
      choices: [
        { id: 'a4', name: 'A4 (21 x 29.7 cm)', priceDelta: 0 },
        { id: 'a3', name: 'A3 (29.7 x 42 cm)', priceDelta: 1200 },
        { id: 'a2', name: 'A2 (42 x 59.4 cm)', priceDelta: 2800 },
      ],
    },
    {
      key: 'marco',
      label: 'Enmarcado',
      choices: [
        { id: 'sin', name: 'Sin Marco (Lámina Sola)', priceDelta: 0 },
        { id: 'negro', name: 'Marco Madera Negro', priceDelta: 3500 },
        { id: 'natural', name: 'Marco Madera Natural', priceDelta: 3500 },
      ],
    },
  ],

  PINTURAS: [
    {
      key: 'lienzo',
      label: 'Tamaño del Lienzo',
      choices: [
        { id: '30x40', name: '30 x 40 cm', priceDelta: 0 },
        { id: '50x70', name: '50 x 70 cm', priceDelta: 5000 },
        { id: '70x100', name: '70 x 100 cm', priceDelta: 12000 },
      ],
    },
    {
      key: 'estilo_pintura',
      label: 'Estilo de Pintura',
      choices: [
        { id: 'neon', name: 'Acrílicos Neón Glow', priceDelta: 0, colorSwatch: '#00F0FF' },
        { id: 'dark', name: 'Gothic Dark', priceDelta: 0, colorSwatch: '#B91C1C' },
        { id: 'pastel', name: 'Kawaii Pastel', priceDelta: 0, colorSwatch: '#FF007F' },
      ],
    },
  ],
};
