import React, { useState } from 'react';
import { Mail, Lock, User, LogIn, X, ChevronRight } from 'lucide-react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile
} from "firebase/auth";
import { auth } from '../../services/firebase';

const LoginModal = ({ isOpen, onClose }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nickname, setNickname] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (isSignUp) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                if (nickname) {
                    await updateProfile(userCredential.user, { displayName: nickname });
                }
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message.includes('auth/invalid-credential') ? "Email o password errati" : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-md flex items-center justify-center z-[300] p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative border-4 border-indigo-50">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-red-400 transition-colors">
                    <X size={24} />
                </button>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-indigo-100 rotate-3">
                        <LogIn size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-indigo-900">
                        {isSignUp ? "Crea Account" : "Bentornato!"}
                    </h3>
                    <p className="text-slate-400 text-sm font-bold mt-1">
                        Salva i tuoi progressi nel regno
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && (
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={20} />
                            <input
                                type="text"
                                placeholder="Come ti chiami?"
                                value={nickname}
                                onChange={e => setNickname(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-indigo-50/50 border-2 border-transparent focus:border-indigo-200 rounded-2xl outline-none font-bold text-indigo-900 transition-all placeholder:text-indigo-200"
                                required
                            />
                        </div>
                    )}

                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={20} />
                        <input
                            type="email"
                            placeholder="La tua email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-indigo-50/50 border-2 border-transparent focus:border-indigo-200 rounded-2xl outline-none font-bold text-indigo-900 transition-all placeholder:text-indigo-200"
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={20} />
                        <input
                            type="password"
                            placeholder="La tua password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-indigo-50/50 border-2 border-transparent focus:border-indigo-200 rounded-2xl outline-none font-bold text-indigo-900 transition-all placeholder:text-indigo-200"
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-lg">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-50 transition-all"
                    >
                        {loading ? "Caricamento..." : (isSignUp ? "Inizia l'Avventura" : "Entra nel Rifugio")}
                        <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-indigo-400 font-bold text-sm hover:text-indigo-600 transition-colors"
                    >
                        {isSignUp ? "Hai già un account? Accedi" : "Nuova piccola maga? Crea account"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
