import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Billboard, Stars } from '@react-three/drei';
import { Heart, Smile, Utensils, Gamepad2, User, Activity, Sparkles, Zap, Volume2, VolumeX, ShoppingBag, Store, Coins, Download, Rotate3d, RefreshCw, Map as MapIcon, Lock, X, Flag, Timer } from 'lucide-react';
import * as THREE from 'three';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

// --- CONFIGURAZIONE SISTEMA ---
const REPO_BASE = '/games-rifugioIncantato';
const APP_VERSION = '1.6.2'; // Fix handleBuy e cleanup

const firebaseConfig = {
  apiKey: "AIzaSyDZp4rC_LYox1YlBW8eDqsycmqH08i4zP8",
  authDomain: "nutriai-f081c.firebaseapp.com",
  projectId: "nutriai-f081c",
  storageBucket: "nutriai-f081c.firebasestorage.app",
  messagingSenderId: "841982374698",
  appId: "1:841982374698:web:0289d0aac7d926b07ce453"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'rifugio-incantato-app-id';

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

const PET_PHRASES = {
  hungry: ["Pancino vuoto...", "Ho fame!", "Cibo?"],
  bored: ["Che noia...", "Giochiamo?", "Uffa..."],
  sick: ["Non sto bene...", "Aiuto...", "Gulp..."],
  happy: ["Sei mitica!", "Ti voglio bene!", "Evviva!"],
  sleepy: ["Zzz...", "Nanna..."],
  intro: ["Ciao!", "Eccomi!"]
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
    { id: 'fountain', name: "Fontana", emoji: "⛲", price: 400, type: 'center', pos: [3, 1, 3], scale: 2.5, levelReq: 3 },
    { id: 'chest', name: "Tesoro", emoji: "💎", price: 250, type: 'storage', pos: [-3, 0.5, 3], scale: 1.5, levelReq: 2 },
    { id: 'tree_magic', name: "Albero", emoji: "🌳", price: 350, type: 'plant_big', pos: [-3, 2, -3], scale: 4, levelReq: 4 },
    { id: 'shell_giant', name: "Conchiglia", emoji: "🐚", price: 300, type: 'seat_beach', pos: [3, 0.5, 3], scale: 2, levelReq: 10 },
    { id: 'umbrella', name: "Ombrellone", emoji: "⛱️", price: 250, type: 'shade', pos: [-3, 2, -3], scale: 3, levelReq: 10 },
    { id: 'castle', name: "Castello", emoji: "🏰", price: 600, type: 'sandcastle', pos: [0, 1, -4], scale: 2.5, levelReq: 12 }
  ],
  toys: [
    { id: 'robot', name: "Robot", emoji: "🤖", price: 100, type: 'toy', pos: [-2, 0.6, 2], scale: 1.5, levelReq: 1 },
    { id: 'bear', name: "Orsetto", emoji: "🧸", price: 75, type: 'toy', pos: [2, 0.5, 2], scale: 1.5, levelReq: 1 },
    { id: 'car', name: "Auto", emoji: "🏎️", price: 85, type: 'toy', pos: [0, 0.4, 3], scale: 1.2, levelReq: 1 },
    { id: 'telescope', name: "Telescopio", emoji: "🔭", price: 200, type: 'toy_adv', pos: [0, 1, 4], scale: 2, levelReq: 3 },
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
    let n1, n2, operator;
    const maxNum = 10 + (level * 5); 

    if (type === 'race') {
       operator = Math.random() > 0.5 ? '+' : '-';
       n1 = rnd(1, maxNum); n2 = rnd(1, maxNum);
       if (operator === '-' && n1 < n2) [n1, n2] = [n2, n1];
       return { text: `${n1} ${operator} ${n2}`, result: operator === '+' ? n1 + n2 : n1 - n2 };
    }
    
    // Logica standard con AI
    const localProblem = this.generateLocalProblem(level, type);
    if (!this.apiKey) return localProblem;
    try {
      const prompt = `
        Sei un tutor di matematica per bambini italiani (Livello: ${level}).
        Genera un problema matematico.
        Tipo richiesto: ${type === 'play' ? 'Moltiplicazioni' : type === 'food' ? 'Somme/Sottrazioni' : 'Divisioni'}.
        
        ISTRUZIONI TASSATIVE:
        1. Genera il testo ESCLUSIVAMENTE IN ITALIANO.
        2. Nel 50% dei casi genera OPERAZIONI SECCHE (es. "12 + 15", "5 x 4").
        3. Nel 50% dei casi genera BREVI PROBLEMI A PAROLE in ITALIANO (es. "Hai 5 mele, ne mangi 2. Quante ne restano?").
        
        Rispondi SOLO JSON valido: { "text": "testo domanda in italiano", "result": numero_intero }
      `;
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

// --- UI COMPONENTS ---
const GlassCard = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white/30 backdrop-blur-md border border-white/50 shadow-xl rounded-3xl ${className} ${onClick ? 'cursor-pointer hover:bg-white/40 transition-colors' : ''}`}>
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
  <button onClick={onClick} disabled={disabled} className={`relative flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-300 transform active:scale-95 ${disabled ? 'opacity-50 grayscale bg-white/10' : `${gradient} shadow-lg`} `} style={{ minHeight: '80px' }}>
    <Icon size={24} className="text-white drop-shadow-md mb-1" /><span className="font-bold text-[10px] text-white drop-shadow-md">{label}</span>
  </button>
);

// --- COMPONENTI 3D GARA ---
const WarpSpeed = () => {
    const count = 400;
    const mesh = useRef();
    const particles = useMemo(() => {
      const temp = [];
      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 50; 
        const y = (Math.random() - 0.5) * 50; 
        const z = (Math.random() - 0.5) * 100; 
        temp.push({ x, y, z });
      }
      return temp;
    }, []);
    
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state, delta) => {
      if (!mesh.current) return;
      particles.forEach((particle, i) => {
        particle.z += 20 * delta; 
        if (particle.z > 20) particle.z = -80; 
        dummy.position.set(particle.x, particle.y, particle.z);
        const scale = Math.max(0.1, (particle.z + 50) / 100);
        dummy.scale.set(0.1, 0.1, scale * 3); 
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
      });
      mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
      <instancedMesh ref={mesh} args={[null, null, count]}>
        <sphereGeometry args={[0.2, 4, 4]} />
        <meshBasicMaterial color="white" />
      </instancedMesh>
    );
};

const RaceGate = ({ position, text, color }) => {
    return (
      <group position={position}>
        <mesh>
          <torusGeometry args={[1.5, 0.1, 8, 20]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh>
          <circleGeometry args={[1.4, 32]} />
          <meshBasicMaterial color={color} opacity={0.3} transparent />
        </mesh>
        <Html position={[0, 0, 0]} transform center pointerEvents="none">
          <div className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]" style={{ fontFamily: 'sans-serif' }}>{text}</div>
        </Html>
      </group>
    );
};

const RaceScene = ({ petEmoji, gates, playerX }) => {
    const playerRef = useRef();

    useFrame(() => {
        if (playerRef.current) {
            const targetX = playerX.current * 3;
            playerRef.current.position.x += (targetX - playerRef.current.position.x) * 0.1;
            playerRef.current.rotation.z = -playerRef.current.position.x * 0.1; 
        }
    });

    return (
        <>
            <WarpSpeed />
            <ambientLight intensity={1} />
            <directionalLight position={[0, 5, 5]} />
            <group ref={playerRef} position={[0, -1, 4]}>
                <Billboard follow={true}>
                   <Html transform center pointerEvents="none">
                     <div className="text-[80px] filter drop-shadow-2xl animate-pulse">{petEmoji}</div>
                   </Html>
                </Billboard>
            </group>
            {gates.map(gate => (
                <RaceGate key={gate.id} position={[gate.lane === 'left' ? -2 : 2, -1, gate.z]} text={gate.value} color={gate.lane === 'left' ? '#f43f5e' : '#0ea5e9'} />
            ))}
        </>
    );
};

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

// --- MODALI ---
const ProfileModal = ({ isOpen, onClose, userInfo, onSave }) => {
    const [data, setData] = useState(userInfo);
    useEffect(() => { if(isOpen) setData(userInfo); }, [isOpen, userInfo]);
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{zIndex: 200}}>
        <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative border-4 border-white">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X /></button>
          <h3 className="text-2xl font-black text-indigo-900 mb-4 flex items-center gap-2"><User /> Profilo</h3>
          <div className="space-y-3">
            <div><label className="text-xs font-bold text-slate-500 uppercase">Nickname</label><input type="text" value={data.nickname || ""} onChange={e => setData({...data, nickname: e.target.value})} className="w-full p-3 rounded-xl border-2 border-indigo-100 font-bold text-indigo-900" /></div>
            <button onClick={() => { onSave(data); onClose(); }} className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg active:scale-95">Salva</button>
          </div>
        </div>
      </div>
    );
  };
  
  const ShopModal = ({ isOpen, onClose, wallet, inventory, onBuy, level }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{zIndex: 200}}>
        <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border-4 border-white">
          <div className="bg-indigo-100 p-4 flex justify-between items-center">
            <h3 className="text-xl font-black text-indigo-900 flex items-center gap-2"><Store size={24}/> Market</h3>
            <div className="bg-white px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200"><Coins size={16} className="text-emerald-600" /><span className="font-bold text-emerald-800">{Math.floor(wallet.money)}</span></div>
            <button onClick={onClose} className="font-bold text-slate-400 p-2"><X /></button>
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
                        {owned ? <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Posseduto</span> : <button onClick={() => onBuy(item)} disabled={wallet.money < item.price || locked} className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${wallet.money >= item.price && !locked ? 'bg-emerald-500 text-white shadow-md active:scale-95' : 'bg-slate-200 text-slate-400'}`}>{item.price} <Coins size={10} className="fill-current" /></button>}
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
  
  const MapModal = ({ isOpen, onClose, currentEnv, unlockedPets, onTravel }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-6" style={{zIndex: 200}}>
        <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X /></button>
          <h3 className="text-2xl font-black text-center text-indigo-900 mb-6 flex justify-center items-center gap-2"><MapIcon /> Mappa</h3>
          <div className="space-y-4">
            <div onClick={() => onTravel('room', 'fox')} className={`p-4 rounded-2xl border-4 cursor-pointer transition-all flex items-center gap-4 ${currentEnv === 'room' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
              <div className="text-4xl">🦊</div><div><div className="font-bold text-lg text-indigo-900">Cameretta</div><div className="text-xs text-indigo-500 font-semibold">Casa di Batuffolo</div></div>{currentEnv === 'room' && <span className="ml-auto text-indigo-600 font-bold">📍 Qui</span>}
            </div>
            <div onClick={() => { if (unlockedPets.includes('dragon')) onTravel('forest', 'dragon'); }} className={`p-4 rounded-2xl border-4 transition-all flex items-center gap-4 ${unlockedPets.includes('dragon') ? 'cursor-pointer border-emerald-500 bg-emerald-50' : 'border-slate-200 opacity-60 grayscale'}`}>
            <div className="text-4xl">🐲</div><div><div className="font-bold text-lg text-emerald-900">Foresta Incantata</div><div className="text-xs text-emerald-600 font-semibold">{unlockedPets.includes('dragon') ? "Casa di Scintilla" : "Sblocca al Livello 5"}</div></div>{!unlockedPets.includes('dragon') && <Lock className="ml-auto text-slate-400" />}{currentEnv === 'forest' && <span className="ml-auto text-emerald-600 font-bold">📍 Qui</span>}
          </div>
          <div onClick={() => { if (unlockedPets.includes('turtle')) onTravel('beach', 'turtle'); }} className={`p-4 rounded-2xl border-4 transition-all flex items-center gap-4 ${unlockedPets.includes('turtle') ? 'cursor-pointer border-sky-500 bg-sky-50' : 'border-slate-200 opacity-60 grayscale'}`}>
            <div className="text-4xl">🐢</div><div><div className="font-bold text-lg text-sky-900">Spiaggia Coralli</div><div className="text-xs text-sky-600 font-semibold">{unlockedPets.includes('turtle') ? "Casa di Guscio" : "Sblocca al Livello 10"}</div></div>{!unlockedPets.includes('turtle') && <Lock className="ml-auto text-slate-400" />}{currentEnv === 'beach' && <span className="ml-auto text-sky-600 font-bold">📍 Qui</span>}
          </div>
          </div>
        </div>
      </div>
    );
  };
  
  const MathModal = ({ isOpen, type, difficultyLevel, rewardItem, onClose, onSuccess }) => {
    const [problem, setProblem] = useState(null);
    const [answer, setAnswer] = useState("");
    const [feedback, setFeedback] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const startTime = useRef(Date.now());
    const inputRef = useRef(null);
  
    useEffect(() => {
      if (isOpen) {
        setIsLoading(true); setAnswer(""); setFeedback(null); setProblem(null);
        aiTutor.generateProblem(difficultyLevel, type).then(prob => {
          setProblem(prob); setIsLoading(false); startTime.current = Date.now();
          setTimeout(() => inputRef.current?.focus(), 100);
        });
      }
    }, [isOpen, difficultyLevel, type]);
  
    const checkAnswer = () => {
      if (!problem) return;
      if(parseInt(answer) === problem.result) {
        setFeedback('correct'); const time = (Date.now() - startTime.current) / 1000;
        setTimeout(() => { onSuccess(type, time); onClose(); }, 800);
      } else {
        setFeedback('wrong'); setAnswer("");
        setTimeout(() => setFeedback(null), 1000);
      }
    };
  
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{zIndex: 200}}>
        <div className={`bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl relative transform transition-all ${feedback === 'wrong' ? 'animate-shake border-4 border-red-300' : 'border-4 border-white'}`}>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
          <div className="text-center mb-6 pt-2"><h3 className="text-xl font-bold text-indigo-900">Risolvi per {rewardItem?.emoji}</h3></div>
          <div className="bg-indigo-50 rounded-2xl p-6 mb-6 text-center border-2 border-indigo-100 min-h-[120px] flex items-center justify-center">
            {isLoading ? <div className="animate-pulse text-indigo-400 font-bold">Generazione magica... ✨</div> : <span className={`font-black text-indigo-600 ${problem?.text.length > 10 ? 'text-xl' : 'text-5xl'}`}>{problem?.text}</span>}
          </div>
          {!isLoading && (
            <div className="flex gap-2 w-full">
              <input ref={inputRef} type="tel" value={answer} onChange={e=>setAnswer(e.target.value)} className="flex-1 min-w-0 text-center text-3xl font-black py-3 rounded-2xl border-4 border-indigo-100 outline-none text-indigo-900" placeholder="?" />
              <button onClick={checkAnswer} className="bg-green-500 text-white rounded-2xl px-6 font-bold shadow-lg shrink-0">OK</button>
            </div>
          )}
        </div>
      </div>
    );
  };

// --- APP PRINCIPALE ---

export default function App() {
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE);
  const [activeModal, setActiveModal] = useState(null);
  const [gameMode, setGameMode] = useState('normal'); 
  const [raceState, setRaceState] = useState({ timeLeft: 30, score: 0, gates: [], currentProblem: null, targetScore: 5 });
  const [raceFeedback, setRaceFeedback] = useState(null); // 'correct' | 'wrong' | null
  const playerX = useRef(0); 

  const [currentReward, setCurrentReward] = useState(null);
  const [petThought, setPetThought] = useState("Ciao!");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [user, setUser] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false); 

  const speak = useCallback((text) => {
    if (isMuted || !text || typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT'; utterance.pitch = 1.4; utterance.rate = 1.1;  
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

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
    const saved = localStorage.getItem('rifugio_v9_race_fix');
    if (saved) { try { setGameState(prev => ({...prev, ...JSON.parse(saved)})); } catch(e){} }
  }, []);

  useEffect(() => { localStorage.setItem('rifugio_v9_race_fix', JSON.stringify(gameState)); }, [gameState]);

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

  const startRace = async () => {
    setGameMode('race');
    // Genera primo problema
    const firstProb = aiTutor.generateLocalProblem(gameState.levelSystem.level, 'race');
    setRaceState({
        timeLeft: 40, score: 0, targetScore: 5, currentProblem: firstProb,
        gates: [
            { id: 1, z: -20, lane: 'left', value: firstProb.result, isCorrect: true },
            { id: 2, z: -20, lane: 'right', value: firstProb.result + 3, isCorrect: false }
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
        levelSystem: { 
          ...prev.levelSystem, 
          level: prev.levelSystem.level + 1, 
          currentStars: 0, 
          nextLevelStars: Math.floor(prev.levelSystem.nextLevelStars * 1.5) 
        }
      }));
    } else {
      alert("😢 Tempo scaduto! Riprova.");
    }
  };

  useEffect(() => {
    if (gameMode !== 'race') return;
    const interval = setInterval(() => {
        setRaceState(prev => {
            if (prev.timeLeft <= 0) { clearInterval(interval); endRace(false); return prev; }
            let newGates = prev.gates.map(g => ({ ...g, z: g.z + 0.8 }));
            let newScore = prev.score;
            let newTime = prev.timeLeft - 0.05;
            let shouldGenerateNewGates = false;
            let newProblem = prev.currentProblem;

            // Collision Check
            const playerZ = 4; 
            const hitGateIndex = newGates.findIndex(g => g.z > playerZ - 0.5 && g.z < playerZ + 0.5);
            
            if (hitGateIndex !== -1) {
                const hitGate = newGates[hitGateIndex];
                const pLane = playerX.current < 0 ? 'left' : 'right';
                if (pLane === hitGate.lane) {
                    if (hitGate.isCorrect) { 
                        newScore++; 
                        newTime += 5; 
                        setRaceFeedback('correct');
                        shouldGenerateNewGates = true;
                    } else { 
                        newTime -= 5;
                        setRaceFeedback('wrong');
                        shouldGenerateNewGates = true; 
                    }
                    setTimeout(() => setRaceFeedback(null), 500); 
                    newGates = newGates.filter(g => Math.abs(g.z - hitGate.z) > 1);
                }
            }

            // Clean & Spawn
            newGates = newGates.filter(g => g.z < 10);
            
            if (shouldGenerateNewGates || newGates.length === 0) {
                 if (shouldGenerateNewGates) {
                     newProblem = aiTutor.generateLocalProblem(gameState.levelSystem.level, 'race');
                 }

                 if (newGates.length === 0) {
                    const res = newProblem.result;
                    const wrong = res + 1; // Simplificato per evitare problemi di undefined
                    const correctLane = Math.random() > 0.5 ? 'left' : 'right';
                    newGates.push({ id: Date.now(), z: -40, lane: correctLane, value: res, isCorrect: true });
                    newGates.push({ id: Date.now()+1, z: -40, lane: correctLane==='left'?'right':'left', value: wrong, isCorrect: false });
                 }
            }

            if (newScore >= prev.targetScore) {
                clearInterval(interval);
                endRace(true);
                return prev;
            }

            return { ...prev, gates: newGates, timeLeft: newTime, score: newScore, currentProblem: newProblem };
        });
    }, 50);
    return () => clearInterval(interval);
  }, [gameMode, gameState.levelSystem.level]);

  const handlePointerMove = (e) => {
     if (gameMode !== 'race') return;
     const clientX = e.touches ? e.touches[0].clientX : e.clientX;
     playerX.current = (clientX / window.innerWidth) * 2 - 1;
  };

  const handleSuccess = async (type, time) => {
    setGameState(prev => {
      let earnedStars = 10;
      let newLevelSystem = { ...prev.levelSystem, currentStars: prev.levelSystem.currentStars + earnedStars };
      if (newLevelSystem.currentStars >= newLevelSystem.nextLevelStars) {
         setTimeout(() => startRace(), 500); 
         newLevelSystem.currentStars = newLevelSystem.nextLevelStars; 
      }
      return { ...prev, wallet: { money: prev.wallet.money + 10 }, levelSystem: newLevelSystem };
    });
    
    const newLevel = await aiTutor.evaluateLevel(gameState.difficulty?.mathLevel || 1);
    if (newLevel !== (gameState.difficulty?.mathLevel || 1)) {
        setGameState(prev => ({
            ...prev,
            difficulty: { ...prev.difficulty, mathLevel: newLevel }
        }));
    }
    speak("Evviva!");
  };

  const handleTravel = (envId, petId) => { setGameState(prev => ({ ...prev, activePetId: petId })); setActiveModal(null); speak(`Andiamo!`); };
  
  const handleBuy = (item) => { 
    if (gameState.wallet.money >= item.price) { 
      setGameState(prev => { 
        const env = PETS_INFO[prev.activePetId].defaultEnv; 
        const newDecor = { ...prev.decor }; 
        if(!newDecor[env]) newDecor[env] = {}; 
        newDecor[env][item.type] = item; 
        return { ...prev, wallet: { money: prev.wallet.money - item.price }, inventory: [...prev.inventory, item.id], decor: newDecor }; 
      }); 
      speak("Grazie!"); 
    } 
  };
  
  const handleUpdateApp = () => { if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(regs => { for(let reg of regs) reg.unregister(); window.location.reload(true); }); else window.location.reload(true); };
  const handleInstallClick = async () => { if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') setDeferredPrompt(null); } };
  const handleUpdateProfile = (newInfo) => { setGameState(prev => ({ ...prev, userInfo: newInfo })); };

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeModal) return;
      const mood = gameState.petsData[gameState.activePetId].stats.health < 40 ? 'sick' : gameState.petsData[gameState.activePetId].stats.hunger < 40 ? 'hungry' : 'happy';
      const phrases = PET_PHRASES[mood];
      const txt = phrases[Math.floor(Math.random() * phrases.length)];
      setPetThought(txt); speak(txt); setTimeout(() => setPetThought(null), 4000);
    }, 15000);
    return () => clearInterval(interval);
  }, [gameState.petsData, gameState.activePetId, activeModal, speak]);

  const activePetInfo = PETS_INFO[gameState.activePetId];
  const activePetData = gameState.petsData[gameState.activePetId];
  const activeEnv = ENVIRONMENTS[activePetInfo.defaultEnv];
  const activeDecor = gameState.decor[activePetInfo.defaultEnv] || {};
  const currentMathLevel = gameState.difficulty?.mathLevel || 1;
  const displayName = gameState.userInfo?.nickname || "Piccola Maga";

  return (
    <div 
        className={`fixed inset-0 ${gameMode === 'race' ? 'bg-slate-900' : activeEnv.colors.bg} font-sans text-slate-800 flex flex-col overflow-hidden select-none transition-colors duration-1000`}
        style={{ touchAction: 'none' }}
        onPointerMove={handlePointerMove}
        onTouchMove={handlePointerMove}
    >
        <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 2, 10], fov: 60 }} dpr={[1, 2]}>
               {gameMode === 'race' ? (
                   <RaceScene petEmoji={activePetInfo.emoji} gates={raceState.gates} playerX={playerX} />
               ) : (
                   <>
                      <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.1} maxDistance={15} minDistance={5} enablePan={false} />
                      <Room3D decor={activeDecor} petEmoji={activePetInfo.emoji} envId={activePetInfo.defaultEnv} />
                   </>
               )}
            </Canvas>
        </div>

        {/* FEEDBACK OVERLAY (Gara) */}
        {raceFeedback && (
            <div className={`absolute inset-0 z-50 pointer-events-none opacity-50 ${raceFeedback === 'correct' ? 'bg-green-500' : 'bg-red-500 animate-shake'}`}></div>
        )}
        
        {/* UI Overlay per Gara */}
        {gameMode === 'race' && (
            <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center pt-10">
                <div className="bg-white/90 px-8 py-4 rounded-3xl border-4 border-indigo-500 shadow-xl">
                    <div className="text-4xl font-black text-indigo-900">{raceState.currentProblem?.text}</div>
                </div>
                {raceFeedback === 'correct' && <div className="absolute top-1/2 text-6xl font-black text-green-400 drop-shadow-lg animate-bounce">+5s</div>}
                {raceFeedback === 'wrong' && <div className="absolute top-1/2 text-6xl font-black text-red-500 drop-shadow-lg animate-shake">-5s</div>}
                
                <div className="absolute top-4 right-4 text-white font-bold text-xl">
                    ⏱️ {Math.ceil(raceState.timeLeft)}s
                </div>
                <div className="absolute bottom-20 text-white/50 text-xl animate-pulse">
                    &lt; TRASCINA PER MUOVERTI &gt;
                </div>
            </div>
        )}
        
        {/* UI Normale */}
        {gameMode === 'normal' && (
             <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pb-6 z-10">
                <div className="px-4 py-4 flex justify-between items-start pointer-events-auto">
                    <GlassCard onClick={() => setActiveModal('profile')} className="flex items-center gap-3 px-4 py-2 rounded-2xl !border-white/40 min-w-[140px] cursor-pointer hover:bg-white/40 transition-colors">
                        <div className="bg-indigo-100 p-1.5 rounded-full"><User size={16} className="text-indigo-600"/></div>
                        <div className="flex flex-col w-full"><span className="font-bold text-sm text-indigo-900">{displayName}</span><LevelBar current={gameState.levelSystem.currentStars} max={gameState.levelSystem.nextLevelStars} /><div className="text-[9px] text-indigo-500 font-bold text-right mt-0.5">Lvl {gameState.levelSystem.level}</div></div>
                    </GlassCard>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveModal('map')} className="p-3 rounded-full bg-white/20 backdrop-blur border border-white/30 text-white shadow-lg active:scale-95"><MapIcon size={20} /></button>
                        {updateAvailable && <button onClick={handleUpdateApp} className="p-3 rounded-full bg-green-500 text-white shadow-lg animate-pulse"><RefreshCw size={20} className="animate-spin" /></button>}
                        {deferredPrompt && <button onClick={handleInstallClick} className="p-3 rounded-full bg-indigo-600 text-white shadow-lg animate-pulse active:scale-95"><Download size={20} /></button>}
                        <button onClick={() => setIsMuted(!isMuted)} className="p-3 rounded-full bg-white/20 backdrop-blur border border-white/30 shadow-lg text-white hover:bg-white/30 transition active:scale-95">{isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
                        <GlassCard className="flex items-center gap-2 px-3 py-2 rounded-full !bg-emerald-500/80 !border-emerald-300 shadow-lg"><Coins size={18} className="text-emerald-200 fill-white"/><span className="font-black text-white text-md">{Math.floor(gameState.wallet.money)}</span></GlassCard>
                    </div>
                </div>

                <div className="relative w-full flex justify-center pointer-events-none h-10">
                   {petThought && <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl rounded-bl-none shadow-lg animate-bounce-in border border-indigo-100"><p className="font-bold text-indigo-900 text-sm">{petThought}</p></div>}
                </div>

                <div className="px-4 pointer-events-auto mt-auto">
                     <div className="flex justify-end mb-4"><button onClick={() => setActiveModal('shop')} className="bg-white p-3 rounded-full shadow-xl border-4 border-emerald-300 text-emerald-600 active:scale-95 animate-bounce-in"><ShoppingBag size={24} /></button></div>
                     <GlassCard className="p-4 rounded-3xl !bg-white/60">
                        <div className="flex justify-between items-center mb-2 px-1"><span className="text-xs font-black uppercase text-indigo-900 opacity-50">{activeEnv.name}</span><span className="text-xs font-black uppercase text-indigo-900 opacity-50">{activePetInfo.name}</span></div>
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
                
                {/* Debug Test Gara */}
                <div className="absolute top-20 left-4 pointer-events-auto opacity-20 hover:opacity-100 transition-opacity">
                    <button onClick={startRace} className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded">Test Gara</button>
                </div>
                
                <div className="absolute bottom-1 right-2 text-[8px] text-white/20 pointer-events-none">v{APP_VERSION}</div>
             </div>
        )}

        {gameMode === 'normal' && (
          <>
            <MathModal isOpen={['food', 'play', 'heal'].includes(activeModal)} type={activeModal} difficultyLevel={currentMathLevel} rewardItem={currentReward} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
            <ShopModal isOpen={activeModal === 'shop'} onClose={() => setActiveModal(null)} wallet={gameState.wallet} inventory={gameState.inventory} onBuy={handleBuy} level={gameState.levelSystem.level} />
            <MapModal isOpen={activeModal === 'map'} onClose={() => setActiveModal(null)} currentEnv={activePetInfo.defaultEnv} unlockedPets={gameState.unlockedPets} onTravel={handleTravel} />
            <ProfileModal isOpen={activeModal === 'profile'} onClose={() => setActiveModal(null)} userInfo={gameState.userInfo} onSave={handleUpdateProfile} />
          </>
        )}
    </div>
  );
}
