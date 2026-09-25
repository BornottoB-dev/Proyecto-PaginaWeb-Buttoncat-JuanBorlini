import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, Users } from 'lucide-react';

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  role: string;
  ordersCount: number;
  totalSpent: number;
  points: number;
  joinedDate: string;
}

interface AddEditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: AdminCustomer) => void;
  customerToEdit?: AdminCustomer | null;
}

export const AddEditCustomerModal: React.FC<AddEditCustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customerToEdit,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('CLIENTE');
  const [points, setPoints] = useState<number | ''>(100);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setEmail(customerToEdit.email);
      setRole(customerToEdit.role);
      setPoints(customerToEdit.points);
    } else {
      setName('');
      setEmail('');
      setRole('CLIENTE');
      setPoints(100);
    }
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Ingresa el nombre y correo del cliente');
      return;
    }

    const customerData: AdminCustomer = {
      id: customerToEdit ? customerToEdit.id : `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      ordersCount: customerToEdit ? customerToEdit.ordersCount : 0,
      totalSpent: customerToEdit ? customerToEdit.totalSpent : 0,
      points: points ? Number(points) : 0,
      joinedDate: customerToEdit ? customerToEdit.joinedDate : new Date().toISOString().split('T')[0],
    };

    onSave(customerData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border-4 border-black w-full max-w-lg shadow-brutal-xl my-8 overflow-hidden font-sans text-slate-100">
        
        {/* HEADER */}
        <div className="bg-black text-white p-4 flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black uppercase text-emerald-400 font-display">
              {customerToEdit ? 'EDITAR CLIENTE' : 'REGISTRAR NUEVO CLIENTE'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-brand-pink text-white border-2 border-white font-black hover:bg-red-600 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold">
          
          <div>
            <label className="block text-slate-300 font-black uppercase mb-1">
              NOMBRE Y APELLIDO *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Luciana Gomez"
              className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-black uppercase mb-1">
              CORREO ELECTRÓNICO *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
              className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-black uppercase mb-1">
                ROL / RANGO DE CLIENTE
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-emerald-400 uppercase cursor-pointer"
              >
                <option value="CLIENTE">CLIENTE ESTÁNDAR</option>
                <option value="CLIENTE VIP">CLIENTE VIP</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-black uppercase mb-1">
                PUNTOS ACUMULADOS
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value === '' ? '' : parseInt(e.target.value))}
                placeholder="100"
                className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border-2 border-slate-700 bg-slate-950 text-slate-300 font-black hover:bg-slate-800 uppercase cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 border-2 border-black bg-emerald-400 text-black font-black hover:bg-white uppercase transition-all flex items-center gap-2 cursor-pointer"
            >
              {customerToEdit ? (
                <>
                  <Save className="w-4 h-4" /> GUARDAR CAMBIOS
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> CREAR CLIENTE
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
