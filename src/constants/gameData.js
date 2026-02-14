export const REPO_BASE = '/games-rifugioIncantato';
export const APP_VERSION = '1.6.2';

export const ENVIRONMENTS = {
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

export const PETS_INFO = {
    fox: { id: 'fox', name: "Batuffolo", emoji: "🦊", defaultEnv: 'room' },
    dragon: { id: 'dragon', name: "Scintilla", emoji: "🐲", defaultEnv: 'forest' },
    turtle: { id: 'turtle', name: "Guscio", emoji: "🐢", defaultEnv: 'beach' },
    user: { id: 'user', name: "Io", emoji: "👤", defaultEnv: 'room' }
};

export const PET_PHRASES = {
    hungry: ["Pancino vuoto...", "Ho fame!", "Cibo?"],
    bored: ["Che noia...", "Giochiamo?", "Uffa..."],
    sick: ["Non sto bene...", "Aiuto...", "Gulp..."],
    happy: ["Sei mitica!", "Ti voglio bene!", "Evviva!"],
    sleepy: ["Zzz...", "Nanna..."],
    intro: ["Ciao!", "Eccomi!"]
};

export const FOOD_ITEMS = [
    { name: "Mela", emoji: "🍎", value: 15 },
    { name: "Burger", emoji: "🍔", value: 35 },
    { name: "Pizza", emoji: "🍕", value: 30 },
    { name: "Gelato", emoji: "🍦", value: 20 },
    { name: "Carota", emoji: "🥕", value: 10 },
    { name: "Sushi", emoji: "🍣", value: 25 },
    { name: "Dolce", emoji: "🍩", value: 15 },
];

export const TOYS = [
    { name: "Palla", emoji: "⚽" },
    { name: "Game", emoji: "🎮" },
    { name: "Aquilone", emoji: "🪁" },
];

export const MEDICINES = [
    { name: "Sciroppo", emoji: "🧪" },
    { name: "Cerotto", emoji: "🩹" },
    { name: "Magia", emoji: "💊" },
];

export const MARKET_ITEMS = {
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

export const INITIAL_GAME_STATE = {
    userInfo: { name: "", surname: "", age: 9, school: "", class: "", gender: "F", nickname: "Piccola Maga", photoURL: null, avatarSVG: null, avatarEmoji: null },
    levelSystem: { level: 1, currentStars: 0, nextLevelStars: 50 },
    wallet: { money: 100 },
    inventory: [],
    unlockedPets: ['fox', 'user'],
    activePetId: 'fox',
    petsData: {
        fox: { stats: { health: 80, hunger: 60, happiness: 90 }, status: "normal" },
        dragon: { stats: { health: 100, hunger: 100, happiness: 100 }, status: "normal" },
        turtle: { stats: { health: 100, hunger: 100, happiness: 100 }, status: "normal" },
        user: { stats: { health: 100, hunger: 100, happiness: 100 }, status: "normal" }
    },
    decor: { room: {}, forest: {}, beach: {} },
    difficulty: { mathLevel: 1, streak: 0 },
    lastLogin: new Date().toISOString()
};
