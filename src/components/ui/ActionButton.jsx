import React from 'react';

const ActionButton = ({ icon: Icon, label, color, gradient, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`relative flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-300 transform active:scale-95 ${disabled ? 'opacity-50 grayscale bg-white/10' : `${gradient} shadow-lg`} `}
        style={{ minHeight: '80px' }}
    >
        <Icon size={24} className="text-white drop-shadow-md mb-1" />
        <span className="font-bold text-[10px] text-white drop-shadow-md">{label}</span>
    </button>
);

export default ActionButton;
