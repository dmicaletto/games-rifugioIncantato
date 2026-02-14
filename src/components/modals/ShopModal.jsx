import React from 'react';
import { Store, Coins, X, Lock } from 'lucide-react';
import { MARKET_ITEMS } from '../../constants/gameData';

const ShopModal = ({ isOpen, onClose, wallet, inventory, onBuy, level }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ zIndex: 200 }}>
            <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border-4 border-white">
                <div className="bg-indigo-100 p-4 flex justify-between items-center">
                    <h3 className="text-xl font-black text-indigo-900 flex items-center gap-2"><Store size={24} /> Market</h3>
                    <div className="bg-white px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                        <Coins size={16} className="text-emerald-600" />
                        <span className="font-bold text-emerald-800">{Math.floor(wallet.money)}</span>
                    </div>
                    <button onClick={onClose} className="font-bold text-slate-400 p-2"><X /></button>
                </div>
                <div className="overflow-y-auto p-4 flex-1">
                    {['decor', 'toys'].map(cat => (
                        <div key={cat}>
                            <h4 className="font-bold text-slate-500 mb-2 uppercase text-xs tracking-wider mt-2">
                                {cat === 'decor' ? 'Arredamento' : 'Giochi'}
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                {MARKET_ITEMS[cat].map(item => {
                                    const owned = inventory.includes(item.id);
                                    const locked = level < (item.levelReq || 1);
                                    return (
                                        <div
                                            key={item.id}
                                            className={`p-3 rounded-xl border-2 flex flex-col items-center text-center relative ${owned ? 'bg-green-50 border-green-200' : locked ? 'bg-slate-100 border-slate-200' : 'bg-white border-slate-100'}`}
                                        >
                                            {locked && (
                                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl">
                                                    <Lock className="text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-500 ml-1">Liv {item.levelReq}</span>
                                                </div>
                                            )}
                                            <div className="text-4xl mb-2">{item.emoji}</div>
                                            <div className="text-xs font-bold text-slate-700 h-8 flex items-center justify-center">{item.name}</div>
                                            {owned ? (
                                                <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Posseduto</span>
                                            ) : (
                                                <button
                                                    onClick={() => onBuy(item)}
                                                    disabled={wallet.money < item.price || locked}
                                                    className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${wallet.money >= item.price && !locked ? 'bg-emerald-500 text-white shadow-md active:scale-95' : 'bg-slate-200 text-slate-400'}`}
                                                >
                                                    {item.price} <Coins size={10} className="fill-current" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ShopModal;
