import React, { useState, useEffect } from 'react';
import { 
  Save, 
  PlusCircle, 
  Sparkles, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  RefreshCw, 
  SlidersHorizontal, 
  Grid, 
  ArrowLeft, 
  ArrowRight,
  Package, 
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import type { Product, ProductVibe, CategoryItem, BadgeItem, ProductVariationGroup, ProductVariationOption } from '../../types/types';
import { getDefaultVariationsForCategory, getOptionLabel, getOptionPriceDelta, getCombinationKey, getAllCombinations, calculateTotalProductStock } from '../../types/types';

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
  categories: CategoryItem[];
  tags?: BadgeItem[];
  isDarkMode?: boolean;
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
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

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
  
  // Variaciones editables
  const [variations, setVariations] = useState<ProductVariationGroup[]>([]);
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({});
  const [bulkStockVal, setBulkStockVal] = useState<number | ''>('');
  const [newOptInputs, setNewOptInputs] = useState<Record<number, { label: string; stock: number | ''; delta: number | '' }>>({});
  const [newGroupName, setNewGroupName] = useState('');

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

  useEffect(() => {
    if (isUnique && step > 3) {
      setStep(3);
    }
  }, [isUnique, step]);

  if (!isOpen) return null;

  // Definición dinámica de Pasos según Pieza Única
  const stepsList = isUnique
    ? [
        { num: 1, title: 'DATOS Y PRECIOS', icon: Package },
        { num: 2, title: 'MULTIMEDIA Y ESTILOS', icon: ImageIcon },
        { num: 3, title: 'REVISIÓN Y GUARDAR', icon: CheckCircle2 },
      ]
    : [
        { num: 1, title: 'DATOS Y PRECIOS', icon: Package },
        { num: 2, title: 'MULTIMEDIA Y ESTILOS', icon: ImageIcon },
        { num: 3, title: 'VARIACIONES', icon: SlidersHorizontal },
        { num: 4, title: 'MATRIZ Y REVISIÓN', icon: Grid },
      ];

  const maxStep = stepsList.length;

  const handleResetToCategoryDefaults = () => {
    const defs = getDefaultVariationsForCategory(category);
    setVariations(defs);
    setVariantStocks({});
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const nameUpper = newGroupName.trim().toUpperCase();
    if (variations.some(v => v.name.toUpperCase() === nameUpper)) {
      setErrorMessage(`El grupo "${nameUpper}" ya existe.`);
      return;
    }
    setVariations([
      ...variations,
      {
        name: nameUpper,
        options: [
          { label: 'Opción 1', priceDelta: 0 },
          { label: 'Opción 2', priceDelta: 0 },
        ],
      },
    ]);
    setNewGroupName('');
  };

  const handleRemoveGroup = (groupIndex: number) => {
    const updated = variations.filter((_, idx) => idx !== groupIndex);
    setVariations(updated);
  };

  const handleUpdateOption = (
    groupIndex: number,
    optionIndex: number,
    field: 'label' | 'priceDelta',
    val: string | number
  ) => {
    setVariations((prev) => {
      const copy = JSON.parse(JSON.stringify(prev)) as ProductVariationGroup[];
      const targetOpt = copy[groupIndex].options[optionIndex];
      if (typeof targetOpt === 'string') {
        copy[groupIndex].options[optionIndex] = {
          label: field === 'label' ? String(val) : targetOpt,
          priceDelta: field === 'priceDelta' ? Number(val) : 0,
        };
      } else {
        if (field === 'label') targetOpt.label = String(val);
        if (field === 'priceDelta') targetOpt.priceDelta = Number(val) || 0;
      }
      return copy;
    });
  };

  const handleAddOptionToGroup = (groupIndex: number) => {
    const inputState = newOptInputs[groupIndex] || { label: '', stock: '', delta: '' };
    if (!inputState.label || !inputState.label.trim()) return;

    setVariations((prev) => {
      const copy = JSON.parse(JSON.stringify(prev)) as ProductVariationGroup[];
      const newOpt: ProductVariationOption = {
        label: inputState.label.trim(),
        priceDelta: Number(inputState.delta) || 0,
      };
      copy[groupIndex].options.push(newOpt);
      return copy;
    });

    setNewOptInputs((prev) => ({
      ...prev,
      [groupIndex]: { label: '', stock: '', delta: '' },
    }));
  };

  const handleRemoveOption = (groupIndex: number, optionIndex: number) => {
    setVariations((prev) => {
      const copy = JSON.parse(JSON.stringify(prev)) as ProductVariationGroup[];
      copy[groupIndex].options.splice(optionIndex, 1);
      return copy;
    });
  };

  const handleVibeToggle = (vibe: ProductVibe) => {
    if (selectedVibes.includes(vibe)) {
      setSelectedVibes(selectedVibes.filter((v) => v !== vibe));
    } else {
      setSelectedVibes([...selectedVibes, vibe]);
    }
  };

  const handleGenerateMatrix = () => {
    const tempProduct: Product = {
      id: 'temp',
      name: name || 'Temp',
      category: category || 'Temp',
      vibe: selectedVibes,
      price: Number(price) || 0,
      image: image || '',
      description: '',
      isCustomizable: false,
      stock: Number(stock) || 10,
      variations,
    };
    const allCombos = getAllCombinations(tempProduct);
    const newMatrix: Record<string, number> = {};
    const defaultVal = Number(stock) || 10;
    allCombos.forEach((combo) => {
      const key = getCombinationKey(combo);
      newMatrix[key] = variantStocks[key] !== undefined ? variantStocks[key] : defaultVal;
    });
    setVariantStocks(newMatrix);
  };

  const handleApplyBulkStock = () => {
    if (bulkStockVal === '') return;
    const targetVal = Number(bulkStockVal) < 0 ? 0 : Number(bulkStockVal);
    const updated: Record<string, number> = {};
    Object.keys(variantStocks).forEach((k) => {
      updated[k] = targetVal;
    });
    setVariantStocks(updated);
  };

  const handleUpdateCombinationStock = (key: string, newStk: number) => {
    setVariantStocks((prev) => ({
      ...prev,
      [key]: Math.max(0, newStk),
    }));
  };

  const handleRemoveCombinationKey = (key: string) => {
    setVariantStocks((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

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
    }

    if (step === 2) {
      if (!image.trim()) {
        setErrorMessage('Es obligatorio ingresar la URL de la imagen del producto (Paso 2).');
        return;
      }
    }

    if (step < maxStep) {
      setStep((prev) => Math.min(prev + 1, maxStep) as any);
    }
  };

  const handlePrevStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage(null);
    if (step > 1) {
      setStep((prev) => Math.max(prev - 1, 1) as any);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMessage(null);

    // Si aún no estamos en el paso final, NO enviar ni cerrar; avanzar al siguiente paso
    if (step < maxStep) {
      handleNextStep();
      return;
    }

    if (!name.trim()) {
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
      name: name.trim().toUpperCase(),
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

    const newProduct: Product = {
      id: productToEdit ? productToEdit.id : `prod-${Date.now()}`,
      name: name.trim().toUpperCase(),
      category: category.trim().toUpperCase(),
      vibe: selectedVibes.length > 0 ? selectedVibes : ['KAWAII'],
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      image: cleanImage,
      badge: badge.trim() ? badge.trim().toUpperCase() : undefined,
      badgeId: badgeId || undefined,
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

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 overflow-y-auto animate-in fade-in ${
      isDarkMode ? 'bg-black/80' : 'bg-black/60 backdrop-blur-xs'
    }`}>
      <div className={`max-w-5xl w-full mx-auto rounded-2xl border shadow-2xl my-2 sm:my-4 overflow-hidden font-sans transition-colors ${
        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        
        {/* TOP EDITOR NAVIGATION HEADER */}
        <div className="bg-brand-yellow text-black p-4 sm:p-5 border-b-4 border-black sticky top-0 z-30 shadow-brutal-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-black text-white hover:bg-brand-pink border-2 border-black px-3.5 py-2 font-black uppercase text-xs flex items-center gap-2 transition-all shadow-brutal-xs cursor-pointer shrink-0"
              title="Volver a la tabla de productos"
            >
              <ArrowLeft className="w-4 h-4 stroke-[3]" /> VOLVER AL INVENTARIO
            </button>
            <div>
              <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight font-display flex items-center gap-2 text-black">
                <Sparkles className="w-5 h-5 text-black shrink-0" />
                {productToEdit ? `EDITAR PRODUCTO: ${productToEdit.name}` : 'CREAR NUEVO PRODUCTO'}
              </h2>
              <p className="text-[11px] font-black text-black/80 uppercase tracking-wide">
                ASISTENTE GUIADO DE CARGA • BUTTONCAT STUDIO ADMIN
              </p>
            </div>
          </div>
        </div>

        {/* STEPPER STEP TRACKER BAR (PASOS ADAPTABLES) */}
        <div className="bg-yellow-50 border-b-4 border-black p-3 sm:p-4 shadow-brutal-xs flex items-center justify-center sm:justify-between overflow-x-auto gap-2">
          {stepsList.map((stepObj) => {
            const isActive = step === stepObj.num;
            const isCompleted = step > stepObj.num;
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
                className={`flex items-center gap-2 px-3.5 py-2.5 border-2 border-black font-black text-xs uppercase transition-all shadow-brutal-xs whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-brand-yellow text-black border-3 border-black shadow-brutal-sm scale-102'
                    : isCompleted
                    ? 'bg-emerald-300 text-black border-2 border-black'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-black font-black ${
                  isActive ? 'bg-black text-white' : isCompleted ? 'bg-black text-white' : 'bg-gray-200 text-black'
                }`}>
                  {isCompleted ? '✓' : stepObj.num}
                </span>
                <IconComponent className="w-4 h-4 shrink-0" />
                <span>{stepObj.title}</span>
              </button>
            );
          })}
        </div>

        {/* UNIFIED ERROR MESSAGE BANNER */}
        {errorMessage && (
          <div className="bg-red-100 border-b-4 border-black text-red-900 p-4 text-xs font-black uppercase shadow-brutal-sm flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MAIN STEPPED FORM BODY */}
        <form noValidate id="product-editor-form" onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 text-xs font-bold bg-gray-50/50">
          
          {/* PASO 1: INFORMACIÓN PRINCIPAL Y PRECIOS */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white p-6 border-3 border-black shadow-brutal space-y-5">
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

                {/* SKU, FECHA DE ALTA Y CANAL DE VENTA */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-yellow-50 p-3.5 border-2 border-black shadow-brutal-xs">
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
                      ? tags.map(t => ({ id: t.id, name: t.name, badgeBg: t.badgeBg }))
                      : DEFAULT_BADGE_LIST.map(name => ({ id: name, name, badgeBg: 'bg-brand-orange text-white' }))
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

          {/* PASO 3: GRUPOS DE VARIACIONES Y ATRIBUTOS (SOLO SI NO ES PIEZA ÚNICA) */}
          {step === 3 && !isUnique && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white p-6 border-3 border-black shadow-brutal space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-3">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-brand-purple" />
                    <div>
                      <h3 className="font-black uppercase text-sm text-black">
                        PASO 3: GRUPOS DE VARIACIONES Y ATRIBUTOS ({variations.length} GRUPOS)
                      </h3>
                      <p className="text-[10px] text-gray-600 font-bold uppercase">
                        CONFIGURA TALLES, COLORES, MEDIDAS Y ADICIONALES DE PRECIO ($ EXTRA)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToCategoryDefaults}
                    className="text-[11px] bg-brand-yellow text-black hover:bg-black hover:text-white border-2 border-black px-3 py-1 font-black uppercase shadow-brutal-xs flex items-center gap-1.5 cursor-pointer transition-all self-start sm:self-auto"
                    title="Restaura las variaciones estándar para esta categoría"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Sugeridas de {category || 'categoría'}
                  </button>
                </div>

                <p className="text-xs text-gray-700 font-bold leading-relaxed bg-yellow-50 p-3 border-2 border-black">
                  Define los atributos del producto (ej. <em>Talle, Color, Material, Medida</em>) y sus adicionales de precio (+$ Extra). El stock por cada combinación conjunta se configura en el <strong>PASO 4 (Matriz de Stock)</strong>.
                </p>

                {/* LIST OF VARIATION GROUPS */}
                {variations.length === 0 ? (
                  <div className="p-6 text-center border-3 border-dashed border-gray-400 bg-white font-black text-gray-500 text-xs">
                    Este producto no tiene grupos de variaciones asignados. Puedes crear uno abajo o cargar las opciones sugeridas de {category}.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {variations.map((vg, grpIdx) => {
                      const currentInput = newOptInputs[grpIdx] || { label: '', stock: '', delta: '' };

                      return (
                        <div key={grpIdx} className="border-3 border-black bg-white shadow-brutal-sm overflow-hidden">
                          {/* GROUP HEADER */}
                          <div className="bg-yellow-200 border-b-3 border-black p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-black uppercase text-black text-xs">
                                GRUPO: {vg.name}
                              </span>
                              <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 border border-black">
                                {vg.options.length} opciones
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveGroup(grpIdx)}
                              className="text-red-600 hover:text-white hover:bg-red-600 p-1 border-2 border-black bg-white transition-colors cursor-pointer shadow-brutal-xs"
                              title="Eliminar grupo completo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* OPTIONS LIST */}
                          <div className="p-3 space-y-3">
                            <div className="space-y-2">
                              {vg.options.map((opt, optIdx) => {
                                const lbl = getOptionLabel(opt);
                                const optDelta = getOptionPriceDelta(opt);

                                return (
                                  <div
                                    key={optIdx}
                                    className="grid grid-cols-12 gap-2 items-center p-2.5 border-2 border-black bg-gray-50 hover:bg-white transition-all shadow-brutal-xs"
                                  >
                                    {/* OPTION NAME */}
                                    <div className="col-span-7 sm:col-span-8">
                                      <label className="text-[9px] font-black uppercase text-gray-600 block mb-0.5">
                                        Nombre de la Opción / Atributo
                                      </label>
                                      <input
                                        type="text"
                                        value={lbl}
                                        onChange={(e) => handleUpdateOption(grpIdx, optIdx, 'label', e.target.value)}
                                        className="w-full border-2 border-black p-1.5 text-xs font-black bg-white text-black"
                                        placeholder="Nombre de la opción"
                                      />
                                    </div>

                                    {/* PRICE DELTA INPUT */}
                                    <div className="col-span-4 sm:col-span-3">
                                      <label className="text-[9px] font-black uppercase text-gray-600 block mb-0.5">
                                        +$ Adicional Extra
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        value={optDelta > 0 ? optDelta : ''}
                                        onChange={(e) => handleUpdateOption(grpIdx, optIdx, 'priceDelta', e.target.value)}
                                        className="w-full border-2 border-black p-1.5 text-xs font-black bg-white text-black"
                                        placeholder="0"
                                      />
                                    </div>

                                    {/* DELETE ACTION */}
                                    <div className="col-span-1 sm:col-span-1 flex items-center justify-center pt-3">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveOption(grpIdx, optIdx)}
                                        className="p-1.5 text-gray-500 hover:text-white hover:bg-red-600 border border-black transition-colors cursor-pointer"
                                        title="Quitar opción"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* INLINE ADD OPTION FORM */}
                            <div className="bg-yellow-50 p-2.5 border-2 border-black flex flex-col sm:flex-row items-center gap-2">
                              <input
                                type="text"
                                placeholder="Nueva opción (ej. XXL, Rosa, 45cm)"
                                value={currentInput.label}
                                onChange={(e) =>
                                  setNewOptInputs((prev) => ({
                                    ...prev,
                                    [grpIdx]: { ...currentInput, label: e.target.value },
                                  }))
                                }
                                className="flex-1 w-full border-2 border-black p-1.5 text-xs font-black bg-white text-black"
                              />
                              <input
                                type="number"
                                min="0"
                                step="100"
                                placeholder="+$ Extra"
                                value={currentInput.delta}
                                onChange={(e) =>
                                  setNewOptInputs((prev) => ({
                                    ...prev,
                                    [grpIdx]: { ...currentInput, delta: e.target.value === '' ? '' : Number(e.target.value) },
                                  }))
                                }
                                className="w-full sm:w-28 border-2 border-black p-1.5 text-xs font-black bg-white text-black"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddOptionToGroup(grpIdx)}
                                className="w-full sm:w-auto bg-brand-yellow text-black border-2 border-black font-black uppercase text-xs px-3 py-1.5 hover:bg-white transition-all shadow-brutal-xs cursor-pointer whitespace-nowrap"
                              >
                                + Agregar Opción
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* CREATE NEW VARIATION GROUP */}
                <div className="pt-3 border-t-2 border-black flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nombre del nuevo grupo (ej. TALLE, ACABADO, LARGO)..."
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full sm:flex-1 border-3 border-black p-2.5 bg-white text-black font-black uppercase text-xs shadow-brutal-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddGroup}
                    className="w-full sm:w-auto bg-brand-purple text-white border-3 border-black font-black uppercase text-xs px-4 py-2.5 hover:bg-brand-pink transition-all shadow-brutal flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> Crear Grupo de Variación
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* PASO FINAL: REVISIÓN, VISTA PREVIA Y GUARDAR */}
          {((step === 3 && isUnique) || step === 4) && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* HEADER BANNER PASO FINAL */}
              <div className="bg-brand-yellow border-3 border-black p-4 shadow-brutal flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-black shrink-0" />
                  <div>
                    <h3 className="font-black uppercase text-sm text-black tracking-wide">
                      PASO FINAL: VISTA PREVIA Y DESGLOSE COMPLETO DEL PRODUCTO
                    </h3>
                    <p className="text-[11px] font-black text-black/80 uppercase">
                      REVISA CÓMO LUCIRÁ LA FICHA, SUS VARIACIONES Y STOCK ANTES DE GUARDAR
                    </p>
                  </div>
                </div>
                <span className="bg-black text-white font-black text-xs uppercase px-3.5 py-1.5 border-2 border-black shadow-brutal-xs">
                  FICHA LISTA PARA PUBLICAR
                </span>
              </div>

              {/* GRID PRINCIPAL: 2 COLUMNAS (VISTA PREVIA TARJETA & DESGLOSE TÉCNICO) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* COLUMNA IZQUIERDA: VISTA PREVIA TARJETA TIENDA / CATÁLOGO */}
                <div className="lg:col-span-5 bg-white p-5 border-3 border-black shadow-brutal space-y-4">
                  <span className="text-[11px] font-black uppercase text-brand-purple bg-brand-purple/10 px-3 py-1 border-2 border-black block text-center">
                    VISTA PREVIA DE FICHA EN TIENDA
                  </span>

                  {/* IMAGEN DE VISTA PREVIA */}
                  <div className="relative aspect-square border-3 border-black overflow-hidden bg-gray-100 shadow-brutal-xs">
                    {image ? (
                      <img src={image} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 font-black text-xs uppercase p-4 text-center">
                        <ImageIcon className="w-10 h-10 mb-2 stroke-[1.5]" />
                        SIN IMAGEN CARGADA
                      </div>
                    )}
                    {badge && (
                      <span className={`absolute top-3 left-3 px-3 py-1 border-2 border-black font-black text-xs uppercase shadow-brutal-xs ${badgeBg}`}>
                        {badge}
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 bg-black text-white font-black text-[10px] uppercase px-2.5 py-1 border border-black">
                      SKU: {sku || 'BTC-000'}
                    </span>
                  </div>

                  {/* DETALLES DE TARJETA */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-black uppercase bg-black text-white px-2.5 py-0.5">
                      {category || 'SIN CATEGORÍA'}
                    </span>
                    <h4 className="font-black text-lg uppercase text-black leading-tight">
                      {name || 'NOMBRE DEL PRODUCTO'}
                    </h4>

                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-xl font-black text-black">
                        ${price ? Number(price).toLocaleString('es-AR') : '0'}
                      </span>
                      {originalPrice && Number(originalPrice) > Number(price) && (
                        <span className="text-xs text-gray-500 line-through font-bold">
                          ${Number(originalPrice).toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>

                    {/* COMPOSICIÓN & VIBES */}
                    {material && (
                      <div className="text-xs text-black font-bold pt-2 border-t-2 border-black/20">
                        <span className="font-black uppercase text-[10px] text-gray-500 block">COMPOSICIÓN / MATERIAL:</span>
                        {material}
                      </div>
                    )}

                    {selectedVibes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedVibes.map(v => (
                          <span key={v} className="bg-brand-pink/20 text-black border border-black text-[9px] font-black px-2 py-0.5 uppercase">
                            {v}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* DESCRIPCIÓN */}
                    {description && (
                      <p className="text-xs text-gray-700 font-medium pt-2 border-t-2 border-black/20 leading-relaxed">
                        {description}
                      </p>
                    )}
                  </div>
                </div>

                {/* COLUMNA DERECHA: DESGLOSE COMPLETO DE PRECIOS, GRUPOS Y MATRIZ */}
                <div className="lg:col-span-7 space-y-5">
                  
                  {/* DATOS GENERALES Y STOCK TOTAL */}
                  <div className="bg-yellow-50 p-4 border-3 border-black shadow-brutal grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-gray-600 block">CANAL DE VENTA:</span>
                      <span className="text-xs font-black text-black uppercase">{salesChannel}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-gray-600 block">PRECIO COSTO:</span>
                      <span className="text-xs font-black text-black uppercase">{costPrice ? `$${costPrice}` : 'NO DEFINIDO'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-gray-600 block">STOCK RESULTANTE:</span>
                      <span className="text-xs font-black text-black uppercase">
                        {isUnique ? '1 UNIDAD (PIEZA ÚNICA)' : `${Object.keys(variantStocks).length > 0 ? Object.values(variantStocks).reduce((a, b) => a + b, 0) : stock} UNIDADES`}
                      </span>
                    </div>
                  </div>

                  {/* DESGLOSE DE GRUPOS DE VARIACIONES Y PRECIOS ADICIONALES */}
                  {!isUnique && variations.length > 0 && (
                    <div className="bg-white p-4 border-3 border-black shadow-brutal space-y-3">
                      <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                        <SlidersHorizontal className="w-4 h-4 text-brand-purple" />
                        <span className="font-black uppercase text-xs text-black">
                          GRUPOS DE VARIACIONES Y OPCIONES ({variations.length} GRUPOS)
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {variations.map((vg, idx) => (
                          <div key={idx} className="bg-gray-50 border-2 border-black p-3">
                            <span className="font-black text-xs uppercase text-black block mb-2">
                              GRUPO: {vg.name} ({vg.options.length} opciones)
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {vg.options.map((opt, oIdx) => {
                                const lbl = getOptionLabel(opt);
                                const delta = getOptionPriceDelta(opt);
                                return (
                                  <span key={oIdx} className="bg-white border-2 border-black px-2.5 py-1 text-xs font-bold text-black flex items-center gap-1.5 shadow-brutal-xs">
                                    <span>{lbl}</span>
                                    {delta > 0 && <span className="bg-yellow-300 font-black px-1.5 text-[10px] border border-black">+$ {delta}</span>}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MATRIZ DE STOCK POR COMBINACIÓN */}
                  {!isUnique && (
                    <div className="bg-white p-4 border-3 border-black shadow-brutal space-y-3">
                      <div className="flex items-center justify-between border-b-2 border-black pb-2">
                        <div className="flex items-center gap-2">
                          <Grid className="w-4 h-4 text-brand-purple" />
                          <span className="font-black uppercase text-xs text-black">
                            MATRIZ DE STOCK POR COMBINACIÓN ({Object.keys(variantStocks).length} RELACIONES)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleGenerateMatrix}
                          className="bg-brand-yellow text-black hover:bg-black hover:text-white border-2 border-black text-[10px] font-black uppercase px-2.5 py-1 shadow-brutal-xs cursor-pointer transition-all"
                        >
                          <RefreshCw className="w-3 h-3 inline mr-1" /> Re-calcular Matriz
                        </button>
                      </div>

                      {/* BULK ACTIONS BAR */}
                      {Object.keys(variantStocks).length > 0 && (
                        <div className="bg-yellow-50 p-2.5 border-2 border-black shadow-brutal-xs flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-black uppercase">AJUSTE MASIVO:</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="Cant."
                              value={bulkStockVal}
                              onChange={(e) => setBulkStockVal(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-20 bg-white border border-black text-black font-black p-1 text-xs text-center shadow-brutal-xs"
                            />
                            <button
                              type="button"
                              onClick={handleApplyBulkStock}
                              className="bg-black text-white hover:bg-brand-purple border border-black px-2.5 py-1 text-[10px] font-black uppercase shadow-brutal-xs cursor-pointer"
                            >
                              Aplicar a Todas
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVariantStocks({})}
                            className="text-red-600 hover:underline text-[10px] font-black uppercase cursor-pointer"
                          >
                            Limpiar Matriz
                          </button>
                        </div>
                      )}

                      {Object.keys(variantStocks).length === 0 ? (
                        <div className="p-4 text-center border-2 border-dashed border-gray-300 font-bold text-gray-500 text-xs">
                          No se ha generado matriz aún. Haz clic en "Re-calcular Matriz" arriba para generar el inventario por combinación.
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                          {Object.entries(variantStocks).map(([comboKey, comboStk]) => {
                            const isOut = comboStk === 0;
                            return (
                              <div key={comboKey} className={`p-2.5 border-2 border-black flex items-center justify-between text-xs font-bold shadow-brutal-xs ${isOut ? 'bg-red-50 border-red-600' : 'bg-white hover:bg-yellow-50'}`}>
                                <span className="truncate flex-1 pr-2 font-mono text-[11px] font-black text-black">{comboKey}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-[9px] font-black px-2 py-0.5 border border-black uppercase ${isOut ? 'bg-red-500 text-white' : 'bg-emerald-400 text-black'}`}>
                                    {isOut ? 'SIN STOCK' : 'DISPONIBLE'}
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={comboStk}
                                    onChange={(e) => handleUpdateCombinationStock(comboKey, Number(e.target.value))}
                                    className="w-16 border-2 border-black text-center font-black p-1 text-xs bg-white text-black"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCombinationKey(comboKey)}
                                    className="p-1 text-gray-500 hover:text-white hover:bg-red-600 border border-black bg-white transition-colors cursor-pointer"
                                    title="Quitar esta combinación"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* BANNER PIEZA ÚNICA */}
                  {isUnique && (
                    <div className="bg-purple-100 border-3 border-purple-950 p-5 font-bold text-xs text-purple-950 space-y-2 shadow-brutal">
                      <span className="font-black uppercase text-sm block">PIEZA ÚNICA IRREPETIBLE</span>
                      <p className="text-xs font-medium leading-relaxed">
                        Este producto está configurado como 1 única unidad artesanal. No posee combinaciones ni variaciones de precio.
                      </p>
                    </div>
                  )}

                </div>
              </div>

            </div>
          )}

        </form>

        {/* STEPPER FOOTER NAVIGATION BUTTONS */}
        <div className="bg-white border-t-4 border-black p-4 flex items-center justify-between gap-3 sticky bottom-0 z-20 shadow-brutal-xs">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="bg-black text-white hover:bg-brand-purple border-2 border-black px-4 py-2.5 font-black uppercase text-xs flex items-center gap-2 transition-all shadow-brutal-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 stroke-[3]" /> PASO ANTERIOR
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
                SIGUIENTE PASO <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            ) : (
              <button
                type="submit"
                form="product-editor-form"
                className="bg-brand-pink text-white hover:bg-brand-purple border-2 border-black px-6 py-2.5 font-black uppercase text-xs flex items-center gap-2 transition-all shadow-brutal cursor-pointer"
              >
                {productToEdit ? (
                  <>
                    <Save className="w-4 h-4 stroke-[3]" /> GUARDAR PRODUCTO
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 stroke-[3]" /> CREAR PRODUCTO
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
