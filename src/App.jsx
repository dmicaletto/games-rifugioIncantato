import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Billboard } from '@react-three/drei';
import { Heart, Smile, Utensils, Gamepad2, User, Activity, Sparkles, Zap, Volume2, VolumeX, ShoppingBag, Store, Coins, Download, Rotate3d, RefreshCw, Map as MapIcon, Lock } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

// --- CONFIGURAZIONE SISTEMA ---
const REPO_BASE = '/games-rifugioIncantato';
// Versione fissata staticamente per compatibilità
const APP_VERSION = '1.1.0';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZp4rC_LYox1YlBW8eDqsycmqH08i4zP8",
  authDomain: "nutriai-f081c.firebaseapp.com",
  projectId: "nutriai-f081c",
  storageBucket: "nutriai-f081c.firebasestorage.app",
  messagingSenderId: "841982374698",
  appId: "1:841982374698:web:0289d0aac7d926b07ce453"
};
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
}

// --- COSTANTI GIOCO ---
const ENVIRONMENTS = {
  room: { 
    id: 'room', 
    name: "Cameretta", 
    colors: { floor: "#e0c097", wall: "#c7d2fe", bg: "bg-indigo-900" },
    gridColor: 0xc0a077
  },
  forest: { 
    id: 'forest', 
    name: "Foresta Incantata", 
    colors: { floor: "#4ade80", wall: "#7dd3fc", bg: "bg-emerald-900" }, // Pavimento erba, Muri cielo
    gridColor: 0x22c55e
  }
};

const PETS_INFO = {
  fox: { id: 'fox', name: "Batuffolo", emoji: "🦊", defaultEnv: 'room' },
  dragon: { id: 'dragon', name: "Scintilla", emoji: "🐲", defaultEnv: 'forest' }
};

// --- DATABASE OGGETTI ---
const FOOD_ITEMS = [
  { name: "Mela", emoji: "🍎", value: 15 },
  { name: "Burger", emoji: "🍔", value: 35 },
  { name: "Pizza", emoji: "🍕", value: 30 },
  { name: "Gelato", emoji: "🍦", value: 20 },
  { name: "Carota", emoji: "🥕", value: 10 },
  { name: "Sushi", emoji: "🍣", value: 25 },
  { name: "Dolce", emoji: "🍩", value: 15 },
];

const TOYS = [
  { name: "Palla", emoji: "⚽" },
  { name: "Game", emoji: "🎮" },
  { name: "Aquilone", emoji: "🪁" },
];

const MEDICINES = [
  { name: "Sciroppo", emoji: "🧪" },
  { name: "Cerotto", emoji: "🩹" },
  { name: "Magia", emoji: "💊" },
];

const MARKET_ITEMS = {
  decor: [
    // Livello Base
    { id: 'rug_rainbow', name: "Tappeto", emoji: "🌈", price: 150, type: 'rug', pos: [0, 0.05, 0], scale: 3, isFlat: true, levelReq: 1 },
    { id: 'plant', name: "Pianta", emoji: "🪴", price: 80, type: 'plant', pos: [-3, 0.8, -3], scale: 2, levelReq: 1 },
    { id: 'lamp', name: "Lampada", emoji: "🌟", price: 120, type: 'lamp', pos: [3, 2, -3.5], scale: 1.5, levelReq: 1 },
    // Livello Avanzato (Foresta/Lusso)
    { id: 'throne', name: "Trono", emoji: "👑", price: 500, type: 'chair', pos: [0, 1, -4], scale: 2.5, levelReq: 5 },
    { id: 'fountain', name: "Fontana", emoji: "⛲", price: 400, type: 'center', pos: [3, 1, 3], scale: 2.5, levelReq: 3 },
    { id: 'chest', name: "Tesoro", emoji: "💎", price: 250, type: 'storage', pos: [-3, 0.5, 3], scale: 1.5, levelReq: 2 },
    { id: 'tree_magic', name: "Albero", emoji: "🌳", price: 350, type: 'plant_big', pos: [-3, 2, -3], scale: 4, levelReq: 4 }
  ],
  toys: [
    { id: 'robot', name: "Robot", emoji: "🤖", price: 100, type: 'toy', pos: [-2, 0.6, 2], scale: 1.5, levelReq: 1 },
    { id: 'bear', name: "Orsetto", emoji: "🧸", price: 75, type: 'toy', pos: [2, 0.5, 2], scale: 1.5, levelReq: 1 },
    { id: 'car', name: "Auto", emoji: "🏎️", price: 85, type: 'toy', pos: [0, 0.4, 3], scale: 1.2, levelReq: 1 },
    { id: 'telescope', name: "Telescopio", emoji: "🔭", price: 200, type: 'toy_adv', pos: [0, 1, 4], scale: 2, levelReq: 3 }
  ]
};

// --- STATO INIZIALE AGGIORNATO ---
const INITIAL_GAME_STATE = {
  user: { name: "Piccola Maga" },
  levelSystem: { level: 1, currentStars: 0, nextLevelStars: 50 },
  wallet: { money: 100 },
  inventory: [],
  unlockedPets: ['fox'], // Lista ID pet sbloccati
  activePetId: 'fox',    // Pet attualmente visibile
  petsData: {            // Stato separato per ogni pet
    fox: { 
      stats: { health: 80, hunger: 60, happiness: 90 },
      status: "normal"
    },
    dragon: {
      stats: { health: 100, hunger: 100, happiness: 100 },
      status: "normal"
    }
  },
  decor: { // Decorazioni per ambiente
    room: {},
    forest: {}
  },
  lastLogin: new Date().toISOString()
};

// --- MOTORE AI ---
class GeminiTutor {
  constructor() { 
    this.history = []; 
    this.apiKey = null;
  }
  setApiKey(key) { this.apiKey = key; }
  recordAnswer(type, problem, isCorrect, timeTaken) { 
    this.history.push({ type, problem, isCorrect, timeTaken });
    if (this.history.length > 20) this.history.shift(); 
  }
  async evaluateLevel(currentLevel) { 
    const recent = this.history.slice(-5);
    if (recent.length < 5) return currentLevel;
    const correctCount = recent.filter(h => h.isCorrect).length;
    if (correctCount <= 1) return Math.max(1, currentLevel - 1);
    if (correctCount === 5) return Math.min(10, currentLevel + 1);
    return currentLevel;
  }
}
const aiTutor = new GeminiTutor();

// --- SCENA 3D ---
const Room3D = ({ decor, petEmoji, envId }) => {
  const env = ENVIRONMENTS[envId] || ENVIRONMENTS.room;
  
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      
      {/* PAVIMENTO */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color={env.colors.floor} />
      </mesh>
      <gridHelper args={[12, 12, env.gridColor, env.gridColor]} position={[0, 0.01, 0]} />

      {/* PARETI (Solo per Room, la Foresta è aperta) */}
      {envId === 'room' ? (
        <>
          <mesh position={[0, 3, -6]}> <boxGeometry args={[12, 6, 0.1]} /> <meshStandardMaterial color={env.colors.wall} /> </mesh>
          <mesh position={[-6, 3, 0]} rotation={[0, Math.PI / 2, 0]}> <boxGeometry args={[12, 6, 0.1]} /> <meshStandardMaterial color="#a5b4fc" /> </mesh>
          <mesh position={[6, 3, 0]} rotation={[0, -Math.PI / 2, 0]}> <boxGeometry args={[12, 6, 0.1]} /> <meshStandardMaterial color="#a5b4fc" /> </mesh>
        </>
      ) : (
        // Alberi di sfondo per la foresta
        <>
          <Billboard position={[-4, 2, -5]} scale={5}><Html pointerEvents="none"><div className="text-[100px]">🌲</div></Html></Billboard>
          <Billboard position={[4, 2, -5]} scale={5}><Html pointerEvents="none"><div className="text-[100px]">🌲</div></Html></Billboard>
          <Billboard position={[0, 2, -6]} scale={6}><Html pointerEvents="none"><div className="text-[100px]">🌳</div></Html></Billboard>
        </>
      )}

      {/* PET */}
      <Billboard position={[0, 1, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
        <Html transform center pointerEvents="none" zIndexRange={[100, 0]}>
          <div className="text-[120px] drop-shadow-2xl animate-bounce-slow select-none filter drop-shadow-lg transition-transform duration-500 hover:scale-110">
            {petEmoji}
          </div>
        </Html>
      </Billboard>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color="black" opacity={0.2} transparent />
      </mesh>

      {/* DECORAZIONI */}
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
        if (item.isWall && envId === 'room') { 
           return (
            <group key={item.id} position={item.pos}>
               <Html transform center pointerEvents="none">
                 <div style={{ fontSize: `${item.scale * 30}px` }}>{item.emoji}</div>
               </Html>
            </group>
           );
        }
        // Nella foresta niente oggetti a muro
        if (item.isWall && envId !== 'room') return null;

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

// --- UI COMPONENTS ---
const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/30 backdrop-blur-md border border-white/50 shadow-xl rounded-3xl ${className}`}>
    {children}
  </div>
);

const StatBar = ({ value, max = 100, color, icon: Icon, label }) => (
  <div className="flex flex-col w-full mb-1">
    <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-white/90">
      <span className="flex items-center gap-1"><Icon size={9} /> {label}</span>
    </div>
    <div className="h-2.5 w-full bg-black/20 rounded-full border border-white/30 relative overflow-hidden">
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

const ActionButton = ({ icon: Icon, label, color, gradient, onClick, disabled }) => (
  <button 
    onClick={onClick} disabled={disabled}
    className={`relative flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-300 transform active:scale-95 
    ${disabled ? 'opacity-50 grayscale bg-white/10' : `${gradient} shadow-lg`} `}
    style={{ minHeight: '80px' }}
  >
    <Icon size={24} className="text-white drop-shadow-md mb-1" />
    <span className="font-bold text-[10px] text-white drop-shadow-md">{label}</span>
  </button>
);

// --- MODALI ---
const ShopModal = ({ isOpen, onClose, wallet, inventory, onBuy, level }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{zIndex: 200}}>
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border-4 border-white">
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
                  const locked = level < (item.levelReq || 1);
                  return (
                    <div key={item.id} className={`p-3 rounded-xl border-2 flex flex-col items-center text-center relative ${owned ? 'bg-green-50 border-green-200' : locked ? 'bg-slate-100 border-slate-200' : 'bg-white border-slate-100'}`}>
                      {locked && <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl"><Lock className="text-slate-400"/> <span className="text-xs font-bold text-slate-500 ml-1">Liv {item.levelReq}</span></div>}
                      <div className="text-4xl mb-2">{item.emoji}</div>
                      <div className="text-xs font-bold text-slate-700 h-8 flex items-center justify-center">{item.name}</div>
                      {owned ? (
                        <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Posseduto</span>
                      ) : (
                        <button onClick={() => onBuy(item)} disabled={wallet.money < item.price || locked} className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${wallet.money >= item.price && !locked ? 'bg-emerald-500 text-white shadow-md active:scale-95' : 'bg-slate-200 text-slate-400'}`}>
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

// Modale Mappa per cambiare ambiente
const MapModal = ({ isOpen, onClose, currentEnv, unlockedPets, onTravel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-6" style={{zIndex: 200}}>
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="text-2xl font-black text-center text-indigo-900 mb-6 flex justify-center items-center gap-2">
          <MapIcon /> Mappa del Mondo
        </h3>
        <div className="space-y-4">
          <div 
            onClick={() => onTravel('room', 'fox')}
            className={`p-4 rounded-2xl border-4 cursor-pointer transition-all flex items-center gap-4 ${currentEnv === 'room' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
          >
            <div className="text-4xl">🦊</div>
            <div>
              <div className="font-bold text-lg text-indigo-900">Cameretta</div>
              <div className="text-xs text-indigo-500 font-semibold">Casa di Batuffolo</div>
            </div>
            {currentEnv === 'room' && <span className="ml-auto text-indigo-600 font-bold">📍 Qui</span>}
          </div>

          <div 
            onClick={() => {
              if (unlockedPets.includes('dragon')) onTravel('forest', 'dragon');
            }}
            className={`p-4 rounded-2xl border-4 transition-all flex items-center gap-4 ${unlockedPets.includes('dragon') ? 'cursor-pointer border-emerald-500 bg-emerald-50' : 'border-slate-200 opacity-60 grayscale'}`}
          >
            <div className="text-4xl">🐲</div>
            <div>
              <div className="font-bold text-lg text-emerald-900">Foresta Incantata</div>
              <div className="text-xs text-emerald-600 font-semibold">
                {unlockedPets.includes('dragon') ? "Casa di Scintilla" : "Sblocca al Livello 5"}
              </div>
            </div>
            {!unlockedPets.includes('dragon') && <Lock className="ml-auto text-slate-400" />}
            {currentEnv === 'forest' && <span className="ml-auto text-emerald-600 font-bold">📍 Qui</span>}
          </div>
        </div>
        <button onClick={onClose} className="mt-6 w-full py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Chiudi</button>
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
          <input ref={inputRef} type="tel" value={answer} onChange={e=>setAnswer(e.target.value)} className="flex-1 min-w-0 text-center text-3xl font-black py-3 rounded-2xl border-4 border-indigo-100 outline-none text-indigo-900" placeholder="?" />
          <button onClick={checkAnswer} className="bg-green-500 text-white rounded-2xl px-6 font-bold shadow-lg shrink-0">OK</button>
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPALE ---

export default function App() {
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE);
  const [activeModal, setActiveModal] = useState(null); // null, 'shop', 'map', 'food', etc.
  const [currentReward, setCurrentReward] = useState(null);
  const [petThought, setPetThought] = useState("Ciao!");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [user, setUser] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false); 

  // --- TTS FUNZIONALITÀ PARLATA (Spostata PRIMA degli handler) ---
  const speak = useCallback((text) => {
    if (isMuted || !text || typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT'; utterance.pitch = 1.4; utterance.rate = 1.1;  
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  const PET_PHRASES = {
    hungry: ["Pancino vuoto...", "Ho fame!", "Cibo?"],
    bored: ["Che noia...", "Giochiamo?", "Uffa..."],
    sick: ["Non sto bene...", "Aiuto...", "Gulp..."],
    happy: ["Sei mitica!", "Ti voglio bene!", "Evviva!"],
    sleepy: ["Zzz...", "Nanna..."],
    intro: ["Ciao!", "Eccomi!"]
  };

  // --- INIT FIREBASE E PERSISTENZA ---
  useEffect(() => {
    if (auth) {
      const initAuth = async () => {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      };
      initAuth();
      return onAuthStateChanged(auth, setUser);
    }
  }, []);

  // Caricamento Dati
  useEffect(() => {
    if (!db || !user) return;
    
    // 1. Chiavi Segrete
    getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'secrets')).then(snap => {
      if(snap.exists() && snap.data().gemini_key) aiTutor.setApiKey(snap.data().gemini_key);
    });

    // 2. Caricamento Salvataggio
    const saveRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'gameState');
    const unsub = onSnapshot(saveRef, (docSnap) => {
      if (docSnap.exists()) {
        const remoteData = docSnap.data();
        // Merge intelligente con stato locale per evitare di perdere campi nuovi
        setGameState(prev => ({
          ...INITIAL_GAME_STATE,
          ...remoteData,
          levelSystem: { ...INITIAL_GAME_STATE.levelSystem, ...(remoteData.levelSystem || {}) },
          petsData: { ...INITIAL_GAME_STATE.petsData, ...(remoteData.petsData || {}) }
        }));
      }
    });
    return () => unsub();
  }, [user]);

  // Salvataggio (Debounced)
  useEffect(() => {
    if (!user || !db) return;
    const timeout = setTimeout(() => {
      const saveRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'gameState');
      setDoc(saveRef, gameState, { merge: true }).catch(e => console.error("Salvataggio fallito", e));
    }, 2000);
    return () => clearTimeout(timeout);
  }, [gameState, user]);

  // PWA & Version
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); });
    
    const checkVersion = async () => {
      try {
        const res = await fetch(`${REPO_BASE}/version.json?t=${Date.now()}`);
        if(res.ok) {
          const data = await res.json();
          if(data.version !== APP_VERSION) setUpdateAvailable(true);
        }
      } catch(e){}
    };
    checkVersion();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register(`${REPO_BASE}/sw.js`).catch(()=>{});
  }, []);

  // --- LOGICA GIOCO ---
  
  const handleTravel = (envId, petId) => {
    setGameState(prev => ({ ...prev, activePetId: petId })); // L'ambiente è dedotto dal pet
    setActiveModal(null);
    speak(`Andiamo nella ${ENVIRONMENTS[envId].name}!`);
  };

  const handleBuy = (item) => {
    if (gameState.wallet.money >= item.price) {
      setGameState(prev => {
        const env = PETS_INFO[prev.activePetId].defaultEnv; // Compra per l'ambiente corrente
        const newDecor = { ...prev.decor };
        if(!newDecor[env]) newDecor[env] = {};
        
        newDecor[env][item.type] = item; 
        
        return { 
          ...prev, 
          wallet: { money: prev.wallet.money - item.price }, 
          inventory: [...prev.inventory, item.id], 
          decor: newDecor 
        };
      });
      speak("Grazie!");
    }
  };

  const handleSuccess = (type, time) => {
    setGameState(prev => {
      const activePet = prev.activePetId;
      const petStats = { ...prev.petsData[activePet].stats };
      
      if(type==='food') petStats.hunger = Math.min(100, petStats.hunger + 20);
      else if(type==='play') petStats.happiness = Math.min(100, petStats.happiness + 20);
      else petStats.health = Math.min(100, petStats.health + 20);
      
      let earnedMoney = time < 5 ? 20 : 10;
      let newLevelSystem = { ...prev.levelSystem, currentStars: prev.levelSystem.currentStars + 10 };
      
      // Level Up Logic
      let unlockedPets = [...prev.unlockedPets];
      if (newLevelSystem.currentStars >= newLevelSystem.nextLevelStars) {
        newLevelSystem.level += 1;
        newLevelSystem.currentStars = 0;
        newLevelSystem.nextLevelStars = Math.floor(newLevelSystem.nextLevelStars * 1.5);
        earnedMoney += 100; // Bonus livello
        
        // Sblocco Drago al livello 5
        if (newLevelSystem.level === 5 && !unlockedPets.includes('dragon')) {
          unlockedPets.push('dragon');
          setTimeout(() => alert("🎉 HAI SBLOCCATO LA FORESTA E IL DRAGHETTO! 🎉\nClicca sulla Mappa per viaggiare!"), 500);
        }
      }

      return { 
        ...prev, 
        wallet: { money: prev.wallet.money + earnedMoney }, 
        petsData: { ...prev.petsData, [activePet]: { ...prev.petsData[activePet], stats: petStats } },
        levelSystem: newLevelSystem,
        unlockedPets
      };
    });
    speak("Evviva!");
  };

  // Aggiornamento App
  const handleUpdateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        for(let reg of regs) reg.unregister();
        window.location.reload(true);
      });
    } else window.location.reload(true);
  };

  // Pensieri (Usa speak)
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeModal) return;
      const mood = gameState.petsData[gameState.activePetId].stats.health < 40 ? 'sick' : gameState.petsData[gameState.activePetId].stats.hunger < 40 ? 'hungry' : 'happy';
      const phrases = PET_PHRASES[mood];
      const txt = phrases[Math.floor(Math.random() * phrases.length)];
      setPetThought(txt);
      speak(txt);
      setTimeout(() => setPetThought(null), 4000);
    }, 15000);
    return () => clearInterval(interval);
  }, [gameState.petsData, gameState.activePetId, activeModal, speak]);

  // Helper dati correnti
  const activePetInfo = PETS_INFO[gameState.activePetId];
  const activePetData = gameState.petsData[gameState.activePetId];
  const activeEnvId = activePetInfo.defaultEnv;
  const activeEnv = ENVIRONMENTS[activeEnvId];
  const activeDecor = gameState.decor[activeEnvId] || {};

  return (
    <div className={`fixed inset-0 ${activeEnv.colors.bg} font-sans text-slate-800 flex flex-col overflow-hidden select-none transition-colors duration-1000`}>
      
      {/* 3D SCENE */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 5, 8], fov: 50 }}>
          <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.1} maxDistance={15} minDistance={5} enablePan={false} />
          <Room3D decor={activeDecor} petEmoji={activePetInfo.emoji} envId={activeEnvId} />
        </Canvas>
      </div>

      {/* UI OVERLAY */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pb-6 z-10">
        
        {/* HEADER */}
        <div className="px-4 py-4 flex justify-between items-start pointer-events-auto">
          <GlassCard className="flex items-center gap-3 px-4 py-2 rounded-2xl !border-white/40 min-w-[140px]">
            <div className="bg-indigo-100 p-1.5 rounded-full"><User size={16} className="text-indigo-600"/></div>
            <div className="flex flex-col w-full">
              <span className="font-bold text-sm text-indigo-900">{gameState.user.name}</span>
              <LevelBar current={gameState.levelSystem.currentStars} max={gameState.levelSystem.nextLevelStars} />
              <div className="text-[9px] text-indigo-500 font-bold text-right mt-0.5">Lvl {gameState.levelSystem.level}</div>
            </div>
          </GlassCard>

          <div className="flex gap-2">
            {/* Tasto Mappa */}
            <button onClick={() => setActiveModal('map')} className="p-3 rounded-full bg-white/20 backdrop-blur border border-white/30 text-white shadow-lg active:scale-95">
              <MapIcon size={20} />
            </button>

            {updateAvailable && (
              <button onClick={handleUpdateApp} className="p-3 rounded-full bg-green-500 text-white shadow-lg animate-pulse">
                <RefreshCw size={20} className="animate-spin" />
              </button>
            )}
            
            <GlassCard className="flex items-center gap-2 px-3 py-2 rounded-full !bg-emerald-500/80 !border-emerald-300 shadow-lg">
              <Coins size={18} className="text-emerald-200 fill-white"/>
              <span className="font-black text-white text-md">{Math.floor(gameState.wallet.money)}</span>
            </GlassCard>
          </div>
        </div>

        {/* THOUGHT BUBBLE */}
        <div className="relative w-full flex justify-center pointer-events-none h-10">
           {petThought && (
             <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl rounded-bl-none shadow-lg animate-bounce-in border border-indigo-100">
               <p className="font-bold text-indigo-900 text-sm">{petThought}</p>
             </div>
           )}
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="px-4 pointer-events-auto mt-auto">
          <div className="flex justify-end mb-4">
             <button onClick={() => setActiveModal('shop')} className="bg-white p-3 rounded-full shadow-xl border-4 border-emerald-300 text-emerald-600 active:scale-95 animate-bounce-in">
                <ShoppingBag size={24} />
             </button>
          </div>
          
          <GlassCard className="p-4 rounded-3xl !bg-white/60">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs font-black uppercase text-indigo-900 opacity-50">{activeEnv.name}</span>
              <span className="text-xs font-black uppercase text-indigo-900 opacity-50">{activePetInfo.name}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
              <StatBar value={activePetData.stats.health} color="bg-rose-500" icon={Heart} label="Vita" />
              <StatBar value={activePetData.stats.hunger} color="bg-amber-500" icon={Utensils} label="Cibo" />
              <StatBar value={activePetData.stats.happiness} color="bg-sky-500" icon={Smile} label="Gioco" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <ActionButton label="Mangia" icon={Utensils} gradient="bg-gradient-to-br from-amber-400 to-orange-500" onClick={() => { setCurrentReward(FOOD_ITEMS[0]); setActiveModal('food'); }} />
              <ActionButton label="Gioca" icon={Gamepad2} gradient="bg-gradient-to-br from-sky-400 to-blue-500" onClick={() => { setCurrentReward(TOYS[0]); setActiveModal('play'); }} />
              <ActionButton label="Cura" icon={Activity} gradient="bg-gradient-to-br from-rose-400 to-red-600" onClick={() => { setCurrentReward(MEDICINES[0]); setActiveModal('heal'); }} />
            </div>
          </GlassCard>
        </div>
      </div>

      <MathModal isOpen={['food', 'play', 'heal'].includes(activeModal)} type={activeModal} rewardItem={currentReward} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
      <ShopModal isOpen={activeModal === 'shop'} onClose={() => setActiveModal(null)} wallet={gameState.wallet} inventory={gameState.inventory} onBuy={handleBuy} level={gameState.levelSystem.level} />
      <MapModal isOpen={activeModal === 'map'} onClose={() => setActiveModal(null)} currentEnv={activeEnvId} unlockedPets={gameState.unlockedPets} onTravel={handleTravel} />
    </div>
  );
}
