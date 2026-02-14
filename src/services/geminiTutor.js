// --- MOTORE AI ---
class GeminiTutor {
    constructor() {
        this.history = [];
        this.apiKey = null;
    }

    setApiKey(key) { this.apiKey = key; }

    recordAnswer(type, problem, isCorrect, timeTaken) {
        this.history.push({
            type,
            problemText: problem.text,
            result: problem.result,
            isCorrect,
            timeTaken,
            timestamp: Date.now()
        });
        if (this.history.length > 20) this.history.shift();
    }

    async generateProblem(level, type, userInfo = {}) {
        const localProblem = this.generateLocalProblem(level, type);
        if (!this.apiKey) return localProblem;

        try {
            const prompt = `
                Sei un tutor di matematica per un bambino.
                INFO STUDENTE: Età ${userInfo.age || 9} anni, Classe ${userInfo.class || 'non specificata'}.
                Tipo: ${type}. Livello: ${level}.
                Rispondi SOLO JSON: { "text": "...", "result": numero }
            `;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });
            const data = await response.json();
            return JSON.parse(data.candidates[0].content.parts[0].text);
        } catch (e) {
            return localProblem;
        }
    }

    async generateDialogue(gameState, petInfo, userInfo = {}) {
        if (!this.apiKey) return null;
        try {
            const prompt = `Sei ${petInfo.name} ${petInfo.emoji}. Parla con ${userInfo.nickname || 'amico'} (età ${userInfo.age}). Stato: Salute ${gameState.petStats.health}. Max 10 parole.`;
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await response.json();
            return data.candidates[0].content.parts[0].text.trim();
        } catch (e) { return null; }
    }

    generateLocalProblem(level, type) {
        const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        let n1, n2, operator, result;
        const maxNum = 10 + (level * 5);
        if (type === 'food' || type === 'heal') {
            operator = Math.random() > 0.5 ? '+' : '-'; n1 = rnd(1, maxNum); n2 = rnd(1, maxNum);
            if (operator === '-' && n1 < n2) [n1, n2] = [n2, n1]; result = operator === '+' ? n1 + n2 : n1 - n2;
        } else if (type === 'play') {
            operator = '×'; n1 = rnd(1, Math.min(10, 2 + level)); n2 = rnd(1, 10); result = n1 * n2;
        } else {
            operator = ':'; n2 = rnd(2, Math.min(9, 1 + level)); result = rnd(1, 10); n1 = n2 * result;
        }
        return { text: `${n1} ${operator} ${n2}`, result };
    }

    async evaluateLevel(currentLevel) {
        if (this.history.length < 5) return currentLevel;
        const last5 = this.history.slice(-5);
        const correctCount = last5.filter(h => h.isCorrect).length;
        if (correctCount === 5) return currentLevel + 1;
        if (correctCount < 2 && currentLevel > 1) return currentLevel - 1;
        return currentLevel;
    }
}

export const aiTutor = new GeminiTutor();
export default GeminiTutor;
