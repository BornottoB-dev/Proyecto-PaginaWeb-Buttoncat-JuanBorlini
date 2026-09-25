import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Save, Tag } from 'lucide-react';
import type { CategoryItem } from '../../types/types';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: CategoryItem) => void;
  categoryToEdit?: CategoryItem | null;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categoryToEdit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number | ''>(10.00);
  const [bgColor, setBgColor] = useState('bg-brand-pink text-white');

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setDescription(categoryToEdit.description || '');
      setBasePrice(categoryToEdit.basePrice || 10.00);
      setBgColor(categoryToEdit.bgColor || 'bg-brand-pink text-white');
    } else {
      setName('');
      setDescription('');
      setBasePrice(10.00);
      setBgColor('bg-brand-pink text-white');
    }
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Ingresa el nombre de la categoría');
      return;
    }

    const categoryData: CategoryItem = {
      id: categoryToEdit ? categoryToEdit.id : `cat-${Date.now()}`,
      name: name.trim().toUpperCase(),
      description: description.trim() || 'Categoría exclusiva Buttoncat Studio.',
      basePrice: basePrice ? Number(basePrice) : 10.00,
      bgColor,
    };

    onSave(categoryData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border-4 border-black w-full max-w-lg shadow-brutal-xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
        
        {/* MODAL HEADER */}
        <div className="bg-black text-white p-4 flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-brand-yellow" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-display">
              {categoryToEdit ? 'EDITAR CATEGORÍA' : 'NUEVA CATEGORÍA DE PRODUCTOS'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-brand-pink text-white border-2 border-white font-black hover:bg-red-600 flex items-center justify-center transition-all shadow-brutal-sm cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold">
          
          {/* NAME */}
          <div>
            <label className="block text-black font-black uppercase mb-1">
              NOMBRE DE CATEGORÍA *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: BANDANAS, MEDIAS, BUZOS"
              className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm uppercase"
            />
          </div>

          {/* BASE PRICE & BG COLOR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-black font-black uppercase mb-1">
                PRECIO BASE ESTIMADO ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="12.00"
                className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm"
              />
            </div>

            <div>
              <label className="block text-black font-black uppercase mb-1">
                ESTILO COLOR DE ETIQUETA
              </label>
              <select
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm uppercase cursor-pointer"
              >
                <option value="bg-brand-pink text-white">ROSA BRAND</option>
                <option value="bg-brand-orange text-white">NARANJA BRAND</option>
                <option value="bg-brand-yellow text-black">AMARILLO BRAND</option>
                <option value="bg-brand-cyan text-black">CYAN BRAND</option>
                <option value="bg-brand-purple text-white">PÚRPURA BRAND</option>
                <option value="bg-black text-white">NEGRO DARK</option>
              </select>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-black font-black uppercase mb-1">
              DESCRIPCIÓN DE LA CATEGORÍA
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción breve de los artículos de esta categoría..."
              className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm resize-none"
            />
          </div>

          {/* ACTIONS */}
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
              className="px-6 py-2.5 border-3 border-black bg-brand-pink text-white font-black hover:bg-brand-orange uppercase shadow-brutal transition-all flex items-center gap-2 active:translate-y-0.5 cursor-pointer"
            >
              {categoryToEdit ? (
                <>
                  <Save className="w-4 h-4" /> GUARDAR CAMBIOS
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> CREAR CATEGORÍA
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
