import React, { useState } from 'react';
import { Award, Sparkles, Gift, Tag, Check, Copy, ArrowRight, ShieldCheck, Ticket, AlertCircle, ShoppingBag } from 'lucide-react';
import type { RewardItem, RedeemedCoupon, User } from '../types/types';
import { MOCK_REWARDS } from '../data/mockRewards';
import { Button } from '../components/ui/Button';

interface RewardsPageProps {
  userPoints: number;
  currentUser: User | null;
  redeemedCoupons: RedeemedCoupon[];
  onRedeemReward: (reward: RewardItem) => void;
  onNavigateToCatalog: () => void;
  onOpenAuthModal: () => void;
}

export const RewardsPage: React.FC<RewardsPageProps> = ({
  userPoints,
  currentUser,
  redeemedCoupons,
  onRedeemReward,
  onNavigateToCatalog,
  onOpenAuthModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [sortBy, setSortBy] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState<'catalogo' | 'mis-cupones'>('catalogo');

  // MODAL STATES
  const [selectedRewardToClaim, setSelectedRewardToClaim] = useState<RewardItem | null>(null);
  const [generatedCoupon, setGeneratedCoupon] = useState<RedeemedCoupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // CATEGORY FILTERING
  const categories = [
    { id: 'TODOS', label: 'TODOS LOS PREMIOS', icon: Sparkles },
    { id: 'VOUCHER', label: 'VOUCHERS $', icon: Ticket },
    { id: 'DESCUENTO', label: 'DESCUENTOS %', icon: Tag },
    { id: 'PRODUCTO', label: 'PRODUCTOS EXCLUSIVOS', icon: ShoppingBag },
    { id: 'ENVIO', label: 'ENVÍO GRATIS', icon: ShieldCheck },
    { id: 'REGALO', label: 'CAJAS SORPRESA', icon: Gift },
  ];

  const filteredRewards = MOCK_REWARDS.filter((reward) => {
    if (selectedCategory === 'TODOS') return true;
    return reward.category === selectedCategory;
  }).sort((a, b) => {
    if (sortBy === 'asc') return a.pointsCost - b.pointsCost;
    return b.pointsCost - a.pointsCost;
  });

  const handleOpenClaimModal = (reward: RewardItem) => {
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }
    setSelectedRewardToClaim(reward);
    setGeneratedCoupon(null);
  };

  const handleConfirmClaim = () => {
    if (!selectedRewardToClaim) return;
    
    // Generate code
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const code = `${selectedRewardToClaim.codePrefix}-${randomSuffix}`;
    
    const newCoupon: RedeemedCoupon = {
      id: `coupon-${Date.now()}`,
      rewardId: selectedRewardToClaim.id,
      rewardTitle: selectedRewardToClaim.title,
      code,
      discountValue: selectedRewardToClaim.discountValue,
      pointsSpent: selectedRewardToClaim.pointsCost,
      redeemedAt: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      isUsed: false,
    };

    onRedeemReward(selectedRewardToClaim);
    setGeneratedCoupon(newCoupon);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // VIP PROGRESS COMPUTATION
  const nextTierPoints = 1000;
  const progressPercent = Math.min(100, Math.round((userPoints / nextTierPoints) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* HERO BANNER - USER POINTS & VIP STATUS */}
      <div className="border-4 border-black bg-brand-yellow p-6 sm:p-8 shadow-brutal-xl relative overflow-hidden">
        {/* Background Decorative Pattern */}
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none select-none text-[180px] font-black text-black">
          PTS
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-brutal-sm">
              <Award className="w-4 h-4 text-brand-yellow" /> CLUB DE RECOMPENSAS BUTTONCAT
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black uppercase text-black font-display tracking-tight leading-none">
              CANJEA TUS PUNTOS POR PREMIOS
            </h1>
            
            <p className="text-xs sm:text-sm font-bold text-gray-900 leading-relaxed">
              Acumula puntos con cada compra o diseño personalizado y desbloquea <b>vouchers de descuento, cupones de compra, regalos de edición limitada y envíos bonificados</b>.
            </p>

            {/* VIP TIER PROGRESS BAR (ONLY LOGGED IN USERS) */}
            {currentUser && (
              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-black uppercase">
                  <span className="flex items-center gap-1 text-black">
                    <Sparkles className="w-3.5 h-3.5 fill-black" /> NIVEL: <span className="bg-brand-purple text-white px-1.5 py-0.5 border border-black">VIP CAT LEGEND</span>
                  </span>
                  <span className="text-gray-900 font-extrabold">{userPoints} / {nextTierPoints} PTS HACIA NIVEL DIOS</span>
                </div>
                <div className="w-full bg-white border-2 border-black h-4 p-0.5 shadow-brutal-sm">
                  <div 
                    className="bg-brand-purple h-full border border-black transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* USER POINTS CARD / GUEST BANNER */}
          <div className="w-full md:w-auto border-3 border-black bg-white p-5 shadow-brutal text-center flex flex-col items-center justify-center min-w-[240px]">
            {currentUser ? (
              <>
                <span className="text-xs font-black uppercase text-brand-purple tracking-wider mb-1 flex items-center gap-1 justify-center">
                  <Award className="w-4 h-4 stroke-[3]" /> SALDO DISPONIBLE
                </span>
                <div className="text-4xl sm:text-5xl font-black text-black my-1 font-display tracking-tight">
                  {userPoints} <span className="text-xl font-extrabold text-brand-orange">PTS</span>
                </div>
                <p className="text-[11px] font-bold text-gray-600 mb-3">
                  ≈ ${(userPoints * 10).toLocaleString('es-AR')} ARS en descuentos
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-green-700 bg-green-100 px-2 py-1 border border-black">
                  <ShieldCheck className="w-3.5 h-3.5" /> CUENTA VERIFICADA
                </span>
              </>
            ) : (
              <div className="space-y-3 py-1">
                <span className="text-xs font-black uppercase text-black flex items-center justify-center gap-1">
                  <Award className="w-4 h-4 text-brand-purple" /> ¿QUERÉS GANAR PREMIOS?
                </span>
                <p className="text-[11px] font-bold text-gray-600 max-w-[200px] leading-tight">
                  Iniciá sesión para consultar tus puntos acumulados, nivel VIP y canjear cupones exclusivos.
                </p>
                <Button variant="purple" size="sm" fullWidth onClick={onOpenAuthModal} className="text-xs font-black">
                  INICIAR SESIÓN
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS: CATÁLOGO VS MIS CUPONES */}
      <div className="flex items-center justify-between border-b-4 border-black pb-2 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('catalogo')}
            className={`px-5 py-2.5 border-3 border-black text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'catalogo'
                ? 'bg-brand-purple text-white shadow-brutal ring-2 ring-black'
                : 'bg-white text-black hover:bg-gray-100 shadow-brutal-sm'
            }`}
          >
            CATÁLOGO DE PREMIOS ({MOCK_REWARDS.length})
          </button>

          {currentUser && (
            <button
              onClick={() => setActiveTab('mis-cupones')}
              className={`px-5 py-2.5 border-3 border-black text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'mis-cupones'
                  ? 'bg-brand-pink text-white shadow-brutal ring-2 ring-black'
                  : 'bg-white text-black hover:bg-gray-100 shadow-brutal-sm'
              }`}
            >
              MIS CUPONES CANJEADOS ({redeemedCoupons.length})
            </button>
          )}
        </div>

        {activeTab === 'catalogo' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-black">ORDENAR:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'asc' | 'desc')}
              className="border-2 border-black px-3 py-1.5 text-xs font-black bg-white focus:outline-none shadow-brutal-sm cursor-pointer uppercase"
            >
              <option value="asc">MENOR COSTO DE PUNTOS</option>
              <option value="desc">MAYOR COSTO DE PUNTOS</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB CONTENT 1: CATÁLOGO DE PREMIOS */}
      {activeTab === 'catalogo' && (
        <div className="space-y-6">
          
          {/* CATEGORY FILTER BUTTONS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 border-2 border-black text-xs font-black uppercase whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shadow-brutal-sm ${
                    isSelected
                      ? 'bg-black text-brand-yellow ring-2 ring-brand-yellow'
                      : 'bg-white text-black hover:bg-yellow-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* REWARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredRewards.map((reward) => {
              const hasEnoughPoints = userPoints >= reward.pointsCost;
              const pointsNeeded = reward.pointsCost - userPoints;

              return (
                <div
                  key={reward.id}
                  className="border-3 border-black bg-white shadow-brutal hover:shadow-brutal-lg transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* IMAGE CONTAINER */}
                    <div className="relative h-48 border-b-3 border-black overflow-hidden bg-gray-100">
                      <img
                        src={reward.image}
                        alt={reward.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* BADGE */}
                      {reward.badge && (
                        <span className={`absolute top-2 left-2 border-2 border-black px-2.5 py-1 text-[10px] font-black uppercase shadow-brutal-sm ${reward.badgeBg || 'bg-brand-yellow text-black'}`}>
                          {reward.badge}
                        </span>
                      )}

                      {/* POINTS COST TAG */}
                      <span className="absolute bottom-2 right-2 bg-black text-brand-yellow border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-brutal-sm flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-brand-yellow" />
                        {reward.pointsCost} PTS
                      </span>
                    </div>

                    {/* DETAILS */}
                    <div className="p-4 space-y-2">
                      <div className="inline-block bg-brand-cyanLight text-black border border-black px-2 py-0.5 text-[10px] font-extrabold uppercase">
                        {reward.discountValue}
                      </div>
                      
                      <h3 className="text-base font-black uppercase text-black leading-snug line-clamp-2">
                        {reward.title}
                      </h3>
                      
                      <p className="text-xs font-semibold text-gray-700 leading-relaxed line-clamp-3">
                        {reward.description}
                      </p>

                      {reward.stock !== undefined && (
                        <div className="text-[11px] font-black uppercase text-brand-orange flex items-center gap-1 pt-1">
                          <AlertCircle className="w-3.5 h-3.5" /> ¡QUEDAN SOLO {reward.stock} UNIDADES!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  <div className="p-4 pt-0">
                    {hasEnoughPoints ? (
                      <Button
                        variant="purple"
                        size="md"
                        fullWidth
                        onClick={() => handleOpenClaimModal(reward)}
                        className="justify-center"
                      >
                        CANJEAR AHORA
                      </Button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2.5 px-3 bg-gray-200 border-2 border-gray-400 text-gray-500 font-black text-xs uppercase cursor-not-allowed text-center"
                      >
                        FALTAN {pointsNeeded} PTS
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* TAB CONTENT 2: MIS CUPONES CANJEADOS */}
      {activeTab === 'mis-cupones' && currentUser && (
        <div className="space-y-6">
          <div className="border-3 border-black bg-white p-6 shadow-brutal space-y-4">
            <h2 className="text-xl font-black uppercase text-black flex items-center gap-2 font-display">
              <Ticket className="w-6 h-6 text-brand-purple" /> MIS CUPONES Y VOUCHERS ACTIVOS
            </h2>
            <p className="text-xs font-bold text-gray-600">
              Copia el código de tu cupón e ingrésalo en la pantalla de pago (Checkout) o muéstralo en el taller para aplicar el beneficio.
            </p>

            {redeemedCoupons.length === 0 ? (
              <div className="border-2 border-dashed border-black bg-yellow-50 p-8 text-center space-y-3">
                <Gift className="w-12 h-12 text-black mx-auto opacity-40" />
                <h3 className="text-lg font-black uppercase text-black">AÚN NO HAS CANJEADO NINGÚN PREMIO</h3>
                <p className="text-xs font-bold text-gray-600 max-w-md mx-auto">
                  Utiliza tus puntos acumulados para obtener descuentos exclusivos en tu próxima compra de stickers, pines o prendas.
                </p>
                <Button variant="yellow" size="sm" onClick={() => setActiveTab('catalogo')}>
                  EXPLORAR CATÁLOGO DE PREMIOS
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {redeemedCoupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="border-3 border-black bg-yellow-50 p-4 shadow-brutal flex flex-col justify-between space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="bg-brand-purple text-white text-[10px] font-black uppercase px-2 py-0.5 border border-black">
                          {coupon.discountValue}
                        </span>
                        <h4 className="text-base font-black uppercase text-black mt-1">
                          {coupon.rewardTitle}
                        </h4>
                        <p className="text-[11px] font-bold text-gray-600">
                          Canjeado el: {coupon.redeemedAt} • Costo: {coupon.pointsSpent} PTS
                        </p>
                      </div>
                      <span className="bg-green-400 text-black border border-black px-2 py-0.5 text-[10px] font-black uppercase shadow-brutal-sm">
                        ACTIVO
                      </span>
                    </div>

                    {/* CODE BOX */}
                    <div className="border-2 border-black bg-white p-3 flex items-center justify-between gap-2 shadow-brutal-sm">
                      <code className="text-sm font-black text-black tracking-wider select-all">
                        {coupon.code}
                      </code>
                      <button
                        onClick={() => handleCopyCode(coupon.code)}
                        className={`px-3 py-1 border-2 border-black text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1 ${
                          copiedCode === coupon.code
                            ? 'bg-green-400 text-black'
                            : 'bg-brand-yellow text-black hover:bg-brand-orange hover:text-white'
                        }`}
                      >
                        {copiedCode === coupon.code ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> ¡COPIADO!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> COPIAR CÓDIGO
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] font-extrabold text-black">
                      <span>✓ Válido para cualquier compra en Buttoncat</span>
                      <button
                        onClick={onNavigateToCatalog}
                        className="text-brand-purple hover:underline flex items-center gap-0.5"
                      >
                        USAR EN CATÁLOGO <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CLAIM CONFIRMATION MODAL */}
      {selectedRewardToClaim && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="border-4 border-black bg-white max-w-md w-full p-6 shadow-brutal-xl space-y-5 relative">
            
            {!generatedCoupon ? (
              <>
                {/* MODAL HEADER */}
                <div className="border-b-3 border-black pb-3 text-center">
                  <div className="inline-flex items-center gap-1.5 bg-brand-yellow border-2 border-black px-3 py-0.5 text-xs font-black uppercase shadow-brutal-sm mb-2">
                    <Award className="w-4 h-4" /> CONFIRMAR CANJE DE PREMIO
                  </div>
                  <h3 className="text-2xl font-black uppercase text-black font-display">
                    {selectedRewardToClaim.title}
                  </h3>
                </div>

                {/* MODAL BODY */}
                <div className="space-y-3 bg-yellow-50 border-2 border-black p-4 text-xs font-bold text-black">
                  <div className="flex justify-between border-b border-black/20 pb-1.5">
                    <span>Beneficio:</span>
                    <span className="font-extrabold text-brand-purple">{selectedRewardToClaim.discountValue}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/20 pb-1.5">
                    <span>Costo en Puntos:</span>
                    <span className="font-extrabold text-brand-orange">-{selectedRewardToClaim.pointsCost} PTS</span>
                  </div>
                  <div className="flex justify-between border-b border-black/20 pb-1.5">
                    <span>Tu Saldo Actual:</span>
                    <span className="font-extrabold">{userPoints} PTS</span>
                  </div>
                  <div className="flex justify-between pt-1 font-black text-sm">
                    <span>Saldo Restante:</span>
                    <span className="text-green-700">{userPoints - selectedRewardToClaim.pointsCost} PTS</span>
                  </div>
                </div>

                {/* MODAL ACTIONS */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="white"
                    size="md"
                    fullWidth
                    onClick={() => setSelectedRewardToClaim(null)}
                  >
                    CANCELAR
                  </Button>
                  <Button
                    variant="purple"
                    size="md"
                    fullWidth
                    onClick={handleConfirmClaim}
                  >
                    ¡SI, CANJEAR!
                  </Button>
                </div>
              </>
            ) : (
              /* SUCCESS STEP */
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 bg-green-400 border-3 border-black rounded-full flex items-center justify-center mx-auto shadow-brutal animate-bounce">
                  <Check className="w-10 h-10 text-black stroke-[3]" />
                </div>

                <div className="space-y-1">
                  <span className="bg-brand-pink text-white border border-black px-2 py-0.5 text-[10px] font-black uppercase">
                    ¡CANJE REALIZADO CON ÉXITO!
                  </span>
                  <h3 className="text-2xl font-black uppercase text-black font-display">
                    {generatedCoupon.rewardTitle}
                  </h3>
                  <p className="text-xs font-bold text-gray-700">
                    Tu código de descuento exclusivo ya está generado y listo para ser utilizado:
                  </p>
                </div>

                {/* GENERATED CODE DISPLAY */}
                <div className="border-3 border-black bg-brand-yellow p-4 shadow-brutal space-y-2">
                  <p className="text-[10px] font-black uppercase text-gray-800">TU CÓDIGO DE CUPÓN:</p>
                  <div className="text-xl sm:text-2xl font-black text-black tracking-widest bg-white border-2 border-black py-2 px-3 select-all">
                    {generatedCoupon.code}
                  </div>
                  <Button
                    variant="black"
                    size="sm"
                    fullWidth
                    onClick={() => handleCopyCode(generatedCoupon.code)}
                    className="mt-2 justify-center"
                  >
                    {copiedCode === generatedCoupon.code ? '¡CÓDIGO COPIADO! ✓' : 'COPIAR CÓDIGO'}
                  </Button>
                </div>

                <div className="pt-2">
                  <Button
                    variant="purple"
                    size="md"
                    fullWidth
                    onClick={() => {
                      setSelectedRewardToClaim(null);
                      setActiveTab('mis-cupones');
                    }}
                  >
                    VER MIS CUPONES CANJEADOS
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
