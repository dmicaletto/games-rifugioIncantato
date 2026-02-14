import React from 'react';
import { Map as MapIcon, X, Lock } from 'lucide-react';

const MapModal = ({ isOpen, onClose, currentEnv, unlockedPets, onTravel, userAvatar }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-6" style={{ zIndex: 300 }}>
            <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl relative border-4 border-white">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><X /></button>
                <h3 className="text-2xl font-black text-center text-indigo-900 mb-6 flex justify-center items-center gap-2">
                    <MapIcon className="text-indigo-600" /> Il Regno
                </h3>

                <div className="space-y-3">
                    {/* Opzione Speciale: AVATAR UTENTE */}
                    <div
                        onClick={() => onTravel('room', 'user')}
                        className={`p-4 rounded-2xl border-4 cursor-pointer transition-all flex items-center gap-4 ${currentEnv === 'room' && unlockedPets.includes('user') ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}
                    >
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl border-2 border-white shadow-sm">
                            {userAvatar?.avatarEmoji || "👤"}
                        </div>
                        <div>
                            <div className="font-black text-indigo-900">Io</div>
                            <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Esplora come te stesso</div>
                        </div>
                        {currentEnv === 'room' && <span className="ml-auto text-indigo-600 text-xs font-black">📍 QUI</span>}
                    </div>

                    <div className="h-px bg-slate-100 my-2"></div>

                    {/* Animali di default */}
                    <div
                        onClick={() => onTravel('room', 'fox')}
                        className={`p-4 rounded-2xl border-4 cursor-pointer transition-all flex items-center gap-4 ${currentEnv === 'room' ? 'border-amber-400 bg-amber-50' : 'border-slate-100 hover:border-amber-200'}`}
                    >
                        <div className="text-3xl">🦊</div>
                        <div>
                            <div className="font-black text-slate-800">Cameretta</div>
                            <div className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Casa di Batuffolo</div>
                        </div>
                        {currentEnv === 'room' && <span className="ml-auto text-amber-500 text-xs font-black">📍 QUI</span>}
                    </div>

                    <div
                        onClick={() => { if (unlockedPets.includes('dragon')) onTravel('forest', 'dragon'); }}
                        className={`p-4 rounded-2xl border-4 transition-all flex items-center gap-4 ${unlockedPets.includes('dragon') ? 'cursor-pointer border-emerald-500 bg-emerald-50' : 'border-slate-100 opacity-60 grayscale'}`}
                    >
                        <div className="text-3xl">🐲</div>
                        <div>
                            <div className="font-black text-slate-800">Foresta Incantata</div>
                            <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                                {unlockedPets.includes('dragon') ? "Casa di Scintilla" : "Sblocca al Lvl 5"}
                            </div>
                        </div>
                        {!unlockedPets.includes('dragon') && <Lock className="ml-auto text-slate-300" size={16} />}
                        {currentEnv === 'forest' && <span className="ml-auto text-emerald-500 text-xs font-black">📍 QUI</span>}
                    </div>

                    <div
                        onClick={() => { if (unlockedPets.includes('turtle')) onTravel('beach', 'turtle'); }}
                        className={`p-4 rounded-2xl border-4 transition-all flex items-center gap-4 ${unlockedPets.includes('turtle') ? 'cursor-pointer border-sky-500 bg-sky-50' : 'border-slate-100 opacity-60 grayscale'}`}
                    >
                        <div className="text-3xl">🐢</div>
                        <div>
                            <div className="font-black text-slate-800">Spiaggia Coralli</div>
                            <div className="text-[10px] text-sky-600 font-bold uppercase tracking-widest">
                                {unlockedPets.includes('turtle') ? "Casa di Guscio" : "Sblocca al Lvl 10"}
                            </div>
                        </div>
                        {!unlockedPets.includes('turtle') && <Lock className="ml-auto text-slate-300" size={16} />}
                        {currentEnv === 'beach' && <span className="ml-auto text-sky-500 text-xs font-black">📍 QUI</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapModal;
