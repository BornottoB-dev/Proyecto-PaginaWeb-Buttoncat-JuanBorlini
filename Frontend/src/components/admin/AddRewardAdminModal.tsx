import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, Award } from 'lucide-react';
import type { RewardItem, RewardCategory } from '../../types/types';

interface AddRewardAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reward: RewardItem) => void;
  rewardToEdit?: RewardItem | null;
}

export const AddRewardAdminModal: React.FC<AddRewardAdminModalProps> = ({
  isOpen,
  onClose,
  onSave,
  rewardToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsCost, setPointsCost] = useState<number | ''>(200);
  const [category, setCategory] = useState<RewardCategory>('VOUCHER');
  const [discountValue, setDiscountValue] = useState('$2.000 OFF');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600&auto=format&fit=crop');
  const [codePrefix, setCodePrefix] = useState('BTC-REWARD');

  useEffect(() => {
    if (rewardToEdit) {
      setTitle(rewardToEdit.title);
      setDescription(rewardToEdit.description);
      setPointsCost(rewardToEdit.pointsCost);
      setCategory(rewardToEdit.category);
      setDiscountValue(rewardToEdit.discountValue);
      setImage(rewardToEdit.image);
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
    if (!title.trim() || !discountValue.trim() || !pointsCost) {
      alert('Completa los campos obligatorios del premio');
      return;
    }

    const rewardData: RewardItem = {
      id: rewardToEdit ? rewardToEdit.id : `reward-${Date.now()}`,
      title: title.trim().toUpperCase(),
      description: description.trim() || 'Beneficio exclusivo canjeable con puntos acumulados.',
      pointsCost: Number(pointsCost),
      category,
      discountValue: discountValue.trim().toUpperCase(),
      image: image.trim(),
      codePrefix: codePrefix.trim().toUpperCase() || 'BTC-REWARD',
    };

    onSave(rewardData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
      <div className="bg-slate-900 border-4 border-black w-full max-w-lg shadow-brutal-xl my-8 overflow-hidden text-slate-100">
        
        {/* HEADER */}
        <div className="bg-black text-white p-4 flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-purple" />
            <h2 className="text-lg font-black uppercase text-brand-purple">
              {rewardToEdit ? 'EDITAR PREMIO' : 'NUEVO PREMIO / CUPÓN CANJEABLE'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-brand-pink text-white border-2 border-white font-black hover:bg-red-600 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold">
          
          <div>
            <label className="block text-slate-300 font-black uppercase mb-1">
              TÍTULO DEL PREMIO *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: VOUCHER DE COMPRA $2.000 ARS"
              className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-brand-purple uppercase"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-black uppercase mb-1">
                TIPO / CATEGORÍA
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RewardCategory)}
                className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-brand-purple uppercase cursor-pointer"
              >
                <option value="VOUCHER">VOUCHER DE COMPRA</option>
                <option value="DESCUENTO">DESCUENTO PORCENTUAL</option>
                <option value="PRODUCTO">PRODUCTO EXCLUSIVO</option>
                <option value="ENVIO">ENVÍO GRATIS</option>
                <option value="REGALO">REGALO / CAJA SORPRESA</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-black uppercase mb-1">
                COSTO EN PUNTOS (PTS) *
              </label>
              <input
                type="number"
                required
                min="10"
                value={pointsCost}
                onChange={(e) => setPointsCost(e.target.value === '' ? '' : parseInt(e.target.value))}
                placeholder="200"
                className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-black uppercase mb-1">
                VALOR DEL BENEFICIO *
              </label>
              <input
                type="text"
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="Ej: $2.000 OFF, 15% OFF, GRATIS"
                className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-brand-purple uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-black uppercase mb-1">
                PREFIJO DE CÓDIGO
              </label>
              <input
                type="text"
                value={codePrefix}
                onChange={(e) => setCodePrefix(e.target.value)}
                placeholder="BTC-VOUCHER2000"
                className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-brand-purple uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-black uppercase mb-1">
              URL DE IMAGEN
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-black uppercase mb-1">
              DESCRIPCIÓN
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre el uso del cupón..."
              className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-brand-purple resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border-2 border-slate-700 bg-slate-950 text-slate-300 font-black hover:bg-slate-800 uppercase cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 border-2 border-black bg-brand-purple text-white font-black hover:bg-brand-pink uppercase transition-all flex items-center gap-2 cursor-pointer"
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
