import React from 'react';
import { Html } from '@react-three/drei';

const RaceGate = ({ position, text, color }) => {
    return (
        <group position={position}>
            {/* Ring */}
            <mesh>
                <torusGeometry args={[1.5, 0.15, 16, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </mesh>

            {/* Glow center */}
            <mesh>
                <circleGeometry args={[1.4, 32]} />
                <meshBasicMaterial color={color} opacity={0.1} transparent />
            </mesh>

            {/* Text */}
            <Html position={[0, 0, 0.1]} transform center pointerEvents="none">
                <div className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] select-none" style={{ fontFamily: 'Arial Black, sans-serif' }}>
                    {text}
                </div>
            </Html>

            {/* Decorative particles around the ring would be nice, but let's keep it clean */}
        </group>
    );
};

export default RaceGate;
