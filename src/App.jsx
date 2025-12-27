import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Smile, Star, Utensils, Gamepad2, User, Activity, Sparkles, AlertCircle, Zap, Volume2, VolumeX } from 'lucide-react';

// --- CONFIGURAZIONE SISTEMA ---
const USE_REAL_AI = false; 
const GOOGLE_API_KEY = ""; 

// --- MOTORE AI (GEMINI) ---
class GeminiTutor {
  constructor() {
    this.history = []; 
  }

  recordAnswer(type, problem, isCorrect, timeTaken) {
    this.history.push({ type, problem, isCorrect, timeTaken });
    if (this.history.length > 20) this.history.shift(); 
  }

  async evaluateLevel(currentLevel) {
    if (USE_REAL_AI && GOOGLE_API_KEY) {
      console.log("Chiamata a Gemini in corso..."); 
    }
    const recent = this.history.slice(-5);
    if (recent.length < 5) return currentLevel;

    const correctCount = recent.filter(h => h.isCorrect).length;
    if (correctCount <= 1) return Math.max(1, currentLevel - 1);
    if (correctCount === 5) return Math.min(10, currentLevel + 1);

    return currentLevel;
  }
}

const aiTutor = new GeminiTutor();

// --- LISTA FRASI DEL PET ---
const PET_PHRASES = {
  hungry: ["Il mio pancino brontola... 🍎", "Ho una fame da lupo!", "Sento profumo di biscotti?", "Possiamo mangiare? 🥺"],
  bored: ["Che noia...", "Contiamo le nuvole?", "Voglio fare una magia!", "Giochiamo a qualcosa?"],
  sick: ["Mi gira la testa... 🤒", "Non mi sento molto bene...", "Ho bisogno di una medicina...", "Abbracciami..."],
  happy: ["Sei la migliore maga del mondo! ✨", "Ti voglio bene!", "Che bella giornata!", "Yuppii!!"],
  sleepy: ["Che sonno...", "Zzz...", "Voglio la mia copertina..."],
  intro: ["Ciao! Sono pronto a giocare!", "Bentornata a casa!"]
};

// --- STATI INIZIALI ---
const INITIAL_GAME_STATE = {
  user: { name: "Piccola Maga", level: 1 },
  pet: {
    name: "Batuffolo",
    type: "fox", 
    stats: { health: 80, hunger: 60, happiness: 90 },
    status: "normal",
    lastLogin: new Date().toISOString()
  },
  wallet: { stars: 50 },
  difficulty: { mathLevel: 1, streak: 0 }
};

// --- COMPONENTI GRAFICI AVANZATI ---

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/30 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl ${className}`}>
    {children}
  </div>
);

const StatBar = ({ value, max = 100, color, icon: Icon, label }) => (
  <div className="flex flex-col w-full mb-3 group">
    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-white/80 mb-1 drop-shadow-md">
      <span className="flex items-center gap-1"><Icon size={12} className="text-white" /> {label}</span>
    </div>
    <div className="h-5 w-full bg-black/20 rounded-full border border-white/30 relative overflow-hidden backdrop-blur-sm">
      <div 
        className={`h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(255,255,255,0.5)] ${color}`}
        style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }}
      >
        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30"></div>
      </div>
    </div>
  </div>
);

const ActionButton = ({ icon: Icon, label, color, gradient, onClick, disabled, urgent }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`
      relative flex flex-col items-center justify-center py-4 rounded-2xl transition-all duration-300 transform
      ${disabled ? 'opacity-50 grayscale cursor-not-allowed bg-white/10' : `${gradient} shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:scale-105 active:scale-95`}
      ${urgent ? 'animate-pulse ring-4 ring-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.6)]' : ''}
    `}
    style={{ minHeight: '110px' }}
  >
    <div className={`p-3 rounded-full bg-white/20 backdrop-blur-md mb-2 shadow-inner ${urgent ? 'animate-bounce' : ''}`}>
      <Icon size={32} strokeWidth={2.5} className="text-white drop-shadow-md" />
    </div>
    <span className="font-bold text-lg text-white drop-shadow-md tracking-wide">{label}</span>
  </button>
);

const Bubble = ({ text }) => {
  if (!text) return null;
  return (
    <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 z-20 w-64">
      <div className="bg-white text-slate-800 p-4 rounded-2xl rounded-bl-none shadow-2xl border-2 border-indigo-100 animate-bounce-in relative">
        <p className="font-bold text-center text-sm leading-tight">{text}</p>
        <div className="absolute -bottom-3 left-6 w-0 h-0 border-l-[10px] border-l-transparent border-t-[15px] border-t-white border-r-[10px] border-r-transparent filter drop-shadow-sm"></div>
      </div>
    </div>
  );
};

// --- MODALE MATEMATICA ---
const MathModal = ({ isOpen, type, difficultyLevel, onClose, onSuccess }) => {
  const [problem, setProblem] = useState(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const startTime = useRef(Date.now());
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      generateProblem();
      setAnswer("");
      setFeedback(null);
      startTime.current = Date.now();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const generateProblem = () => {
    let n1, n2, operator, result;
    const level = difficultyLevel;

    if (level === 1) { n1 = rnd(1, 10); n2 = rnd(1, 10); operator = '+'; result = n1 + n2; }
    else if (level === 2) { n1 = rnd(5, 15); n2 = rnd(1, n1); operator = '-'; result = n1 - n2; }
    else if (level <= 4) { n1 = rnd(10, 50); n2 = rnd(5, 20); operator = '+'; result = n1 + n2; }
    else if (level <= 6) { n1 = [2, 5, 10][rnd(0, 2)]; n2 = rnd(1, 10); operator = '×'; result = n1 * n2; }
    else if (level <= 8) { n1 = rnd(3, 9); n2 = rnd(3, 9); operator = '×'; result = n1 * n2; }
    else { n2 = rnd(2, 9); result = rnd(2, 9); n1 = n2 * result; operator = ':'; }
    
    setProblem({ text: `${n1} ${operator} ${n2}`, result });
  };

  const checkAnswer = async () => {
    if (!answer) return;
    const val = parseInt(answer);
    const timeTaken = (Date.now() - startTime.current) / 1000;
    const isCorrect = val === problem.result;

    aiTutor.recordAnswer(type, problem.text, isCorrect, timeTaken);

    if (isCorrect) {
      setFeedback('correct');
      setTimeout(() => { onSuccess(type); onClose(); }, 800);
    } else {
      setFeedback('wrong');
      setAnswer(""); 
      inputRef.current?.focus();
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  if (!isOpen || !problem) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl transform transition-all ${feedback === 'wrong' ? 'animate-shake border-4 border-red-300' : 'border-4 border-white'}`}>
        <div className="text-center mb-6">
          <h3 className="text-2xl font-black text-indigo-900 mb-1">{type === 'heal' ? '🚑 AIUTO!' : '✨ MAGIA!'}</h3>
          <p className="text-indigo-400 font-bold">Risolvi per ottenere l'oggetto</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-8 mb-8 border-2 border-indigo-200 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10"><Sparkles size={60} /></div>
          <span className="text-6xl font-black text-indigo-600 tracking-widest font-mono drop-shadow-sm block">
            {problem.text}
          </span>
        </div>

        <div className="flex gap-3 mb-6">
          <input
            ref={inputRef}
            type="tel"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="flex-1 text-center text-4xl font-black py-4 rounded-2xl border-4 border-indigo-100 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none text-indigo-900 placeholder-indigo-200 transition-all bg-white shadow-sm"
            placeholder="?"
          />
          <button 
            onClick={checkAnswer}
            className="bg-gradient-to-b from-green-400 to-green-600 text-white rounded-2xl px-6 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <Zap size={32} fill="white" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPALE ---

export default function App() {
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE);
  const [activeModal, setActiveModal] = useState(null);
  const [message, setMessage] = useState(null);
  const [petThought, setPetThought] = useState("Ciao! Giochiamo?"); 
  const [isMuted, setIsMuted] = useState(false); // Stato Audio
  
  // --- FUNZIONE PARLATA (TTS) ---
  const speak = useCallback((text) => {
    if (isMuted || !text || typeof window === 'undefined') return;
    
    // Ferma eventuali frasi precedenti
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.pitch = 1.4; // Voce acuta (più "piccola/carina")
    utterance.rate = 1.1;  // Leggermente più veloce
    
    // Tenta di usare il motore Google se disponibile (spesso migliore su Android)
    const voices = window.speechSynthesis.getVoices();
    // Non forziamo troppo per evitare errori, il default va bene
    
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  // --- LOGICA DEL PENSIERO (Chatterbox + Voce) ---
  useEffect(() => {
    const thoughtInterval = setInterval(() => {
      if (activeModal) return;

      const { stats, status } = gameState.pet;
      let mood = 'happy';

      if (status === 'sick' || stats.health < 40) mood = 'sick';
      else if (stats.hunger < 40) mood = 'hungry';
      else if (stats.happiness < 40) mood = 'bored';
      else if (stats.happiness > 90 && Math.random() > 0.7) mood = 'sleepy';

      const phrases = PET_PHRASES[mood];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      
      setPetThought(randomPhrase);
      speak(randomPhrase); // <-- Parla qui

      setTimeout(() => setPetThought(null), 5000);
    }, 12000); 

    return () => clearInterval(thoughtInterval);
  }, [gameState.pet, activeModal, speak]);


  // --- CARICAMENTO & SALVATAGGIO ---
  useEffect(() => {
    const saved = localStorage.getItem('rifugio_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        const last = new Date(parsed.pet.lastLogin).getTime();
        const hoursPassed = (now - last) / (1000 * 60 * 60);
        
        if (hoursPassed > 1) {
          parsed.pet.stats.hunger = Math.max(0, parsed.pet.stats.hunger - (hoursPassed * 5));
          parsed.pet.stats.happiness = Math.max(0, parsed.pet.stats.happiness - (hoursPassed * 2));
          setMessage(`Mentre dormivi sono passate ${Math.floor(hoursPassed)} ore!`);
        }
        setGameState(parsed);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rifugio_v3', JSON.stringify({
      ...gameState,
      pet: { ...gameState.pet, lastLogin: new Date().toISOString() }
    }));
  }, [gameState]);

  // --- LOOP DI GIOCO ---
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => {
        if (prev.pet.status === 'runaway') return prev;
        const s = prev.pet.stats;
        const newStats = {
          health: Math.max(0, s.health - 0.04),
          hunger: Math.max(0, s.hunger - 0.1), 
          happiness: Math.max(0, s.happiness - 0.08)
        };
        let newStatus = 'normal';
        if (newStats.health <= 0 || newStats.hunger <= 0) newStatus = 'runaway';
        else if (newStats.health < 30) newStatus = 'sick';
        return { ...prev, pet: { ...prev.pet, stats: newStats, status: newStatus } };
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- AZIONI UTENTE ---
  const handleSuccess = async (type) => {
    let thought = "";
    setGameState(prev => {
      const s = { ...prev.pet.stats };
      let stars = 5;
      if (type === 'food') { s.hunger = Math.min(100, s.hunger + 30); stars = 5; thought = "Gnam gnam! Delizioso! 😋"; }
      if (type === 'play') { s.happiness = Math.min(100, s.happiness + 25); stars = 8; thought = "Che divertimento!! 🎉"; }
      if (type === 'heal') { s.health = Math.min(100, s.health + 20); stars = 15; thought = "Mi sento fortissimo! 💪"; }

      setPetThought(thought);
      // Non chiamiamo speak() qui direttamente perché lo faremo nel useEffect o subito sotto, 
      // ma setState è asincrono. Meglio chiamarlo direttamente.
      
      return {
        ...prev,
        wallet: { stars: prev.wallet.stars + stars },
        pet: { ...prev.pet, stats: s },
        difficulty: { ...prev.difficulty, streak: prev.difficulty.streak + 1 }
      };
    });
    
    speak(thought); // <-- Parla dopo azione corretta

    const newLevel = await aiTutor.evaluateLevel(gameState.difficulty.mathLevel);
    if (newLevel !== gameState.difficulty.mathLevel) {
      setGameState(prev => ({ ...prev, difficulty: { ...prev.difficulty, mathLevel: newLevel } }));
    }
  };

  const recoverPet = () => {
    if (gameState.wallet.stars >= 50) {
      setGameState(prev => ({
        ...prev,
        wallet: { stars: prev.wallet.stars - 50 },
        pet: { ...prev.pet, status: 'normal', stats: { health: 50, hunger: 50, happiness: 50 } }
      }));
      const text = "Sono tornato! Mi sei mancata! ❤️";
      setPetThought(text);
      speak(text);
    } else {
      const text = "Servono più stelle... 😢";
      setPetThought(text);
      speak(text);
    }
  };

  // --- RENDER ---
  const { pet, wallet } = gameState;
  const isRunaway = pet.status === 'runaway';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 font-sans text-slate-800 flex flex-col overflow-hidden relative">
      
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-yellow-300/20 rounded-full blur-3xl animate-pulse delay-700"></div>

      {/* TOP BAR */}
      <div className="px-4 py-4 z-10 flex justify-between items-start">
        <GlassCard className="flex items-center gap-3 px-4 py-2 rounded-full !border-white/40">
          <div className="bg-indigo-100 p-1.5 rounded-full border border-indigo-200">
            <User size={18} className="text-indigo-600"/>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-indigo-900 leading-none">{gameState.user.name}</span>
            <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Livello {gameState.difficulty.mathLevel}</span>
          </div>
        </GlassCard>

        <div className="flex gap-2">
          {/* Tasto Mute */}
          <button 
            onClick={() => setIsMuted(!isMuted)} 
            className="p-3 rounded-full bg-white/20 backdrop-blur border border-white/30 shadow-lg text-white hover:bg-white/30 transition active:scale-95"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          
          <GlassCard className="flex items-center gap-2 px-4 py-2 rounded-full !bg-amber-400/80 !border-amber-300 shadow-amber-500/30">
            <Star size={20} className="text-white fill-white animate-[spin_3s_linear_infinite]"/>
            <span className="font-black text-white text-lg drop-shadow-sm">{wallet.stars}</span>
          </GlassCard>
        </div>
      </div>

      {/* AREA CENTRALE PET */}
      <div className="flex-1 relative flex flex-col items-center justify-center pb-20">
        
        {message && (
          <div className="absolute top-0 z-50 bg-white/90 backdrop-blur text-indigo-900 px-6 py-3 rounded-full shadow-xl font-bold animate-bounce border-2 border-white">
            {message}
          </div>
        )}

        <div className="relative w-full flex justify-center">
          
          {!isRunaway && <Bubble text={petThought} />}

          <div 
            onClick={() => {
               const txt = "Ehi! Ciao! 👋"; 
               setPetThought(txt); 
               speak(txt);
            }} 
            className="relative z-10 transform transition duration-500 hover:scale-110 active:scale-95 cursor-pointer filter drop-shadow-2xl"
          >
             <div className="text-[160px] leading-none select-none animate-[bounce_3s_infinite]">
               {isRunaway ? "💨" : pet.status === 'sick' ? "🤒" : pet.stats.happiness > 80 ? "🦊" : "😿"}
             </div>
             <div className="w-32 h-4 bg-black/20 rounded-[100%] mx-auto mt-2 blur-sm"></div>
          </div>
        </div>

        {isRunaway && (
          <div className="mt-8 text-center px-8 w-full max-w-sm">
            <GlassCard className="p-6 text-center">
              <h3 className="text-xl font-bold text-indigo-900 mb-2">Oh no! Batuffolo è andato via!</h3>
              <p className="text-indigo-700 mb-6 text-sm">Era troppo triste o affamato. Vuoi provare a chiamarlo?</p>
              <button 
                onClick={recoverPet} 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Star size={18} className="fill-white" /> Richiama (50)
              </button>
            </GlassCard>
          </div>
        )}
      </div>

      {/* PANNELLO CONTROLLI INFERIORE */}
      {!isRunaway && (
        <div className="absolute bottom-0 w-full z-20">
          <div className="h-12 bg-gradient-to-t from-white/20 to-transparent w-full absolute -top-12 pointer-events-none"></div>
          
          <GlassCard className="rounded-b-none rounded-t-[2.5rem] p-6 pb-8 border-b-0 backdrop-blur-2xl bg-white/40 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
            
            <div className="grid grid-cols-3 gap-4 mb-6 px-2">
              <StatBar value={pet.stats.health} color="bg-rose-500" icon={Heart} label="Vita" />
              <StatBar value={pet.stats.hunger} color="bg-amber-500" icon={Utensils} label="Cibo" />
              <StatBar value={pet.stats.happiness} color="bg-sky-500" icon={Smile} label="Gioco" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <ActionButton 
                label="Mangia" 
                icon={Utensils} 
                gradient="bg-gradient-to-br from-amber-400 to-orange-500"
                onClick={() => setActiveModal('food')}
                disabled={pet.stats.hunger >= 100}
              />
              <ActionButton 
                label="Gioca" 
                icon={Gamepad2} 
                gradient="bg-gradient-to-br from-sky-400 to-blue-500"
                onClick={() => setActiveModal('play')}
                disabled={pet.stats.happiness >= 100}
              />
              <ActionButton 
                label="Cura" 
                icon={Activity} 
                gradient="bg-gradient-to-br from-rose-400 to-red-600"
                onClick={() => setActiveModal('heal')}
                disabled={pet.stats.health >= 100}
                urgent={pet.stats.health < 40}
              />
            </div>
          </GlassCard>
        </div>
      )}

      <MathModal 
        isOpen={!!activeModal} 
        type={activeModal}
        difficultyLevel={gameState.difficulty.mathLevel}
        onClose={() => setActiveModal(null)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
