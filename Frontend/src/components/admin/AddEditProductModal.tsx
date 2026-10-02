import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, Sparkles, AlertTriangle, Trash2, Plus } from 'lucide-react';
import type { Product, ProductVibe, CategoryItem, BadgeItem, ProductVariationGroup, ProductVariationOption } from '../../types/types';
import { getDefaultVariationsForCategory, getOptionLabel, getOptionPriceDelta, getOptionStock } from '../../types/types';

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
  categories: CategoryItem[];
  tags?: BadgeItem[];
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
}) => {
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
  const [newVarName, setNewVarName] = useState('');
  const [newVarOptions, setNewVarOptions] = useState('');

  // Nuevos atributos de producto
  const [sku, setSku] = useState('');
  const [dateAdded, setDateAdded] = useState('');
  const [salesChannel, setSalesChannel] = useState<'AMBOS' | 'SOLO_WEB' | 'SOLO_LOCAL'>('AMBOS');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [material, setMaterial] = useState('');

  useEffect(() => {
    setErrorMessage(null);
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
      setImage(''); // Campo de imagen vacío por defecto para exigir su carga obligatoria
      setStock(15);
      setIsUnique(false);
      setDescription('');
      setBadge('');
      setBadgeId('');
      setBadgeBg('bg-brand-orange text-white');
      setSelectedVibes(['KAWAII']);
      setVariations(getDefaultVariationsForCategory(defaultCat));
      setSku(`BTC-${Math.floor(100 + Math.random() * 900)}`);
      setDateAdded(today);
      setSalesChannel('AMBOS');
      setCostPrice('');
      setMaterial('');
    }
  }, [productToEdit, categories, isOpen]);

  if (!isOpen) return null;

  const handleVibeToggle = (vibe: ProductVibe) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('El nombre del producto es un campo obligatorio (*).');
      return;
    }

    if (!category.trim()) {
      setErrorMessage('La categoría del producto es un campo obligatorio (*).');
      return;
    }

    if (!price || Number(price) <= 0) {
      setErrorMessage('El precio del producto debe ser un valor numérico mayor a 0 (*).');
      return;
    }

    // VALIDACIÓN ESTRICTA DE IMAGEN OBLIGATORIA
    const cleanImage = image.trim();
    if (!cleanImage) {
      setErrorMessage('La URL de la imagen es un campo obligatorio (*). No se permite crear productos sin imagen.');
      return;
    }

    if (!cleanImage.startsWith('http://') && !cleanImage.startsWith('https://') && !cleanImage.startsWith('data:image/')) {
      setErrorMessage('La URL de la imagen debe ser una dirección web válida (ejemplo: https://...).');
      return;
    }

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
      stock: isUnique ? 1 : Number(stock),
      isUnique,
      rating: productToEdit?.rating || 5.0,
      variations: variations.length > 0 ? variations : undefined,
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border-4 border-black w-full max-w-2xl shadow-brutal-xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
        
        {/* MODAL HEADER */}
        <div className="bg-black text-white p-4 flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-yellow" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-display">
              {productToEdit ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO EN CATÁLOGO'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-brand-pink text-white border-2 border-white font-black hover:bg-red-600 flex items-center justify-center transition-all shadow-brutal-sm cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* MODAL FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs font-bold max-h-[80vh] overflow-y-auto">
          
          {/* UNIFIED ERROR MESSAGE BANNER */}
          {errorMessage && (
            <div className="bg-red-100 border-3 border-black text-red-800 p-3 text-xs font-black uppercase shadow-brutal-sm flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SKU, FECHA DE ALTA Y CANAL DE VENTA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-yellow-50 p-3 border-2 border-black">
            <div>
              <label className="block text-black font-black uppercase mb-1">
                CÓDIGO / SKU
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="BTC-101"
                className="w-full border-2 border-black p-2 bg-white text-black font-bold focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-black font-black uppercase mb-1">
                FECHA DE ALTA / INICIO
              </label>
              <input
                type="date"
                value={dateAdded}
                onChange={(e) => setDateAdded(e.target.value)}
                className="w-full border-2 border-black p-2 bg-white text-black font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-black font-black uppercase mb-1">
                CANAL / DISPONIBILIDAD
              </label>
              <select
                value={salesChannel}
                onChange={(e) => setSalesChannel(e.target.value as any)}
                className="w-full border-2 border-black p-2 bg-white text-black font-bold focus:outline-none uppercase cursor-pointer"
              >
                <option value="AMBOS">WEB Y LOCAL FÍSICO</option>
                <option value="SOLO_WEB">SOLO EN TIENDA WEB</option>
                <option value="SOLO_LOCAL">SOLO EN LOCAL FÍSICO</option>
              </select>
            </div>
          </div>

          {/* NAME & CATEGORY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-black font-black uppercase mb-1">
                NOMBRE DEL PRODUCTO *
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
                CATEGORÍA *
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

          {/* PRICES (PUBLIC & COST), STOCK & MATERIAL */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-black font-black uppercase mb-1">
                PRECIO PÚBLICO ($) *
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="15.00"
                className="w-full border-3 border-black p-2 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm"
              />
            </div>

            <div>
              <label className="block text-black font-black uppercase mb-1">
                PRECIO COSTO ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="Margen / Costo"
                className="w-full border-3 border-black p-2 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm"
              />
            </div>

            <div>
              <label className="block text-black font-black uppercase mb-1">
                PRECIO ANTERIOR ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="Oferta"
                className="w-full border-3 border-black p-2 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm"
              />
            </div>

            <div>
              <label className="block text-black font-black uppercase mb-1">
                STOCK DISPONIBLE *
              </label>
              <input
                type="number"
                min="0"
                disabled={isUnique}
                value={isUnique ? 1 : stock}
                onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                placeholder="20"
                className={`w-full border-3 border-black p-2 text-black font-bold focus:outline-none shadow-brutal-sm ${
                  isUnique ? 'bg-purple-100 text-purple-950 cursor-not-allowed' : 'bg-gray-50 focus:bg-white'
                }`}
              />
            </div>

            {/* CHECKBOX PRODUCTO DE STOCK ÚNICO */}
            <div className="sm:col-span-4 flex items-center gap-2.5 p-3 bg-brand-purple/15 border-2 border-black shadow-brutal-sm">
              <input
                type="checkbox"
                id="isUniqueCheckbox"
                checked={isUnique}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsUnique(checked);
                  if (checked) {
                    setStock(1);
                    if (!badge) {
                      setBadge('PIEZA ÚNICA');
                      setBadgeBg('bg-brand-purple text-white');
                    }
                  }
                }}
                className="w-4 h-4 accent-brand-purple cursor-pointer"
              />
              <label htmlFor="isUniqueCheckbox" className="text-black font-black uppercase text-xs cursor-pointer select-none flex items-center gap-1.5">
                <span>PRODUCTO DE STOCK ÚNICO / PIEZA ÚNICA (Solo 1 unidad irrepetible, ej. Peluches artesanales o Pinturas)</span>
              </label>
            </div>
          </div>

          {/* MATERIAL & SPECIFICATION */}
          <div>
            <label className="block text-black font-black uppercase mb-1">
              MATERIAL / COMPOSICIÓN DEL PRODUCTO
            </label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Ej: Felpa hipoalergénica lavable, Algodón 100%, Vinilo mate 3M, Acero quirúrgico"
              className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm"
            />
          </div>

          {/* IMAGE URL */}
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
              <div className="mt-2 flex items-center gap-3 bg-yellow-50 p-2 border-2 border-black">
                <img src={image} alt="Preview" className="w-12 h-12 object-cover border border-black shrink-0" />
                <span className="text-[10px] text-gray-600 font-bold uppercase truncate">VISTA PREVIA DE LA IMAGEN</span>
              </div>
            )}
          </div>

          {/* BADGE / ETIQUETA SELECTION (ASOCIACIÓN CON ETIQUETAS Y TEXTO CUSTOM) */}
          <div className="space-y-3 bg-yellow-50/70 p-3.5 border-2 border-black">
            <div className="flex items-center justify-between">
              <label className="block text-black font-black uppercase text-xs">
                ETIQUETA ADMINISTRADA ASOCIADA (BADGE TABULADO)
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

            {/* TABULADA BADGE BUTTONS GRID */}
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
                    className={`p-2 border-2 border-black text-center font-black text-xs uppercase transition-all shadow-brutal-sm cursor-pointer ${
                      isSelected
                        ? 'bg-brand-pink text-white font-black translate-x-0.5 translate-y-0.5'
                        : 'bg-white text-black hover:bg-yellow-200'
                    }`}
                  >
                    {isSelected ? `✓ ${tagObj.name}` : tagObj.name}
                  </button>
                );
              })}
            </div>

            {/* CUSTOM BADGE TEXT ASSOCIATED */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t-2 border-black/20">
              <div>
                <label className="block text-black font-black text-[11px] uppercase mb-1">
                  TEXTO MOSTRADO DE LA ETIQUETA (EJ: -20%, PROMO 2x1):
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Ej: -20%, RE-STOCK, VINTAGE, PIEZA ÚNICA..."
                  className="w-full border-2 border-black p-2 bg-white text-black font-bold focus:outline-none uppercase shadow-brutal-sm text-xs"
                />
              </div>

              <div>
                <label className="block text-black font-black text-[11px] uppercase mb-1">
                  COLOR ESTILÍSTICO DEL BADGE:
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
                <span className="text-gray-600">VISTA PREVIA DE ASIGNACIÓN:</span>
                <span className={`px-2.5 py-0.5 border border-black font-black text-xs uppercase shadow-brutal-sm ${badgeBg}`}>
                  {badge}
                </span>
              </div>
            )}
          </div>

          {/* VARIACIONES EDITABLES DEL PRODUCTO */}
          <div className="space-y-3 bg-blue-50/70 p-3.5 border-2 border-black">
            <label className="text-black font-black uppercase text-xs flex items-center justify-between">
              <span>VARIACIONES DEL PRODUCTO (Editables por el Administrador)</span>
              <span className="text-[10px] text-gray-500 font-bold">Soporta recargos y stock por variante (ej: S [15], XL (+800) [5], XXL (+1500) [0])</span>
            </label>

            {/* LIST OF CURRENT VARIATIONS */}
            {variations.length > 0 && (
              <div className="space-y-2">
                {variations.map((v, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white border-2 border-black p-2 shadow-brutal-sm">
                    <div>
                      <span className="font-black uppercase text-black text-xs">{v.name}: </span>
                      <span className="font-bold text-brand-purple text-xs">
                        {v.options.map((opt) => {
                          const lbl = getOptionLabel(opt);
                          const delta = getOptionPriceDelta(opt);
                          const stk = getOptionStock(opt);
                          let str = lbl;
                          if (delta > 0) str += ` (+$${delta.toLocaleString('es-AR')})`;
                          if (stk !== undefined) str += ` [Stock: ${stk}]`;
                          return str;
                        }).join(', ')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVariations(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-red-600 hover:bg-red-100 border border-black cursor-pointer"
                      title="Eliminar variación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ADD NEW VARIATION */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t-2 border-black/20">
              <input
                type="text"
                placeholder="Nombre (ej: TALLE DE PRENDA)"
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
                className="sm:col-span-5 border-2 border-black p-1.5 bg-white text-black font-bold uppercase text-xs"
              />
              <input
                type="text"
                placeholder="Opciones (ej: S [15], M [20], XL (+800) [5], XXL [0])"
                value={newVarOptions}
                onChange={(e) => setNewVarOptions(e.target.value)}
                className="sm:col-span-5 border-2 border-black p-1.5 bg-white text-black font-bold uppercase text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newVarName.trim() || !newVarOptions.trim()) return;
                  const rawTokens = newVarOptions.split(',').map(s => s.trim()).filter(Boolean);
                  if (rawTokens.length === 0) return;
                  
                  const parsedOpts: (string | ProductVariationOption)[] = rawTokens.map(tok => {
                    const match = tok.match(/^(.*?)(?:\s*\(\s*\+\s*\$?(\d+(?:\.\d+)?)\s*\))?(?:\s*\[\s*(\d+)\s*\])?$/);
                    if (match) {
                      const label = match[1].trim();
                      const priceDelta = match[2] ? Number(match[2]) : undefined;
                      const optStock = match[3] !== undefined ? Number(match[3]) : undefined;

                      if (priceDelta !== undefined || optStock !== undefined) {
                        return {
                          label,
                          ...(priceDelta !== undefined ? { priceDelta } : {}),
                          ...(optStock !== undefined ? { stock: optStock } : {}),
                        };
                      }
                    }
                    return tok;
                  });

                  setVariations(prev => [...prev, { name: newVarName.trim().toUpperCase(), options: parsedOpts }]);
                  setNewVarName('');
                  setNewVarOptions('');
                }}
                className="sm:col-span-2 bg-brand-yellow text-black font-black border-2 border-black p-1.5 hover:bg-brand-pink hover:text-white uppercase text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> AÑADIR
              </button>
            </div>
          </div>

          {/* ESTILOS SELECTION */}
          <div>
            <label className="block text-black font-black uppercase mb-1">
              ESTILOS VINCULADOS
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {ALL_VIBES.map((vibe) => {
                const isSelected = selectedVibes.includes(vibe);
                return (
                  <button
                    type="button"
                    key={vibe}
                    onClick={() => handleVibeToggle(vibe)}
                    className={`px-3 py-1 border-2 border-black font-black text-xs uppercase transition-all shadow-brutal-sm cursor-pointer ${
                      isSelected
                        ? 'bg-brand-pink text-white shadow-brutal'
                        : 'bg-white text-black hover:bg-yellow-200'
                    }`}
                  >
                    {isSelected ? `✓ ${vibe}` : vibe}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-black font-black uppercase mb-1">
              DESCRIPCIÓN DEL PRODUCTO
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre materiales, tamaños, confección o acabados..."
              className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm resize-none"
            />
          </div>

          {/* FORM ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t-3 border-black">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border-3 border-black bg-white text-black font-black hover:bg-gray-200 uppercase shadow-brutal-sm active:translate-y-0.5 cursor-pointer"
            >
              CANCELAR
            </button>
            
            <button
              type="submit"
              className="px-6 py-2.5 border-3 border-black bg-brand-yellow text-black font-black hover:bg-brand-orange hover:text-white uppercase shadow-brutal transition-all flex items-center gap-2 active:translate-y-0.5 cursor-pointer"
            >
              {productToEdit ? (
                <>
                  <Save className="w-4 h-4" /> GUARDAR CAMBIOS
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> CREAR PRODUCTO
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
