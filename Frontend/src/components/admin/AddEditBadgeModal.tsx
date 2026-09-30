import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, Sparkles } from 'lucide-react';
import type { BadgeItem } from '../../types/types';

interface AddEditBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (badge: BadgeItem) => void;
  badgeToEdit?: BadgeItem | null;
}

export const AddEditBadgeModal: React.FC<AddEditBadgeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  badgeToEdit,
}) => {
  const [name, setName] = useState('');
  const [badgeBg, setBadgeBg] = useState('bg-brand-pink text-white');

  useEffect(() => {
    if (badgeToEdit) {
      setName(badgeToEdit.name);
      setBadgeBg(badgeToEdit.badgeBg || 'bg-brand-pink text-white');
    } else {
      setName('');
      setBadgeBg('bg-brand-pink text-white');
    }
  }, [badgeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Ingresa el texto de la Etiqueta / Badge');
      return;
    }

    const newBadge: BadgeItem = {
      id: badgeToEdit ? badgeToEdit.id : `tag-${Date.now()}`,
      name: name.trim().toUpperCase(),
      badgeBg,
    };

    onSave(newBadge);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border-4 border-black w-full max-w-md shadow-brutal-xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
        
        {/* MODAL HEADER */}
        <div className="bg-black text-white p-4 flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-yellow" />
            <h2 className="text-xl font-black uppercase tracking-tight font-display">
              {badgeToEdit ? 'EDITAR ETIQUETA' : 'NUEVA ETIQUETA / BADGE'}
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
          
          <div>
            <label className="block text-black font-black uppercase mb-1">
              TEXTO DE LA ETIQUETA *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: ¡NUEVO!, TOP SALES, OFERTA 20%"
              className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm uppercase"
            />
          </div>

          <div>
            <label className="block text-black font-black uppercase mb-1">
              ESTILO COLOR DE ETIQUETA
            </label>
            <select
              value={badgeBg}
              onChange={(e) => setBadgeBg(e.target.value)}
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

          {/* PREVIEW */}
          <div className="border-2 border-black p-3 bg-yellow-50 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-gray-600">VISTA PREVIA:</span>
            <span className={`px-3 py-1 border-2 border-black font-black text-xs uppercase shadow-brutal-sm ${badgeBg}`}>
              {name || 'NUEVA ETIQUETA'}
            </span>
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
              className="px-6 py-2.5 border-3 border-black bg-brand-yellow text-black font-black hover:bg-brand-orange hover:text-white uppercase shadow-brutal transition-all flex items-center gap-2 active:translate-y-0.5 cursor-pointer"
            >
              {badgeToEdit ? (
                <>
                  <Save className="w-4 h-4" /> GUARDAR CAMBIOS
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> CREAR ETIQUETA
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
