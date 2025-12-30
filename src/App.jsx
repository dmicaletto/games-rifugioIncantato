import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Billboard } from '@react-three/drei';
import { Heart, Smile, Star, Utensils, Gamepad2, User, Activity, Sparkles, Zap, Volume2, VolumeX, ShoppingBag, Store, Coins, Download, Rotate3d, RefreshCw } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// --- CONFIGURAZIONE SISTEMA ---
const REPO_BASE = '/games-rifugioIncantato';
// Recupera la versione definita in vite.config.js o usa default
const APP_VERSION = import.meta.env.PACKAGE_VERSION || '1.0.0';

// Inizializzazione Firebase sicura
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

let auth = null;
let db = null;

if (firebaseConfig) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Errore inizializzazione Firebase:", e);
  }
} else {
  console.warn("Configurazione Firebase non trovata.");
}

// --- DATABASE OGGETTI GIOCO ---
const FOOD_ITEMS = [
  { name: "Mela Rossa", emoji: "🍎", value: 15 },
  { name: "Hamburger", emoji: "🍔", value: 35 },
  { name: "Pizza", emoji: "🍕", value: 30 },
  { name: "Gelato", emoji: "🍦", value: 20 },
  { name: "Carota", emoji: "🥕", value: 10 },
  { name: "Sushi", emoji: "🍣", value: 25 },
  { name: "Ciambella", emoji: "🍩", value: 15 },
];

const TOYS = [
  { name: "Pallone", emoji: "⚽" },
  { name: "Videogioco", emoji: "🎮" },
  { name: "Aquilone", emoji: "🪁" },
];

const MEDICINES = [
  { name: "Sciroppo", emoji: "🧪" },
  { name: "Cerotto", emoji: "🩹" },
  { name: "Pillola Magica", emoji: "💊" },
];

// --- DATABASE NEGOZIO (Coordinate 3D: x, y, z) ---
const MARKET_ITEMS = {
  decor: [
    { id: 'rug_rainbow', name: "Tappeto", emoji: "🌈", price: 150, type: 'rug', pos: [0, 0.05, 0], scale: 3, isFlat: true },
    { id: 'plant', name: "Pianta", emoji: "🪴", price: 80, type: 'plant', pos: [-3, 0.8, -3], scale: 2 },
    { id: 'lamp', name: "Lampada", emoji: "🌟", price: 120, type: 'lamp', pos: [3, 2, -3.5], scale: 1.5 },
    { id: 'bed', name: "Letto", emoji: "🛏️", price: 300, type: 'bed', pos: [2.5, 0.8, -2], scale: 2.5 },
    { id: 'pic', name: "Quadro", emoji: "🖼️", price: 90, type: 'wall', pos: [-2, 3, -4.9], scale: 2, isWall: true },
    { id: 'clock', name: "Orologio", emoji: "⏰", price: 60, type: 'clock', pos: [2, 3.5, -4.9], scale: 1.2, isWall: true }
  ],
  toys: [
    { id: 'robot', name: "Robot", emoji: "🤖", price: 100, type: 'toy', pos: [-2, 0.6, 2], scale: 1.5 },
    { id: 'bear', name: "Orsetto", emoji: "🧸", price: 75, type: 'toy', pos: [2, 0.5, 2], scale: 1.5 },
    { id: 'car', name: "Auto", emoji: "🏎️", price: 85, type: 'toy', pos: [0, 0.4, 3], scale: 1.2 }
  ]
};

// --- LOGICA DI GIOCO STANDARD ---
const INITIAL_GAME_STATE = {
  user: { name: "Piccola Maga" },
  levelSystem: { level: 1, currentStars: 0, nextLevelStars: 50 },
  pet: {
    name: "Batuffolo",
    type: "fox", 
    stats: { health: 80, hunger: 60, happiness: 90 },
    status: "normal",
    lastLogin: new Date().toISOString()
  },
  wallet: { money: 150 },
  difficulty: { mathLevel: 1, streak: 0 },
  inventory: [], 
  decor: {} 
};

// --- MOTORE AI ---
class GeminiTutor {
  constructor() { 
    this.history = []; 
    this.apiKey = null;
  }

  setApiKey(key) {
    this.apiKey = key;
    console.log("Gemini AI attivata! 🧠");
  }

  recordAnswer(type, problem, isCorrect, timeTaken) { 
    this.history.push({ type, problem, isCorrect, timeTaken });
    if (this.history.length > 20) this.history.shift(); 
  }

  async evaluateLevel(currentLevel) { 
    if (this.apiKey) {
      // TODO: Implementare chiamata reale a Gemini
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

const PET_PHRASES = {
  hungry: ["Pancino vuoto...", "Ho fame!", "Cibo?"],
  bored: ["Che noia...", "Giochiamo?", "Uffa..."],
  sick: ["Non sto bene...", "Aiuto...", "Gulp..."],
  happy: ["Sei mitica!", "Ti voglio bene!", "Evviva!"],
  sleepy: ["Zzz...", "Nanna..."],
  intro: ["Ciao!", "Eccomi!"]
};

// --- SCENA 3D ---
const Room3D = ({ decor, petEmoji }) => {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#e0c097" />
      </mesh>
      <gridHelper args={[10, 10, 0xc0a077, 0xc0a077]} position={[0, 0.01, 0]} />

      <mesh position={[0, 2.5, -5]}> <boxGeometry args={[10, 5, 0.1]} /> <meshStandardMaterial color="#c7d2fe" /> </mesh>
      <mesh position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}> <boxGeometry args={[10, 5, 0.1]} /> <meshStandardMaterial color="#a5b4fc" /> </mesh>
      <mesh position={[5, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}> <boxGeometry args={[10, 5, 0.1]} /> <meshStandardMaterial color="#a5b4fc" /> </mesh>

      <Billboard position={[0, 1, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
        <Html transform center pointerEvents="none" zIndexRange={[100, 0]}>
          <div className="text-[100px] drop-shadow-2xl animate-bounce-slow select-none filter drop-shadow-lg">
            {petEmoji}
          </div>
        </Html>
      </Billboard>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.8, 32]} />
        <meshBasicMaterial color="black" opacity={0.2} transparent />
      </mesh>

      {Object.values(decor).map((item) => {
        if (item.isFlat) { 
          return (
            <group key={item.id} position={item.pos} rotation={[-Math.PI/2, 0, 0]}>
               <Html transform center pointerEvents="none" zIndexRange={[0, 0]}>
                 <div style={{ fontSize: `${item.scale * 40}px`, opacity: 0.9 }}>{item.emoji}</div>
               </Html>
            </group>
          );
        }
        if (item.isWall) { 
           return (
            <group key={item.id} position={item.pos}>
               <Html transform center pointerEvents="none">
                 <div style={{ fontSize: `${item.scale * 30}px` }}>{item.emoji}</div>
               </Html>
            </group>
           );
        }
        return ( 
          <Billboard key={item.id} position={item.pos} follow={true}>
            <Html transform center pointerEvents="none">
              <div style={{ fontSize: `${item.scale * 40}px`, filter: 'drop-shadow(0 10px 5px rgba(0,0,0,0.3))' }}>
                {item.emoji}
              </div>
            </Html>
          </Billboard>
        );
      })}
    </>
  );
};

// --- COMPONENTI UI 2D ---
const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/30 backdrop-blur-md border border-white/50 shadow-xl rounded-3xl ${className}`}>
    {children}
  </div>
);

const StatBar = ({ value, max = 100, color, icon: Icon, label }) => (
  <div className="flex flex-col w-full mb-2">
    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/90 mb-0.5">
      <span className="flex items-center gap-1"><Icon size={10} className="text-white" /> {label}</span>
    </div>
    <div className="h-3 w-full bg-black/20 rounded-full border border-white/30 relative overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ease-out ${color}`} style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
    </div>
  </div>
);

const LevelBar = ({ current, max }) => (
  <div className="w-full mt-1">
    <div className="h-1.5 w-full bg-indigo-900/20 rounded-full overflow-hidden">
      <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (current / max) * 100)}%` }} />
    </div>
  </div>
);

const ActionButton = ({ icon: Icon, label, color, gradient, onClick, disabled, urgent }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`relative flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-300 transform active:scale-95 
    ${disabled ? 'opacity-50 grayscale bg-white/10' : `${gradient} shadow-lg`}
    ${urgent ? 'animate-pulse ring-4 ring-rose-400' : ''}`}
    style={{ minHeight: '90px' }}
  >
    <Icon size={28} className="text-white drop-shadow-md mb-1" />
    <span className="font-bold text-xs text-white drop-shadow-md">{label}</span>
  </button>
);

// --- MODALI ---
const ShopModal = ({ isOpen, onClose, wallet, inventory, onBuy }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{zIndex: 200}}>
      <div className="bg-white rounded-3xl w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl border-4 border-white">
        <div className="bg-indigo-100 p-4 flex justify-between items-center">
          <h3 className="text-xl font-black text-indigo-900 flex items-center gap-2"><Store size={24}/> Market</h3>
          <div className="bg-white px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
            <Coins size={16} className="text-emerald-600" />
            <span className="font-bold text-emerald-800">{Math.floor(wallet.money)}</span>
          </div>
          <button onClick={onClose} className="font-bold text-slate-400 p-2">X</button>
        </div>
        <div className="overflow-y-auto p-4 flex-1">
          {['decor', 'toys'].map(cat => (
            <div key={cat}>
              <h4 className="font-bold text-slate-500 mb-2 uppercase text-xs tracking-wider mt-2">{cat === 'decor' ? 'Arredamento' : 'Giochi'}</h4>
              <div className="grid grid-cols-2 gap-3">
                {MARKET_ITEMS[cat].map(item => {
                  const owned = inventory.includes(item.id);
                  return (
                    <div key={item.id} className={`p-3 rounded-xl border-2 flex flex-col items-center text-center ${owned ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}>
                      <div className="text-4xl mb-2">{item.emoji}</div>
                      <div className="text-xs font-bold text-slate-700 h-8 flex items-center justify-center">{item.name}</div>
                      {owned ? (
                        <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Posseduto</span>
                      ) : (
                        <button onClick={() => onBuy(item)} disabled={wallet.money < item.price} className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${wallet.money >= item.price ? 'bg-emerald-500 text-white shadow-md active:scale-95' : 'bg-slate-200 text-slate-400'}`}>
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

const MathModal = ({ isOpen, type, rewardItem, onClose, onSuccess }) => {
  const [problem, setProblem] = useState(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const startTime = useRef(Date.now());
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      let n1 = Math.floor(Math.random()*10)+1; let n2 = Math.floor(Math.random()*10)+1;
      setProblem({ text: `${n1} + ${n2}`, result: n1+n2 });
      setAnswer(""); setFeedback(null); startTime.current = Date.now();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const checkAnswer = () => {
    if(parseInt(answer) === problem.result) {
      setFeedback('correct');
      const time = (Date.now() - startTime.current) / 1000;
      setTimeout(() => { onSuccess(type, time); onClose(); }, 800);
    } else {
      setFeedback('wrong'); setAnswer("");
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  if (!isOpen || !problem) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{zIndex: 200}}>
      <div className={`bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl transform transition-all ${feedback === 'wrong' ? 'animate-shake border-4 border-red-300' : 'border-4 border-white'}`}>
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-indigo-900">Risolvi per {rewardItem?.emoji}</h3>
        </div>
        <div className="bg-indigo-50 rounded-2xl p-6 mb-6 text-center border-2 border-indigo-100">
          <span className="text-5xl font-black text-indigo-600">{problem.text}</span>
        </div>
        
        <div className="flex gap-2 w-full">
          <input 
            ref={inputRef} type="tel" value={answer} 
            onChange={e=>setAnswer(e.target.value)} 
            className="flex-1 min-w-0 text-center text-3xl font-black py-3 rounded-2xl border-4 border-indigo-100 outline-none text-indigo-900" 
            placeholder="?" 
          />
          <button onClick={checkAnswer} className="bg-green-500 text-white rounded-2xl px-6 font-bold shadow-lg shrink-0">OK</button>
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPALE ---

export default function App() {
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE);
  const [activeModal, setActiveModal] = useState(null);
  const [currentReward, setCurrentReward] = useState(null);
  const [petThought, setPetThought] = useState("Ciao!");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [user, setUser] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false); 

  // --- INIT FIREBASE E CARICAMENTO ---
  useEffect(() => {
    if (auth) {
      const initAuth = async () => {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      };
      initAuth();
      const unsubscribe = onAuthStateChanged(auth, setUser);
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (!db || !user) return;
    const fetchSecrets = async () => {
      try {
        const secretRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'secrets');
        const secretSnap = await getDoc(secretRef);
        if (secretSnap.exists() && secretSnap.data().gemini_key) {
             aiTutor.setApiKey(secretSnap.data().gemini_key);
        }
      } catch (e) { console.error(e); }
    };
    fetchSecrets();
  }, [user]);

  // --- CONTROLLO VERSIONE ---
  const checkVersion = async () => {
    try {
      const response = await fetch(`${REPO_BASE}/version.json?t=${new Date().getTime()}`);
      if (!response.ok) return;
      const data = await response.json();
      console.log(`App: ${APP_VERSION}, Server: ${data.version}`);
      if (data.version !== APP_VERSION) setUpdateAvailable(true);
    } catch (e) { console.log(e); }
  };

  useEffect(() => {
    const saved = localStorage.getItem('rifugio_v6_three');
    if (saved) { try { setGameState(prev => ({...prev, ...JSON.parse(saved)})); } catch(e){} }
    
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); });
    
    checkVersion();
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === 'visible') checkVersion(); });

    if ('serviceWorker' in navigator) navigator.serviceWorker.register(`${REPO_BASE}/sw.js`).catch(() => {});
  }, []);

  useEffect(() => { localStorage.setItem('rifugio_v6_three', JSON.stringify(gameState)); }, [gameState]);

  // --- AGGIORNAMENTO ---
  const handleUpdateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) registration.unregister();
        window.location.reload(true);
      });
    } else window.location.reload(true);
  };

  // TTS
  const speak = useCallback((text) => {
    if (isMuted || !text || typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT'; utterance.pitch = 1.4; utterance.rate = 1.1;  
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  // Pensieri
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeModal) return;
      const mood = gameState.pet.stats.health < 40 ? 'sick' : gameState.pet.stats.hunger < 40 ? 'hungry' : 'happy';
      const phrases = PET_PHRASES[mood];
      const txt = phrases[Math.floor(Math.random() * phrases.length)];
      setPetThought(txt);
      speak(txt);
      setTimeout(() => setPetThought(null), 4000);
    }, 15000);
    return () => clearInterval(interval);
  }, [gameState.pet, activeModal, speak]);

  const handleBuy = (item) => {
    if (gameState.wallet.money >= item.price) {
      setGameState(prev => {
        const newDecor = { ...prev.decor };
        newDecor[item.type] = item; 
        return { ...prev, wallet: { money: prev.wallet.money - item.price }, inventory: [...prev.inventory, item.id], decor: newDecor };
      });
      setPetThought("Che bello!");
      speak("Wow, grazie!");
    }
  };

  const startAction = (type) => {
    let reward = type === 'food' ? FOOD_ITEMS[0] : type === 'play' ? TOYS[0] : MEDICINES[0];
    setCurrentReward(reward);
    setActiveModal(type);
  };

  const handleSuccess = (type, time) => {
    setGameState(prev => {
      const s = { ...prev.pet.stats };
      if(type==='food') s.hunger=Math.min(100,s.hunger+20);
      else if(type==='play') s.happiness=Math.min(100,s.happiness+20);
      else s.health=Math.min(100,s.health+20);
      let earnedMoney = time < 5 ? 20 : 10;
      return { ...prev, wallet: { money: prev.wallet.money + earnedMoney }, pet: { ...prev.pet, stats: s }, levelSystem: { ...prev.levelSystem, currentStars: prev.levelSystem.currentStars + 10 } };
    });
    setPetThought("Evviva!");
    speak("Evviva!");
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  const isRunaway = gameState.pet.status === 'runaway';

  return (
    <div className="fixed inset-0 bg-slate-900 font-sans text-slate-800 flex flex-col overflow-hidden select-none">
      
      {/* 3D LAYER */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 5, 8], fov: 50 }}>
          <OrbitControls 
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 2 - 0.1} // Stop floor
            maxDistance={15} 
            minDistance={5} 
            enablePan={false} // Evita di trascinare via la stanza
          />
          {!isRunaway && (
            <Room3D 
              decor={gameState.decor} 
              petEmoji={gameState.pet.stats.health < 30 ? "🤒" : "🦊"} 
              petStatus={gameState.pet.status} 
            />
          )}
        </Canvas>
      </div>

      {/* UI LAYER */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pb-6 z-10">
        
        {/* TOP BAR */}
        <div className="px-4 py-4 flex justify-between items-start pointer-events-auto">
          <GlassCard className="flex items-center gap-3 px-4 py-2 rounded-2xl !border-white/40 min-w-[140px]">
            <div className="bg-indigo-100 p-1.5 rounded-full"><User size={16} className="text-indigo-600"/></div>
            <div className="flex flex-col w-full">
              <span className="font-bold text-sm text-indigo-900">{gameState.user.name}</span>
              <LevelBar current={gameState.levelSystem.currentStars} max={gameState.levelSystem.nextLevelStars} />
            </div>
          </GlassCard>

          <div className="flex gap-2">
            {/* TASTO AGGIORNA APP */}
            {updateAvailable && (
              <button 
                onClick={handleUpdateApp} 
                className="p-3 rounded-full bg-green-500 text-white shadow-lg animate-pulse transition active:scale-95"
              >
                <RefreshCw size={20} className="animate-spin" />
              </button>
            )}

            {deferredPrompt && (
              <button onClick={handleInstallClick} className="p-3 rounded-full bg-indigo-600 text-white shadow-lg animate-pulse active:scale-95">
                <Download size={20} />
              </button>
            )}
            <button onClick={() => setIsMuted(!isMuted)} className="p-3 rounded-full bg-white/20 backdrop-blur border border-white/30 shadow-lg text-white hover:bg-white/30 transition active:scale-95">
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <GlassCard className="flex items-center gap-2 px-3 py-2 rounded-full !bg-emerald-500/80 !border-emerald-300 shadow-lg">
              <Coins size={18} className="text-emerald-200 fill-white"/>
              <span className="font-black text-white text-md">{Math.floor(gameState.wallet.money)}</span>
            </GlassCard>
          </div>
        </div>

        {/* FUMETTO */}
        <div className="relative w-full flex justify-center pointer-events-none">
           {!isRunaway && petThought && (
             <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl rounded-bl-none shadow-lg mb-4 animate-bounce-in border border-indigo-100">
               <p className="font-bold text-indigo-900 text-sm">{petThought}</p>
             </div>
           )}
        </div>

        {/* CONTROLLI INFERIORI */}
        <div className="px-4 pointer-events-auto">
          <div className="flex justify-end mb-4">
             <button onClick={() => setActiveModal('shop')} className="bg-white p-3 rounded-full shadow-xl border-4 border-emerald-300 text-emerald-600 active:scale-95 animate-bounce-in">
                <ShoppingBag size={24} />
             </button>
          </div>
          <GlassCard className="p-4 rounded-3xl !bg-white/60">
            <div className="grid grid-cols-3 gap-2 mb-4">
              <StatBar value={gameState.pet.stats.health} color="bg-rose-500" icon={Heart} label="Vita" />
              <StatBar value={gameState.pet.stats.hunger} color="bg-amber-500" icon={Utensils} label="Cibo" />
              <StatBar value={gameState.pet.stats.happiness} color="bg-sky-500" icon={Smile} label="Gioco" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <ActionButton label="Mangia" icon={Utensils} gradient="bg-gradient-to-br from-amber-400 to-orange-500" onClick={() => startAction('food')} />
              <ActionButton label="Gioca" icon={Gamepad2} gradient="bg-gradient-to-br from-sky-400 to-blue-500" onClick={() => startAction('play')} />
              <ActionButton label="Cura" icon={Activity} gradient="bg-gradient-to-br from-rose-400 to-red-600" onClick={() => startAction('heal')} />
            </div>
          </GlassCard>
        </div>
        
        {/* Versione App (Discreta) */}
        <div className="absolute bottom-1 right-2 text-[8px] text-white/20 pointer-events-none">
          v{APP_VERSION}
        </div>
      </div>

      <MathModal isOpen={!!activeModal && activeModal !== 'shop'} type={activeModal} rewardItem={currentReward} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
      <ShopModal isOpen={activeModal === 'shop'} onClose={() => setActiveModal(null)} wallet={gameState.wallet} inventory={gameState.inventory} onBuy={handleBuy} />
      
      <div className="absolute bottom-1/2 w-full text-center text-white/30 text-xs font-bold pointer-events-none animate-pulse">
        <Rotate3d className="inline mr-1"/> Ruota con il dito
      </div>
    </div>
  );
}
