import React, { useState, useEffect, useRef } from 'react';
import { User, X, GraduationCap, School, Sparkles } from 'lucide-react';

const AVATAR_OPTIONS = [
    { id: 'girl1', emoji: '👧' }, { id: 'boy1', emoji: '👦' },
    { id: 'witch', emoji: '🧙‍♀️' }, { id: 'wizard', emoji: '🧙‍♂️' },
    { id: 'fairy', emoji: '🧚‍♀️' }, { id: 'elf', emoji: '🧝‍♀️' },
    { id: 'hero', emoji: '🦸‍♀️' }, { id: 'ninja', emoji: '🥷' },
    { id: 'cat', emoji: '🐱' }, { id: 'dog', emoji: '🐶' },
    { id: 'rabbit', emoji: '🐰' }, { id: 'bear', emoji: '🐻' }
];

const ProfileModal = ({ isOpen, onClose, userInfo, onSave }) => {
    const [data, setData] = useState(userInfo);
    const isOpening = useRef(false);

    useEffect(() => {
        if (isOpen && !isOpening.current) {
            setData(userInfo);
            isOpening.current = true;
        }
        if (!isOpen) isOpening.current = false;
    }, [isOpen, userInfo]);

    if (!isOpen) return null;

    const inputClasses = "w-full p-2.5 rounded-xl border-2 border-indigo-50 font-bold text-indigo-900 bg-indigo-50/30 focus:border-indigo-200 outline-none transition-colors text-sm";
    const labelClasses = "text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block ml-1";

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative border-4 border-white overflow-hidden max-h-[95vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-red-400 transition-colors z-10"><X size={24} /></button>

                <h3 className="text-2xl font-black text-indigo-900 mb-6 flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-2xl text-white shadow-lg shadow-indigo-200"><User size={20} /></div>
                    Profilo Magico
                </h3>

                <div className="flex flex-col items-center mb-8">
                    <div className="w-28 h-28 rounded-full border-4 border-indigo-100 bg-indigo-50 flex items-center justify-center text-6xl shadow-inner mb-4">
                        {data.avatarEmoji || "👤"}
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        {AVATAR_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setData({ ...data, avatarEmoji: opt.emoji })}
                                className={`w-12 h-12 flex items-center justify-center text-3xl rounded-xl border-2 transition-all ${data.avatarEmoji === opt.emoji ? 'border-indigo-500 bg-indigo-50 scale-110 shadow-md' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}
                            >
                                {opt.emoji}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] font-black text-indigo-400 mt-4 uppercase tracking-widest">Scegli il tuo Personaggio</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className={labelClasses}>Nickname</label>
                        <input
                            type="text"
                            value={data.nickname || ""}
                            onChange={e => setData({ ...data, nickname: e.target.value })}
                            className={`${inputClasses} text-lg border-indigo-100 bg-white`}
                            placeholder="Il tuo soprannome"
                        />
                    </div>

                    <div><label className={labelClasses}>Età</label><input type="number" value={data.age || ""} onChange={e => setData({ ...data, age: parseInt(e.target.value) })} className={inputClasses} /></div>
                    <div><label className={labelClasses}>Classe</label><input type="text" value={data.class || ""} onChange={e => setData({ ...data, class: e.target.value })} className={inputClasses} /></div>
                    <div className="col-span-2"><label className={labelClasses}>Scuola</label><input type="text" value={data.school || ""} onChange={e => setData({ ...data, school: e.target.value })} className={inputClasses} /></div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-bold hover:text-red-400 transition-colors">Annulla</button>
                    <button
                        onClick={() => { onSave(data); onClose(); }}
                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-[1.25rem] font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-widest text-sm"
                    >
                        Salva
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
