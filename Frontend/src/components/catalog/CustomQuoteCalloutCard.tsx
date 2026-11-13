import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface CustomQuoteCalloutCardProps {
  onOpenQuoteForm: () => void;
}

export const CustomQuoteCalloutCard: React.FC<CustomQuoteCalloutCardProps> = ({
  onOpenQuoteForm,
}) => {
  return (
    <div className="border-3 border-black bg-pink-300 p-4 sm:p-6 shadow-brutal flex flex-col items-center justify-between text-center min-h-55 sm:min-h-85 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg transition-all col-span-2 sm:col-span-1">
      
      <div className="flex flex-col items-center my-auto">
        <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-black mb-2 sm:mb-3 stroke-[2.5]" />
        
        <h3 className="text-xl sm:text-3xl font-black uppercase text-black tracking-tight leading-none mb-2 sm:mb-3 font-display">
          ¿NO ENCUENTRAS LO TUYO?
        </h3>
        
        <p className="text-xs sm:text-sm font-bold text-black max-w-xs leading-relaxed">
          Haz un pedido personalizado. Tú lo imaginas, nosotros lo fabricamos.
        </p>
      </div>

      <Button
        variant="black"
        size="md"
        fullWidth
        onClick={onOpenQuoteForm}
        className="mt-4"
      >
        PEDIR PRESUPUESTO
      </Button>

    </div>
  );
};
