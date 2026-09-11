import React, { useState } from 'react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="bg-white border-t-3 border-black pt-10 pb-6 mt-16">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        
        {/* COL 1: BRAND */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => onNavigate('inicio')}>
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 36 36" className="w-8 h-8 drop-shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.35)] group-hover:rotate-[180deg] transition-transform duration-500 ease-in-out">
                <circle cx="18" cy="18" r="16" fill="#FDBA74" stroke="#000" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="10.5" fill="#EA580C" fillOpacity="0.15" stroke="#000" strokeWidth="1.2" strokeOpacity="0.4" />
                
                <circle cx="13.5" cy="13.5" r="2.2" fill="#9A3412" />
                <circle cx="13.5" cy="13.5" r="1.6" fill="#000000" />
                
                <circle cx="22.5" cy="13.5" r="2.2" fill="#9A3412" />
                <circle cx="22.5" cy="13.5" r="1.6" fill="#000000" />

                <circle cx="13.5" cy="22.5" r="2.2" fill="#9A3412" />
                <circle cx="13.5" cy="22.5" r="1.6" fill="#000000" />

                <circle cx="22.5" cy="22.5" r="2.2" fill="#9A3412" />
                <circle cx="22.5" cy="22.5" r="1.6" fill="#000000" />

                <line x1="13.5" y1="13.5" x2="22.5" y2="22.5" stroke="#FFF" strokeWidth="1" strokeOpacity="0.85" strokeLinecap="round" />
                <line x1="22.5" y1="13.5" x2="13.5" y2="22.5" stroke="#FFF" strokeWidth="1" strokeOpacity="0.85" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-2xl font-sedgwick uppercase text-brand-purple drop-shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">
              BUTTONCAT
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-700 max-w-xs">
            La mercería más chillona del multiverso. Botones con actitud.
          </p>
        </div>

        {/* COL 2: LINKS */}
        <div>
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-black border-b-2 border-black inline-block mb-3 pb-0.5">
            ENLACES
          </h4>
          <ul className="space-y-2 text-sm font-semibold text-gray-800">
            <li>
              <button onClick={() => onNavigate('inicio')} className="hover:underline hover:text-brand-purple">
                Contacto
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('catalogo')} className="hover:underline hover:text-brand-purple">
                Preguntas Frecuentes
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('catalogo')} className="hover:underline hover:text-brand-purple">
                Envíos
              </button>
            </li>
          </ul>
        </div>

        {/* COL 3: NEWSLETTER */}
        <div>
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-black border-b-2 border-black inline-block mb-3 pb-0.5">
            NEWSLETTER
          </h4>
          <form onSubmit={handleSubmit} className="flex gap-1 max-w-sm">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="flex-1 border-2 border-black px-3 py-1.5 text-xs font-semibold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm"
            />
            <button
              type="submit"
              className="bg-brand-purple text-white border-2 border-black px-4 py-1.5 text-xs font-black uppercase hover:bg-brand-pink transition-colors shadow-brutal-sm"
            >
              OK
            </button>
          </form>
          {subscribed && (
            <p className="text-xs font-bold text-green-700 mt-2">
              ✓ ¡Gracias por suscribirte al caos!
            </p>
          )}
        </div>

      </div>

      {/* COPYRIGHT */}
      <div className="border-t-2 border-black pt-4 text-center text-xs font-black tracking-wider uppercase text-black">
        © 2024 BUTTONCAT INC. NO ARREPENTIMIENTOS.
      </div>
    </footer>
  );
};
