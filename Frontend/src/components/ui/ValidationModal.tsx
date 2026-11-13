import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Check } from 'lucide-react';
import { Button } from './Button';

export interface ValidationModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  title = 'CAMPO OBLIGATORIO REQUERIDO',
  message,
  confirmText = 'ENTENDIDO / ACEPTAR',
  onClose,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  // Si isDarkMode está definido (true o false), renderizamos el diseño del panel de administración
  if (isDarkMode !== undefined) {
    return createPortal(
      <div 
        className={`fixed inset-0 z-9999 flex items-center justify-center p-3 sm:p-5 animate-in fade-in font-sans ${
          isDarkMode ? 'bg-black/80 backdrop-blur-xs' : 'bg-black/60 backdrop-blur-xs'
        }`}
        onClick={onClose}
      >
        <div 
          className={`w-full max-w-md my-auto rounded-2xl border shadow-2xl overflow-hidden transition-colors flex flex-col ${
            isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER ADMIN */}
          <div className={`px-6 py-4 flex items-center justify-between border-b shrink-0 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                isDarkMode ? 'bg-amber-950/40 text-amber-400 border-amber-900/50' : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-base font-bold uppercase tracking-wide ${
                  isDarkMode ? 'text-slate-100' : 'text-gray-900'
                }`}>
                  {title}
                </h2>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Aviso del sistema Buttoncat
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDarkMode
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-100'
                  : 'border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* BODY ADMIN */}
          <div className="p-6 space-y-4">
            <div className={`p-4 rounded-xl border text-xs font-semibold leading-relaxed flex items-start gap-2.5 ${
              isDarkMode 
                ? 'bg-amber-950/30 border-amber-900/50 text-amber-200' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
              <span>{message}</span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                  isDarkMode 
                    ? 'bg-slate-100 text-slate-900 hover:bg-white' 
                    : 'bg-gray-900 text-white hover:bg-black'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Tienda / Cliente: diseño brutalista original
  return createPortal(
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-9999 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white border-4 border-black w-full max-w-md shadow-brutal-xl overflow-hidden font-sans animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-brand-yellow text-black p-4 flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-black fill-brand-orange" />
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight font-display">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 bg-black text-white font-black hover:bg-red-600 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5 stroke-3" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4 bg-white">
          <div className="bg-red-100 border-3 border-black text-red-800 p-3 text-xs font-black uppercase shadow-brutal-sm flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{message}</span>
          </div>

          <div className="pt-2">
            <Button
              variant="yellow"
              size="md"
              fullWidth
              onClick={onClose}
              className="font-black uppercase tracking-wider shadow-brutal"
            >
              <Check className="w-4 h-4 mr-1.5 stroke-3" /> {confirmText}
            </Button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
