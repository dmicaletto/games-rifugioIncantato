import React from 'react';

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

export default StatBar;
