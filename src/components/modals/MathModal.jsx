import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { aiTutor } from '../../services/geminiTutor';

const MathModal = ({ isOpen, type, difficultyLevel, rewardItem, userInfo, onClose, onSuccess }) => {
    const [problem, setProblem] = useState(null);
    const [answer, setAnswer] = useState("");
    const [feedback, setFeedback] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const startTime = useRef(Date.now());
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true); setAnswer(""); setFeedback(null); setProblem(null);
            aiTutor.generateProblem(difficultyLevel, type, userInfo).then(prob => {
                setProblem(prob); setIsLoading(false); startTime.current = Date.now();
                setTimeout(() => inputRef.current?.focus(), 100);
            });
        }
    }, [isOpen, difficultyLevel, type, userInfo]);

    const checkAnswer = () => {
        if (!problem) return;
        const timeTaken = (Date.now() - startTime.current) / 1000;
        if (parseInt(answer) === problem.result) {
            aiTutor.recordAnswer(type, problem, true, timeTaken);
            setFeedback('correct');
            setTimeout(() => { onSuccess(type, timeTaken); onClose(); }, 800);
        } else {
            aiTutor.recordAnswer(type, problem, false, timeTaken);
            setFeedback('wrong'); setAnswer("");
            setTimeout(() => setFeedback(null), 1000);
        }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ zIndex: 200 }}>
            <div className={`bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl relative transform transition-all ${feedback === 'wrong' ? 'animate-shake border-4 border-red-300' : 'border-4 border-white'}`}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
                <div className="text-center mb-6 pt-2"><h3 className="text-xl font-bold text-indigo-900">Risolvi per {rewardItem?.emoji}</h3></div>
                <div className="bg-indigo-50 rounded-2xl p-6 mb-6 text-center border-2 border-indigo-100 min-h-[120px] flex items-center justify-center">
                    {isLoading ? (
                        <div className="animate-pulse text-indigo-400 font-bold">Generazione magica... ✨</div>
                    ) : (
                        <span className={`font-black text-indigo-600 ${problem?.text.length > 10 ? 'text-xl' : 'text-5xl'}`}>
                            {problem?.text}
                        </span>
                    )}
                </div>
                {!isLoading && (
                    <div className="flex gap-2 w-full">
                        <input
                            ref={inputRef}
                            type="tel"
                            value={answer}
                            onChange={e => setAnswer(e.target.value)}
                            className="flex-1 min-w-0 text-center text-3xl font-black py-3 rounded-2xl border-4 border-indigo-100 outline-none text-indigo-900"
                            placeholder="?"
                        />
                        <button onClick={checkAnswer} className="bg-green-500 text-white rounded-2xl px-6 font-bold shadow-lg shrink-0">OK</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MathModal;
