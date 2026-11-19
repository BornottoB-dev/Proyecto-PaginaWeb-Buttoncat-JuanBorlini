import React from 'react';
import { Loader2 } from 'lucide-react';

interface FullPageLoadingScreenProps {
  title?: string;
  subtitle?: string;
}

export const FullPageLoadingScreen: React.FC<FullPageLoadingScreenProps> = ({
  title = 'CARGANDO BUTTONCAT...',
  subtitle = 'Sincronizando catalogo y productos desde la base de datos',
}) => {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-6 font-sans">
      <div className="border-4 border-black bg-white p-8 shadow-brutal-xl max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-brand-yellow border-3 border-black shadow-brutal-sm flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-black animate-spin stroke-[2.5]" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-black uppercase text-black font-display tracking-wide">
            {title}
          </h2>
          <p className="text-xs font-bold text-gray-600">
            {subtitle}
          </p>
        </div>
        <div className="w-full h-2.5 border-2 border-black bg-gray-100 overflow-hidden">
          <div className="h-full w-2/3 bg-brand-pink animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export const CatalogGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="border-3 border-black bg-white shadow-brutal flex flex-col justify-between overflow-hidden animate-pulse"
        >
          <div className="aspect-square w-full bg-yellow-100/70 border-b-3 border-black flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-black/30 animate-spin" />
          </div>
          <div className="p-3 sm:p-4 space-y-3">
            <div className="h-3 w-1/3 bg-gray-200 border border-black/20" />
            <div className="h-4 w-3/4 bg-gray-300 border border-black/20" />
            <div className="flex items-center justify-between pt-2 border-t-2 border-gray-100">
              <div className="h-5 w-1/3 bg-gray-300 border border-black/20" />
              <div className="h-8 w-20 bg-brand-yellow/60 border-2 border-black/30" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const AdminSectionLoader: React.FC<{
  label?: string;
  isDarkMode?: boolean;
}> = ({ label = 'Cargando registros desde PostgreSQL...', isDarkMode = false }) => {
  return (
    <div
      className={`border rounded-xl p-10 text-center space-y-3 transition-colors ${
        isDarkMode
          ? 'border-slate-800 bg-slate-950 text-slate-300'
          : 'border-gray-200 bg-white text-gray-700 shadow-xs'
      }`}
    >
      <Loader2
        className={`w-7 h-7 mx-auto animate-spin ${
          isDarkMode ? 'text-amber-400' : 'text-gray-900'
        }`}
      />
      <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
    </div>
  );
};
