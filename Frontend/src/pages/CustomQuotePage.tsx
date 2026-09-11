import React, { useState } from 'react';
import { Upload, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const CustomQuotePage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [productBase, setProductBase] = useState('PINES METÁLICOS');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(50);
  const [email, setEmail] = useState('');
  const [fileName, setFileName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      
      <div className="border-4 border-black bg-white p-6 sm:p-10 shadow-brutal-xl space-y-8">
        
        {/* HEADER */}
        <div className="border-b-4 border-black pb-4 text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-brand-pink text-white border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-brutal-sm">
            <Sparkles className="w-4 h-4" /> REQUISITO RF-08: TALLER A PEDIDO
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase text-black font-display tracking-tight">
            SOLICITUD DE PRESUPUESTO
          </h1>
          <p className="text-sm font-bold text-gray-600 max-w-xl mx-auto">
            ¿Tienes una idea en mente para pines, parches o remeras personalizadas? Envíanos los detalles y te responderemos con la cotización exacta.
          </p>
        </div>

        {submitted ? (
          <div className="bg-brand-yellowLight border-3 border-black p-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-black mx-auto stroke-[2.5]" />
            <h2 className="text-2xl font-black uppercase text-black">
              ¡SOLICITUD ENVIADA AL TALLER!
            </h2>
            <p className="text-sm font-extrabold text-black max-w-md mx-auto">
              Recibirás la cotización detallada y los bocetos a tu correo <b>{email}</b> en menos de 24 horas hábiles.
            </p>
            <Button variant="purple" size="md" onClick={() => setSubmitted(false)}>
              ENVIAR OTRA SOLICITUD
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* TIPO DE PRODUCTO BASE */}
            <div>
              <label className="block text-sm font-black uppercase text-black mb-2">
                1. SELECCIONA EL PRODUCTO BASE
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['PINES METÁLICOS', 'PARCHES', 'STICKERS', 'REMERAS'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setProductBase(item)}
                    className={`border-3 border-black py-3 px-2 text-xs font-black uppercase transition-all shadow-brutal-sm ${
                      productBase === item
                        ? 'bg-brand-yellow text-black'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* DESCRIPCIÓN DEL DISEÑO */}
            <div>
              <label className="block text-sm font-black uppercase text-black mb-2">
                2. DETALLA TU IDEA / DISEÑO
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el concepto, colores, medidas aproximadas y acabado deseado..."
                className="w-full border-3 border-black p-3 text-sm font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm"
              />
            </div>

            {/* CANTIDAD Y ARCHIVO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-sm font-black uppercase text-black mb-2">
                  3. CANTIDAD ESTIMADA
                </label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full border-3 border-black p-3 text-sm font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-black uppercase text-black mb-2">
                  4. IMAGEN DE REFERENCIA (OPCIONAL)
                </label>
                <div className="relative border-3 border-dashed border-black bg-gray-50 p-3 text-center cursor-pointer hover:bg-yellow-50 shadow-brutal-sm">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFileName(e.target.files[0].name);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center justify-center gap-2 text-xs font-black uppercase text-black">
                    <Upload className="w-4 h-4 stroke-[2.5]" />
                    {fileName ? fileName : 'SUBIR IMAGEN (PNG, JPG)'}
                  </div>
                </div>
              </div>

            </div>

            {/* EMAIL DE CONTACTO */}
            <div>
              <label className="block text-sm font-black uppercase text-black mb-2">
                5. TU CORREO ELECTRÓNICO DE CONTACTO
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full border-3 border-black p-3 text-sm font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm"
              />
            </div>

            {/* SUBMIT BUTTON */}
            <Button variant="purple" size="lg" fullWidth type="submit" className="py-4">
              ENVIAR SOLICITUD DE COTIZACIÓN
            </Button>

          </form>
        )}

      </div>

    </div>
  );
};
