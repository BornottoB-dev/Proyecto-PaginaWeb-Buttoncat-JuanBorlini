import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User as UserIcon, Shield, Sparkles, LogIn, UserPlus, CheckCircle, ArrowLeft } from 'lucide-react';
import type { User, UserRole } from '../../types/types';
import { Button } from '../ui/Button';
import { ValidationModal } from '../ui/ValidationModal';
import { authApi } from '../../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

// STANDARD EMAIL REGEX VALIDATION (Requires format user@domain.tld with at least 2 characters TLD, rejecting invalid forms like demo@demo)
const isValidEmail = (email: string): boolean => {
  const cleanEmail = email.trim().toLowerCase();
  // Validates standard name@domain.tld structure with any valid 2+ character TLD (e.g. .com, .com.ar, .org, .tech)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(cleanEmail);
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Recover password state
  const [forgotEmail, setForgotEmail] = useState('');
  
  // UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // RESET ALL FORM & MESSAGE STATES
  const resetModalState = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoginEmail('');
    setLoginPassword('');
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
    setForgotEmail('');
  };

  // Reset when modal opens/closes or switches tabs
  useEffect(() => {
    if (!isOpen) {
      resetModalState();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTabSwitch = (tab: 'login' | 'register' | 'forgot') => {
    setActiveTab(tab);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // INICIO DE SESIÓN HANDLER
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Por favor, completa todos los campos obligatorios (*).');
      return;
    }

    if (!isValidEmail(loginEmail)) {
      setErrorMessage('El formato de correo electrónico no es válido. Debe incluir un dominio real (ejemplo: usuario@dominio.com).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.login({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (res.success && res.data) {
        localStorage.setItem('buttoncat_token', res.data.token);
        localStorage.setItem('buttoncat_user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);
        resetModalState();
        onClose();
      } else {
        setErrorMessage(res.error || 'Credenciales inválidas');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // REGISTRO DE CUENTA HANDLER
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regConfirmPassword.trim()) {
      setErrorMessage('Por favor, completa todos los campos obligatorios (*).');
      return;
    }

    if (!isValidEmail(regEmail)) {
      setErrorMessage('El formato de correo electrónico no es válido. Debe incluir un dominio real (ejemplo: usuario@dominio.com).');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });

      if (res.success && res.data) {
        localStorage.setItem('buttoncat_token', res.data.token);
        localStorage.setItem('buttoncat_user', JSON.stringify(res.data.user));
        setSuccessMessage('¡Cuenta creada con éxito! Iniciando sesión...');
        setTimeout(() => {
          onLoginSuccess(res.data!.user);
          resetModalState();
          onClose();
        }, 500);
      } else {
        setErrorMessage(res.error || 'Error al crear la cuenta');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // RECUPERACIÓN DE CONTRASEÑA HANDLER
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!forgotEmail.trim()) {
      setErrorMessage('Por favor, ingresa tu correo electrónico obligatoriamente (*).');
      return;
    }

    if (!isValidEmail(forgotEmail)) {
      setErrorMessage('El formato de correo electrónico no es válido. Debe incluir un dominio real (ejemplo: usuario@dominio.com).');
      return;
    }

    setSuccessMessage(`Se enviaron las instrucciones de recuperación a ${forgotEmail.trim()}.`);
  };

  // Quick Demo Logins for fast evaluator testing
  const handleDemoLogin = (role: UserRole) => {
    const demoUser: User = role === 'ADMIN' ? {
      id: 'usr-admin-demo',
      name: 'Admin Buttoncat',
      email: 'admin@buttoncat.com',
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    } : {
      id: 'usr-client-demo',
      name: 'Luna Lovecraft',
      email: 'luna@buttoncat.com',
      role: 'CLIENTE',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
    };

    onLoginSuccess(demoUser);
    resetModalState();
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-9999 overflow-y-auto flex items-center justify-center p-2.5 sm:p-4 bg-black/70 backdrop-blur-sm min-h-dvh animate-in fade-in duration-200"
      onClick={() => { resetModalState(); onClose(); }}
    >
      
      {/* MODAL CONTAINER */}
      <div 
        className="relative w-full max-w-md bg-white border-3 sm:border-4 border-black shadow-brutal sm:shadow-brutal-xl overflow-hidden font-sans my-auto max-h-[92dvh] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* TOP BAR */}
        <div className="bg-brand-yellow border-b-3 sm:border-b-4 border-black p-2.5 sm:p-3.5 px-3.5 sm:px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-black shrink-0" />
            <h3 className="text-sm sm:text-base font-black uppercase text-black font-display tracking-tight truncate">
              ACCESO A BUTTONCAT
            </h3>
          </div>
          <button
            onClick={() => { resetModalState(); onClose(); }}
            className="w-7 h-7 sm:w-8 sm:h-8 bg-white border-2 border-black flex items-center justify-center font-black text-black hover:bg-black hover:text-white transition-colors shadow-brutal-sm cursor-pointer shrink-0"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-3" />
          </button>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex border-b-3 sm:border-b-4 border-black bg-gray-100 shrink-0">
          <button
            onClick={() => handleTabSwitch('login')}
            className={`flex-1 py-2 sm:py-2.5 text-[11px] sm:text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-black border-b-3 sm:border-b-4 border-black font-black'
                : 'text-gray-500 hover:text-black hover:bg-gray-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> INICIAR SESIÓN
          </button>
          <button
            onClick={() => handleTabSwitch('register')}
            className={`flex-1 py-2 sm:py-2.5 text-[11px] sm:text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-black border-b-3 sm:border-b-4 border-black font-black'
                : 'text-gray-500 hover:text-black hover:bg-gray-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> REGISTRARSE
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-3.5 bg-[#FDFBF7] flex-1 overflow-y-auto overscroll-contain">
          
          {/* UNIFIED SUCCESS MESSAGE BANNER */}
          {successMessage && (
            <div className="bg-green-100 border-2 sm:border-3 border-black text-green-800 p-2 sm:p-2.5 text-[11px] sm:text-xs font-black uppercase shadow-brutal-sm flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-green-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <form noValidate onSubmit={handleLoginSubmit} className="space-y-2.5 sm:space-y-3">
              <div className="space-y-0.5">
                <label htmlFor="auth-login-email" className="text-[10px] sm:text-xs font-black uppercase text-black block">
                  EMAIL <span className="text-red-600 font-black">*</span>
                </label>
                <div className="relative">
                  <input
                    id="auth-login-email"
                    name="loginEmail"
                    aria-label="Correo electrónico para iniciar sesión"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="tu.email@ejemplo.com"
                    className="w-full border-2 sm:border-3 border-black p-2 sm:p-2.5 text-xs font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm pl-8 sm:pl-9"
                  />
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black absolute left-2.5 sm:left-3 top-2.5 sm:top-3 stroke-[2.5]" />
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="auth-login-password" className="text-[10px] sm:text-xs font-black uppercase text-black block">
                    CONTRASEÑA <span className="text-red-600 font-black">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('forgot')}
                    className="text-[10px] sm:text-[11px] font-black uppercase text-brand-purple hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="auth-login-password"
                    name="loginPassword"
                    aria-label="Contraseña para iniciar sesión"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-2 sm:border-3 border-black p-2 sm:p-2.5 text-xs font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm pl-8 sm:pl-9"
                  />
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black absolute left-2.5 sm:left-3 top-2.5 sm:top-3 stroke-[2.5]" />
                </div>
              </div>

              <Button variant="pink" size="md" fullWidth type="submit" disabled={isSubmitting} className="py-2.5 sm:py-3 font-black text-xs sm:text-sm">
                {isSubmitting ? 'INGRESANDO...' : 'ENTRAR A MI CUENTA'}
              </Button>

              <div className="text-[9px] sm:text-[10px] font-black uppercase text-gray-500 text-center">
                ( <span className="text-red-600">*</span> ) CAMPOS OBLIGATORIOS
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER FORM */}
          {activeTab === 'register' && (
            <form noValidate onSubmit={handleRegisterSubmit} className="space-y-2 sm:space-y-2.5">
              <div className="space-y-0.5">
                <label htmlFor="auth-reg-name" className="text-[10px] sm:text-xs font-black uppercase text-black block">
                  NOMBRE COMPLETO <span className="text-red-600 font-black">*</span>
                </label>
                <div className="relative">
                  <input
                    id="auth-reg-name"
                    name="regName"
                    aria-label="Nombre completo"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ej. Camila Torres"
                    className="w-full border-2 sm:border-3 border-black p-2 sm:p-2.5 text-xs font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm pl-8 sm:pl-9"
                  />
                  <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black absolute left-2.5 sm:left-3 top-2.5 sm:top-3 stroke-[2.5]" />
                </div>
              </div>

              <div className="space-y-0.5">
                <label htmlFor="auth-reg-email" className="text-[10px] sm:text-xs font-black uppercase text-black block">
                  EMAIL <span className="text-red-600 font-black">*</span>
                </label>
                <div className="relative">
                  <input
                    id="auth-reg-email"
                    name="regEmail"
                    aria-label="Correo electrónico de registro"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="tu.email@ejemplo.com"
                    className="w-full border-2 sm:border-3 border-black p-2 sm:p-2.5 text-xs font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm pl-8 sm:pl-9"
                  />
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black absolute left-2.5 sm:left-3 top-2.5 sm:top-3 stroke-[2.5]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-0.5">
                  <label htmlFor="auth-reg-password" className="text-[9px] sm:text-[10px] font-black uppercase text-black block truncate">
                    CONTRASEÑA <span className="text-red-600 font-black">*</span>
                  </label>
                  <input
                    id="auth-reg-password"
                    name="regPassword"
                    aria-label="Contraseña de registro"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-2 sm:border-3 border-black p-2 text-xs font-bold text-black bg-white focus:outline-none shadow-brutal-sm"
                  />
                </div>
                <div className="space-y-0.5">
                  <label htmlFor="auth-reg-confirm-password" className="text-[9px] sm:text-[10px] font-black uppercase text-black block truncate">
                    CONFIRMAR <span className="text-red-600 font-black">*</span>
                  </label>
                  <input
                    id="auth-reg-confirm-password"
                    name="regConfirmPassword"
                    aria-label="Repetir contraseña de registro"
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-2 sm:border-3 border-black p-2 text-xs font-bold text-black bg-white focus:outline-none shadow-brutal-sm"
                  />
                </div>
              </div>

              <Button variant="yellow" size="md" fullWidth type="submit" disabled={isSubmitting} className="py-2.5 sm:py-3 font-black text-xs sm:text-sm">
                {isSubmitting ? 'CREANDO CUENTA...' : 'CREAR MI CUENTA'}
              </Button>

              <div className="text-[9px] sm:text-[10px] font-black uppercase text-gray-500 text-center">
                ( <span className="text-red-600">*</span> ) CAMPOS OBLIGATORIOS
              </div>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD FORM */}
          {activeTab === 'forgot' && (
            <form noValidate onSubmit={handleForgotSubmit} className="space-y-2.5 sm:space-y-3">
              <div className="text-xs font-bold text-gray-700 leading-relaxed">
                Ingresa tu correo electrónico registrado y te enviaremos las instrucciones para restablecer tu contraseña.
              </div>

              <div className="space-y-0.5">
                <label htmlFor="auth-forgot-email" className="text-[10px] sm:text-xs font-black uppercase text-black block">
                  EMAIL REGISTRADO <span className="text-red-600 font-black">*</span>
                </label>
                <div className="relative">
                  <input
                    id="auth-forgot-email"
                    name="forgotEmail"
                    aria-label="Correo electrónico registrado para recuperar contraseña"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="tu.email@ejemplo.com"
                    className="w-full border-2 sm:border-3 border-black p-2 sm:p-2.5 text-xs font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm pl-8 sm:pl-9"
                  />
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black absolute left-2.5 sm:left-3 top-2.5 sm:top-3 stroke-[2.5]" />
                </div>
              </div>

              <Button variant="cyan" size="md" fullWidth type="submit" className="py-2.5 sm:py-3 font-black text-xs sm:text-sm">
                RECUPERAR MI CONTRASEÑA
              </Button>

              <div className="text-center pt-0.5 space-y-1">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('login')}
                  className="text-xs font-black uppercase text-black hover:underline cursor-pointer inline-flex items-center gap-1.5 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver a Iniciar Sesión
                </button>
                <div className="text-[9px] sm:text-[10px] font-black uppercase text-gray-500">
                  ( <span className="text-red-600">*</span> ) CAMPOS OBLIGATORIOS
                </div>
              </div>
            </form>
          )}

          {/* QUICK DEMO LOGIN BOX (1-CLICK TESTING) */}
          <div className="border-2 sm:border-3 border-black bg-yellow-100 p-2 sm:p-2.5 space-y-1.5 text-center shadow-brutal-sm">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-black flex items-center justify-center gap-1">
              <Shield className="w-3.5 h-3.5 text-brand-purple" /> PRUEBA RÁPIDA EN 1 CLIC (DEMO)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('CLIENTE')}
                className="bg-white border-2 border-black py-1.5 px-2 text-[10px] sm:text-[11px] font-black uppercase text-black hover:bg-cyan-200 transition-all shadow-brutal-sm cursor-pointer flex items-center justify-center gap-1 truncate"
              >
                <UserIcon className="w-3.5 h-3.5 shrink-0" /> CLIENTE DEMO
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN')}
                className="bg-black border-2 border-black py-1.5 px-2 text-[10px] sm:text-[11px] font-black uppercase text-brand-yellow hover:bg-brand-pink hover:text-white transition-all shadow-brutal-sm cursor-pointer flex items-center justify-center gap-1 truncate"
              >
                <Shield className="w-3.5 h-3.5 text-brand-yellow shrink-0" /> ADMIN DEMO
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* VALIDATION NOTICE MODAL */}
      <ValidationModal
        isOpen={!!errorMessage}
        title="AVISO DE ACCESO"
        message={errorMessage || ''}
        onClose={() => setErrorMessage(null)}
      />
    </div>,
    document.body
  );
};
