import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, Sparkles } from 'lucide-react';
import type { Product, ProductVibe, CategoryItem } from '../../types/types';

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
  categories: CategoryItem[];
}

const ALL_VIBES: ProductVibe[] = ['GOTH', 'Y2K', 'KAWAII', 'PUNK', 'ROCK', 'NEÓN'];

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  categories,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [image, setImage] = useState('');
  const [stock, setStock] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [badgeBg, setBadgeBg] = useState('bg-brand-orange text-white');
  const [selectedVibes, setSelectedVibes] = useState<ProductVibe[]>([]);
  
  // Nuevos atributos de producto
  const [sku, setSku] = useState('');
  const [dateAdded, setDateAdded] = useState('');
  const [salesChannel, setSalesChannel] = useState<'AMBOS' | 'SOLO_WEB' | 'SOLO_LOCAL'>('AMBOS');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [material, setMaterial] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setPrice(productToEdit.price);
      setOriginalPrice(productToEdit.originalPrice || '');
      setImage(productToEdit.image);
      setStock(productToEdit.stock);
      setDescription(productToEdit.description);
      setBadge(productToEdit.badge || '');
      setBadgeBg(productToEdit.badgeBg || 'bg-brand-orange text-white');
      setSelectedVibes(productToEdit.vibe || []);
      setSku(productToEdit.sku || `BTC-${Math.floor(100 + Math.random() * 900)}`);
      setDateAdded(productToEdit.dateAdded || today);
      setSalesChannel(productToEdit.salesChannel || 'AMBOS');
      setCostPrice(productToEdit.costPrice || '');
      setMaterial(productToEdit.material || '');
    } else {
      setName('');
      setCategory(categories[0]?.name || 'STICKERS');
      setPrice('');
      setOriginalPrice('');
      setImage('https://images.unsplash.com/photo-1572375992501-4b0892d50c69?q=80&w=600&auto=format&fit=crop');
      setStock(15);
      setDescription('');
      setBadge('');
      setBadgeBg('bg-brand-orange text-white');
      setSelectedVibes(['KAWAII']);
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

    if (!name.trim() || !category.trim() || !price || !image.trim()) {
      alert('Por favor completa todos los campos obligatorios (*)');
      return;
    }

    const newProduct: Product = {
      id: productToEdit ? productToEdit.id : `prod-${Date.now()}`,
      name: name.trim().toUpperCase(),
      category: category.trim().toUpperCase(),
      vibe: selectedVibes.length > 0 ? selectedVibes : ['KAWAII'],
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      image: image.trim(),
      badge: badge.trim() ? badge.trim().toUpperCase() : undefined,
      badgeBg: badge.trim() ? badgeBg : undefined,
      description: description.trim() || 'Producto exclusivo de la colección Buttoncat Studio.',
      isCustomizable: false,
      stock: Number(stock),
      rating: productToEdit?.rating || 5.0,
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
                <option value="AMBOS">🌐 WEB Y LOCAL FÍSICO</option>
                <option value="SOLO_WEB">🛒 SOLO EN TIENDA WEB</option>
                <option value="SOLO_LOCAL">🏪 SOLO EN LOCAL FÍSICO</option>
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
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: COLGANTE LUNA OBSIDIANA"
                className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm uppercase"
              />
            </div>

            <div>
              <label className="block text-black font-black uppercase mb-1">
                CATEGORÍA *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
                required
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
                required
                min="0"
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                placeholder="20"
                className="w-full border-3 border-black p-2 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm"
              />
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
              placeholder="Ej: Algodón peinado 100%, Vinilo mate 3M impermeable, Acero quirúrgico"
              className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm"
            />
          </div>

          {/* IMAGE URL */}
          <div>
            <label className="block text-black font-black uppercase mb-1">
              URL DE LA IMAGEN *
            </label>
            <input
              type="url"
              required
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm"
            />
            {image && (
              <div className="mt-2 flex items-center gap-3 bg-yellow-50 p-2 border-2 border-black">
                <img src={image} alt="Preview" className="w-12 h-12 object-cover border border-black shrink-0" />
                <span className="text-[10px] text-gray-600 font-bold uppercase truncate">VISTA PREVIA DE LA IMAGEN</span>
              </div>
            )}
          </div>

          {/* BADGE & BADGE COLOR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-black font-black uppercase mb-1">
                BADGE / ETIQUETA DESTACADA
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Ej: ¡NUEVO!, NEW DROP, -20%"
                className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm uppercase"
              />
            </div>

            <div>
              <label className="block text-black font-black uppercase mb-1">
                COLOR DE BADGE
              </label>
              <select
                value={badgeBg}
                onChange={(e) => setBadgeBg(e.target.value)}
                className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm uppercase cursor-pointer"
              >
                <option value="bg-brand-orange text-white">NARANJA BRAND</option>
                <option value="bg-brand-pink text-white">ROSA BRAND</option>
                <option value="bg-brand-yellow text-black">AMARILLO BRAND</option>
                <option value="bg-brand-cyan text-black">CYAN BRAND</option>
                <option value="bg-brand-purple text-white">PÚRPURA BRAND</option>
              </select>
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
