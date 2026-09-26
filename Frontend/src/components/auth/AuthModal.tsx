import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User as UserIcon, Shield, Sparkles, LogIn, UserPlus, CheckCircle, AlertTriangle } from 'lucide-react';
import type { User, UserRole } from '../../types/types';
import { Button } from '../ui/Button';

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
  const handleLoginSubmit = (e: React.FormEvent) => {
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

    // Check if admin email
    const isAdmin = loginEmail.toLowerCase().includes('admin');
    const user: User = {
      id: `usr-${Date.now()}`,
      name: isAdmin ? 'Administrador Buttoncat' : loginEmail.split('@')[0],
      email: loginEmail.trim(),
      role: isAdmin ? 'ADMIN' : 'CLIENTE',
      avatar: isAdmin
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    };

    onLoginSuccess(user);
    resetModalState();
    onClose();
  };

  // REGISTRO DE CUENTA HANDLER
  const handleRegisterSubmit = (e: React.FormEvent) => {
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

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: regName.trim(),
      email: regEmail.trim(),
      role: 'CLIENTE',
    };

    setSuccessMessage('¡Cuenta creada con éxito! Iniciando sesión...');
    setTimeout(() => {
      onLoginSuccess(newUser);
      resetModalState();
      onClose();
    }, 800);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* MODAL CONTAINER */}
      <div className="relative w-full max-w-md bg-white border-4 border-black shadow-brutal-xl overflow-hidden font-sans">
        
        {/* TOP BAR */}
        <div className="bg-brand-yellow border-b-4 border-black p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-black" />
            <h3 className="text-lg font-black uppercase text-black font-display tracking-tight">
              ACCESO A BUTTONCAT
            </h3>
          </div>
          <button
            onClick={() => { resetModalState(); onClose(); }}
            className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center font-black text-black hover:bg-black hover:text-white transition-colors shadow-brutal-sm cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex border-b-4 border-black bg-gray-100">
          <button
            onClick={() => handleTabSwitch('login')}
            className={`flex-1 py-3 text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-black border-b-4 border-black font-black'
                : 'text-gray-500 hover:text-black hover:bg-gray-200'
            }`}
          >
            <LogIn className="w-4 h-4" /> INICIAR SESIÓN
          </button>
          <button
            onClick={() => handleTabSwitch('register')}
            className={`flex-1 py-3 text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-black border-b-4 border-black font-black'
                : 'text-gray-500 hover:text-black hover:bg-gray-200'
            }`}
          >
            <UserPlus className="w-4 h-4" /> REGISTRARSE
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-5 bg-[#FDFBF7]">
          
          {/* UNIFIED ERROR MESSAGE BANNER */}
          {errorMessage && (
            <div className="bg-red-100 border-3 border-black text-red-800 p-3 text-xs font-black uppercase shadow-brutal-sm flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* UNIFIED SUCCESS MESSAGE BANNER */}
          {successMessage && (
            <div className="bg-green-100 border-3 border-black text-green-800 p-3 text-xs font-black uppercase shadow-brutal-sm flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <form noValidate onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-black block">
                  EMAIL <span className="text-red-600 font-black">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="tu.email@ejemplo.com"
                    className="w-full border-3 border-black p-2.5 text-xs font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm pl-9"
                  />
                  <Mail className="w-4 h-4 text-black absolute left-3 top-3 stroke-[2.5]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase text-black block">
                    CONTRASEÑA <span className="text-red-600 font-black">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('forgot')}
                    className="text-[11px] font-black uppercase text-brand-purple hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-3 border-black p-2.5 text-xs font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm pl-9"
                  />
                  <Lock className="w-4 h-4 text-black absolute left-3 top-3 stroke-[2.5]" />
                </div>
              </div>

              <Button variant="pink" size="md" fullWidth type="submit" className="py-3 font-black">
                ENTRAR A MI CUENTA
              </Button>

              <div className="text-[10px] font-black uppercase text-gray-500 text-center pt-1">
                ( <span className="text-red-600">*</span> ) CAMPOS OBLIGATORIOS
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER FORM */}
          {activeTab === 'register' && (
            <form noValidate onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-black block">
                  NOMBRE COMPLETO <span className="text-red-600 font-black">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ej. Camila Torres"
                    className="w-full border-3 border-black p-2.5 text-xs font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm pl-9"
                  />
                  <UserIcon className="w-4 h-4 text-black absolute left-3 top-3 stroke-[2.5]" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-black block">
                  EMAIL <span className="text-red-600 font-black">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="tu.email@ejemplo.com"
                    className="w-full border-3 border-black p-2.5 text-xs font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm pl-9"
                  />
                  <Mail className="w-4 h-4 text-black absolute left-3 top-3 stroke-[2.5]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-black block">
                    CONTRASEÑA <span className="text-red-600 font-black">*</span>
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-3 border-black p-2 text-xs font-bold text-black bg-white focus:outline-none shadow-brutal-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-black block">
                    REPETIR CONTRASEÑA <span className="text-red-600 font-black">*</span>
                  </label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-3 border-black p-2 text-xs font-bold text-black bg-white focus:outline-none shadow-brutal-sm"
                  />
                </div>
              </div>

              <Button variant="yellow" size="md" fullWidth type="submit" className="py-3 font-black">
                CREAR MI CUENTA
              </Button>

              <div className="text-[10px] font-black uppercase text-gray-500 text-center pt-1">
                ( <span className="text-red-600">*</span> ) CAMPOS OBLIGATORIOS
              </div>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD FORM */}
          {activeTab === 'forgot' && (
            <form noValidate onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="text-xs font-bold text-gray-700 leading-relaxed">
                Ingresa tu correo electrónico registrado y te enviaremos las instrucciones para restablecer tu contraseña.
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-black block">
                  EMAIL REGISTRADO <span className="text-red-600 font-black">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="tu.email@ejemplo.com"
                    className="w-full border-3 border-black p-2.5 text-xs font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm pl-9"
                  />
                  <Mail className="w-4 h-4 text-black absolute left-3 top-3 stroke-[2.5]" />
                </div>
              </div>

              <Button variant="cyan" size="md" fullWidth type="submit" className="py-3 font-black">
                RECUPERAR MI CONTRASEÑA
              </Button>

              <div className="text-center pt-1 space-y-2">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('login')}
                  className="text-xs font-black uppercase text-black hover:underline cursor-pointer block mx-auto"
                >
                  ← Volver a Iniciar Sesión
                </button>
                <div className="text-[10px] font-black uppercase text-gray-500">
                  ( <span className="text-red-600">*</span> ) CAMPOS OBLIGATORIOS
                </div>
              </div>
            </form>
          )}

          {/* QUICK DEMO LOGIN BOX (1-CLICK TESTING) */}
          <div className="border-3 border-black bg-yellow-100 p-3 space-y-2 text-center shadow-brutal-sm">
            <span className="text-[10px] font-black uppercase text-black flex items-center justify-center gap-1">
              <Shield className="w-3.5 h-3.5 text-brand-purple" /> PRUEBA RÁPIDA EN 1 CLIC (DEMO)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('CLIENTE')}
                className="bg-white border-2 border-black py-1.5 px-2 text-[11px] font-black uppercase text-black hover:bg-cyan-200 transition-all shadow-brutal-sm cursor-pointer"
              >
                👤 CLIENTE DEMO
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN')}
                className="bg-black border-2 border-black py-1.5 px-2 text-[11px] font-black uppercase text-brand-yellow hover:bg-brand-pink hover:text-white transition-all shadow-brutal-sm cursor-pointer"
              >
                ⚡ ADMIN DEMO
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
