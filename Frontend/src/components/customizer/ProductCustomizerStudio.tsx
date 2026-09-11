import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, RotateCcw, Check, Upload, Image as ImageIcon, Trash2, Dices, ZoomIn, ZoomOut } from 'lucide-react';
import type { CustomizableCategory, Product, CustomizationSpecs } from '../../types/types';
import { CustomProductPreview } from './CustomProductPreview';
import { CUSTOMIZABLE_CATEGORIES_DATA } from './CustomizerCatalogGrid';
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
        { id: 'gargantilla', name: 'Gargantilla Negro Velvet', priceDelta: 0, colorSwatch: '#18181B', iconVisual: '🎗️' },
        { id: 'eslabon', name: 'Eslabón Grueso Gothic', priceDelta: 800, colorSwatch: '#71717A', iconVisual: '⛓️' },
        { id: 'fina', name: 'Cadena Fina Acero 316L', priceDelta: 500, colorSwatch: '#E5E7EB', iconVisual: '✨' },
        { id: 'cuero', name: 'Cordón de Cuero Negro', priceDelta: 0, colorSwatch: '#27272A', iconVisual: '🖤' },
      ],
    },
    {
      key: 'dije',
      label: 'Dije Principal',
      choices: [
        { id: 'gatito', name: 'Gatito Buttoncat', priceDelta: 0, iconVisual: '🐱' },
        { id: 'cruz', name: 'Cruz Gothic Magenta', priceDelta: 600, iconVisual: '✝️', colorSwatch: '#FF007F' },
        { id: 'corazon', name: 'Corazón Espinado', priceDelta: 700, iconVisual: '🖤', colorSwatch: '#B91C1C' },
        { id: 'ojo', name: 'Ojo Místico Neón', priceDelta: 650, iconVisual: '👁️', colorSwatch: '#00F0FF' },
        { id: 'luna', name: 'Luna Carmesí', priceDelta: 500, iconVisual: '🌙', colorSwatch: '#E11D48' },
        { id: 'calavera', name: 'Calavera de Acero', priceDelta: 800, iconVisual: '💀', colorSwatch: '#9CA3AF' },
      ],
    },
    {
      key: 'metal',
      label: 'Acabado de Metal',
      choices: [
        { id: 'plateado', name: 'Plateado Brillante', priceDelta: 0, colorSwatch: '#E5E7EB', iconVisual: '⚪' },
        { id: 'negro', name: 'Negro Mate Oxidado', priceDelta: 400, colorSwatch: '#18181B', iconVisual: '⚫' },
        { id: 'bronce', name: 'Bronce Vintage', priceDelta: 300, colorSwatch: '#D97706', iconVisual: '🟡' },
      ],
    },
    {
      key: 'largo',
      label: 'Largo de Cadena',
      choices: [
        { id: '40cm', name: '40 cm (Corto)', priceDelta: 0, iconVisual: '📏' },
        { id: '45cm', name: '45 cm (Standard)', priceDelta: 0, iconVisual: '📏' },
        { id: '50cm', name: '50 cm (Largo)', priceDelta: 0, iconVisual: '📏' },
        { id: '60cm', name: '60 cm (Extra Largo)', priceDelta: 300, iconVisual: '📏' },
      ],
    },
  ],

  ARITOS: [
    {
      key: 'dije',
      label: 'Dije Colgante',
      choices: [
        { id: 'gatito', name: 'Gatito Buttoncat', priceDelta: 0, iconVisual: '🐱' },
        { id: 'murcielago', name: 'Murciélago Kawaii', priceDelta: 0, iconVisual: '🦇' },
        { id: 'corazon', name: 'Corazón Sangrante', priceDelta: 0, iconVisual: '💔', colorSwatch: '#FF007F' },
        { id: 'imperdible', name: 'Imperdible con Perla', priceDelta: 400, iconVisual: '🧷' },
        { id: 'telarana', name: 'Telaraña Gótica', priceDelta: 300, iconVisual: '🕸️' },
      ],
    },
    {
      key: 'anzuelo',
      label: 'Tipo de Enganche',
      choices: [
        { id: 'acero', name: 'Acero Quirúrgico 316L', priceDelta: 0, colorSwatch: '#9CA3AF', iconVisual: '⚡' },
        { id: 'plata925', name: 'Plata 925 Certificada', priceDelta: 2500, colorSwatch: '#F3F4F6', iconVisual: '💎' },
        { id: 'clip', name: 'Clip (Sin Perforación)', priceDelta: 500, colorSwatch: '#FFE600', iconVisual: '🧲' },
      ],
    },
    {
      key: 'estilo',
      label: 'Configuración del Par',
      choices: [
        { id: 'simetrico', name: 'Par Simétrico (2 iguales)', priceDelta: 0, iconVisual: '👥' },
        { id: 'asimetrico', name: 'Par Asimétrico (1+1 diferente)', priceDelta: 500, iconVisual: '☯️' },
        { id: 'individual', name: 'Aro Individual (1 solo)', priceDelta: -1000, iconVisual: '👤' },
      ],
    },
  ],

  'LLAVEROS / PELUCHES': [
    {
      key: 'forma',
      label: 'Figura de la Criatura',
      choices: [
        { id: 'gato', name: 'Gato Buttoncat', priceDelta: 0, iconVisual: '🐱' },
        { id: 'murcielago', name: 'Murciélago Kawaii', priceDelta: 600, iconVisual: '🦇' },
        { id: 'conejito', name: 'Conejito Cosido', priceDelta: 0, iconVisual: '🐰' },
        { id: 'osito', name: 'Osito Franken', priceDelta: 800, iconVisual: '🧸' },
      ],
    },
    {
      key: 'color',
      label: 'Color de Tela',
      choices: [
        { id: 'negro', name: 'Negro Azabache', priceDelta: 0, colorSwatch: '#18181B', iconVisual: '⚫' },
        { id: 'violeta', name: 'Violeta Neón', priceDelta: 300, colorSwatch: '#7E22CE', iconVisual: '🟣' },
        { id: 'rosa', name: 'Rosa Pastel', priceDelta: 300, colorSwatch: '#FF007F', iconVisual: '🩷' },
        { id: 'rojo', name: 'Rojo Sangre', priceDelta: 300, colorSwatch: '#B91C1C', iconVisual: '🔴' },
      ],
    },
    {
      key: 'ojos',
      label: 'Ojos de Botón',
      choices: [
        { id: 'amarillos', name: 'Botones Amarillos', priceDelta: 0, colorSwatch: '#FFE600', iconVisual: '🟡' },
        { id: 'cruz', name: 'Botones Negros Cruz', priceDelta: 300, colorSwatch: '#18181B', iconVisual: '✖️' },
        { id: 'desparejos', name: 'Ojos Desparejos', priceDelta: 400, colorSwatch: '#00F0FF', iconVisual: '👁️' },
      ],
    },
  ],

  PINES: [
    {
      key: 'tamano',
      label: 'Tamaño del Pin',
      choices: [
        { id: '38mm', name: '38 mm (Standard)', priceDelta: 0, iconVisual: '🔘' },
        { id: '55mm', name: '55 mm (Grande)', priceDelta: 400, iconVisual: '🟣' },
        { id: '75mm', name: '75 mm (Extra Grande)', priceDelta: 800, iconVisual: '🟡' },
      ],
    },
    {
      key: 'acabado',
      label: 'Acabado',
      choices: [
        { id: 'brillante', name: 'Brillante Clásico', priceDelta: 0, colorSwatch: '#FFE600', iconVisual: '✨' },
        { id: 'mate', name: 'Mate Soft-Touch', priceDelta: 300, colorSwatch: '#18181B', iconVisual: '🖤' },
        { id: 'holografico', name: 'Holográfico Brillo', priceDelta: 600, colorSwatch: '#00F0FF', iconVisual: '🌌' },
      ],
    },
  ],

  STICKERS: [
    {
      key: 'material',
      label: 'Material de Vinilo',
      choices: [
        { id: 'vinilo', name: 'Vinilo Impermeable', priceDelta: 0, colorSwatch: '#FFE600', iconVisual: '🌧️' },
        { id: 'holografico', name: 'Holográfico Estelar', priceDelta: 300, colorSwatch: '#00F0FF', iconVisual: '🌌' },
        { id: 'transparente', name: 'Transparente', priceDelta: 200, colorSwatch: '#F3F4F6', iconVisual: '🔳' },
      ],
    },
    {
      key: 'tamano',
      label: 'Tamaño',
      choices: [
        { id: 'mini', name: 'Mini (5 cm)', priceDelta: 0, iconVisual: '📏' },
        { id: 'standard', name: 'Standard (8 cm)', priceDelta: 200, iconVisual: '📏' },
        { id: 'max', name: 'Grande (12 cm)', priceDelta: 450, iconVisual: '📏' },
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
        { id: 'a4', name: 'A4 (21 x 29.7 cm)', priceDelta: 0, iconVisual: '📏' },
        { id: 'a3', name: 'A3 (29.7 x 42 cm)', priceDelta: 1200, iconVisual: '📏' },
        { id: 'a2', name: 'A2 (42 x 59.4 cm)', priceDelta: 2800, iconVisual: '📏' },
      ],
    },
    {
      key: 'marco',
      label: 'Enmarcado',
      choices: [
        { id: 'sin', name: 'Sin Marco (Lámina Sola)', priceDelta: 0, iconVisual: '❌' },
        { id: 'negro', name: 'Marco Madera Negro', priceDelta: 3500, iconVisual: '🖼️' },
        { id: 'natural', name: 'Marco Madera Natural', priceDelta: 3500, iconVisual: '🖼️' },
      ],
    },
  ],

  PINTURAS: [
    {
      key: 'lienzo',
      label: 'Tamaño del Lienzo',
      choices: [
        { id: '30x40', name: '30 x 40 cm', priceDelta: 0, iconVisual: '📏' },
        { id: '50x70', name: '50 x 70 cm', priceDelta: 5000, iconVisual: '📏' },
        { id: '70x100', name: '70 x 100 cm', priceDelta: 12000, iconVisual: '📏' },
      ],
    },
    {
      key: 'estilo_pintura',
      label: 'Estilo de Pintura',
      choices: [
        { id: 'neon', name: 'Acrílicos Neón Glow', priceDelta: 0, colorSwatch: '#00F0FF', iconVisual: '💡' },
        { id: 'dark', name: 'Gothic Dark', priceDelta: 0, colorSwatch: '#B91C1C', iconVisual: '🖤' },
        { id: 'pastel', name: 'Kawaii Pastel', priceDelta: 0, colorSwatch: '#FF007F', iconVisual: '🩷' },
      ],
    },
  ],
};

interface ProductCustomizerStudioProps {
  category: CustomizableCategory;
  onBackToCatalog: () => void;
  onAddToCartCustomized: (product: Product, specs: CustomizationSpecs) => void;
}

export const ProductCustomizerStudio: React.FC<ProductCustomizerStudioProps> = ({
  category,
  onBackToCatalog,
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
  const supportsImageUpload = category === 'PINES' || category === 'STICKERS' || category === 'REMERAS' || category === 'POSTERS' || category === 'PINTURAS';
  const isQuoteOnly = category === 'PINTURAS';

  return (
    <div className="space-y-6 font-sans">
      
      {/* SIMPLE HEADER BAR */}
      <div className="flex items-center justify-between border-b-4 border-black pb-4 gap-4">
        <button
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-2 bg-white border-3 border-black px-3.5 py-1.5 text-xs font-black uppercase text-black hover:bg-brand-yellow transition-all shadow-brutal-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> ELEGIR OTRO PRODUCTO
        </button>

        <h2 className="text-xl sm:text-3xl font-extrabold uppercase text-black font-display">
          PERSONALIZANDO: {categoryMeta.name}
        </h2>

        <div className="flex items-center gap-2">
          {!supportsImageUpload && (
            <button
              onClick={handleRandomize}
              className="hidden sm:inline-flex items-center gap-1.5 bg-brand-yellow border-2 border-black px-3 py-1.5 text-xs font-black uppercase text-black hover:bg-brand-pink hover:text-white transition-all shadow-brutal-sm cursor-pointer"
            >
              <Dices className="w-4 h-4" /> ME SIENTO CON SUERTE
            </button>
          )}

          <button
            onClick={handleReset}
            className="p-1.5 bg-gray-100 border-2 border-black text-black hover:bg-red-200 transition-colors cursor-pointer"
            title="Reiniciar diseño"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* STUDIO LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: LIVE PREVIEW & FINAL CHECKOUT */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          <CustomProductPreview
            category={category}
            options={selectedOptions}
            customImage={customImage}
            imageTransforms={imageTransforms}
          />

          {/* TOTAL PRICE & ACTION BUTTON */}
          <div className="border-4 border-black bg-white p-5 shadow-brutal-lg space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <span className="text-xs font-black uppercase text-gray-600">PRECIO FINAL</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-black font-display">
                {isQuoteOnly ? 'A PRESUPUESTAR' : `$${totalPrice.toLocaleString()}`}
              </span>
            </div>

            {/* SELECTION SUMMARY LIST */}
            <div className="bg-yellow-50 border-2 border-black p-3 space-y-1 text-xs">
              <span className="font-black uppercase text-black block mb-1">
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
                className="py-3.5 text-sm font-black"
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

                {/* SIMPLE ZOOM & ROTATION CONTROLS */}
                {customImage && (
                  <div className="bg-white border-2 border-black p-3 space-y-2 text-xs font-bold shadow-brutal-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-black uppercase text-black">TAMAÑO:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setImageTransforms((prev) => ({ ...prev, zoom: Math.max(30, prev.zoom - 15) }))}
                          className="px-2 py-1 bg-gray-200 border border-black font-black text-xs hover:bg-yellow-200 cursor-pointer"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-12 text-center font-black">{imageTransforms.zoom}%</span>
                        <button
                          type="button"
                          onClick={() => setImageTransforms((prev) => ({ ...prev, zoom: Math.min(250, prev.zoom + 15) }))}
                          className="px-2 py-1 bg-gray-200 border border-black font-black text-xs hover:bg-yellow-200 cursor-pointer"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 1: OPTIONS STEPPER BOX */}
          <div className="border-4 border-black bg-white shadow-brutal-lg overflow-hidden">
            
            {/* TABS HEADER */}
            <div className="bg-gray-100 border-b-3 border-black p-2 flex items-center gap-2 overflow-x-auto">
              {optionGroups.map((group) => {
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
                    {group.label}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT GRID */}
            <div className="p-5 space-y-4">
              <h4 className="text-sm font-black uppercase text-black border-b-2 border-black pb-2">
                SELECCIONA {activeGroup.label.toUpperCase()}:
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeGroup.choices.map((choice) => {
                  const isSelected = selectedOptions[activeGroup.key] === choice.name;

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => handleOptionSelect(activeGroup.key, choice.name)}
                      className={`border-3 border-black p-3 flex flex-col items-center justify-between text-center transition-all cursor-pointer relative min-h-[90px] ${
                        isSelected
                          ? 'bg-brand-yellow text-black border-black shadow-brutal-md ring-2 ring-brand-pink font-black scale-[1.02]'
                          : 'bg-white text-black hover:bg-yellow-50 shadow-brutal-sm'
                      }`}
                    >
                      {/* ICON OR SWATCH */}
                      <div className="my-auto">
                        {choice.colorSwatch ? (
                          <div
                            className="w-8 h-8 rounded-full border-2 border-black shadow-brutal-sm mx-auto mb-1"
                            style={{ backgroundColor: choice.colorSwatch }}
                          />
                        ) : choice.iconVisual ? (
                          <div className="text-2xl mb-1">{choice.iconVisual}</div>
                        ) : null}
                      </div>

                      {/* TITLE & PRICE DELTA */}
                      <div>
                        <span className="text-xs font-black uppercase block leading-tight">
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
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
