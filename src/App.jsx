import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Billboard, Stars } from '@react-three/drei';
import { Heart, Smile, Utensils, Gamepad2, User, Activity, Sparkles, Zap, Volume2, VolumeX, ShoppingBag, Store, Coins, Download, Rotate3d, RefreshCw, Map as MapIcon, Lock, X, Flag, Timer } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

// --- CONFIGURAZIONE SISTEMA ---
const REPO_BASE = '/games-rifugioIncantato';
const APP_VERSION = '1.4.1'; // Fix Race Mode Rendering

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

// --- COSTANTI AMBIENTI ---
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
    colors: { floor: "#4ade80", wall: "#7dd3fc", bg: "bg-emerald-900" }, 
    gridColor: 0x22c55e
  },
  beach: { 
    id: 'beach', 
    name: "Spiaggia Coralli", 
    colors: { floor: "#fde68a", wall: "#60a5fa", bg: "bg-sky-900" }, 
    gridColor: 0xd4b48b
  }
};

const PETS_INFO = {
  fox: { id: 'fox', name: "Batuffolo", emoji: "🦊", defaultEnv: 'room' },
  dragon: { id: 'dragon', name: "Scintilla", emoji: "🐲", defaultEnv: 'forest' },
  turtle: { id: 'turtle', name: "Guscio", emoji: "🐢", defaultEnv: 'beach' }
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
    { id: 'rug_rainbow', name: "Tappeto", emoji: "🌈", price: 150, type: 'rug', pos: [0, 0.05, 0], scale: 3, isFlat: true, levelReq: 1 },
    { id: 'plant', name: "Pianta", emoji: "🪴", price: 80, type: 'plant', pos: [-3, 0.8, -3], scale: 2, levelReq: 1 },
    { id: 'lamp', name: "Lampada", emoji: "🌟", price: 120, type: 'lamp', pos: [3, 2, -3.5], scale: 1.5, levelReq: 1 },
    { id: 'throne', name: "Trono", emoji: "👑", price: 500, type: 'chair', pos: [0, 1, -4], scale: 2.5, levelReq: 5 },
    { id: 'tree_magic', name: "Albero", emoji: "🌳", price: 350, type: 'plant_big', pos: [-3, 2, -3], scale: 4, levelReq: 5 },
    { id: 'shell_giant', name: "Conchiglia", emoji: "🐚", price: 300, type: 'seat_beach', pos: [3, 0.5, 3], scale: 2, levelReq: 10 },
    { id: 'umbrella', name: "Ombrellone", emoji: "⛱️", price: 250, type: 'shade', pos: [-3, 2, -3], scale: 3, levelReq: 10 },
    { id: 'castle', name: "Castello", emoji: "🏰", price: 600, type: 'sandcastle', pos: [0, 1, -4], scale: 2.5, levelReq: 12 }
  ],
  toys: [
    { id: 'robot', name: "Robot", emoji: "🤖", price: 100, type: 'toy', pos: [-2, 0.6, 2], scale: 1.5, levelReq: 1 },
    { id: 'bear', name: "Orsetto", emoji: "🧸", price: 75, type: 'toy', pos: [2, 0.5, 2], scale: 1.5, levelReq: 1 },
    { id: 'telescope', name: "Telescopio", emoji: "🔭", price: 200, type: 'toy_adv', pos: [0, 1, 4], scale: 2, levelReq: 5 },
    { id: 'boat', name: "Barchetta", emoji: "⛵", price: 150, type: 'toy_sea', pos: [0, 0.5, 3], scale: 1.5, levelReq: 10 }
  ]
};

// --- STATO INIZIALE ---
const INITIAL_GAME_STATE = {
  userInfo: { name: "", surname: "", age: 9, gender: "F", nickname: "Piccola Maga" },
  levelSystem: { level: 1, currentStars: 0, nextLevelStars: 50 },
  wallet: { money: 100 },
  inventory: [],
  unlockedPets: ['fox'],
  activePetId: 'fox',
  petsData: {
    fox: { stats: { health: 80, hunger: 60, happiness: 90 }, status: "normal" },
    dragon: { stats: { health: 100, hunger: 100, happiness: 100 }, status: "normal" },
    turtle: { stats: { health: 100, hunger: 100, happiness: 100 }, status: "normal" }
  },
  decor: { room: {}, forest: {}, beach: {} },
  difficulty: { mathLevel: 1, streak: 0 },
  lastLogin: new Date().toISOString()
};

// --- MOTORE AI ---
class GeminiTutor {
  constructor() { this.history = []; this.apiKey = null; }
  setApiKey(key) { this.apiKey = key; }
  recordAnswer(type, problem, isCorrect, timeTaken) { 
    this.history.push({ type, problem, isCorrect, timeTaken, timestamp: Date.now() });
    if (this.history.length > 30) this.history.shift(); 
  }
  async generateProblem(level, type) {
    const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    let n1 = rnd(1, 10 + level), n2 = rnd(1, 10 + level);
    let operator = Math.random() > 0.5 ? '+' : '-';
    
    // In Gara: Operazioni rapide
    if(type === 'race') { 
       if(operator === '-' && n1 < n2) [n1, n2] = [n2, n1];
       return { text: `${n1} ${operator} ${n2}`, result: operator==='+'?n1+n2:n1-n2 };
    }

    const localProblem = this.generateLocalProblem(level, type);
    if (!this.apiKey) return localProblem;
    try {
      const prompt = `Genera un problema matematico per bambino livello ${level}. Tipo: ${type}. JSON: { "text": "...", "result": 123 }`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${this.apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
      });
      const data = await response.json();
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (e) { return localProblem; }
  }
  generateLocalProblem(level, type) {
    const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    let n1, n2, operator, result;
    const maxNum = 10 + (level * 5); 
    if (type === 'food') {
      operator = Math.random() > 0.5 ? '+' : '-'; n1 = rnd(1, maxNum); n2 = rnd(1, maxNum);
      if (operator === '-' && n1 < n2) [n1, n2] = [n2, n1]; result = operator === '+' ? n1 + n2 : n1 - n2;
    } else if (type === 'play') {
      operator = '×'; n1 = rnd(1, Math.min(10, 2 + level)); n2 = rnd(1, 10); result = n1 * n2;
    } else {
      operator = ':'; n2 = rnd(2, Math.min(9, 1 + level)); result = rnd(1, 10); n1 = n2 * result;
    }
    return { text: `${n1} ${operator} ${n2}`, result };
  }
  async evaluateLevel(currentLevel) { return currentLevel; }
}
const aiTutor = new GeminiTutor();

// --- RACE COMPONENTS (FIXED) ---
const RaceGate = ({ position, text, color }) => {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[3, 2, 0.2]} />
        <meshStandardMaterial color={color} opacity={0.8} transparent />
      </mesh>
      {/* Sostituito Text (drei) con Html per stabilità */}
      <Html position={[0, 0, 0.2]} transform center pointerEvents="none">
        <div className="text-4xl font-black text-white drop-shadow-md" style={{ fontFamily: 'sans-serif' }}>{text}</div>
      </Html>
    </group>
  );
};

const RaceScene = ({ petEmoji, gates }) => {
  const playerRef = useRef();
  
  // Per aggiornare la posizione senza causare re-render, usiamo un listener diretto
  // Ma per semplicità in questo esempio, la posizione X viene aggiornata esternamente tramite ref
  // Qui visualizziamo solo lo stato corrente

  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[0, 10, 5]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Pista */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[20, 200]} />
        <meshStandardMaterial color="#3b0764" />
      </mesh>
      <gridHelper args={[20, 200, 0xffffff, 0x555555]} position={[0, -0.9, 0]} />

      {/* Player (La posizione X è gestita via CSS/Ref nel componente padre per fluidità, qui mettiamo un placeholder visivo) */}
      <group position={[0, 0, 5]} name="playerGroup">
         <Billboard follow={true}>
            <Html transform center pointerEvents="none">
              <div className="text-[80px] drop-shadow-2xl">{petEmoji}</div>
            </Html>
         </Billboard>
      </group>

      {/* Gates */}
      {gates.map(gate => (
        <RaceGate 
            key={gate.id} 
            position={[gate.lane === 'left' ? -2.5 : 2.5, 0, gate.z]} 
            text={gate.value} 
            color={gate.lane === 'left' ? '#ec4899' : '#06b6d4'} 
        />
      ))}
    </>
  );
};

// --- SCENA 3D STANZA ---
const Room3D = ({ decor, petEmoji, envId }) => {
  const env = ENVIRONMENTS[envId] || ENVIRONMENTS.room;
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[12, 12]} /><meshStandardMaterial color={env.colors.floor} /></mesh>
      <gridHelper args={[12, 12, env.gridColor, env.gridColor]} position={[0, 0.01, 0]} />
      
      {envId === 'room' ? (
        <>
          <mesh position={[0, 3, -6]}><boxGeometry args={[12, 6, 0.1]} /><meshStandardMaterial color={env.colors.wall} /></mesh>
          <mesh position={[-6, 3, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[12, 6, 0.1]} /><meshStandardMaterial color="#a5b4fc" /></mesh>
          <mesh position={[6, 3, 0]} rotation={[0, -Math.PI / 2, 0]}><boxGeometry args={[12, 6, 0.1]} /><meshStandardMaterial color="#a5b4fc" /></mesh>
        </>
      ) : (
         <Billboard position={[0, 2, -6]} scale={6}><Html pointerEvents="none"><div className="text-[100px]">{envId === 'forest' ? '🌳' : '🌊'}</div></Html></Billboard>
      )}
      
      <Billboard position={[0, 1, 0]} follow={true}><Html transform center pointerEvents="none"><div className="text-[120px] drop-shadow-lg">{petEmoji}</div></Html></Billboard>
      
      {Object.values(decor || {}).map((item) => {
        if (item.isFlat) return <group key={item.id} position={item.pos} rotation={[-Math.PI/2, 0, 0]}><Html transform center pointerEvents="none"><div style={{ fontSize: `${item.scale * 40}px`, opacity: 0.9 }}>{item.emoji}</div></Html></group>;
        if (item.isWall && envId !== 'room') return null;
        if (item.isWall) return <group key={item.id} position={item.pos}><Html transform center pointerEvents="none"><div style={{ fontSize: `${item.scale * 30}px` }}>{item.emoji}</div></Html></group>;
        return <Billboard key={item.id} position={item.pos} follow={true}><Html transform center pointerEvents="none"><div style={{ fontSize: `${item.scale * 40}px` }}>{item.emoji}</div></Html></Billboard>;
      })}
    </>
  );
};

// --- APP PRINCIPALE ---

export default function App() {
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE);
  const [activeModal, setActiveModal] = useState(null);
  const [gameMode, setGameMode] = useState('normal'); 
  
  // RACE STATE
  const [raceState, setRaceState] = useState({ timeLeft: 30, score: 0, gates: [], currentProblem: null, targetScore: 5 });
  const playerX = useRef(0);

  const [currentReward, setCurrentReward] = useState(null);
  const [petThought, setPetThought] = useState("Ciao!");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [user, setUser] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false); 

  // --- INIT E LOGICA ---
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

  useEffect(() => {
    if (!db || !user) return;
    getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'secrets')).then(snap => {
      if(snap.exists() && snap.data().gemini_key) aiTutor.setApiKey(snap.data().gemini_key);
    });
    const saveRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'gameState');
    const unsub = onSnapshot(saveRef, (docSnap) => {
      if (docSnap.exists()) setGameState(prev => ({ ...INITIAL_GAME_STATE, ...docSnap.data() }));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('rifugio_v8_race');
    if (saved) { try { setGameState(prev => ({...prev, ...JSON.parse(saved)})); } catch(e){} }
  }, []);

  useEffect(() => { localStorage.setItem('rifugio_v8_race', JSON.stringify(gameState)); }, [gameState]);
  
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); });
    const checkVersion = async () => {
       try {
         const res = await fetch(`${REPO_BASE}/version.json?t=${Date.now()}`);
         if(res.ok && (await res.json()).version !== APP_VERSION) setUpdateAvailable(true);
       } catch(e){}
    };
    checkVersion();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register(`${REPO_BASE}/sw.js`).catch(()=>{});
  }, []);

  // --- GARA LOGIC ---
  const startRace = async () => {
    setGameMode('race');
    const firstProb = await aiTutor.generateProblem(gameState.levelSystem.level, 'race');
    setRaceState({
      timeLeft: 30, score: 0, targetScore: 5, currentProblem: firstProb,
      gates: [
        { id: 1, z: -20, lane: 'left', value: firstProb.result, isCorrect: true },
        { id: 2, z: -20, lane: 'right', value: firstProb.result + 2, isCorrect: false }
      ]
    });
  };

  const endRace = (success) => {
    setGameMode('normal');
    if (success) {
      alert("🏆 GARA VINTA! +200 Monete!");
      setGameState(prev => ({
        ...prev,
        wallet: { money: prev.wallet.money + 200 },
        levelSystem: { ...prev.levelSystem, level: prev.levelSystem.level + 1, currentStars: 0, nextLevelStars: Math.floor(prev.levelSystem.nextLevelStars * 1.5) }
      }));
    } else {
      alert("😢 Tempo scaduto! Riprova la gara per passare di livello.");
    }
  };

  useEffect(() => {
    if (gameMode !== 'race') return;
    const raceLoop = setInterval(() => {
      setRaceState(prev => {
        if (prev.timeLeft <= 0) { clearInterval(raceLoop); endRace(false); return prev; }
        
        let newGates = prev.gates.map(g => ({ ...g, z: g.z + 0.5 }));
        let newScore = prev.score;
        let newTime = prev.timeLeft - 0.1;
        let needsNewProb = false;

        // Collision Logic
        const hitGateIndex = newGates.findIndex(g => g.z > 4.5 && g.z < 5.5);
        if (hitGateIndex !== -1) {
          const gate = newGates[hitGateIndex];
          const playerLane = playerX.current < 0 ? 'left' : 'right';
          if (gate.lane === playerLane) {
            if (gate.isCorrect) { newScore++; newTime += 5; needsNewProb = true; } 
            else { newTime -= 5; }
            newGates = newGates.filter(g => Math.abs(g.z - gate.z) > 1);
          }
        }
        
        // Spawn New Gates
        newGates = newGates.filter(g => g.z < 10);
        if (needsNewProb || newGates.length === 0) {
           const res = prev.currentProblem.result; // (In realta servirebbe nuovo problema da AI, usiamo mock per semplicita loop)
           const wrong = res + Math.floor(Math.random() * 5) + 1;
           const correctLane = Math.random() > 0.5 ? 'left' : 'right';
           // Se serve nuovo problema lo genereremmo qui, per ora ricicliamo per fluidità demo
           if (newGates.length === 0) {
              newGates.push({ id: Date.now(), z: -30, lane: correctLane, value: res, isCorrect: true });
              newGates.push({ id: Date.now()+1, z: -30, lane: correctLane==='left'?'right':'left', value: wrong, isCorrect: false });
           }
        }

        if (newScore >= prev.targetScore) { clearInterval(raceLoop); endRace(true); return prev; }
        return { ...prev, gates: newGates, timeLeft: newTime, score: newScore };
      });
    }, 100);
    return () => clearInterval(raceLoop);
  }, [gameMode]);

  const handleRaceMove = (e) => {
    if (gameMode !== 'race') return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    playerX.current = (clientX / window.innerWidth) * 2 - 1;
    
    // Aggiornamento diretto DOM per fluidità in gara (Opzionale, qui ci affidiamo al render React)
    // In un gioco serio useremmo useFrame dentro il componente per leggere playerX.current
  };

  // --- STANDARD HANDLERS ---
  const handleSuccess = (type, time) => {
    setGameState(prev => {
      let earnedStars = 10;
      let newLevelSystem = { ...prev.levelSystem, currentStars: prev.levelSystem.currentStars + earnedStars };
      if (newLevelSystem.currentStars >= newLevelSystem.nextLevelStars) {
        setTimeout(() => startRace(), 500); // GARA!
        newLevelSystem.currentStars = newLevelSystem.nextLevelStars; // Bloccato finché non vince
      }
      return { ...prev, wallet: { money: prev.wallet.money + 10 }, levelSystem: newLevelSystem };
    });
  };

  const handleTravel = (envId, petId) => { setGameState(prev => ({ ...prev, activePetId: petId })); setActiveModal(null); };
  const handleBuy = (item) => { 
    if (gameState.wallet.money >= item.price) {
      setGameState(prev => {
        const env = PETS_INFO[prev.activePetId].defaultEnv;
        const newDecor = { ...prev.decor }; if(!newDecor[env]) newDecor[env] = {}; newDecor[env][item.type] = item; 
        return { ...prev, wallet: { money: prev.wallet.money - item.price }, inventory: [...prev.inventory, item.id], decor: newDecor };
      });
    }
  };
  const handleUpdateApp = () => { if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(regs => { for(let reg of regs) reg.unregister(); window.location.reload(true); }); else window.location.reload(true); };
  const handleInstallClick = async () => { if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') setDeferredPrompt(null); } };
  const handleUpdateProfile = (newInfo) => { setGameState(prev => ({ ...prev, userInfo: newInfo })); };

  // --- RENDER ---
  const activePetInfo = PETS_INFO[gameState.activePetId];
  const activePetData = gameState.petsData[gameState.activePetId];
  const activeEnv = ENVIRONMENTS[activePetInfo.defaultEnv];
  const activeDecor = gameState.decor[activePetInfo.defaultEnv] || {};

  return (
    <div className={`fixed inset-0 ${gameMode === 'race' ? 'bg-slate-900' : activeEnv.colors.bg} font-sans text-slate-800 flex flex-col overflow-hidden select-none transition-colors duration-1000`}
         onPointerMove={handleRaceMove} onTouchMove={handleRaceMove}>
      
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 5, 8], fov: 50 }} dpr={[1, 2]}>
          {gameMode === 'race' ? (
             <RaceScene petEmoji={activePetInfo.emoji} gates={raceState.gates} />
          ) : (
             <>
               <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.1} maxDistance={15} minDistance={5} enablePan={false} />
               <Room3D decor={activeDecor} petEmoji={activePetInfo.emoji} envId={activePetInfo.defaultEnv} />
             </>
          )}
        </Canvas>
      </div>

      {gameMode === 'race' && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center pt-10 z-20">
          <div className="bg-white/90 px-6 py-4 rounded-3xl border-4 border-indigo-500 shadow-2xl text-center animate-bounce-in">
             <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Risolvi!</div>
             <div className="text-5xl font-black text-indigo-900">{raceState.currentProblem?.text || "..."}</div>
          </div>
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Flag /> {raceState.score}/{raceState.targetScore}</div>
            <div className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg ${raceState.timeLeft < 10 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'} text-white`}><Timer /> {Math.ceil(raceState.timeLeft)}s</div>
          </div>
          <div className="absolute bottom-10 w-full text-center text-white/50 font-bold text-xl animate-pulse">&lt; TRASCINA &gt;</div>
        </div>
      )}

      {gameMode === 'normal' && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pb-6 z-10">
           {/* HEADER */}
           <div className="px-4 py-4 flex justify-between items-start pointer-events-auto">
              <GlassCard onClick={() => setActiveModal('profile')} className="flex items-center gap-3 px-4 py-2 rounded-2xl !border-white/40 min-w-[140px] cursor-pointer hover:bg-white/40 transition-colors">
                <div className="bg-indigo-100 p-1.5 rounded-full"><User size={16} className="text-indigo-600"/></div>
                <div className="flex flex-col w-full">
                  <span className="font-bold text-sm text-indigo-900">{gameState.userInfo.nickname}</span>
                  <LevelBar current={gameState.levelSystem.currentStars} max={gameState.levelSystem.nextLevelStars} />
                  <div className="text-[9px] text-indigo-500 font-bold text-right mt-0.5">Lvl {gameState.levelSystem.level}</div>
                </div>
              </GlassCard>
              <div className="flex gap-2">
                 <button onClick={() => setActiveModal('map')} className="p-3 rounded-full bg-white/20 backdrop-blur border border-white/30 text-white shadow-lg active:scale-95"><MapIcon size={20} /></button>
                 {updateAvailable && <button onClick={handleUpdateApp} className="p-3 rounded-full bg-green-500 text-white shadow-lg animate-pulse"><RefreshCw size={20} className="animate-spin" /></button>}
                 {deferredPrompt && <button onClick={handleInstallClick} className="p-3 rounded-full bg-indigo-600 text-white shadow-lg animate-pulse active:scale-95"><Download size={20} /></button>}
                 <GlassCard className="flex items-center gap-2 px-3 py-2 rounded-full !bg-emerald-500/80 !border-emerald-300 shadow-lg"><Coins size={18} className="text-emerald-200 fill-white"/><span className="font-black text-white text-md">{Math.floor(gameState.wallet.money)}</span></GlassCard>
              </div>
           </div>

           {/* CONTROLLI */}
           <div className="px-4 pointer-events-auto mt-auto">
             <div className="flex justify-end mb-4"><button onClick={() => setActiveModal('shop')} className="bg-white p-3 rounded-full shadow-xl border-4 border-emerald-300 text-emerald-600 active:scale-95 animate-bounce-in"><ShoppingBag size={24} /></button></div>
             <GlassCard className="p-4 rounded-3xl !bg-white/60">
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
      )}

      {/* MODALI */}
      {gameMode === 'normal' && (
        <>
          <MathModal isOpen={['food', 'play', 'heal'].includes(activeModal)} type={activeModal} difficultyLevel={gameState.difficulty.mathLevel} rewardItem={currentReward} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
          <ShopModal isOpen={activeModal === 'shop'} onClose={() => setActiveModal(null)} wallet={gameState.wallet} inventory={gameState.inventory} onBuy={handleBuy} level={gameState.levelSystem.level} />
          <MapModal isOpen={activeModal === 'map'} onClose={() => setActiveModal(null)} currentEnv={activePetInfo.defaultEnv} unlockedPets={gameState.unlockedPets} onTravel={handleTravel} />
          <ProfileModal isOpen={activeModal === 'profile'} onClose={() => setActiveModal(null)} userInfo={gameState.userInfo} onSave={handleUpdateProfile} />
        </>
      )}
    </div>
  );
}
