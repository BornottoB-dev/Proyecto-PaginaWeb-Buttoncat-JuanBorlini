import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, Tag } from 'lucide-react';
import type { RewardCategoryItem } from '../../types/types';
import { getNextAutoNumericId } from '../../types/types';
import { ValidationModal } from '../ui/ValidationModal';

interface AddEditRewardCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: RewardCategoryItem) => void;
  categoryToEdit?: RewardCategoryItem | null;
  existingCategories?: RewardCategoryItem[];
  isDarkMode?: boolean;
}

export const AddEditRewardCategoryModal: React.FC<AddEditRewardCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categoryToEdit,
  existingCategories = [],
  isDarkMode = true,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [badgeBg, setBadgeBg] = useState('bg-brand-pink text-white');
  const [validationModalMsg, setValidationModalMsg] = useState<string | null>(null);

  useEffect(() => {
    setValidationModalMsg(null);
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setDescription(categoryToEdit.description || '');
      setBadgeBg(categoryToEdit.badgeBg || 'bg-brand-pink text-white');
    } else {
      setName('');
      setDescription('');
      setBadgeBg('bg-brand-pink text-white');
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

    const categoryData: RewardCategoryItem = {
      id: categoryToEdit ? categoryToEdit.id : getNextAutoNumericId('rew-cat-', existingCategories),
      name: name.trim().toUpperCase(),
      description: description.trim() || 'Categoría de beneficios del club de recompensas.',
      badgeBg,
    };

    onSave(categoryData);
    onClose();
  };

  const labelClass = `text-[11px] font-semibold uppercase tracking-wider block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`;
  const inputClass = `w-full rounded-lg px-3 py-2 text-xs font-medium border focus:outline-none transition-colors ${
    isDarkMode 
      ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-slate-400' 
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 shadow-2xs'
  }`;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in font-sans ${
        isDarkMode ? 'bg-black/80' : 'bg-black/60 backdrop-blur-xs'
      }`}
    >
      <div 
        className={`w-full max-w-lg my-auto rounded-2xl border shadow-2xl overflow-hidden transition-colors flex flex-col ${
          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className={`px-6 py-4 flex items-center justify-between border-b shrink-0 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
              isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-gray-900 border-gray-200 shadow-2xs'
            }`}>
              <Tag className="w-5 h-5 text-gray-700 dark:text-slate-300" />
            </div>
            <div>
              <h2 className={`text-base font-bold uppercase tracking-wide ${
                isDarkMode ? 'text-slate-100' : 'text-gray-900'
              }`}>
                {categoryToEdit ? 'Editar Categoría de Premio' : 'Crear Categoría de Premio'}
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Clasificación de recompensas del club • Buttoncat Admin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'
            }`}
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* NAME */}
          <div>
            <label htmlFor="admin-reward-cat-name" className={labelClass}>NOMBRE DE LA CATEGORÍA *</label>
            <input
              id="admin-reward-cat-name"
              name="name"
              aria-label="Nombre de la Categoría"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: VOUCHERS, DESCUENTOS, PRODUCTOS..."
              className={inputClass}
            />
          </div>

          {/* BADGE COLOR */}
          <div>
            <label htmlFor="admin-reward-cat-bgcolor" className={labelClass}>ESTILO COLOR DE ETIQUETA</label>
            <select
              id="admin-reward-cat-bgcolor"
              name="badgeBg"
              aria-label="Estilo Color de Etiqueta"
              value={badgeBg}
              onChange={(e) => setBadgeBg(e.target.value)}
              className={`${inputClass} uppercase cursor-pointer`}
            >
              <option value="bg-brand-pink text-white">ROSA BRAND</option>
              <option value="bg-brand-orange text-white">NARANJA BRAND</option>
              <option value="bg-brand-yellow text-black">AMARILLO BRAND</option>
              <option value="bg-brand-cyan text-black">CYAN BRAND</option>
              <option value="bg-brand-purple text-white">PÚRPURA BRAND</option>
              <option value="bg-emerald-500 text-white">ESMERALDA BRAND</option>
              <option value="bg-black text-white">NEGRO DARK</option>
            </select>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label htmlFor="admin-reward-cat-description" className={labelClass}>DESCRIPCIÓN DEL BENEFICIO</label>
            <textarea
              id="admin-reward-cat-description"
              name="description"
              aria-label="Descripción de la Categoría de Premio"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explica qué tipo de recompensas incluye esta categoría..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* ACTIONS */}
          <div className={`px-6 py-4 flex items-center justify-between border-t shrink-0 -mx-6 -mb-6 mt-6 ${
            isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 bg-slate-900' : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
              }`}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-gray-900 text-white hover:bg-black'
              }`}
            >
              {categoryToEdit ? (
                <>
                  <Save className="w-4 h-4" /> Guardar Cambios
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> Crear Categoría
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* VALIDATION NOTICE MODAL */}
      <ValidationModal
        isOpen={!!validationModalMsg}
        title="CAMPO OBLIGATORIO REQUERIDO"
        message={validationModalMsg || ''}
        onClose={() => setValidationModalMsg(null)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
