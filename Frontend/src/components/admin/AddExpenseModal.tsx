import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, DollarSign } from 'lucide-react';

export interface AdminExpense {
  id: string;
  supplier: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  date: string;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: AdminExpense) => void;
  expenseToEdit?: AdminExpense | null;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
}) => {
  const [supplier, setSupplier] = useState('');
  const [category, setCategory] = useState('INSUMOS');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA');

  useEffect(() => {
    if (expenseToEdit) {
      setSupplier(expenseToEdit.supplier);
      setCategory(expenseToEdit.category);
      setDescription(expenseToEdit.description);
      setAmount(expenseToEdit.amount);
      setPaymentMethod(expenseToEdit.paymentMethod);
    } else {
      setSupplier('');
      setCategory('INSUMOS');
      setDescription('');
      setAmount('');
      setPaymentMethod('TRANSFERENCIA');
    }
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier.trim() || !description.trim() || !amount) {
      alert('Completa los campos obligatorios del gasto');
      return;
    }

    const expenseData: AdminExpense = {
      id: expenseToEdit ? expenseToEdit.id : `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
      supplier: supplier.trim(),
      category,
      description: description.trim(),
      amount: Number(amount),
      paymentMethod,
      date: expenseToEdit ? expenseToEdit.date : new Date().toISOString().split('T')[0],
    };

    onSave(expenseData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
      <div className="bg-slate-900 border-4 border-black w-full max-w-lg shadow-brutal-xl my-8 overflow-hidden text-slate-100">
        
        {/* HEADER */}
        <div className="bg-black text-white p-4 flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black uppercase text-amber-400 font-display">
              {expenseToEdit ? `EDITAR GASTO #${expenseToEdit.id}` : 'REGISTRAR GASTO / PROVEEDOR'}
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
              PROVEEDOR / EMPRESA *
            </label>
            <input
              type="text"
              required
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Ej: Distribuidora Textil Quilmes"
              className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-black uppercase mb-1">
                CATEGORÍA DE GASTO
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-amber-400 uppercase cursor-pointer"
              >
                <option value="INSUMOS">INSUMOS / MATERIA PRIMA</option>
                <option value="PACKAGING">PACKAGING Y CAJAS</option>
                <option value="LOGISTICA">LOGÍSTICA / ENVÍOS</option>
                <option value="SERVICIOS">SERVICIOS DE TALLER</option>
                <option value="MAQUINARIA">MANTENIMIENTO / MAQUINARIA</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-black uppercase mb-1">
                FORMA DE PAGO
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-amber-400 uppercase cursor-pointer"
              >
                <option value="TRANSFERENCIA">TRANSFERENCIA BANCARIA</option>
                <option value="MERCADO PAGO">MERCADO PAGO</option>
                <option value="EFECTIVO">EFECTIVO</option>
                <option value="TARJETA">TARJETA CRÉDITO/DÉBITO</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-black uppercase mb-1">
              MONTO TOTAL ($ ARS) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="35000.00"
              className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-black uppercase mb-1">
              CONCEPTO / DETALLE DEL GASTO *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Compra de 50m de tela algodón peinado negro..."
              className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-amber-400 resize-none"
            />
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
              className="px-6 py-2.5 border-2 border-black bg-amber-400 text-black font-black hover:bg-white uppercase transition-all flex items-center gap-2 cursor-pointer"
            >
              {expenseToEdit ? (
                <>
                  <Save className="w-4 h-4" /> GUARDAR CAMBIOS
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> REGISTRAR GASTO
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
