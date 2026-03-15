// @ts-nocheck - React Three Fiber JSX elements not recognized in strict mode
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import { AdditiveBlending } from 'three';

function StarField(props: any) {
    const ref = useRef<any>(null);
    // Generate 5000 stars in a sphere
    // Note: We need to ensure the array is properly sized (3 components per point = 5000 * 3)
    // and filter out any potential NaN values to prevent THREE.BufferGeometry.computeBoundingSphere errors
    const sphere = useMemo(() => {
        const positions = random.inSphere(new Float32Array(5000 * 3), { radius: 15 });
        // Sanitize positions: replace any NaN/Infinity values with valid coordinates
        for (let i = 0; i < positions.length; i++) {
            if (!Number.isFinite(positions[i])) {
                positions[i] = 0;
            }
        }
        return positions;
    }, []);

    useFrame((_state, delta) => {
        if (ref.current) {
            // Rotation gives a subtle movement feel
            ref.current.rotation.x -= delta / 15;
            ref.current.rotation.y -= delta / 20;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#8b5cf6" // Brand primary color (purple-ish)
                    size={0.03}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={AdditiveBlending}
                />
            </Points>
        </group>
    );
}

export function Hero3D() {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <fog attach="fog" args={['#000', 0, 30]} />
                <ambientLight intensity={0.5} />
                <StarField />
            </Canvas>
        </div>
    );
}
