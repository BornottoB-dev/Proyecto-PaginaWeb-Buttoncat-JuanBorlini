import React, { useState } from 'react';
import { Upload, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ValidationModal } from '../components/ui/ValidationModal';

export const CustomQuotePage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [productBase, setProductBase] = useState('PINES METÁLICOS');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(50);
  const [email, setEmail] = useState('');
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!description.trim() || !email.trim()) {
      setErrorMessage('POR FAVOR, COMPLETA TODOS LOS CAMPOS OBLIGATORIOS (*).');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
      
      <div className="border-4 border-black bg-white p-4 sm:p-10 shadow-brutal sm:shadow-brutal-xl space-y-6 sm:space-y-8">
        
        {/* HEADER */}
        <div className="border-b-4 border-black pb-4 text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-brand-pink text-white border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-brutal-sm">
            <Sparkles className="w-4 h-4" /> TALLER A PEDIDO
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase text-black font-display tracking-tight">
            SOLICITUD DE PRESUPUESTO
          </h1>
          <p className="text-xs sm:text-sm font-bold text-gray-600 max-w-xl mx-auto">
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
          <form noValidate onSubmit={handleSubmit} className="space-y-6">
            {/* TIPO DE PRODUCTO BASE */}
            <div>
              <label className="block text-sm font-black uppercase text-black mb-2">
                1. SELECCIONA EL PRODUCTO BASE
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {['PINES METÁLICOS', 'PARCHES', 'STICKERS', 'REMERAS'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setProductBase(item)}
                    className={`border-3 border-black py-2.5 sm:py-3 px-2 text-[11px] sm:text-xs font-black uppercase transition-all shadow-brutal-sm cursor-pointer ${
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
              <label htmlFor="quote-description" className="block text-sm font-black uppercase text-black mb-2">
                2. DETALLA TU IDEA / DISEÑO <span className="text-red-600 font-black">*</span>
              </label>
              <textarea
                id="quote-description"
                name="quoteDescription"
                aria-label="Detalla tu idea o diseño"
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
                <label htmlFor="quote-quantity" className="block text-sm font-black uppercase text-black mb-2">
                  3. CANTIDAD ESTIMADA
                </label>
                <input
                  id="quote-quantity"
                  name="quoteQuantity"
                  aria-label="Cantidad estimada"
                  type="number"
                  min="10"
                  max="10000"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full border-3 border-black p-3 text-sm font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm"
                />
              </div>

              <div>
                <label htmlFor="quote-file" className="block text-sm font-black uppercase text-black mb-2">
                  4. IMAGEN DE REFERENCIA (OPCIONAL)
                </label>
                <div className="relative border-3 border-dashed border-black bg-gray-50 p-3 text-center cursor-pointer hover:bg-yellow-50 shadow-brutal-sm">
                  <input
                    id="quote-file"
                    name="quoteFile"
                    aria-label="Subir imagen de referencia"
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
              <label htmlFor="quote-email" className="block text-sm font-black uppercase text-black mb-2">
                5. TU CORREO ELECTRÓNICO DE CONTACTO <span className="text-red-600 font-black">*</span>
              </label>
              <input
                id="quote-email"
                name="quoteEmail"
                aria-label="Correo electrónico de contacto"
                type="email"
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

      {/* VALIDATION NOTICE MODAL */}
      <ValidationModal
        isOpen={!!errorMessage}
        title="CAMPOS REQUERIDOS"
        message={errorMessage || ''}
        onClose={() => setErrorMessage(null)}
      />
    </div>
  );
};
