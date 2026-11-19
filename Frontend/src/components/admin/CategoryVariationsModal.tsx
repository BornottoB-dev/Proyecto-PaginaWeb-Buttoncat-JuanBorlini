import React, { useState, useEffect } from 'react';
import { X, Save, Layers, Plus, Trash2, Check } from 'lucide-react';
import type { CategoryItem, ProductVariationGroup } from '../../types/types';
import { getOptionLabel } from '../../types/types';
import { ValidationModal } from '../ui/ValidationModal';

interface CategoryVariationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryItem | null;
  onSave: (updatedCategory: CategoryItem) => void;
  isDarkMode?: boolean;
}

export const CategoryVariationsModal: React.FC<CategoryVariationsModalProps> = ({
  isOpen,
  onClose,
  category,
  onSave,
  isDarkMode = false,
}) => {
  const [variationTypes, setVariationTypes] = useState<ProductVariationGroup[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeOptions, setNewTypeOptions] = useState('');
  const [inlineOptionInputs, setInlineOptionInputs] = useState<Record<number, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      const initialVars = category.variationTypes && category.variationTypes.length > 0
        ? JSON.parse(JSON.stringify(category.variationTypes))
        : [];
      setVariationTypes(initialVars);
      setNewTypeName('');
      setNewTypeOptions('');
      setInlineOptionInputs({});
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [category, isOpen]);

  if (!isOpen || !category) return null;

  const handleAddVariationType = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = newTypeName.trim().toUpperCase();
    if (!cleanName) {
      setErrorMessage('Ingresa el nombre del tipo de variante (ej: TALLE, COLOR, TIPO DE TELA).');
      return;
    }

    if (variationTypes.some((vt) => vt.name.toUpperCase() === cleanName)) {
      setErrorMessage(`El tipo de variante "${cleanName}" ya existe en esta categoría.`);
      return;
    }

    const parsedOptions = newTypeOptions
      .split(',')
      .map((opt) => opt.trim())
      .filter(Boolean);

    const newGroup: ProductVariationGroup = {
      name: cleanName,
      options: parsedOptions.length > 0 ? parsedOptions : ['Opción 1', 'Opción 2'],
    };

    setVariationTypes((prev) => [...prev, newGroup]);
    setNewTypeName('');
    setNewTypeOptions('');
  };

  const handleRemoveVariationType = (index: number) => {
    setVariationTypes((prev) => prev.filter((_, i) => i !== index));
    setErrorMessage(null);
  };

  const handleRemoveOptionFromType = (typeIndex: number, optionIndex: number) => {
    setVariationTypes((prev) =>
      prev.map((vt, i) => {
        if (i !== typeIndex) return vt;
        const newOptions = vt.options.filter((_, optI) => optI !== optionIndex);
        return {
          ...vt,
          options: newOptions.length > 0 ? newOptions : ['Opción 1'],
        };
      })
    );
  };

  const handleAddInlineOption = (typeIndex: number) => {
    const text = (inlineOptionInputs[typeIndex] || '').trim();
    if (!text) return;

    setVariationTypes((prev) =>
      prev.map((vt, i) => {
        if (i !== typeIndex) return vt;
        const exists = vt.options.some((o) => getOptionLabel(o).toUpperCase() === text.toUpperCase());
        if (exists) return vt;
        return {
          ...vt,
          options: [...vt.options, text],
        };
      })
    );

    setInlineOptionInputs((prev) => ({ ...prev, [typeIndex]: '' }));
  };

  const handleSave = () => {
    const updatedCategory: CategoryItem = {
      ...category,
      variationTypes,
    };
    onSave(updatedCategory);
    setSuccessMessage('Variantes guardadas correctamente.');
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in font-sans ${
        isDarkMode ? 'bg-black/80' : 'bg-black/60 backdrop-blur-xs'
      }`}
    >
      <div
        className={`w-full max-w-4xl max-h-[92vh] my-auto rounded-2xl border shadow-2xl overflow-hidden transition-colors flex flex-col ${
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
              <Layers className="w-5 h-5 text-gray-700 dark:text-slate-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base font-bold uppercase tracking-wide ${
                  isDarkMode ? 'text-slate-100' : 'text-gray-900'
                }`}>
                  Variantes de Categoría: {category.name}
                </h2>
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 border border-gray-300 dark:border-slate-700 ${category.bgColor?.split(' ')[0] || 'bg-brand-pink'}`} />
              </div>
              <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Tabla de atributos y opciones sugeridas para productos de esta categoría
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

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-5 font-sans max-h-[calc(92vh-150px)]">
          {/* NOTICES */}
          {successMessage && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-semibold border ${
              isDarkMode ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <Check className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ADD VARIATION TYPE FORM */}
          <form
            noValidate
            onSubmit={handleAddVariationType}
            className={`p-4 border rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-end ${
              isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="md:col-span-5 space-y-1">
              <label htmlFor="cat-new-type-name" className={`block text-[11px] font-bold uppercase ${
                isDarkMode ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Nuevo Tipo de Variante *
              </label>
              <input
                id="cat-new-type-name"
                name="newTypeName"
                aria-label="Nuevo Tipo de Variante"
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Ej: TALLE, COLOR, TIPO DE TELA"
                className={`w-full border p-2 font-bold text-xs uppercase rounded-lg focus:outline-none ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-900'
                }`}
              />
            </div>

            <div className="md:col-span-5 space-y-1">
              <label htmlFor="cat-new-type-options" className={`block text-[11px] font-bold uppercase ${
                isDarkMode ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Opciones Iniciales (separadas por coma)
              </label>
              <input
                id="cat-new-type-options"
                name="newTypeOptions"
                aria-label="Opciones Iniciales separadas por coma"
                type="text"
                value={newTypeOptions}
                onChange={(e) => setNewTypeOptions(e.target.value)}
                placeholder="Ej: S, M, L, XL o Peluche Soft, Corderito"
                className={`w-full border p-2 font-semibold text-xs rounded-lg focus:outline-none ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-900'
                }`}
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isDarkMode ? 'bg-slate-100 text-slate-950 hover:bg-white' : 'bg-gray-900 text-white hover:bg-black shadow-xs'
                }`}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> ASOCIAR
              </button>
            </div>
          </form>

          {/* TABLA PRINCIPAL DE TIPOS DE VARIANTES */}
          <div className={`border rounded-xl overflow-hidden ${
            isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white shadow-xs'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                    isDarkMode ? 'bg-slate-900 text-slate-300 border-slate-800' : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>
                    <th className="py-3 px-4 w-48">Tipo de Variante</th>
                    <th className="py-3 px-4">Opciones Sugeridas</th>
                    <th className="py-3 px-4 w-28 text-center">Cant. Opciones</th>
                    <th className="py-3 px-4 w-24 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-semibold ${
                  isDarkMode ? 'divide-slate-800 text-slate-200' : 'divide-gray-100 text-gray-900'
                }`}>
                  {variationTypes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={`py-8 text-center font-medium ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-500'
                      }`}>
                        No hay tipos de variantes asociados a esta categoría.
                      </td>
                    </tr>
                  ) : (
                    variationTypes.map((vt, typeIdx) => (
                      <tr
                        key={`${vt.name}-${typeIdx}`}
                        className={`transition-colors ${
                          isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50/80'
                        }`}
                      >
                        {/* NOMBRE DEL TIPO */}
                        <td className="py-3 px-4 align-top">
                          <span className={`font-mono font-bold text-xs uppercase block ${
                            isDarkMode ? 'text-slate-100' : 'text-gray-900'
                          }`}>
                            {vt.name}
                          </span>
                        </td>

                        {/* LISTA DE OPCIONES & INPUT INLINE */}
                        <td className="py-3 px-4 align-top space-y-2">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {vt.options.map((opt, optIdx) => {
                              const label = getOptionLabel(opt);
                              return (
                                <span
                                  key={optIdx}
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
                                    isDarkMode
                                      ? 'bg-slate-950 border-slate-700 text-slate-200'
                                      : 'bg-gray-100 border-gray-300 text-gray-800'
                                  }`}
                                >
                                  <span>{label}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOptionFromType(typeIdx, optIdx)}
                                    className="text-gray-400 hover:text-red-500 cursor-pointer text-xs"
                                    title={`Eliminar opción ${label}`}
                                  >
                                    ✕
                                  </button>
                                </span>
                              );
                            })}
                          </div>

                          {/* INLINE ADD OPTION INPUT */}
                          <div className="flex items-center gap-2 max-w-xs pt-1">
                            <input
                              id={`cat-inline-opt-${typeIdx}`}
                              name={`inlineOption_${typeIdx}`}
                              aria-label={`Nueva opción para ${vt.name}`}
                              type="text"
                              value={inlineOptionInputs[typeIdx] || ''}
                              onChange={(e) =>
                                setInlineOptionInputs((prev) => ({
                                  ...prev,
                                  [typeIdx]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddInlineOption(typeIdx);
                                }
                              }}
                              placeholder="+ Nueva opción..."
                              className={`px-2.5 py-1 text-xs border rounded-md focus:outline-none flex-1 ${
                                isDarkMode
                                  ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500'
                                  : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => handleAddInlineOption(typeIdx)}
                              className={`px-2 py-1 text-xs font-bold rounded-md border cursor-pointer transition-colors ${
                                isDarkMode
                                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                                  : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800'
                              }`}
                            >
                              + Agregar
                            </button>
                          </div>
                        </td>

                        {/* TOTAL OPCIONES */}
                        <td className="py-3 px-4 align-top text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                            isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {vt.options.length} un.
                          </span>
                        </td>

                        {/* ACCIONES */}
                        <td className="py-3 px-4 align-top text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariationType(typeIdx)}
                            className={`p-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer inline-flex items-center gap-1 ${
                              isDarkMode
                                ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/30'
                                : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={`Eliminar tipo ${vt.name}`}
                          >
                            <Trash2 className="w-4 h-4" /> Borrar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className={`px-6 py-4 flex items-center justify-between border-t shrink-0 ${
          isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              isDarkMode
                ? 'border-slate-700 text-slate-300 hover:bg-slate-800 bg-slate-900'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
            }`}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={`px-5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              isDarkMode
                ? 'bg-slate-100 text-slate-900 hover:bg-white'
                : 'bg-gray-900 text-white hover:bg-black'
            }`}
          >
            <Save className="w-4 h-4" /> Guardar Variantes de Categoría
          </button>
        </div>
      </div>

      {/* VALIDATION NOTICE MODAL */}
      <ValidationModal
        isOpen={!!errorMessage}
        title="AVISO DE VARIACIÓN"
        message={errorMessage || ''}
        onClose={() => setErrorMessage(null)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
