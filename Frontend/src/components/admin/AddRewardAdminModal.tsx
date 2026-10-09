import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, Award, AlertTriangle } from 'lucide-react';
import type { RewardItem, RewardCategory } from '../../types/types';
import { handleProductImageError } from '../../types/types';

interface AddRewardAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reward: RewardItem) => void;
  rewardToEdit?: RewardItem | null;
  isDarkMode?: boolean;
}

export const AddRewardAdminModal: React.FC<AddRewardAdminModalProps> = ({
  isOpen,
  onClose,
  onSave,
  rewardToEdit,
  isDarkMode = true,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsCost, setPointsCost] = useState<number | ''>(200);
  const [category, setCategory] = useState<RewardCategory>('VOUCHER');
  const [discountValue, setDiscountValue] = useState('$2.000 OFF');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600&auto=format&fit=crop');
  const [codePrefix, setCodePrefix] = useState('BTC-REWARD');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setErrorMessage(null);
    if (rewardToEdit) {
      setTitle(rewardToEdit.title);
      setDescription(rewardToEdit.description);
      setPointsCost(rewardToEdit.pointsCost);
      setCategory(rewardToEdit.category);
      setDiscountValue(rewardToEdit.discountValue);
      setImage(rewardToEdit.image || '');
      setCodePrefix(rewardToEdit.codePrefix);
    } else {
      setTitle('');
      setDescription('');
      setPointsCost(200);
      setCategory('VOUCHER');
      setDiscountValue('$2.000 OFF');
      setImage('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600&auto=format&fit=crop');
      setCodePrefix('BTC-REWARD');
    }
  }, [rewardToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('El título del premio es obligatorio (*).');
      return;
    }

    if (!discountValue.trim()) {
      setErrorMessage('El valor del beneficio es obligatorio (*).');
      return;
    }

    if (!pointsCost || Number(pointsCost) <= 0) {
      setErrorMessage('El costo en puntos debe ser mayor a 0 (*).');
      return;
    }

    const cleanImage = image.trim();
    if (!cleanImage) {
      setErrorMessage('La URL de la imagen es obligatoria (*). No se permite crear premios/vouchers sin cargar su correspondiente imagen.');
      return;
    }

    if (!cleanImage.startsWith('http://') && !cleanImage.startsWith('https://') && !cleanImage.startsWith('data:image/')) {
      setErrorMessage('La URL de la imagen debe ser una dirección web válida (ej: https://...).');
      return;
    }

    const rewardData: RewardItem = {
      id: rewardToEdit ? rewardToEdit.id : `reward-${Date.now()}`,
      title: title.trim().toUpperCase(),
      description: description.trim() || 'Beneficio exclusivo canjeable con puntos acumulados.',
      pointsCost: Number(pointsCost),
      category,
      discountValue: discountValue.trim().toUpperCase(),
      image: cleanImage,
      codePrefix: codePrefix.trim().toUpperCase() || 'BTC-REWARD',
    };

    onSave(rewardData);
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
        className={`w-full max-w-xl my-6 rounded-2xl border shadow-2xl overflow-hidden font-sans transition-colors ${
          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <Award className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <h2 className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
              {rewardToEdit ? 'EDITAR PREMIO' : 'NUEVO PREMIO / CUPÓN CANJEABLE'}
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
          {errorMessage && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium border ${
              isDarkMode ? 'bg-red-950/40 border-red-800/50 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className={labelClass}>TÍTULO DEL PREMIO *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: VOUCHER DE COMPRA $2.000 ARS"
              className={`${inputClass} uppercase`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>TIPO / CATEGORÍA</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RewardCategory)}
                className={`${inputClass} uppercase cursor-pointer`}
              >
                <option value="VOUCHER">VOUCHER DE COMPRA</option>
                <option value="DESCUENTO">DESCUENTO PORCENTUAL</option>
                <option value="PRODUCTO">PRODUCTO EXCLUSIVO</option>
                <option value="ENVIO">ENVÍO GRATIS</option>
                <option value="REGALO">REGALO / CAJA SORPRESA</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>COSTO EN PUNTOS (PTS) *</label>
              <input
                type="number"
                min="10"
                value={pointsCost}
                onChange={(e) => setPointsCost(e.target.value === '' ? '' : parseInt(e.target.value))}
                placeholder="200"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>VALOR DEL BENEFICIO *</label>
              <input
                type="text"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="Ej: $2.000 OFF, 15% OFF, GRATIS"
                className={`${inputClass} uppercase`}
              />
            </div>

            <div>
              <label className={labelClass}>PREFIJO DE CÓDIGO</label>
              <input
                type="text"
                value={codePrefix}
                onChange={(e) => setCodePrefix(e.target.value)}
                placeholder="BTC-VOUCHER2000"
                className={`${inputClass} uppercase`}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              URL DE IMAGEN DEL VOUCHER / PREMIO <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className={inputClass}
            />
            <span className="text-[10px] text-red-500 font-semibold block mt-1 uppercase">
              * CAMPO OBLIGATORIO: No se permite crear vouchers o premios sin cargar su imagen.
            </span>
            {image && (
              <div className={`mt-2.5 flex items-center gap-3 p-2.5 rounded-lg border ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'
              }`}>
                <img
                  src={image}
                  alt="Vista previa"
                  onError={handleProductImageError}
                  className={`w-12 h-12 object-cover rounded-md border shrink-0 ${isDarkMode ? 'border-slate-700' : 'border-gray-300'}`}
                />
                <span className={`text-[10px] font-bold uppercase truncate ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  VISTA PREVIA DEL VOUCHER
                </span>
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>DESCRIPCIÓN</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre el uso del cupón..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* FOOTER */}
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
              {rewardToEdit ? (
                <>
                  <Save className="w-4 h-4" /> GUARDAR CAMBIOS
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> CREAR PREMIO
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

