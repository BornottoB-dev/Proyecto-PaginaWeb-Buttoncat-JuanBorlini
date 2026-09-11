import React from 'react';
import { Package, Award, MapPin, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const ProfilePage: React.FC = () => {
  const steps = [
    { title: 'Pedido Realizado', status: 'completed' },
    { title: 'Pago Confirmado', status: 'completed' },
    { title: 'En Preparación', status: 'completed' },
    { title: 'En Producción', status: 'active' },
    { title: 'Listo para Despacho', status: 'pending' },
    { title: 'Enviado (Tracking)', status: 'pending' },
    { title: 'Entregado', status: 'pending' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      
      {/* USER PROFILE HEADER (RF-02) */}
      <div className="border-4 border-black bg-brand-yellow p-6 shadow-brutal-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop"
            alt="Juan Borlini"
            className="w-20 h-20 rounded-full border-3 border-black object-cover shadow-brutal-sm"
          />
          <div>
            <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 tracking-wider">
              CLIENTE VIP
            </span>
            <h1 className="text-3xl font-black uppercase text-black font-display leading-tight">
              JUAN BORLINI
            </h1>
            <p className="text-xs font-bold text-gray-800">
              juan.borlini@email.com • Miembro desde 2024
            </p>
          </div>
        </div>

        {/* POINTS BALANCE (RF-13) */}
        <div className="border-3 border-black bg-white p-4 shadow-brutal text-center min-w-[180px]">
          <div className="flex items-center justify-center gap-1 text-brand-purple mb-1">
            <Award className="w-5 h-5 stroke-[2.5]" />
            <span className="text-xs font-black uppercase">PUNTOS ACUMULADOS</span>
          </div>
          <p className="text-3xl font-black text-black">450 PTS</p>
          <span className="text-[10px] font-bold text-gray-500">
            Equivalente a $4.500 de descuento
          </span>
        </div>
      </div>

      {/* TRACKING TIMELINE (RF-18) */}
      <div className="border-4 border-black bg-white p-6 shadow-brutal-xl space-y-6">
        <div className="flex items-center justify-between border-b-3 border-black pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-black stroke-[2.5]" />
            <h2 className="text-xl font-black uppercase text-black font-display">
              SEGUIMIENTO DE PEDIDO VIVO #BTC-9842
            </h2>
          </div>
          <span className="bg-brand-cyan border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-brutal-sm">
            PAQ.AR: AR982341293AR
          </span>
        </div>

        {/* TIMELINE STEPS */}
        <div className="relative py-4">
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-center">
            {steps.map((step, idx) => {
              const isCompleted = step.status === 'completed';
              const isActive = step.status === 'active';

              return (
                <div key={idx} className="flex flex-col items-center space-y-2">
                  <div
                    className={`w-10 h-10 border-3 border-black flex items-center justify-center text-sm font-black shadow-brutal-sm transition-all ${
                      isCompleted
                        ? 'bg-green-400 text-black'
                        : isActive
                        ? 'bg-brand-yellow text-black animate-pulse'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 stroke-[2.5]" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className="text-[11px] font-extrabold uppercase text-black leading-tight">
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ADDRESSES & FAVORITES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* DIRECCIONES DE ENVÍO */}
        <div className="border-3 border-black bg-white p-6 shadow-brutal space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className="text-base font-black uppercase text-black flex items-center gap-2">
              <MapPin className="w-4 h-4" /> MIS DIRECCIONES (RF-02)
            </h3>
            <Button variant="yellow" size="sm">
              + NUEVA
            </Button>
          </div>
          <div className="border-2 border-black p-3 bg-yellow-50 text-xs font-bold text-black space-y-1">
            <p className="font-extrabold">CASA (Predeterminada)</p>
            <p>Av. Corrientes 1234, Piso 4B</p>
            <p>Ciudad Autónoma de Buenos Aires, C1043 (PAQ.AR)</p>
          </div>
        </div>

        {/* ACCIONES RÁPIDAS */}
        <div className="border-3 border-black bg-white p-6 shadow-brutal space-y-4">
          <h3 className="text-base font-black uppercase text-black border-b-2 border-black pb-2">
            GESTIÓN DE CUENTA
          </h3>
          <div className="space-y-2">
            <Button variant="white" fullWidth className="justify-start text-xs">
              Historial de pedidos anteriores (RF-17)
            </Button>
            <Button variant="white" fullWidth className="justify-start text-xs">
              Mis reseñas y valoraciones publicadas (RF-22)
            </Button>
            <Button variant="white" fullWidth className="justify-start text-xs">
              Galería de mis diseños personalizados (RF-24)
            </Button>
          </div>
        </div>

      </div>

    </div>
  );
};
