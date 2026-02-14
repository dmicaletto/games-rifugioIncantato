import React, { useState } from 'react';
import { Billboard, Html } from '@react-three/drei';
import { ENVIRONMENTS } from '../../constants/gameData';

const Room3D = ({ decor, petEmoji, envId, onMoveItem }) => {
    const env = ENVIRONMENTS[envId] || ENVIRONMENTS.room;
    const [selectedId, setSelectedId] = useState(null);

    const handleFloorClick = (e) => {
        if (selectedId) {
            const point = e.point;
            const x = Math.max(-5.5, Math.min(5.5, point.x));
            const z = Math.max(-5.5, Math.min(5.5, point.z));
            onMoveItem(selectedId, [x, decor[selectedId].pos[1], z]);
            setSelectedId(null);
        }
    };

    return (
        <>
            <ambientLight intensity={1.2} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} />

            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0, 0]}
                onPointerDown={handleFloorClick}
            >
                <planeGeometry args={[12, 12]} />
                <meshStandardMaterial color={env.colors.floor} />
            </mesh>

            <gridHelper args={[12, 12, env.gridColor, env.gridColor]} position={[0, 0.01, 0]} />

            {envId === 'room' ? (
                <>
                    <mesh position={[0, 3, -6]}><boxGeometry args={[12, 6, 0.1]} /><meshStandardMaterial color={env.colors.wall} /></mesh>
                    <mesh position={[-6, 3, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[12, 6, 0.1]} /><meshStandardMaterial color="#a5b4fc" /></mesh>
                    <mesh position={[6, 3, 0]} rotation={[0, -Math.PI / 2, 0]}><boxGeometry args={[12, 6, 0.1]} /><meshStandardMaterial color="#a5b4fc" /></mesh>
                </>
            ) : (
                <Billboard position={[0, 2, -6]} scale={6}><Html pointerEvents="none"><div className="text-[100px]">{envId === 'forest' ? '🌳' : '🌊'}</div></Html></Billboard>
            )}

            {/* The Pet / Avatar */}
            <Billboard position={[0, 1.2, 0]} follow={true}>
                <Html transform center pointerEvents="none">
                    <div className="text-[120px] drop-shadow-xl select-none">{petEmoji || "👤"}</div>
                </Html>
            </Billboard>

            {/* Decoration Items */}
            {Object.values(decor || {}).map((item) => {
                const isSelected = selectedId === item.id;

                const handleItemClick = (e) => {
                    e.stopPropagation();
                    setSelectedId(isSelected ? null : item.id);
                };

                const itemStyle = {
                    fontSize: `${item.scale * 40}px`,
                    filter: isSelected ? 'drop-shadow(0 0 20px white) brightness(1.2)' : 'drop-shadow(0 5px 10px rgba(0,0,0,0.3))',
                    transform: isSelected ? 'scale(1.2) translateY(-20px)' : 'scale(1)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    cursor: 'pointer',
                    opacity: selectedId && !isSelected ? 0.6 : 1
                };

                if (item.isFlat) {
                    return (
                        <group key={item.id} position={item.pos} rotation={[-Math.PI / 2, 0, 0]} onClick={handleItemClick}>
                            <Html transform center pointerEvents="none">
                                <div style={{ ...itemStyle, transform: isSelected ? 'scale(1.2)' : 'scale(1)', opacity: isSelected ? 0.7 : 0.9 }}>
                                    {item.emoji}
                                </div>
                            </Html>
                        </group>
                    );
                }

                if (item.isWall && envId !== 'room') return null;

                return (
                    <Billboard key={item.id} position={item.pos} follow={true} onClick={handleItemClick}>
                        <Html transform center pointerEvents="none">
                            <div style={itemStyle}>{item.emoji}</div>
                            {isSelected && (
                                <div className="absolute top-full mt-4 bg-white/90 px-3 py-1 rounded-full text-[10px] font-bold text-indigo-600 shadow-lg animate-bounce border border-indigo-200">
                                    SPOSTAMI!
                                </div>
                            )}
                        </Html>
                    </Billboard>
                );
            })}

            {selectedId && (
                <Html position={[0, 6, 0]} center>
                    <div className="bg-indigo-600 text-white px-6 py-2 rounded-2xl font-black shadow-2xl animate-pulse text-sm uppercase tracking-widest border-2 border-white">
                        Seleziona un punto sul pavimento
                    </div>
                </Html>
            )}
        </>
    );
};

export default Room3D;
