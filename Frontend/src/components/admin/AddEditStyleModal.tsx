import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, Sparkles } from 'lucide-react';
import type { StyleItem } from '../../types/types';

interface AddEditStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (style: StyleItem) => void;
  styleToEdit?: StyleItem | null;
}

export const AddEditStyleModal: React.FC<AddEditStyleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  styleToEdit,
}) => {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('⚡');
  const [badgeBg, setBadgeBg] = useState('bg-brand-pink text-white');

  useEffect(() => {
    if (styleToEdit) {
      setName(styleToEdit.name);
      setEmoji(styleToEdit.emoji || '⚡');
      setBadgeBg(styleToEdit.badgeBg || 'bg-brand-pink text-white');
    } else {
      setName('');
      setEmoji('⚡');
      setBadgeBg('bg-brand-pink text-white');
    }
  }, [styleToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Ingresa el nombre del Estilo');
      return;
    }

    const newStyle: StyleItem = {
      id: styleToEdit ? styleToEdit.id : `style-${Date.now()}`,
      name: name.trim().toUpperCase(),
      emoji: emoji.trim() || '⚡',
      badgeBg,
    };

    onSave(newStyle);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border-4 border-black w-full max-w-md shadow-brutal-xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="bg-black text-white p-4 flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-yellow" />
            <h2 className="text-xl font-black uppercase tracking-tight font-display">
              {styleToEdit ? 'EDITAR ESTILO' : 'NUEVO ESTILO'}
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
          
          {/* EMOJI & NAME */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-black font-black uppercase mb-1">
                EMOJI
              </label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="⚡"
                className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-center text-xl font-bold focus:outline-none shadow-brutal-sm"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-black font-black uppercase mb-1">
                NOMBRE DEL ESTILO *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: CYBERPUNK, E-GIRL"
                className="w-full border-3 border-black p-2.5 bg-gray-50 focus:bg-white text-black font-bold focus:outline-none shadow-brutal-sm uppercase"
              />
            </div>
          </div>

          {/* COLOR STYLE */}
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
              {emoji} {name || 'NUEVO ESTILO'}
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
              {styleToEdit ? (
                <>
                  <Save className="w-4 h-4" /> GUARDAR CAMBIOS
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> CREAR ESTILO
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
