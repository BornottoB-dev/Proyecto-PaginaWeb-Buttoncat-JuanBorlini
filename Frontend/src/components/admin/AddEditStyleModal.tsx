import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, Sparkles, AlertTriangle } from 'lucide-react';
import type { StyleItem } from '../../types/types';

interface AddEditStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (style: StyleItem) => void;
  styleToEdit?: StyleItem | null;
  isDarkMode?: boolean;
}

export const AddEditStyleModal: React.FC<AddEditStyleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  styleToEdit,
  isDarkMode = true,
}) => {
  const [name, setName] = useState('');
  const [badgeBg, setBadgeBg] = useState('bg-brand-pink text-white');
  const [validationModalMsg, setValidationModalMsg] = useState<string | null>(null);

  useEffect(() => {
    setValidationModalMsg(null);
    if (styleToEdit) {
      setName(styleToEdit.name);
      setBadgeBg(styleToEdit.badgeBg || 'bg-brand-pink text-white');
    } else {
      setName('');
      setBadgeBg('bg-brand-pink text-white');
    }
  }, [styleToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationModalMsg(null);
    if (!name.trim()) {
      setValidationModalMsg('POR FAVOR, COMPLETA TODOS LOS CAMPOS OBLIGATORIOS (*).');
      return;
    }

    const newStyle: StyleItem = {
      id: styleToEdit ? styleToEdit.id : `style-${Date.now()}`,
      name: name.trim().toUpperCase(),
      badgeBg,
    };

    onSave(newStyle);
    onClose();
  };

  const labelClass = `block text-xs font-black uppercase mb-1 tracking-wider ${isDarkMode ? 'text-slate-200' : 'text-black'}`;
  const inputClass = `w-full border-3 border-black p-2.5 font-bold text-xs focus:outline-none shadow-brutal-sm ${
    isDarkMode 
      ? 'bg-slate-900 border-slate-700 text-slate-100 focus:bg-slate-950' 
      : 'bg-gray-50 focus:bg-white text-black'
  }`;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in font-sans ${
        isDarkMode ? 'bg-black/80' : 'bg-black/60 backdrop-blur-xs'
      }`}
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-md my-auto rounded-2xl border-4 border-black shadow-2xl overflow-hidden transition-colors flex flex-col ${
          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* MODAL HEADER */}
        <div className="bg-brand-yellow text-black p-3.5 sm:p-5 border-b-4 border-black shrink-0 shadow-brutal-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-brand-yellow flex items-center justify-center border-2 border-black shadow-brutal-xs shrink-0">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black uppercase tracking-tight font-display text-black">
                {styleToEdit ? 'EDITAR ESTILO' : 'NUEVO ESTILO VIBE'}
              </h2>
              <p className="text-[11px] font-black text-black/80 uppercase tracking-wide">
                ESTILOS Y VIBES • BUTTONCAT STUDIO ADMIN
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

        {/* FORM */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4 font-sans">
          
          {/* UNIFIED ERROR MESSAGE BANNER */}
          {validationModalMsg && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium border ${
              isDarkMode ? 'bg-red-950/40 border-red-800/50 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{validationModalMsg}</span>
            </div>
          )}

          <div>
            <label className={labelClass}>NOMBRE DEL ESTILO *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: CYBERPUNK, E-GIRL"
              className={`${inputClass} uppercase`}
            />
          </div>

          {/* COLOR STYLE */}
          <div>
            <label className={labelClass}>ESTILO COLOR DE ETIQUETA</label>
            <select
              value={badgeBg}
              onChange={(e) => setBadgeBg(e.target.value)}
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

          {/* PREVIEW */}
          <div className={`border-2 border-black p-3.5 flex items-center justify-between ${
            isDarkMode ? 'bg-slate-900' : 'bg-yellow-50'
          }`}>
            <span className="text-[10px] font-black uppercase text-black">
              VISTA PREVIA DE ETIQUETA:
            </span>
            <span className={`px-2.5 py-1 text-xs font-black uppercase border-2 border-black ${badgeBg}`}>
              {name || 'NUEVO ESTILO'}
            </span>
          </div>

          {/* ACTIONS */}
          <div className={`px-6 py-4 flex items-center justify-between border-t-4 border-black -mx-6 -mb-6 mt-6 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-yellow-50 border-black'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 border-2 border-black font-black uppercase text-xs shadow-brutal-xs transition-all cursor-pointer ${
                isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              CANCELAR
            </button>
            
            <button
              type="submit"
              className="px-5 py-2 bg-brand-yellow text-black hover:bg-brand-pink hover:text-white border-2 border-black font-black text-xs uppercase shadow-brutal-xs transition-all flex items-center gap-2 cursor-pointer"
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

