import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, RotateCcw, Check, Upload, Image as ImageIcon, Trash2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, ChevronDown, Gem } from 'lucide-react';
import type { CustomizableCategory, Product, CustomizationSpecs } from '../../types/types';
import { CustomProductPreview } from './CustomProductPreview';
import { CUSTOMIZABLE_CATEGORIES_DATA, CATEGORY_ICONS } from './CustomizerCatalogGrid';
import { Button } from '../ui/Button';

interface OptionChoice {
  id: string;
  name: string;
  priceDelta: number;
  colorSwatch?: string;
  iconVisual?: string;
}

interface CategoryOptionGroup {
  key: string;
  label: string;
  choices: OptionChoice[];
}

const CATEGORY_OPTIONS_MAP: Record<CustomizableCategory, CategoryOptionGroup[]> = {
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

interface ProductCustomizerStudioProps {
  category: CustomizableCategory;
  onBackToCatalog: () => void;
  onSelectCategory?: (cat: CustomizableCategory) => void;
  onAddToCartCustomized: (product: Product, specs: CustomizationSpecs) => void;
}

export const ProductCustomizerStudio: React.FC<ProductCustomizerStudioProps> = ({
  category,
  onBackToCatalog,
  onSelectCategory,
  onAddToCartCustomized,
}) => {
  const categoryMeta = CUSTOMIZABLE_CATEGORIES_DATA.find((c) => c.id === category) || CUSTOMIZABLE_CATEGORIES_DATA[0];
  const optionGroups = CATEGORY_OPTIONS_MAP[category] || CATEGORY_OPTIONS_MAP.COLLARES;

  const [activeTabKey, setActiveTabKey] = useState<string>(optionGroups[0].key);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    optionGroups.forEach((group) => {
      initial[group.key] = group.choices[0].name;
    });
    return initial;
  });

  const [customImage, setCustomImage] = useState<string | null>(null);
  const [imageTransforms, setImageTransforms] = useState({
    zoom: 100,
    posX: 0,
    posY: 0,
    rotate: 0,
  });

  React.useEffect(() => {
    if (optionGroups && optionGroups.length > 0) {
      setActiveTabKey(optionGroups[0].key);
      const initial: Record<string, string> = {};
      optionGroups.forEach((group) => {
        initial[group.key] = group.choices[0].name;
      });
      setSelectedOptions(initial);
      setCustomImage(null);
      setImageTransforms({ zoom: 100, posX: 0, posY: 0, rotate: 0 });
    }
  }, [category]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomImage(event.target.result as string);
          setImageTransforms({ zoom: 100, posX: 0, posY: 0, rotate: 0 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOptionSelect = (groupKey: string, choiceName: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupKey]: choiceName,
    }));
  };

  const handleRandomize = () => {
    const randomChoices: Record<string, string> = {};
    optionGroups.forEach((group) => {
      const randomIndex = Math.floor(Math.random() * group.choices.length);
      randomChoices[group.key] = group.choices[randomIndex].name;
    });
    setSelectedOptions(randomChoices);
  };

  const handleReset = () => {
    const initial: Record<string, string> = {};
    optionGroups.forEach((group) => {
      initial[group.key] = group.choices[0].name;
    });
    setSelectedOptions(initial);
    setCustomImage(null);
    setImageTransforms({ zoom: 100, posX: 0, posY: 0, rotate: 0 });
  };

  const calculateTotalPrice = (): number => {
    let total = categoryMeta.basePrice;
    optionGroups.forEach((group) => {
      const selectedName = selectedOptions[group.key];
      const matchChoice = group.choices.find((c) => c.name === selectedName);
      if (matchChoice) {
        total += matchChoice.priceDelta;
      }
    });
    return total;
  };

  const totalPrice = calculateTotalPrice();

  const getSummaryText = (): string => {
    const optsStr = Object.entries(selectedOptions)
      .map(([_, v]) => v)
      .join(', ');
    return customImage ? `${optsStr} (Imagen personalizada)` : optsStr;
  };

  const handleAddToCart = () => {
    const specs: CustomizationSpecs = {
      category,
      options: selectedOptions,
      calculatedPrice: totalPrice,
      summaryText: getSummaryText(),
      customImage,
      imageTransforms,
    };

    const customizedProduct: Product = {
      id: `custom-${category.toLowerCase()}-${Date.now()}`,
      name: `${categoryMeta.name} Personalizado`,
      category: category as any,
      vibe: ['KAWAII', 'GOTH', 'PUNK'],
      price: totalPrice,
      image: customImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop',
      badge: customImage ? 'DISEÑO PROPIO' : 'CUSTOM MAKER',
      badgeBg: 'bg-brand-pink',
      description: `Producto personalizado creado en Buttoncat Studio. Detalle: ${getSummaryText()}`,
      isCustomizable: true,
      stock: 99,
    };

    onAddToCartCustomized(customizedProduct, specs);
  };

  const handleRequestQuote = () => {
    alert(
      `🎨 ¡SOLICITUD DE PRESUPUESTO ENVIADA!\n\nProducto: PINTURA EN LIENZO\nDetalle: ${getSummaryText()}\n\nTe contactaremos a la brevedad con la cotización exacta.`
    );
  };

  const activeGroup = optionGroups.find((g) => g.key === activeTabKey) || optionGroups[0];
  const activeIndex = optionGroups.findIndex((g) => g.key === activeTabKey);
  const currentStepNum = activeIndex >= 0 ? activeIndex + 1 : 1;
  const totalSteps = optionGroups.length;

  const handlePrevStep = () => {
    if (activeIndex > 0) {
      setActiveTabKey(optionGroups[activeIndex - 1].key);
    }
  };

  const handleNextStep = () => {
    if (activeIndex < optionGroups.length - 1) {
      setActiveTabKey(optionGroups[activeIndex + 1].key);
    }
  };

  const supportsImageUpload = category === 'PINES' || category === 'STICKERS' || category === 'REMERAS' || category === 'POSTERS' || category === 'PINTURAS';
  const isQuoteOnly = category === 'PINTURAS';

  return (
    <div className="space-y-6 font-sans">
      
      {/* UNIFIED STUDIO HEADER BAR */}
      <div className="border-3 sm:border-4 border-black bg-white p-2.5 sm:p-4 shadow-brutal-md space-y-3 font-sans">
        
        {/* MOBILE COMPACT HEADER (SINGLE LINE) */}
        <div className="flex items-center justify-between gap-2 sm:hidden min-w-0">
          <button
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-1 bg-gray-100 border-2 border-black px-2.5 py-1 text-xs font-black uppercase text-black shadow-brutal-sm cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" /> CATÁLOGO
          </button>

          {onSelectCategory && (
            <div className="relative inline-flex items-center min-w-0 max-w-[160px] xs:max-w-[190px]">
              <select
                value={category}
                onChange={(e) => onSelectCategory(e.target.value as CustomizableCategory)}
                className="w-full bg-brand-purple text-white font-extrabold text-xs uppercase border-2 border-black pl-3 pr-7 py-1 shadow-brutal-sm cursor-pointer rounded-lg focus:outline-none appearance-none tracking-wide truncate text-center"
              >
                {CUSTOMIZABLE_CATEGORIES_DATA.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-white text-black font-bold">
                    {cat.id.split('/')[0]}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-brand-yellow stroke-[3] absolute right-2 pointer-events-none shrink-0" />
            </div>
          )}
        </div>

        {/* DESKTOP/TABLET HEADER BAR (CENTERED) */}
        <div className="hidden sm:flex items-center justify-between relative min-h-[40px] gap-3">
          <button
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-brand-yellow border-2 border-black px-3 py-1.5 text-xs font-black uppercase text-black transition-all shadow-brutal-sm cursor-pointer shrink-0 z-10"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> VOLVER AL CATÁLOGO
          </button>

          <div className="sm:absolute sm:inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              {(() => {
                const IconComponent = CATEGORY_ICONS[category] || Gem;
                return <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-brand-purple shrink-0 stroke-[2.5]" />;
              })()}
              <h2 className="text-sm sm:text-lg md:text-xl font-extrabold uppercase text-black font-display tracking-wide">
                PERSONALIZANDO: {categoryMeta.name}
              </h2>
            </div>
          </div>
        </div>

        {/* DESKTOP CATEGORY SWITCHER TABS (CENTERED SINGLE ROW) */}
        {onSelectCategory && (
          <div className="hidden sm:flex pt-2.5 border-t-2 border-black/10 items-center justify-center overflow-x-auto no-scrollbar">
            <div className="flex flex-nowrap items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
              {CUSTOMIZABLE_CATEGORIES_DATA.map((cat) => {
                const isActive = category === cat.id;
                const IconComp = CATEGORY_ICONS[cat.id] || Gem;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase border-2 border-black rounded-lg transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-brand-purple text-white shadow-brutal-sm scale-105'
                        : 'bg-gray-100 text-black hover:bg-brand-yellow'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{cat.id.split('/')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* STUDIO LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* LEFT COLUMN: LIVE PREVIEW & FINAL CHECKOUT (STICKY ON MOBILE & DESKTOP) */}
        <div className="lg:col-span-5 space-y-4 lg:space-y-6 sticky top-20 lg:top-24 z-30 bg-[#FDFBF7]/95 backdrop-blur-md pb-3 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 border-b-4 lg:border-b-0 border-black shadow-md lg:shadow-none transition-all">
          
          <CustomProductPreview
            category={category}
            options={selectedOptions}
            customImage={customImage}
            imageTransforms={imageTransforms}
            onRandomize={handleRandomize}
            onReset={handleReset}
            onUpdateTransforms={setImageTransforms}
          />

          {/* TOTAL PRICE & ACTION BUTTON (DESKTOP ONLY) */}
          <div className="hidden lg:block border-4 border-black bg-white p-5 shadow-brutal-lg space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-2 lg:pb-3">
              <span className="text-[11px] lg:text-xs font-black uppercase text-gray-600">PRECIO FINAL</span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-black font-display">
                {isQuoteOnly ? 'A PRESUPUESTAR' : `$${totalPrice.toLocaleString()}`}
              </span>
            </div>

            {/* SELECTION SUMMARY LIST */}
            <div className="bg-yellow-50 border border-black lg:border-2 p-2 lg:p-3 space-y-0.5 lg:space-y-1 text-[11px] lg:text-xs">
              <span className="font-black uppercase text-black block mb-0.5">
                RESUMEN DE TU DISEÑO:
              </span>
              <p className="font-bold text-gray-700 leading-tight lg:leading-snug truncate sm:whitespace-normal">
                {getSummaryText()}
              </p>
            </div>

            {/* CTA BUTTON */}
            {isQuoteOnly ? (
              <Button
                variant="yellow"
                size="lg"
                fullWidth
                onClick={handleRequestQuote}
                className="py-2.5 lg:py-3.5 text-xs lg:text-sm font-black"
              >
                📋 SOLICITAR PRESUPUESTO
              </Button>
            ) : (
              <Button
                variant="pink"
                size="lg"
                fullWidth
                onClick={handleAddToCart}
                className="py-2.5 lg:py-3.5 text-xs lg:text-sm font-black"
              >
                <ShoppingBag className="w-4 h-4 lg:w-5 lg:h-5 mr-1.5 lg:mr-2 stroke-[2.5]" />
                AÑADIR AL CARRITO
              </Button>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: SIMPLE STEPS & OPTIONS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* IMAGE UPLOAD SECTION IF APPLICABLE */}
          {supportsImageUpload && (
            <div className="border-4 border-black bg-brand-cyanLight p-4 shadow-brutal-md space-y-3">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-black stroke-[2.5]" />
                  <h3 className="text-sm font-black uppercase text-black font-display">
                    SUBIR TU IMAGEN O DISEÑO
                  </h3>
                </div>
                {customImage && (
                  <button
                    onClick={() => setCustomImage(null)}
                    className="text-xs font-black text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Borrar imagen
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="relative border-3 border-dashed border-black bg-white p-3 text-center cursor-pointer hover:bg-yellow-50 transition-all shadow-brutal-sm">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex items-center justify-center gap-2 text-black">
                    <Upload className="w-5 h-5 text-brand-purple stroke-[2.5]" />
                    <span className="text-xs font-black uppercase">
                      {customImage ? 'CAMBIAR IMAGEN CARGADA' : 'HAZ CLIC AQUÍ PARA SUBIR TU FOTO O DIBUJO'}
                    </span>
                  </div>
                </div>

                {/* FULL POSITION (X, Y), ZOOM & ROTATION CONTROLS */}
                {customImage && (
                  <div className="bg-white border-2 border-black p-3 space-y-3 text-xs font-bold shadow-brutal-sm">
                    <div className="flex items-center justify-between border-b border-black pb-1.5">
                      <span className="font-black uppercase text-black text-[11px]">
                        AJUSTAR IMAGEN EN EL PRODUCTO
                      </span>
                      <button
                        type="button"
                        onClick={() => setImageTransforms({ zoom: 100, posX: 0, posY: 0, rotate: 0 })}
                        className="text-[10px] font-black text-brand-purple hover:underline cursor-pointer uppercase flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Recentrar Imagen
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* EJE X (HORIZONTAL) */}
                      <div className="space-y-1 bg-yellow-50/60 p-2 border border-black">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                          <span>EJE X (Horizontal):</span>
                          <span className="font-mono">{imageTransforms.posX > 0 ? `+${imageTransforms.posX}` : imageTransforms.posX}px</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setImageTransforms((prev) => ({ ...prev, posX: prev.posX - 10 }))}
                            className="px-2 py-1 bg-white border border-black font-black text-xs hover:bg-brand-yellow cursor-pointer shadow-brutal-sm"
                            title="Mover Izquierda"
                          >
                            ←
                          </button>
                          <input
                            type="range"
                            min="-120"
                            max="120"
                            step="2"
                            value={imageTransforms.posX}
                            onChange={(e) => setImageTransforms((prev) => ({ ...prev, posX: Number(e.target.value) }))}
                            className="w-full accent-black cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => setImageTransforms((prev) => ({ ...prev, posX: prev.posX + 10 }))}
                            className="px-2 py-1 bg-white border border-black font-black text-xs hover:bg-brand-yellow cursor-pointer shadow-brutal-sm"
                            title="Mover Derecha"
                          >
                            →
                          </button>
                        </div>
                      </div>

                      {/* EJE Y (VERTICAL) */}
                      <div className="space-y-1 bg-pink-50/60 p-2 border border-black">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                          <span>EJE Y (Vertical):</span>
                          <span className="font-mono">{imageTransforms.posY > 0 ? `+${imageTransforms.posY}` : imageTransforms.posY}px</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setImageTransforms((prev) => ({ ...prev, posY: prev.posY - 10 }))}
                            className="px-2 py-1 bg-white border border-black font-black text-xs hover:bg-brand-pink hover:text-white cursor-pointer shadow-brutal-sm"
                            title="Mover Arriba"
                          >
                            ↑
                          </button>
                          <input
                            type="range"
                            min="-120"
                            max="120"
                            step="2"
                            value={imageTransforms.posY}
                            onChange={(e) => setImageTransforms((prev) => ({ ...prev, posY: Number(e.target.value) }))}
                            className="w-full accent-black cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => setImageTransforms((prev) => ({ ...prev, posY: prev.posY + 10 }))}
                            className="px-2 py-1 bg-white border border-black font-black text-xs hover:bg-brand-pink hover:text-white cursor-pointer shadow-brutal-sm"
                            title="Mover Abajo"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-200">
                      {/* ZOOM / TAMAÑO */}
                      <div className="flex items-center justify-between gap-2 bg-cyan-50/60 p-2 border border-black">
                        <span className="text-[10px] font-black uppercase text-black">TAMAÑO (ZOOM):</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setImageTransforms((prev) => ({ ...prev, zoom: Math.max(30, prev.zoom - 15) }))}
                            className="px-2 py-0.5 bg-white border border-black font-black text-xs hover:bg-yellow-200 cursor-pointer shadow-brutal-sm"
                          >
                            <ZoomOut className="w-3 h-3" />
                          </button>
                          <span className="w-10 text-center font-black text-xs font-mono">{imageTransforms.zoom}%</span>
                          <button
                            type="button"
                            onClick={() => setImageTransforms((prev) => ({ ...prev, zoom: Math.min(250, prev.zoom + 15) }))}
                            className="px-2 py-0.5 bg-white border border-black font-black text-xs hover:bg-yellow-200 cursor-pointer shadow-brutal-sm"
                          >
                            <ZoomIn className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* ROTACIÓN */}
                      <div className="flex items-center justify-between gap-2 bg-purple-50/60 p-2 border border-black">
                        <span className="text-[10px] font-black uppercase text-black">ROTACIÓN:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setImageTransforms((prev) => ({ ...prev, rotate: (prev.rotate - 15 + 360) % 360 }))}
                            className="px-2 py-0.5 bg-white border border-black font-black text-xs hover:bg-brand-cyan cursor-pointer shadow-brutal-sm"
                            title="Girar 15° Izquierda"
                          >
                            ↺
                          </button>
                          <span className="w-10 text-center font-black text-xs font-mono">{imageTransforms.rotate}°</span>
                          <button
                            type="button"
                            onClick={() => setImageTransforms((prev) => ({ ...prev, rotate: (prev.rotate + 15) % 360 }))}
                            className="px-2 py-0.5 bg-white border border-black font-black text-xs hover:bg-brand-cyan cursor-pointer shadow-brutal-sm"
                            title="Girar 15° Derecha"
                          >
                            ↻
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 1: OPTIONS STEPPER BOX */}
          <div className="border-4 border-black bg-white shadow-brutal-lg overflow-hidden">
            
            {/* STEP INDICATOR BAR FOR MOBILE & DESKTOP */}
            <div className="bg-yellow-100 border-b-3 border-black p-2.5 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
              <span className="text-xs font-black uppercase text-black font-display">
                PASO {currentStepNum} DE {totalSteps}: {activeGroup.label.toUpperCase()}
              </span>

              {/* MOBILE SELECT DROPDOWN FOR DIRECT JUMP */}
              <div className="w-full sm:w-auto block sm:hidden">
                <select
                  value={activeTabKey}
                  onChange={(e) => setActiveTabKey(e.target.value)}
                  className="w-full bg-white border-2 border-black px-2.5 py-1.5 text-xs font-black uppercase shadow-brutal-sm cursor-pointer"
                >
                  {optionGroups.map((group, idx) => (
                    <option key={group.key} value={group.key}>
                      Paso {idx + 1}: {group.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* DESKTOP/TABLET TABS HEADER */}
            <div className="bg-gray-100 border-b-3 border-black p-2 hidden sm:flex items-center gap-2 overflow-x-auto">
              {optionGroups.map((group, idx) => {
                const isActive = activeTabKey === group.key;
                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => setActiveTabKey(group.key)}
                    className={`px-3 py-2 border-2 border-black text-xs font-black uppercase transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-brand-pink text-white shadow-brutal-sm'
                        : 'bg-white text-black hover:bg-yellow-200'
                    }`}
                  >
                    {idx + 1}. {group.label}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT GRID */}
            <div className="p-4 sm:p-5 space-y-4">
              <h4 className="text-xs sm:text-sm font-black uppercase text-black border-b-2 border-black pb-2">
                SELECCIONA {activeGroup.label.toUpperCase()}:
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {activeGroup.choices.map((choice) => {
                  const isSelected = selectedOptions[activeGroup.key] === choice.name;

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => handleOptionSelect(activeGroup.key, choice.name)}
                      className={`border-3 border-black p-2.5 sm:p-3 flex flex-col items-center justify-between text-center transition-all cursor-pointer relative min-h-[95px] touch-manipulation ${
                        isSelected
                          ? 'bg-brand-yellow text-black border-black shadow-brutal-md ring-2 ring-brand-pink font-black scale-[1.02]'
                          : 'bg-white text-black hover:bg-yellow-50 shadow-brutal-sm'
                      }`}
                    >
                      {/* ICON OR SWATCH */}
                      <div className="my-auto">
                        {choice.colorSwatch ? (
                          <div
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-black shadow-brutal-sm mx-auto mb-1"
                            style={{ backgroundColor: choice.colorSwatch }}
                          />
                        ) : choice.iconVisual ? (
                          <div className="text-xl sm:text-2xl mb-1">{choice.iconVisual}</div>
                        ) : null}
                      </div>

                      {/* TITLE & PRICE DELTA */}
                      <div>
                        <span className="text-[11px] sm:text-xs font-black uppercase block leading-tight">
                          {choice.name}
                        </span>
                        {choice.priceDelta !== 0 && (
                          <span className="text-[10px] font-extrabold uppercase text-brand-purple block mt-0.5">
                            {choice.priceDelta > 0 ? `+$${choice.priceDelta}` : `-$${Math.abs(choice.priceDelta)}`}
                          </span>
                        )}
                      </div>

                      {/* SELECTED CHECKMARK */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-black text-brand-yellow flex items-center justify-center rounded-none">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* BOTTOM STEP NAVIGATION BUTTONS */}
              <div className="flex items-center justify-between pt-3 border-t-2 border-black gap-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={activeIndex === 0}
                  className="px-3 py-2 text-xs font-black bg-white border-2 border-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-yellow transition-all shadow-brutal-sm uppercase flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> OPCIÓN ANTERIOR
                </button>

                {activeIndex < totalSteps - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-4 py-2 text-xs font-black bg-brand-pink text-white border-2 border-black hover:bg-black transition-colors shadow-brutal-sm uppercase flex items-center gap-1 cursor-pointer"
                  >
                    SIGUIENTE OPCIÓN <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-xs font-black text-green-700 bg-green-100 border border-green-700 px-2.5 py-1 uppercase">
                    ✓ ÚLTIMA OPCIÓN
                  </span>
                )}
              </div>

            </div>

          </div>

          {/* MOBILE ONLY: FINAL PRICE & ACTION BUTTON AT THE VERY BOTTOM OF THE PAGE */}
          <div className="block lg:hidden border-4 border-black bg-white p-4 shadow-brutal-lg space-y-3 mt-6">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <span className="text-xs font-black uppercase text-gray-600">PRECIO FINAL</span>
              <span className="text-2xl font-extrabold text-black font-display">
                {isQuoteOnly ? 'A PRESUPUESTAR' : `$${totalPrice.toLocaleString()}`}
              </span>
            </div>

            {/* SELECTION SUMMARY LIST */}
            <div className="bg-yellow-50 border-2 border-black p-3 space-y-1 text-xs">
              <span className="font-black uppercase text-black block mb-0.5">
                RESUMEN DE TU DISEÑO:
              </span>
              <p className="font-bold text-gray-700 leading-snug">
                {getSummaryText()}
              </p>
            </div>

            {/* CTA BUTTON */}
            {isQuoteOnly ? (
              <Button
                variant="yellow"
                size="lg"
                fullWidth
                onClick={handleRequestQuote}
                className="py-3 text-xs font-black"
              >
                📋 SOLICITAR PRESUPUESTO
              </Button>
            ) : (
              <Button
                variant="pink"
                size="lg"
                fullWidth
                onClick={handleAddToCart}
                className="py-3.5 text-sm font-black"
              >
                <ShoppingBag className="w-5 h-5 mr-2 stroke-[2.5]" />
                AÑADIR AL CARRITO
              </Button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
