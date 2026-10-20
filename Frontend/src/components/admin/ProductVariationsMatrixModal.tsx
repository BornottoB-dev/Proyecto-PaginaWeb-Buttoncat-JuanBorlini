import React, { useState, useEffect } from 'react';
import { X, Save, SlidersHorizontal, Grid, Plus, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import type { Product, ProductVariationGroup } from '../../types/types';
import { getDefaultVariationsForCategory, getOptionLabel, getOptionPriceDelta, getOptionStock, getCombinationKey, getAllCombinations, calculateTotalProductStock } from '../../types/types';

interface ProductVariationsMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProduct: Product) => void;
  product: Product | null;
  isDarkMode?: boolean;
}

export const ProductVariationsMatrixModal: React.FC<ProductVariationsMatrixModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  isDarkMode = false,
}) => {
  const [subTab, setSubTab] = useState<'groups' | 'matrix'>('groups');
  const [variations, setVariations] = useState<ProductVariationGroup[]>([]);
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({});
  const [bulkStockVal, setBulkStockVal] = useState<number | ''>('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newOptInputs, setNewOptInputs] = useState<Record<number, { label: string; stock: number | ''; delta: number | '' }>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      const initialVars = (product.variations && product.variations.length > 0)
        ? JSON.parse(JSON.stringify(product.variations))
        : getDefaultVariationsForCategory(product.category);
      setVariations(initialVars);
      setVariantStocks(product.variantStocks ? { ...product.variantStocks } : {});
      setSubTab('groups');
      setErrorMessage(null);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleResetToCategoryDefaults = () => {
    const defs = getDefaultVariationsForCategory(product.category);
    setVariations(defs);
    setVariantStocks({});
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const nameUpper = newGroupName.trim().toUpperCase();
    if (variations.some((v) => v.name.toUpperCase() === nameUpper)) {
      setErrorMessage(`El grupo "${nameUpper}" ya existe.`);
      return;
    }
    setVariations((prev) => [...prev, { name: nameUpper, options: ['Opción 1'] }]);
    setNewGroupName('');
    setErrorMessage(null);
  };

  const handleRemoveGroup = (idx: number) => {
    setVariations((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddOptionToGroup = (groupIdx: number) => {
    const input = newOptInputs[groupIdx];
    if (!input || !input.label.trim()) return;
    const labelClean = input.label.trim();

    setVariations((prev) => {
      const copy = [...prev];
      const targetGroup = { ...copy[groupIdx] };
      const currentOpts = [...targetGroup.options];

      const exists = currentOpts.some((opt) => getOptionLabel(opt).toUpperCase() === labelClean.toUpperCase());
      if (exists) {
        setErrorMessage(`La opción "${labelClean}" ya existe en este grupo.`);
        return prev;
      }

      const hasDeltaOrStock = input.delta !== '' || input.stock !== '';
      if (hasDeltaOrStock) {
        currentOpts.push({
          label: labelClean,
          priceDelta: input.delta !== '' ? Number(input.delta) : undefined,
          stock: input.stock !== '' ? Number(input.stock) : undefined,
        });
      } else {
        currentOpts.push(labelClean);
      }

      targetGroup.options = currentOpts;
      copy[groupIdx] = targetGroup;
      return copy;
    });

    setNewOptInputs((prev) => ({
      ...prev,
      [groupIdx]: { label: '', stock: '', delta: '' },
    }));
    setErrorMessage(null);
  };

  const handleRemoveOptionFromGroup = (groupIdx: number, optIdx: number) => {
    setVariations((prev) => {
      const copy = [...prev];
      const targetGroup = { ...copy[groupIdx] };
      targetGroup.options = targetGroup.options.filter((_, i) => i !== optIdx);
      copy[groupIdx] = targetGroup;
      return copy;
    });
  };

  const handleGenerateMatrix = () => {
    const tempProd: Product = {
      ...product,
      variations,
    };
    const allCombos = getAllCombinations(tempProd);
    const newMatrix: Record<string, number> = {};
    const defaultVal = Number(product.stock) || 10;
    allCombos.forEach((combo) => {
      const key = getCombinationKey(combo);
      newMatrix[key] = variantStocks[key] !== undefined ? variantStocks[key] : defaultVal;
    });
    setVariantStocks(newMatrix);
    setSubTab('matrix');
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

  const handleSaveMatrix = () => {
    if (!product) return;
    const tempProd: Product = {
      ...product,
      variations,
      variantStocks,
    };
    const calculatedTotalStock = calculateTotalProductStock(tempProd);
    onSave({
      ...tempProd,
      stock: calculatedTotalStock,
    });
    onClose();
  };

  const combinationsList = getAllCombinations({ ...product, variations });

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in font-sans ${
        isDarkMode ? 'bg-black/80' : 'bg-black/60 backdrop-blur-xs'
      }`}
      onClick={onClose}
    >
      <div
        className={`max-w-4xl w-full mx-auto rounded-2xl border-4 border-black shadow-2xl overflow-hidden font-sans transition-colors flex flex-col max-h-[90vh] my-auto ${
          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP EDITOR NAVIGATION HEADER (MISMOS COLORES Y ESTILO QUE CREAR/EDITAR PRODUCTO) */}
        <div className="bg-brand-yellow text-black p-3.5 sm:p-5 border-b-4 border-black shrink-0 shadow-brutal-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-brand-yellow flex items-center justify-center border-2 border-black shadow-brutal-xs shrink-0">
              <SlidersHorizontal className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black uppercase tracking-tight font-display flex items-center gap-2 text-black">
                CONFIGURAR VARIACIONES Y MATRIZ DE STOCK
              </h2>
              <p className="text-[11px] font-black text-black/80 uppercase tracking-wide">
                PRODUCTO: {product.name} ({product.category}) • BUTTONCAT STUDIO ADMIN
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-black text-white hover:bg-brand-pink border-2 border-black p-2 font-black uppercase text-xs flex items-center gap-2 transition-all shadow-brutal-xs cursor-pointer shrink-0"
            title="Cerrar modal"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* SUB-TABS NAVIGATION BAR (MISMA ESTÉTICA QUE EL STEPPER DE PRODUCTO) */}
        <div className="bg-yellow-50 border-b-4 border-black p-2.5 sm:p-3.5 shrink-0 shadow-brutal-xs flex items-center justify-between overflow-x-auto gap-2 no-scrollbar">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSubTab('groups')}
              className={`px-3.5 py-2.5 border-2 border-black font-black text-xs uppercase transition-all shadow-brutal-xs whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                subTab === 'groups'
                  ? 'bg-brand-yellow text-black border-3 border-black shadow-brutal-sm scale-102'
                  : 'bg-white text-black hover:bg-yellow-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> 1. GRUPOS Y OPCIONES ({variations.length})
            </button>
            <button
              type="button"
              onClick={handleGenerateMatrix}
              className={`px-3.5 py-2.5 border-2 border-black font-black text-xs uppercase transition-all shadow-brutal-xs whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                subTab === 'matrix'
                  ? 'bg-brand-yellow text-black border-3 border-black shadow-brutal-sm scale-102'
                  : 'bg-white text-black hover:bg-yellow-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> 2. MATRIZ DE STOCK POR COMBINACIÓN ({combinationsList.length})
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetToCategoryDefaults}
            className="bg-white text-black hover:bg-yellow-200 border-2 border-black px-3 py-2 font-black uppercase text-[11px] flex items-center gap-1.5 transition-all shadow-brutal-xs cursor-pointer shrink-0"
            title="Restablecer a las variaciones recomendadas por categoría"
          >
            <RefreshCw className="w-3.5 h-3.5" /> PREDETERMINADOS DE {product.category}
          </button>
        </div>

        {/* BODY CONTENT */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 font-sans">
          {errorMessage && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium border ${
              isDarkMode ? 'bg-red-950/40 border-red-800/50 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SUB-TAB 1: GRUPOS Y OPCIONES */}
          {subTab === 'groups' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* CREAR NUEVO GRUPO */}
              <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ${
                isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-200'
              }`}>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Nuevo grupo de atributos (ej: COLOR, TALLE, LARGO)..."
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold uppercase border focus:outline-none ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-300 text-gray-900 shadow-2xs'
                  }`}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGroup())}
                />
                <button
                  type="button"
                  onClick={handleAddGroup}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                    isDarkMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-900 hover:bg-black'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-3" /> AGREGAR GRUPO
                </button>
              </div>

              {/* LISTA DE GRUPOS */}
              {variations.length === 0 ? (
                <div className={`p-8 text-center border border-dashed rounded-xl ${
                  isDarkMode ? 'border-slate-800 text-slate-500' : 'border-gray-300 text-gray-500'
                }`}>
                  <p className="text-xs font-bold uppercase">No hay grupos de variaciones definidos.</p>
                  <p className="text-[11px] font-medium mt-1">Agrega un grupo arriba o usa el botón de predeterminados.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {variations.map((group, groupIdx) => {
                    const optInput = newOptInputs[groupIdx] || { label: '', stock: '', delta: '' };

                    return (
                      <div
                        key={groupIdx}
                        className={`p-4 rounded-xl border space-y-3 shadow-2xs ${
                          isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200'
                        }`}
                      >
                        {/* GROUP HEADER */}
                        <div className="flex items-center justify-between border-b pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-brand-purple text-white font-mono font-black text-[11px] flex items-center justify-center">
                              {groupIdx + 1}
                            </span>
                            <span className={`font-black text-xs uppercase tracking-wide ${
                              isDarkMode ? 'text-slate-100' : 'text-gray-900'
                            }`}>
                              {group.name}
                            </span>
                            <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                              ({group.options.length} opciones)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveGroup(groupIdx)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> ELIMINAR GRUPO
                          </button>
                        </div>

                        {/* EXISTING OPTIONS BADGES */}
                        <div className="flex flex-wrap gap-2">
                          {group.options.map((opt, optIdx) => {
                            const lbl = getOptionLabel(opt);
                            const delta = getOptionPriceDelta(opt);
                            const stk = getOptionStock(opt);

                            return (
                              <div
                                key={optIdx}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-2 ${
                                  isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-gray-50 border-gray-300 text-gray-800'
                                }`}
                              >
                                <span>{lbl}</span>
                                {delta > 0 && (
                                  <span className="text-pink-600 dark:text-pink-400 font-mono text-[10px]">(+${delta})</span>
                                )}
                                {stk !== undefined && (
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                                    stk === 0
                                      ? 'bg-red-500/20 text-red-500'
                                      : (isDarkMode ? 'bg-slate-800 text-amber-300' : 'bg-amber-100 text-amber-900')
                                  }`}>
                                    {stk === 0 ? 'AGOTADO' : `${stk} un.`}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOptionFromGroup(groupIdx, optIdx)}
                                  className="text-gray-400 hover:text-red-500 transition-colors ml-1 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* INPUT FOR NEW OPTION IN THIS GROUP */}
                        <div className={`p-2.5 rounded-lg border grid grid-cols-1 sm:grid-cols-12 gap-2 items-center ${
                          isDarkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-gray-50/80 border-gray-200'
                        }`}>
                          <input
                            type="text"
                            placeholder="Nombre opción (ej: XL, Plata 925)..."
                            value={optInput.label}
                            onChange={(e) =>
                              setNewOptInputs((prev) => ({
                                ...prev,
                                [groupIdx]: { ...optInput, label: e.target.value },
                              }))
                            }
                            className={`sm:col-span-5 rounded px-2.5 py-1 text-xs font-bold border focus:outline-none ${
                              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOptionToGroup(groupIdx))}
                          />
                          <input
                            type="number"
                            placeholder="+ Precio Delta ($)"
                            value={optInput.delta}
                            onChange={(e) =>
                              setNewOptInputs((prev) => ({
                                ...prev,
                                [groupIdx]: { ...optInput, delta: e.target.value === '' ? '' : Number(e.target.value) },
                              }))
                            }
                            className={`sm:col-span-3 rounded px-2 py-1 text-xs font-semibold border focus:outline-none ${
                              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          <input
                            type="number"
                            placeholder="Stock específico"
                            value={optInput.stock}
                            onChange={(e) =>
                              setNewOptInputs((prev) => ({
                                ...prev,
                                [groupIdx]: { ...optInput, stock: e.target.value === '' ? '' : Number(e.target.value) },
                              }))
                            }
                            className={`sm:col-span-2 rounded px-2 py-1 text-xs font-semibold border focus:outline-none ${
                              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddOptionToGroup(groupIdx)}
                            className={`sm:col-span-2 py-1 rounded text-xs font-black uppercase text-white transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              isDarkMode ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gray-900 hover:bg-black'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" /> OPCIÓN
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateMatrix}
                  className="px-5 py-2.5 rounded-xl text-xs font-black uppercase bg-brand-pink text-white hover:bg-pink-600 transition-all shadow-brutal-xs flex items-center gap-2 cursor-pointer"
                >
                  CONTINUAR A MATRIZ DE STOCK <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: MATRIZ DE STOCK POR COMBINACIÓN */}
          {subTab === 'matrix' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* BULK STOCK SETTER */}
              <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
                isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Stock masivo para todas las combinaciones:
                  </span>
                  <input
                    type="number"
                    value={bulkStockVal}
                    onChange={(e) => setBulkStockVal(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ej: 15"
                    className={`w-24 rounded px-2.5 py-1 text-xs font-bold border focus:outline-none ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleApplyBulkStock}
                    className={`px-3 py-1 rounded text-xs font-black uppercase text-white transition-all cursor-pointer ${
                      isDarkMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-900 hover:bg-black'
                    }`}
                  >
                    APLICAR A TODAS
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateMatrix}
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                    isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-white'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" /> Regenerar Matriz
                </button>
              </div>

              {/* COMBINATIONS TABLE / GRID */}
              {combinationsList.length === 0 ? (
                <div className={`p-8 text-center border border-dashed rounded-xl ${
                  isDarkMode ? 'border-slate-800 text-slate-500' : 'border-gray-300 text-gray-500'
                }`}>
                  <p className="text-xs font-bold uppercase">No hay combinaciones generadas.</p>
                  <p className="text-[11px] font-medium mt-1">Primero define grupos y opciones en el paso 1.</p>
                </div>
              ) : (
                <div className={`border rounded-xl overflow-hidden shadow-2xs ${
                  isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-white'
                }`}>
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs font-medium border-collapse">
                      <thead className={`uppercase text-[10px] font-black sticky top-0 border-b ${
                        isDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        <tr>
                          <th className="p-3">COMBINACIÓN DE ATRIBUTOS</th>
                          <th className="p-3 text-center">STOCK DISPONIBLE (UNIDADES)</th>
                          <th className="p-3 text-right">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/80' : 'divide-gray-200'}`}>
                        {combinationsList.map((combo) => {
                          const key = getCombinationKey(combo);
                          const currentStk = variantStocks[key] !== undefined ? variantStocks[key] : (Number(product.stock) || 10);
                          const isOut = currentStk === 0;

                          return (
                            <tr key={key} className={isDarkMode ? 'hover:bg-slate-900/40' : 'hover:bg-gray-50'}>
                              <td className="p-3">
                                <span className={`font-mono text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                                  {key}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="inline-flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    value={currentStk}
                                    onChange={(e) => handleUpdateCombinationStock(key, Number(e.target.value))}
                                    className={`w-20 rounded px-2.5 py-1 text-xs font-bold text-center border focus:outline-none ${
                                      isOut
                                        ? (isDarkMode ? 'bg-red-950/60 border-red-800 text-red-300' : 'bg-red-50 border-red-300 text-red-700')
                                        : (isDarkMode ? 'bg-slate-900 border-slate-700 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-900')
                                    }`}
                                  />
                                  <span className={`text-[10px] font-bold ${isOut ? 'text-red-500' : 'text-gray-500'}`}>
                                    {isOut ? 'AGOTADO' : 'un.'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCombinationKey(key)}
                                  className="text-red-500 hover:text-red-700 text-xs font-bold p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                  title="Quitar esta combinación específica"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div
          className={`px-6 py-4 flex items-center justify-between border-t-4 border-black shrink-0 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-yellow-50 border-black'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 border-2 border-black font-black uppercase text-xs shadow-brutal-xs transition-all cursor-pointer ${
              isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            CANCELAR
          </button>

          <div className="flex items-center gap-3">
            {subTab === 'groups' && (
              <button
                type="button"
                onClick={handleGenerateMatrix}
                className="px-4 py-2 bg-brand-pink text-white hover:bg-brand-purple border-2 border-black font-black text-xs uppercase shadow-brutal-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                CONTINUAR A MATRIZ DE STOCK <Grid className="w-4 h-4 text-white" />
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveMatrix}
              className="px-5 py-2 bg-brand-yellow text-black hover:bg-brand-pink hover:text-white border-2 border-black font-black text-xs uppercase shadow-brutal-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" /> GUARDAR VARIACIONES Y MATRIZ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
