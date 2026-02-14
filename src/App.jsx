import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  Heart, Smile, Utensils, Gamepad2, User, Activity,
  Volume2, VolumeX, ShoppingBag, Coins, Download, RefreshCw,
  Map as MapIcon
} from 'lucide-react';
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

// Services
import { auth, db, appId } from './services/firebase';
import { aiTutor } from './services/geminiTutor';

// Constants
import {
  REPO_BASE, APP_VERSION, ENVIRONMENTS, PETS_INFO,
  PET_PHRASES, FOOD_ITEMS, TOYS, MEDICINES,
  INITIAL_GAME_STATE
} from './constants/gameData';

// UI Components
import GlassCard from './components/ui/GlassCard';
import StatBar from './components/ui/StatBar';
import LevelBar from './components/ui/LevelBar';
import ActionButton from './components/ui/ActionButton';

// Game Components
import RaceScene from './components/game/RaceScene';
import Room3D from './components/game/Room3D';

// Modals
import ProfileModal from './components/modals/ProfileModal';
import ShopModal from './components/modals/ShopModal';
import MapModal from './components/modals/MapModal';
import MathModal from './components/modals/MathModal';
import LoginModal from './components/modals/LoginModal';

import { setDoc } from "firebase/firestore";

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
      return onAuthStateChanged(auth, (u) => {
        setUser(u);
        if (!u) setActiveModal('login');
      });
    }
  }, []);

  useEffect(() => {
    if (!db || !user) return;
    getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'secrets')).then(snap => {
      if (snap.exists() && snap.data().gemini_key) aiTutor.setApiKey(snap.data().gemini_key);
    });
    const saveRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'gameState');
    const unsub = onSnapshot(saveRef, (docSnap) => {
      if (docSnap.exists() && !activeModal) {
        setGameState(prev => ({ ...INITIAL_GAME_STATE, ...docSnap.data() }));
      }
    });
    return () => unsub();
  }, [user, activeModal]);

  useEffect(() => {
    const saved = localStorage.getItem('rifugio_v10_login');
    if (saved) { try { setGameState(prev => ({ ...prev, ...JSON.parse(saved) })); } catch (e) { } }
  }, []);

  // Sync with Firestore (Throttled)
  useEffect(() => {
    if (!user || !db) return;
    const saveToFirebase = async () => {
      try {
        const saveRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'gameState');
        await setDoc(saveRef, gameState, { merge: true });
        localStorage.setItem('rifugio_v10_login', JSON.stringify(gameState));
      } catch (e) { console.error("Sync error:", e); }
    };
    const timeout = setTimeout(saveToFirebase, 5000);
    return () => clearTimeout(timeout);
  }, [gameState, user]);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); });
    const checkVersion = async () => {
      try {
        const res = await fetch(`${REPO_BASE}/version.json?t=${Date.now()}`);
        if (res.ok && (await res.json()).version !== APP_VERSION) setUpdateAvailable(true);
      } catch (e) { }
    };
    checkVersion();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register(`${REPO_BASE}/sw.js`).catch(() => { });
  }, []);

  const startRace = async () => {
    setGameMode('race');
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

        // Speed multiplier based on progress/score
        const speedMult = 1 + (prev.score * 0.15);
        let newGates = prev.gates.map(g => ({ ...g, z: g.z + (0.8 * speedMult) }));
        let newScore = prev.score;
        let newTime = prev.timeLeft - 0.05;
        let shouldGenerateNewGates = false;
        let newProblem = prev.currentProblem;

        const playerZ = 4;
        const hitGateIndex = newGates.findIndex(g => g.z > playerZ - 0.7 && g.z < playerZ + 0.3);

        if (hitGateIndex !== -1) {
          const hitGate = newGates[hitGateIndex];
          const pLane = playerX.current < 0 ? 'left' : 'right';
          if (pLane === hitGate.lane) {
            if (hitGate.isCorrect) {
              newScore++;
              newTime += 3; // Reduced bonus to keep it challenging
              setRaceFeedback('correct');
              shouldGenerateNewGates = true;
            } else {
              newTime -= 8; // Increased penalty
              setRaceFeedback('wrong');
              shouldGenerateNewGates = true;
            }
            setTimeout(() => setRaceFeedback(null), 500);
            newGates = newGates.filter(g => Math.abs(g.z - hitGate.z) > 1);
          }
        }

        newGates = newGates.filter(g => g.z < 10);

        if (shouldGenerateNewGates || (newGates.length === 0 && prev.timeLeft > 0)) {
          if (shouldGenerateNewGates || !newProblem) {
            newProblem = aiTutor.generateLocalProblem(gameState.levelSystem.level, 'race');
          }

          if (newGates.length === 0) {
            const res = newProblem.result;
            const wrong = res + (Math.random() > 0.5 ? 1 : -1);
            const correctLane = Math.random() > 0.5 ? 'left' : 'right';
            const spawnZ = -50; // Spawn further back
            newGates.push({ id: Date.now(), z: spawnZ, lane: correctLane, value: res, isCorrect: true });
            newGates.push({ id: Date.now() + 1, z: spawnZ, lane: correctLane === 'left' ? 'right' : 'left', value: wrong, isCorrect: false });
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

    setGameState(prev => {
      const petId = prev.activePetId;
      const newPetsData = { ...prev.petsData };
      const stats = { ...newPetsData[petId].stats };

      if (type === 'food') stats.hunger = Math.min(100, stats.hunger + 30);
      if (type === 'heal') stats.health = Math.min(100, stats.health + 40);
      if (type === 'play') stats.happiness = Math.min(100, stats.happiness + 25);

      newPetsData[petId] = { ...newPetsData[petId], stats };

      return {
        ...prev,
        petsData: newPetsData,
        difficulty: { ...prev.difficulty, mathLevel: newLevel }
      };
    });

    speak("Evviva!");
  };

  // Degrado statistiche nel tempo
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => {
        const newPetsData = { ...prev.petsData };
        Object.keys(newPetsData).forEach(id => {
          const s = newPetsData[id].stats;
          newPetsData[id].stats = {
            health: Math.max(0, s.health - 0.2),
            hunger: Math.max(0, s.hunger - 0.5),
            happiness: Math.max(0, s.happiness - 0.3)
          };
        });
        return { ...prev, petsData: newPetsData };
      });
    }, 10000); // Ogni 10 secondi calano un po'
    return () => clearInterval(interval);
  }, []);

  const handleTravel = (envId, petId) => { setGameState(prev => ({ ...prev, activePetId: petId })); setActiveModal(null); speak(`Andiamo!`); };

  const handleBuy = (item) => {
    if (gameState.wallet.money >= item.price) {
      setGameState(prev => {
        const env = PETS_INFO[prev.activePetId].defaultEnv;
        const newDecor = { ...prev.decor };
        if (!newDecor[env]) newDecor[env] = {};
        newDecor[env][item.id] = { ...item };
        return { ...prev, wallet: { money: prev.wallet.money - item.price }, inventory: [...prev.inventory, item.id], decor: newDecor };
      });
      speak("Grazie!");
    }
  };

  const handleUpdateApp = () => { if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(regs => { for (let reg of regs) reg.unregister(); window.location.reload(true); }); else window.location.reload(true); };
  const handleInstallClick = async () => { if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') setDeferredPrompt(null); } };
  const handleUpdateProfile = (newInfo) => { setGameState(prev => ({ ...prev, userInfo: newInfo })); };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (activeModal) return;

      let txt = null;
      if (aiTutor.apiKey) {
        const petData = {
          petStats: gameState.petsData[gameState.activePetId].stats,
          money: gameState.wallet.money
        };
        const petInfo = PETS_INFO[gameState.activePetId];
        txt = await aiTutor.generateDialogue(petData, petInfo, gameState.userInfo);
      }

      if (!txt) {
        const mood = gameState.petsData[gameState.activePetId].stats.health < 40 ? 'sick' : gameState.petsData[gameState.activePetId].stats.hunger < 40 ? 'hungry' : 'happy';
        const phrases = PET_PHRASES[mood];
        txt = phrases[Math.floor(Math.random() * phrases.length)];
      }

      setPetThought(txt);
      speak(txt);
      setTimeout(() => setPetThought(null), 5000);
    }, 20000);
    return () => clearInterval(interval);
  }, [gameState.petsData, gameState.activePetId, activeModal, speak, gameState.wallet.money]);

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
        <Canvas camera={{ position: [0, 8, 12], fov: 45 }} dpr={[1, 2]}>
          {gameMode === 'race' ? (
            <RaceScene
              petEmoji={activePetInfo.id === 'user' ? (gameState.userInfo.avatarEmoji || "👤") : activePetInfo.emoji}
              gates={raceState.gates}
              playerX={playerX}
            />
          ) : (
            <Room3D
              decor={activeDecor}
              petEmoji={activePetInfo.id === 'user' ? (gameState.userInfo.avatarEmoji || "👤") : activePetInfo.emoji}
              envId={activePetInfo.defaultEnv}
              onMoveItem={(itemId, newPos) => {
                setGameState(prev => {
                  const env = PETS_INFO[prev.activePetId].defaultEnv;
                  const newDecor = { ...prev.decor };
                  if (newDecor[env] && newDecor[env][itemId]) {
                    newDecor[env][itemId] = { ...newDecor[env][itemId], pos: newPos };
                  }
                  return { ...prev, decor: newDecor };
                });
              }}
            />
          )}
        </Canvas>
      </div>

      {raceFeedback && (
        <div className={`absolute inset-0 z-50 pointer-events-none opacity-50 ${raceFeedback === 'correct' ? 'bg-green-500' : 'bg-red-500 animate-shake'}`}></div>
      )}

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

      {gameMode === 'normal' && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pb-6 z-10">
          <div className="px-4 py-4 flex justify-between items-start pointer-events-auto">
            <GlassCard onClick={() => setActiveModal('profile')} className="flex items-center gap-3 px-4 py-2 rounded-2xl !border-white/40 min-w-[140px] cursor-pointer hover:bg-white/40 transition-colors">
              <div className="bg-indigo-100 p-1.5 rounded-full"><User size={16} className="text-indigo-600" /></div>
              <div className="flex flex-col w-full">
                <span className="font-bold text-sm text-indigo-900">{displayName}</span>
                <LevelBar current={gameState.levelSystem.currentStars} max={gameState.levelSystem.nextLevelStars} />
                <div className="text-[9px] text-indigo-500 font-bold text-right mt-0.5">Lvl {gameState.levelSystem.level}</div>
              </div>
            </GlassCard>
            <div className="flex gap-2">
              <button onClick={() => setActiveModal('map')} className="p-3 rounded-full bg-white/20 backdrop-blur border border-white/30 text-white shadow-lg active:scale-95"><MapIcon size={20} /></button>
              {updateAvailable && <button onClick={handleUpdateApp} className="p-3 rounded-full bg-green-500 text-white shadow-lg animate-pulse"><RefreshCw size={20} className="animate-spin" /></button>}
              {deferredPrompt && <button onClick={handleInstallClick} className="p-3 rounded-full bg-indigo-600 text-white shadow-lg animate-pulse active:scale-95"><Download size={20} /></button>}
              <button onClick={() => setIsMuted(!isMuted)} className="p-3 rounded-full bg-white/20 backdrop-blur border border-white/30 shadow-lg text-white hover:bg-white/30 transition active:scale-95">{isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
              <GlassCard className="flex items-center gap-2 px-3 py-2 rounded-full !bg-emerald-500/80 !border-emerald-300 shadow-lg"><Coins size={18} className="text-emerald-200 fill-white" /><span className="font-black text-white text-md">{Math.floor(gameState.wallet.money)}</span></GlassCard>
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

          <div className="absolute top-20 left-4 pointer-events-auto opacity-20 hover:opacity-100 transition-opacity">
            <button onClick={startRace} className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded">Test Gara</button>
          </div>

          <div className="absolute bottom-1 right-2 text-[8px] text-white/20 pointer-events-none">v{APP_VERSION}</div>
        </div>
      )}

      {gameMode === 'normal' && (
        <>
          <MathModal isOpen={['food', 'play', 'heal'].includes(activeModal)} type={activeModal} difficultyLevel={currentMathLevel} rewardItem={currentReward} userInfo={gameState.userInfo} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
          <ShopModal isOpen={activeModal === 'shop'} onClose={() => setActiveModal(null)} wallet={gameState.wallet} inventory={gameState.inventory} onBuy={handleBuy} level={gameState.levelSystem.level} />
          <MapModal isOpen={activeModal === 'map'} onClose={() => setActiveModal(null)} currentEnv={activePetInfo.defaultEnv} unlockedPets={gameState.unlockedPets} onTravel={handleTravel} userAvatar={gameState.userInfo} />
          <ProfileModal isOpen={activeModal === 'profile'} onClose={() => setActiveModal(null)} userInfo={gameState.userInfo} onSave={handleUpdateProfile} />
          <LoginModal isOpen={activeModal === 'login'} onClose={() => setActiveModal(null)} />
        </>
      )}
    </div>
  );
}
