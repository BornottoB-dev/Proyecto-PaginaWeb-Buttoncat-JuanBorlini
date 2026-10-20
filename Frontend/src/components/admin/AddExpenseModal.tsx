import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, DollarSign, AlertTriangle } from 'lucide-react';

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
  isDarkMode?: boolean;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
  isDarkMode = false,
}) => {
  const [supplier, setSupplier] = useState('');
  const [category, setCategory] = useState('INSUMOS');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA');
  const [validationModalMsg, setValidationModalMsg] = useState<string | null>(null);

  useEffect(() => {
    setValidationModalMsg(null);
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
    setValidationModalMsg(null);
    if (!supplier.trim() || !description.trim() || !amount) {
      setValidationModalMsg('POR FAVOR, COMPLETA TODOS LOS CAMPOS OBLIGATORIOS (*).');
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
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in font-sans ${
        isDarkMode ? 'bg-black/80' : 'bg-black/60 backdrop-blur-xs'
      }`}
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-lg my-auto rounded-2xl border-4 border-black shadow-2xl overflow-hidden transition-colors flex flex-col ${
          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className="bg-brand-yellow text-black p-3.5 sm:p-5 border-b-4 border-black shrink-0 shadow-brutal-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-brand-yellow flex items-center justify-center border-2 border-black shadow-brutal-xs shrink-0">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black uppercase tracking-tight font-display text-black">
                {expenseToEdit ? `EDITAR GASTO #${expenseToEdit.id}` : 'REGISTRAR GASTO / PROVEEDOR'}
              </h2>
              <p className="text-[11px] font-black text-black/80 uppercase tracking-wide">
                GESTIÓN FINANCIERA • BUTTONCAT STUDIO ADMIN
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-black text-white hover:bg-brand-pink border-2 border-black p-2 font-black uppercase text-xs flex items-center gap-2 transition-all shadow-brutal-xs cursor-pointer shrink-0"
            title="Cerrar modal"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* FORM */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold">
          
          {/* UNIFIED ERROR MESSAGE BANNER */}
          {validationModalMsg && (
            <div className={`p-3.5 rounded-xl text-xs font-bold uppercase flex items-center gap-2 border ${
              isDarkMode ? 'bg-red-500/10 border-red-500/40 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{validationModalMsg}</span>
            </div>
          )}
          
          <div>
            <label className={`block font-extrabold uppercase mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              PROVEEDOR / EMPRESA *
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Ej: Distribuidora Textil Quilmes"
              className={`w-full rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none border transition-colors ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-slate-700'
                  : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-800 shadow-xs'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block font-extrabold uppercase mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                CATEGORÍA DE GASTO
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none border transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-100 focus:border-slate-700'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-gray-800 shadow-xs'
                }`}
              >
                <option value="INSUMOS">INSUMOS / MATERIA PRIMA</option>
                <option value="PACKAGING">PACKAGING Y CAJAS</option>
                <option value="LOGISTICA">LOGÍSTICA / ENVÍOS</option>
                <option value="SERVICIOS">SERVICIOS DE TALLER</option>
                <option value="MAQUINARIA">MANTENIMIENTO / MAQUINARIA</option>
              </select>
            </div>

            <div>
              <label className={`block font-extrabold uppercase mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                FORMA DE PAGO
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={`w-full rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none border transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-100 focus:border-slate-700'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-gray-800 shadow-xs'
                }`}
              >
                <option value="TRANSFERENCIA">TRANSFERENCIA BANCARIA</option>
                <option value="MERCADO PAGO">MERCADO PAGO</option>
                <option value="EFECTIVO">EFECTIVO</option>
                <option value="TARJETA">TARJETA CRÉDITO/DÉBITO</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`block font-extrabold uppercase mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              MONTO TOTAL ($ ARS) *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="35000.00"
              className={`w-full rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none border transition-colors ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-slate-700'
                  : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-800 shadow-xs'
              }`}
            />
          </div>

          <div>
            <label className={`block font-extrabold uppercase mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              CONCEPTO / DETALLE DEL GASTO *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Compra de 50m de tela algodón peinado negro..."
              className={`w-full rounded-lg p-2.5 text-xs font-semibold focus:outline-none border transition-colors resize-none ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-slate-700'
                  : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-800 shadow-xs'
              }`}
            />
          </div>

          <div className={`px-6 py-4 flex items-center justify-between border-t-4 border-black -mx-6 -mb-6 mt-6 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-yellow-50 border-black'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 border-2 border-black font-black uppercase text-xs shadow-brutal-xs transition-all cursor-pointer ${
                isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-yellow text-black hover:bg-brand-pink hover:text-white border-2 border-black font-black text-xs uppercase shadow-brutal-xs transition-all flex items-center gap-2 cursor-pointer"
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
