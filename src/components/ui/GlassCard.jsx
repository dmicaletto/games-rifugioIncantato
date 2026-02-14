import React from 'react';

const GlassCard = ({ children, className = "", onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white/30 backdrop-blur-md border border-white/50 shadow-xl rounded-3xl ${className} ${onClick ? 'cursor-pointer hover:bg-white/40 transition-colors' : ''}`}
    >
        {children}
    </div>
);

export default GlassCard;
