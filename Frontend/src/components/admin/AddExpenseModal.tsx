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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto font-sans animate-in fade-in">
      <div className={`w-full max-w-lg my-6 rounded-2xl border shadow-2xl overflow-hidden transition-colors ${
        isDarkMode
          ? 'bg-slate-950 border-slate-800 text-slate-100'
          : 'bg-white border-gray-200 text-gray-900'
      }`}>
        
        {/* HEADER */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <DollarSign className={`w-5 h-5 ${isDarkMode ? 'text-amber-400' : 'text-gray-800'}`} />
            <h2 className={`text-base sm:text-lg font-black uppercase font-display ${
              isDarkMode ? 'text-slate-100' : 'text-gray-900'
            }`}>
              {expenseToEdit ? `EDITAR GASTO #${expenseToEdit.id}` : 'REGISTRAR GASTO / PROVEEDOR'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <X className="w-5 h-5" />
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
                  ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-slate-700'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-800 shadow-xs'
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
                  ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-slate-700'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-800 shadow-xs'
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
                  ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-slate-700'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-800 shadow-xs'
              }`}
            />
          </div>

          <div className={`px-6 py-4 flex items-center justify-end gap-3 border-t -mx-6 -mb-6 mt-4 ${
            isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer border ${
                isDarkMode
                  ? 'border-slate-800 text-slate-300 hover:bg-slate-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border ${
                isDarkMode
                  ? 'bg-slate-100 text-slate-900 hover:bg-white border-slate-100'
                  : 'bg-gray-900 text-white hover:bg-black border-gray-900'
              }`}
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
