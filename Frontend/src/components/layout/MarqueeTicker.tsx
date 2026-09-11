import React from 'react';

export const MarqueeTicker: React.FC = () => {
  const items = [
    'NO ARREPENTIMIENTOS',
    '100% ACTITUD',
    'BOTONES RADICALES',
    'MÁXIMO COLOR',
    'ENVÍOS A TODO EL PAÍS',
    'DISEÑOS EXCLUSIVOS',
  ];

  return (
    <div className="w-full bg-brand-purple border-y-3 border-black py-2 overflow-hidden select-none">
      <div className="flex whitespace-nowrap animate-marquee">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-6 mx-3">
            {items.map((item, idx) => (
              <React.Fragment key={idx}>
                <span className="text-white text-xs sm:text-sm font-black tracking-widest uppercase">
                  {item}
                </span>
                <span className="text-brand-yellow font-black text-sm">✦</span>
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
