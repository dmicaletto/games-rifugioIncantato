import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const WarpSpeed = () => {
    const count = 600;
    const mesh = useRef();

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 2 + Math.random() * 20;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = -Math.random() * 100;
            const speed = 40 + Math.random() * 60;
            temp.push({ x, y, z, speed });
        }
        return temp;
    }, []);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        particles.forEach((particle, i) => {
            particle.z += particle.speed * delta;

            if (particle.z > 20) {
                particle.z = -80;
            }

            dummy.position.set(particle.x, particle.y, particle.z);

            // Stretch based on speed
            const scaleZ = (particle.speed / 20);
            dummy.scale.set(0.1, 0.1, scaleZ);

            dummy.lookAt(0, 0, particle.z + 10);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <boxGeometry args={[0.1, 0.1, 1]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </instancedMesh>
    );
};

export default WarpSpeed;
