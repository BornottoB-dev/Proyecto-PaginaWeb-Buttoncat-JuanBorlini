import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, DollarSign } from 'lucide-react';
import { ValidationModal } from '../ui/ValidationModal';

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
  const [paymentMethod, setPaymentMethod] = useState('DIGITAL');
  const [validationModalMsg, setValidationModalMsg] = useState<string | null>(null);

  const normalizeExpenseMethod = (m?: string): string => {
    if (!m) return 'DIGITAL';
    const lower = m.toLowerCase();
    if (lower.includes('efectivo') || lower.includes('cash') || lower.includes('físic') || lower.includes('fisic') || lower.includes('local')) {
      return 'EFECTIVO';
    }
    return 'DIGITAL';
  };

  useEffect(() => {
    setValidationModalMsg(null);
    if (expenseToEdit) {
      setSupplier(expenseToEdit.supplier);
      setCategory(expenseToEdit.category);
      setDescription(expenseToEdit.description);
      setAmount(expenseToEdit.amount);
      setPaymentMethod(normalizeExpenseMethod(expenseToEdit.paymentMethod));
    } else {
      setSupplier('');
      setCategory('INSUMOS');
      setDescription('');
      setAmount('');
      setPaymentMethod('DIGITAL');
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

  const labelClass = `text-[11px] font-semibold uppercase tracking-wider block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`;
  const inputClass = `w-full rounded-lg px-3 py-2 text-xs font-medium border focus:outline-none transition-colors ${
    isDarkMode 
      ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-slate-400' 
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 shadow-2xs'
  }`;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in font-sans ${
        isDarkMode ? 'bg-black/80' : 'bg-black/60 backdrop-blur-xs'
      }`}
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-lg my-auto rounded-2xl border shadow-2xl overflow-hidden transition-colors flex flex-col ${
          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className={`px-6 py-4 flex items-center justify-between border-b shrink-0 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
              isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-gray-900 border-gray-200 shadow-2xs'
            }`}>
              <DollarSign className="w-5 h-5 text-gray-700 dark:text-slate-300" />
            </div>
            <div>
              <h2 className={`text-base font-bold uppercase tracking-wide ${
                isDarkMode ? 'text-slate-100' : 'text-gray-900'
              }`}>
                {expenseToEdit ? `EDITAR GASTO #${expenseToEdit.id}` : 'REGISTRAR NUEVO GASTO'}
              </h2>
              <p className={`text-xs ${
                isDarkMode ? 'text-slate-400' : 'text-gray-500'
              }`}>
                Gestión Financiera de Proveedores y Servicios
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="admin-expense-supplier" className={labelClass}>
              PROVEEDOR / EMPRESA *
            </label>
            <input
              id="admin-expense-supplier"
              name="expenseSupplier"
              aria-label="Proveedor o Empresa"
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Ej: Distribuidora Textil Quilmes"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="admin-expense-category" className={labelClass}>
                CATEGORÍA DE GASTO
              </label>
              <select
                id="admin-expense-category"
                name="expenseCategory"
                aria-label="Categoría de Gasto"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="INSUMOS">INSUMOS / MATERIA PRIMA</option>
                <option value="PACKAGING">PACKAGING Y CAJAS</option>
                <option value="LOGISTICA">LOGÍSTICA / ENVÍOS</option>
                <option value="SERVICIOS">SERVICIOS DE TALLER</option>
                <option value="MAQUINARIA">MANTENIMIENTO / MAQUINARIA</option>
              </select>
            </div>

            <div>
              <label htmlFor="admin-expense-payment-method" className={labelClass}>
                FORMA DE PAGO
              </label>
              <select
                id="admin-expense-payment-method"
                name="expensePaymentMethod"
                aria-label="Forma de Pago"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="DIGITAL">DINERO DIGITAL</option>
                <option value="EFECTIVO">DINERO FÍSICO / EFECTIVO</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="admin-expense-amount" className={labelClass}>
              MONTO TOTAL ($ ARS) *
            </label>
            <input
              id="admin-expense-amount"
              name="expenseAmount"
              aria-label="Monto Total ARS"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="35000.00"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="admin-expense-description" className={labelClass}>
              CONCEPTO / DETALLE DEL GASTO *
            </label>
            <textarea
              id="admin-expense-description"
              name="expenseDescription"
              aria-label="Concepto o Detalle del Gasto"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Compra de 50m de tela algodón peinado negro..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className={`px-6 py-4 flex items-center justify-between border-t shrink-0 -mx-6 -mb-6 mt-6 ${
            isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isDarkMode
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                isDarkMode
                  ? 'bg-slate-100 text-slate-900 hover:bg-white'
                  : 'bg-gray-900 text-white hover:bg-black'
              }`}
            >
              {expenseToEdit ? (
                <>
                  <Save className="w-4 h-4" /> Guardar Cambios
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> Registrar Gasto
                </>
              )}
            </button>
          </div>

        </form>

      </div>

      {/* VALIDATION NOTICE MODAL */}
      <ValidationModal
        isOpen={!!validationModalMsg}
        title="CAMPO OBLIGATORIO REQUERIDO"
        message={validationModalMsg || ''}
        onClose={() => setValidationModalMsg(null)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
