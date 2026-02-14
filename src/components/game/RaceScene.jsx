import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html, Stars, Float } from '@react-three/drei';

const RaceScene = ({ progress, petEmoji, rivals }) => {
    const starRef = useRef();

    useFrame((state) => {
        if (starRef.current) {
            starRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
        }
    });

    // Pista spaziale
    const trackWidth = 8;
    const trackLength = 20;

    return (
        <>
            <color attach="background" args={['#0f172a']} />
            <ambientLight intensity={0.8} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#818cf8" />

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            <group ref={starRef}>
                {/* Pista di luce */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -trackLength / 2 + 2]}>
                    <planeGeometry args={[trackWidth, trackLength]} />
                    <meshStandardMaterial color="#4f46e5" transparent opacity={0.2} />
                </mesh>
            </group>

            {/* Traguardo */}
            <Billboard position={[0, 1, -trackLength + 2]}>
                <Html transform center>
                    <div className="bg-white/10 backdrop-blur-md px-10 py-4 rounded-[2rem] border-4 border-dashed border-indigo-400/50">
                        <span className="text-8xl">🏁</span>
                    </div>
                </Html>
            </Billboard>

            {/* Giocatore */}
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                <Billboard position={[(progress / 100) * trackWidth - trackWidth / 2, 1, - (progress / 100) * (trackLength - 2) + 2]}>
                    <Html transform center pointerEvents="none">
                        <div className="flex flex-col items-center">
                            <div className="text-9xl drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] filter">
                                {petEmoji || "👤"}
                            </div>
                            <div className="mt-4 bg-indigo-600 px-4 py-1 rounded-full text-white font-black text-xs uppercase tracking-widest shadow-lg">TU</div>
                        </div>
                    </Html>
                </Billboard>
            </Float>

            {/* Rivali AI */}
            {rivals.map((rival, idx) => (
                <Billboard
                    key={idx}
                    position={[
                        (idx % 2 === 0 ? -2.5 : 2.5),
                        0.8,
                        - (rival.progress / 100) * (trackLength - 2) + 2
                    ]}
                >
                    <Html transform center>
                        <div className="flex flex-col items-center opacity-60 grayscale-[0.5]">
                            <div className="text-7xl">{rival.emoji}</div>
                            <div className="mt-2 bg-slate-700 px-2 py-0.5 rounded-full text-[8px] text-white font-bold">{rival.name}</div>
                        </div>
                    </Html>
                </Billboard>
            ))}
        </>
    );
};

export default RaceScene;
