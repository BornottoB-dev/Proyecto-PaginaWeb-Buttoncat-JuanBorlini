import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Save, Tag, AlertTriangle } from 'lucide-react';
import type { CategoryItem } from '../../types/types';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: CategoryItem) => void;
  categoryToEdit?: CategoryItem | null;
  isDarkMode?: boolean;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categoryToEdit,
  isDarkMode = true,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number | ''>(10.00);
  const [bgColor, setBgColor] = useState('bg-brand-pink text-white');
  const [validationModalMsg, setValidationModalMsg] = useState<string | null>(null);

  useEffect(() => {
    setValidationModalMsg(null);
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
    setValidationModalMsg(null);
    if (!name.trim()) {
      setValidationModalMsg('POR FAVOR, COMPLETA TODOS LOS CAMPOS OBLIGATORIOS (*).');
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

  const labelClass = `block text-xs font-semibold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`;
  const inputClass = `w-full rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none border transition-colors ${
    isDarkMode 
      ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-slate-700' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-800 shadow-xs'
  }`;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-lg my-6 rounded-2xl border shadow-2xl overflow-hidden font-sans transition-colors ${
          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* MODAL HEADER */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <Tag className={`w-5 h-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <h2 className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
              {categoryToEdit ? 'EDITAR CATEGORÍA' : 'NUEVA CATEGORÍA DE PRODUCTOS'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* UNIFIED ERROR MESSAGE BANNER */}
          {validationModalMsg && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium border ${
              isDarkMode ? 'bg-red-950/40 border-red-800/50 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{validationModalMsg}</span>
            </div>
          )}
          
          {/* NAME */}
          <div>
            <label className={labelClass}>NOMBRE DE CATEGORÍA *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: BANDANAS, MEDIAS, BUZOS"
              className={`${inputClass} uppercase`}
            />
          </div>

          {/* BASE PRICE & BG COLOR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>PRECIO BASE ESTIMADO ($)</label>
              <input
                type="number"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="12.00"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>ESTILO COLOR DE ETIQUETA</label>
              <select
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className={`${inputClass} uppercase cursor-pointer`}
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
            <label className={labelClass}>DESCRIPCIÓN DE LA CATEGORÍA</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción breve de los artículos de esta categoría..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* ACTIONS */}
          <div className={`px-6 py-4 flex items-center justify-end gap-3 border-t -mx-6 -mb-6 mt-4 ${
            isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isDarkMode 
                  ? 'border-slate-800 text-slate-300 hover:bg-slate-900' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
              }`}
            >
              CANCELAR
            </button>
            
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-2 ${
                isDarkMode ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gray-900 hover:bg-gray-800'
              }`}
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

