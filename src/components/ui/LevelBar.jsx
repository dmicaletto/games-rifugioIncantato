import React from 'react';

const LevelBar = ({ current, max }) => (
    <div className="w-full mt-1">
        <div className="h-1.5 w-full bg-indigo-900/20 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (current / max) * 100)}%` }} />
        </div>
    </div>
);

export default LevelBar;
