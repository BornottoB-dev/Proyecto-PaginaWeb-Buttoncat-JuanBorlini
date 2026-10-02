import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Check } from 'lucide-react';
import { Button } from './Button';

interface ValidationModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  title = 'CAMPO OBLIGATORIO REQUERIDO',
  message,
  onClose,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-150">
      <div className="bg-white border-4 border-black w-full max-w-md shadow-brutal-xl overflow-hidden font-sans animate-in zoom-in-95 duration-150">
        
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
            <X className="w-5 h-5 stroke-[3]" />
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
              <Check className="w-4 h-4 mr-1.5 stroke-[3]" /> ENTENDIDO / ACEPTAR
            </Button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
