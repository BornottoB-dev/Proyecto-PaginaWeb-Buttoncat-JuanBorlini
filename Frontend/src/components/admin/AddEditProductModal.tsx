import React, { useState, useEffect } from 'react';
import { 
  Save, 
  PlusCircle, 
  Sparkles, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight,
  Package, 
  Image as ImageIcon,
  SlidersHorizontal
} from 'lucide-react';
import type { Product, ProductVibe, CategoryItem, BadgeItem, ProductVariationGroup } from '../../types/types';
import { getDefaultVariationsForCategory, calculateTotalProductStock } from '../../types/types';
import { ProductVariationsMatrixModal } from './ProductVariationsMatrixModal';

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
  categories: CategoryItem[];
  tags?: BadgeItem[];
  isDarkMode?: boolean;
  onOpenVariationsMatrix?: (product: Product) => void;
}

const ALL_VIBES: ProductVibe[] = ['GOTH', 'Y2K', 'KAWAII', 'PUNK', 'ROCK', 'NEÓN'];
const DEFAULT_BADGE_LIST = ['¡NUEVO!', 'TOP SALES', 'OFERTA', 'EDICIÓN LIMITADA', 'ARTESANAL', 'BESTSELLER', 'NUEVO DROP', 'HOLO'];

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  categories,
  tags,
  isDarkMode = true,
  onOpenVariationsMatrix,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [image, setImage] = useState('');
  const [stock, setStock] = useState<number>(10);
  const [isUnique, setIsUnique] = useState<boolean>(false);
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [badgeId, setBadgeId] = useState('');
  const [badgeBg, setBadgeBg] = useState('bg-brand-orange text-white');
  const [selectedVibes, setSelectedVibes] = useState<ProductVibe[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Variaciones y Matriz
  const [variations, setVariations] = useState<ProductVariationGroup[]>([]);
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({});
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);

  // Atributos adicionales de producto
  const [sku, setSku] = useState('');
  const [dateAdded, setDateAdded] = useState('');
  const [salesChannel, setSalesChannel] = useState<'AMBOS' | 'SOLO_WEB' | 'SOLO_LOCAL'>('AMBOS');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [material, setMaterial] = useState('');

  useEffect(() => {
    setErrorMessage(null);
    setStep(1);
    const today = new Date().toISOString().split('T')[0];
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setPrice(productToEdit.price);
      setOriginalPrice(productToEdit.originalPrice || '');
      setImage(productToEdit.image || '');
      setStock(productToEdit.stock);
      setIsUnique(!!productToEdit.isUnique);
      setDescription(productToEdit.description);
      setBadge(productToEdit.badge || '');
      setBadgeId(productToEdit.badgeId || '');
      setBadgeBg(productToEdit.badgeBg || 'bg-brand-orange text-white');
      setSelectedVibes(productToEdit.vibe || []);
      
      const initialVars = (productToEdit.variations && productToEdit.variations.length > 0)
        ? productToEdit.variations
        : getDefaultVariationsForCategory(productToEdit.category);
      setVariations(initialVars);
      setVariantStocks(productToEdit.variantStocks ? { ...productToEdit.variantStocks } : {});

      setSku(productToEdit.sku || `BTC-${Math.floor(100 + Math.random() * 900)}`);
      setDateAdded(productToEdit.dateAdded || today);
      setSalesChannel(productToEdit.salesChannel || 'AMBOS');
      setCostPrice(productToEdit.costPrice || '');
      setMaterial(productToEdit.material || '');
    } else {
      const defaultCat = categories[0]?.name || 'STICKERS';
      setName('');
      setCategory(defaultCat);
      setPrice('');
      setOriginalPrice('');
      setImage('');
      setStock(15);
      setIsUnique(false);
      setDescription('');
      setBadge('');
      setBadgeId('');
      setBadgeBg('bg-brand-orange text-white');
      setSelectedVibes(['KAWAII']);
      setVariations(getDefaultVariationsForCategory(defaultCat));
      setVariantStocks({});
      setSku(`BTC-${Math.floor(100 + Math.random() * 900)}`);
      setDateAdded(today);
      setSalesChannel('AMBOS');
      setCostPrice('');
      setMaterial('');
    }
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const stepsList = [
    { num: 1, title: 'DATOS Y PRECIOS', icon: Package },
    { num: 2, title: 'MULTIMEDIA Y ESTILOS', icon: ImageIcon },
  ];

  const maxStep = stepsList.length;

  const handleNextStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage(null);

    if (step === 1) {
      if (!name.trim()) {
        setErrorMessage('El nombre del producto es obligatorio (Paso 1).');
        return;
      }
      if (price === '' || isNaN(Number(price)) || Number(price) < 0) {
        setErrorMessage('Debes ingresar un precio público válido (Paso 1).');
        return;
      }
      setStep(2);
    }
  };

  const handlePrevStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage(null);
    setStep(1);
  };

  const handleVibeToggle = (vibe: ProductVibe) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim().toUpperCase();
    if (!cleanName) {
      setErrorMessage('El nombre del producto es obligatorio (Paso 1).');
      setStep(1);
      return;
    }

    if (price === '' || isNaN(Number(price)) || Number(price) < 0) {
      setErrorMessage('Debes ingresar un precio público válido (Paso 1).');
      setStep(1);
      return;
    }

    const cleanImage = image.trim();
    if (!cleanImage) {
      setErrorMessage('Es obligatorio ingresar la URL de la imagen del producto (Paso 2).');
      setStep(2);
      return;
    }

    const tempProdForStock: Product = {
      id: productToEdit ? productToEdit.id : 'temp',
      name: cleanName,
      category: category.trim().toUpperCase(),
      vibe: selectedVibes,
      price: Number(price),
      image: cleanImage,
      description: '',
      isCustomizable: false,
      stock: Number(stock) || 0,
      variations: isUnique ? undefined : variations,
      variantStocks: isUnique ? undefined : variantStocks,
    };
    const calculatedStock = isUnique ? 1 : calculateTotalProductStock(tempProdForStock);

    const isDiscounted = originalPrice ? Number(originalPrice) > Number(price) : false;
    const finalBadgeId = badgeId || (isDiscounted && !badge.trim() ? 'tag-3' : undefined);

    const newProduct: Product = {
      id: productToEdit ? productToEdit.id : `prod-${Date.now()}`,
      name: cleanName,
      category: category.trim().toUpperCase(),
      vibe: selectedVibes.length > 0 ? selectedVibes : ['KAWAII'],
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      image: cleanImage,
      badge: badge.trim() ? badge.trim().toUpperCase() : undefined,
      badgeId: finalBadgeId,
      badgeBg: badge.trim() ? badgeBg : undefined,
      description: description.trim() || 'Producto exclusivo de la colección Buttoncat Studio.',
      isCustomizable: false,
      stock: calculatedStock,
      isUnique,
      rating: productToEdit?.rating || 5.0,
      variations: isUnique ? undefined : (variations.length > 0 ? variations : undefined),
      variantStocks: isUnique ? undefined : (Object.keys(variantStocks).length > 0 ? variantStocks : undefined),
      sku: sku.trim() || undefined,
      dateAdded: dateAdded || new Date().toISOString().split('T')[0],
      salesChannel,
      costPrice: costPrice ? Number(costPrice) : undefined,
      material: material.trim() || undefined,
    };

    onSave(newProduct);
    onClose();
  };

  const currentProductForMatrix: Product = {
    id: productToEdit ? productToEdit.id : 'temp-id',
    name: name.trim().toUpperCase() || 'NUEVO PRODUCTO',
    category: category || 'STICKERS',
    price: Number(price) || 0,
    image: image.trim() || 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600',
    stock: Number(stock) || 10,
    vibe: selectedVibes,
    description: description,
    variations,
    variantStocks,
  };

  return (
    <>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in ${
        isDarkMode ? 'bg-black/80' : 'bg-black/60 backdrop-blur-xs'
      }`}>
        <div className={`max-w-4xl w-full mx-auto rounded-2xl border-4 border-black shadow-2xl overflow-hidden font-sans transition-colors flex flex-col max-h-[90vh] my-auto ${
          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-gray-900'
        }`}>
          
          {/* TOP EDITOR NAVIGATION HEADER */}
          <div className="bg-brand-yellow text-black p-3.5 sm:p-5 border-b-4 border-black shrink-0 shadow-brutal-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-black text-white hover:bg-brand-pink border-2 border-black px-3.5 py-2 font-black uppercase text-xs flex items-center gap-2 transition-all shadow-brutal-xs cursor-pointer shrink-0"
                title="Volver al inventario"
              >
                <ArrowLeft className="w-4 h-4 stroke-3" /> VOLVER AL INVENTARIO
              </button>
              <div>
                <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight font-display flex items-center gap-2 text-black">
                  <Sparkles className="w-5 h-5 text-black shrink-0" />
                  {productToEdit ? `EDITAR PRODUCTO: ${productToEdit.name}` : 'CREAR NUEVO PRODUCTO'}
                </h2>
                <p className="text-[11px] font-black text-black/80 uppercase tracking-wide">
                  CARGA RÁPIDA • BUTTONCAT STUDIO ADMIN
                </p>
              </div>
            </div>
          </div>

          {/* STEPPER STEP TRACKER BAR (2 PASOS LIMPIOS) */}
          <div className="bg-yellow-50 border-b-4 border-black p-2.5 sm:p-3.5 shrink-0 shadow-brutal-xs flex items-center justify-between overflow-x-auto gap-2 no-scrollbar">
            {stepsList.map((stepObj) => {
              const isActive = step === stepObj.num;
              const IconComponent = stepObj.icon;
              return (
                <button
                  key={stepObj.num}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setErrorMessage(null);
                    setStep(stepObj.num as any);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 border-2 border-black font-black text-xs uppercase transition-all shadow-brutal-xs whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-brand-yellow text-black border-3 border-black shadow-brutal-sm scale-102'
                      : 'bg-white text-black hover:bg-yellow-200'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    {stepObj.num}
                  </span>
                  <IconComponent className="w-4 h-4 shrink-0" />
                  <span>{stepObj.title}</span>
                </button>
              );
            })}
          </div>

          {/* ERROR ALERT BANNER */}
          {errorMessage && (
            <div className="bg-red-600 text-white p-3 font-black text-xs uppercase tracking-wide flex items-center gap-2 shrink-0 border-b-3 border-black">
              <AlertTriangle className="w-5 h-5 shrink-0 stroke-3" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* MAIN FORM */}
          <form id="product-editor-form" noValidate onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 font-sans space-y-6">
            
            {/* PASO 1: DATOS Y PRECIOS */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-white p-6 border-3 border-black shadow-brutal space-y-4">
                  <div className="flex items-center gap-2 border-b-2 border-black pb-3">
                    <Package className="w-5 h-5 text-brand-purple" />
                    <div>
                      <h3 className="font-black uppercase text-sm text-black">
                        PASO 1: INFORMACIÓN PRINCIPAL & CLASIFICACIÓN
                      </h3>
                      <p className="text-[10px] text-gray-600 font-bold uppercase">
                        CÓDIGO, NOMBRE, CATEGORÍA Y VALORES MONETARIOS BASE
                      </p>
                    </div>
                  </div>

                  {/* CÓDIGO, FECHA Y CANAL */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-black font-black uppercase mb-1 text-[10px]">
                        CÓDIGO / SKU
                      </label>
                      <input
                        type="text"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="BTC-101"
                        className="w-full border-2 border-black p-2 bg-white text-black font-bold focus:outline-none uppercase text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-black font-black uppercase mb-1 text-[10px]">
                        FECHA DE ALTA
                      </label>
                      <input
                        type="date"
                        value={dateAdded}
                        onChange={(e) => setDateAdded(e.target.value)}
                        className="w-full border-2 border-black p-2 bg-white text-black font-bold focus:outline-none text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-black font-black uppercase mb-1 text-[10px]">
                        CANAL / DISPONIBILIDAD
                      </label>
                      <select
                        value={salesChannel}
                        onChange={(e) => setSalesChannel(e.target.value as any)}
                        className="w-full border-2 border-black p-2 bg-white text-black font-bold focus:outline-none uppercase cursor-pointer text-xs"
                      >
                        <option value="AMBOS">WEB Y LOCAL FÍSICO</option>
                        <option value="SOLO_WEB">SOLO EN TIENDA WEB</option>
                        <option value="SOLO_LOCAL">SOLO EN LOCAL FÍSICO</option>
                      </select>
                    </div>
                  </div>

                  {/* NOMBRE Y CATEGORÍA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-black font-black uppercase mb-1">
                        NOMBRE DEL PRODUCTO <span className="text-red-600 font-black">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: PELUCHE OSITO DARK UNICORNIO"
                        className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-black font-black uppercase mb-1">
                        CATEGORÍA DEL CATÁLOGO <span className="text-red-600 font-black">*</span>
                      </label>
                      <select
                        value={category}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          setCategory(newCat);
                          setVariations(getDefaultVariationsForCategory(newCat));
                        }}
                        className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm uppercase cursor-pointer"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* PRECIOS DEL PRODUCTO */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-black font-black uppercase mb-1 text-[10px]">
                        PRECIO PÚBLICO ($) <span className="text-red-600 font-black">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="15.00"
                        className="w-full border-3 border-black p-2 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-black font-black uppercase mb-1 text-[10px]">
                        PRECIO COSTO ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="Margen / Costo"
                        className="w-full border-3 border-black p-2 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-black font-black uppercase mb-1 text-[10px]">
                        PRECIO ANTERIOR ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="Oferta / Tachado"
                        className="w-full border-3 border-black p-2 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm text-xs"
                      />
                    </div>
                  </div>

                  {/* CHECKBOX PRODUCTO DE STOCK ÚNICO */}
                  <div className="flex items-center gap-2.5 p-3.5 bg-brand-purple/15 border-2 border-black shadow-brutal-sm">
                    <input
                      type="checkbox"
                      id="isUniqueCheckbox"
                      checked={isUnique}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsUnique(checked);
                        if (checked) {
                          setStock(1);
                          setVariations([]);
                          setVariantStocks({});
                          if (!badge) {
                            setBadge('PIEZA ÚNICA');
                            setBadgeBg('bg-brand-purple text-white');
                          }
                        }
                      }}
                      className="w-4 h-4 accent-brand-purple cursor-pointer"
                    />
                    <label htmlFor="isUniqueCheckbox" className="text-black font-black uppercase text-xs cursor-pointer select-none">
                      PRODUCTO DE STOCK ÚNICO / PIEZA ÚNICA (Solo 1 unidad irrepetible, ej. Peluche artesanal o Pintura)
                    </label>
                  </div>

                  {/* SECCIÓN/BANNER VARIACIONES Y MATRIZ DE STOCK */}
                  {!isUnique && (
                    <div className="p-4 bg-brand-yellow/30 border-3 border-black shadow-brutal-sm space-y-2 mt-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="font-black uppercase text-xs text-black font-display flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-brand-purple" />
                            ESTRUCTURA DE VARIACIONES Y MATRIZ DE STOCK
                          </h4>
                          <p className="text-[11px] text-gray-700 font-bold mt-0.5">
                            {variations.length > 0
                              ? `✓ ${variations.length} grupo(s) configurado(s): ${variations.map((v) => v.name).join(', ')}`
                              : '¿Tiene variaciones de talle, color o medida? Configúralas en la matriz dedicada.'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenVariationsMatrix && productToEdit) {
                              onOpenVariationsMatrix(currentProductForMatrix);
                            } else {
                              setIsMatrixModalOpen(true);
                            }
                          }}
                          className="px-4 py-2 bg-brand-purple text-white hover:bg-brand-pink border-2 border-black font-black text-xs uppercase shadow-brutal-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
                        >
                          <SlidersHorizontal className="w-4 h-4" /> GESTIONAR VARIACIONES Y MATRIZ
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* PASO 2: MULTIMEDIA, ETIQUETAS Y ESTILOS */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                
                {/* IMAGEN Y MATERIAL */}
                <div className="bg-white p-6 border-3 border-black shadow-brutal space-y-4">
                  <div className="flex items-center gap-2 border-b-2 border-black pb-3">
                    <ImageIcon className="w-5 h-5 text-brand-purple" />
                    <div>
                      <h3 className="font-black uppercase text-sm text-black">
                        PASO 2: MULTIMEDIA & ETIQUETAS
                      </h3>
                      <p className="text-[10px] text-gray-600 font-bold uppercase">
                        IMAGEN PRINCIPAL, BADGES DE PROMOCIÓN, ESTILOS VIBES Y FICHA TÉCNICA
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-black font-black uppercase mb-1">
                      URL DE LA IMAGEN <span className="text-red-600 font-black">*</span>
                    </label>
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm"
                    />
                    <span className="text-[10px] text-red-600 font-extrabold block mt-1 uppercase">
                      * CAMPO OBLIGATORIO: No se permite guardar productos sin cargar su correspondiente imagen.
                    </span>
                    {image && (
                      <div className="mt-3 flex items-center gap-4 bg-yellow-50 p-4 border-2 border-black shadow-brutal-xs">
                        <img src={image} alt="Preview" className="w-20 h-20 object-cover border-2 border-black shrink-0" />
                        <div>
                          <span className="text-xs text-black font-black uppercase block">VISTA PREVIA CARGADA</span>
                          <span className="text-[10px] text-gray-600 font-bold block truncate max-w-md">{image}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-black font-black uppercase mb-1">
                      MATERIAL / COMPOSICIÓN DEL PRODUCTO
                    </label>
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      placeholder="Ej: Felpa hipoalergénica lavable, Algodón 100%, Vinilo mate 3M"
                      className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm"
                    />
                  </div>
                </div>

                {/* BADGES & VIBES */}
                <div className="bg-white p-6 border-3 border-black shadow-brutal space-y-4">
                  
                  {/* BADGE TABULADO */}
                  <div className="space-y-3 bg-yellow-50/80 p-4 border-2 border-black shadow-brutal-xs">
                    <div className="flex items-center justify-between">
                      <label className="block text-black font-black uppercase text-xs">
                        ETIQUETA SELECCIONADA (BADGE SELLO)
                      </label>
                      {badge && (
                        <button
                          type="button"
                          onClick={() => {
                            setBadge('');
                            setBadgeId('');
                          }}
                          className="text-[10px] font-black uppercase text-red-600 hover:underline cursor-pointer"
                        >
                          ✕ QUITAR ETIQUETA
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(tags && tags.length > 0
                        ? tags.map((t) => ({ id: t.id, name: t.name, badgeBg: t.badgeBg }))
                        : DEFAULT_BADGE_LIST.map((name) => ({ id: name, name, badgeBg: 'bg-brand-orange text-white' }))
                      ).map((tagObj) => {
                        const isSelected = badgeId === tagObj.id || badge.trim().toUpperCase() === tagObj.name.toUpperCase();
                        return (
                          <button
                            key={tagObj.id}
                            type="button"
                            onClick={() => {
                              setBadge(tagObj.name);
                              setBadgeId(tagObj.id);
                              if (tagObj.badgeBg) {
                                setBadgeBg(tagObj.badgeBg);
                              }
                            }}
                            className={`p-2 border-2 border-black text-center font-black text-xs uppercase transition-all shadow-brutal-xs cursor-pointer ${
                              isSelected
                                ? 'bg-black text-white shadow-brutal'
                                : 'bg-white text-black hover:bg-yellow-200'
                            }`}
                          >
                            {tagObj.name}
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-black font-black text-[10px] uppercase mb-1">
                          TEXTO PERSONALIZADO DE BADGE:
                        </label>
                        <input
                          type="text"
                          value={badge}
                          onChange={(e) => setBadge(e.target.value)}
                          placeholder="Ej: -20%, RE-STOCK..."
                          className="w-full border-2 border-black p-2 bg-white text-black font-bold focus:outline-none uppercase shadow-brutal-xs text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-black font-black text-[10px] uppercase mb-1">
                          COLOR DEL BADGE:
                        </label>
                        <select
                          value={badgeBg}
                          onChange={(e) => setBadgeBg(e.target.value)}
                          className="w-full border-2 border-black p-2 bg-white text-black font-bold focus:outline-none uppercase cursor-pointer text-xs"
                        >
                          <option value="bg-brand-orange text-white">NARANJA BRAND</option>
                          <option value="bg-brand-pink text-white">ROSA BRAND</option>
                          <option value="bg-brand-yellow text-black">AMARILLO BRAND</option>
                          <option value="bg-brand-cyan text-black">CYAN BRAND</option>
                          <option value="bg-brand-purple text-white">PÚRPURA BRAND</option>
                          <option value="bg-black text-white">NEGRO DARK</option>
                        </select>
                      </div>
                    </div>

                    {badge && (
                      <div className="flex items-center gap-2 pt-1 text-[11px] font-black uppercase">
                        <span className="text-gray-600">VISTA PREVIA BADGE:</span>
                        <span className={`px-2.5 py-0.5 border border-black font-black text-xs uppercase shadow-brutal-xs ${badgeBg}`}>
                          {badge}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* VIBES / ESTILOS */}
                  <div>
                    <label className="block text-black font-black uppercase mb-1">
                      ESTILOS VINCULADOS (VIBES)
                    </label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {ALL_VIBES.map((vibe) => {
                        const isSelected = selectedVibes.includes(vibe);
                        return (
                          <button
                            type="button"
                            key={vibe}
                            onClick={() => handleVibeToggle(vibe)}
                            className={`px-3 py-1.5 border-2 border-black font-black text-xs uppercase transition-all shadow-brutal-xs cursor-pointer ${
                              isSelected
                                ? 'bg-brand-pink text-white shadow-brutal-sm'
                                : 'bg-white text-black hover:bg-yellow-200'
                            }`}
                          >
                            {isSelected ? `✓ ${vibe}` : vibe}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* DESCRIPCIÓN */}
                  <div>
                    <label className="block text-black font-black uppercase mb-1">
                      DESCRIPCIÓN DETALLADA DEL PRODUCTO
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detalles sobre materiales, tamaños, confección o acabados..."
                      className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm resize-none"
                    />
                  </div>

                </div>

              </div>
            )}

          </form>

          {/* STEPPER FOOTER NAVIGATION BUTTONS */}
          <div className="bg-white border-t-4 border-black p-3.5 sm:p-4 shrink-0 flex items-center justify-between gap-3 shadow-brutal-xs">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="bg-black text-white hover:bg-brand-purple border-2 border-black px-4 py-2.5 font-black uppercase text-xs flex items-center gap-2 transition-all shadow-brutal-xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 stroke-3" /> PASO ANTERIOR
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border-2 border-black bg-white text-black font-black hover:bg-gray-200 uppercase text-xs shadow-brutal-xs cursor-pointer"
              >
                CANCELAR
              </button>
            )}

            <div className="flex items-center gap-2">
              {step < maxStep ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-brand-yellow text-black hover:bg-brand-pink hover:text-white border-2 border-black px-5 py-2.5 font-black uppercase text-xs flex items-center gap-2 transition-all shadow-brutal-xs cursor-pointer"
                >
                  SIGUIENTE PASO <ArrowRight className="w-4 h-4 stroke-3" />
                </button>
              ) : (
                <button
                  type="submit"
                  form="product-editor-form"
                  className="bg-brand-pink text-white hover:bg-brand-purple border-2 border-black px-6 py-2.5 font-black uppercase text-xs flex items-center gap-2 transition-all shadow-brutal cursor-pointer"
                >
                  {productToEdit ? (
                    <>
                      <Save className="w-4 h-4 stroke-3" /> GUARDAR PRODUCTO
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4 stroke-3" /> CREAR PRODUCTO
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* SUB-MODAL DEDICADO DE VARIACIONES Y MATRIZ DE STOCK */}
      <ProductVariationsMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        onSave={(updatedProduct) => {
          setVariations(updatedProduct.variations || []);
          setVariantStocks(updatedProduct.variantStocks || {});
          setStock(updatedProduct.stock);
        }}
        product={currentProductForMatrix}
        isDarkMode={isDarkMode}
      />
    </>
  );
};
