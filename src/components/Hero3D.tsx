import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import * as THREE from 'three';

function StarField(props: any) {
    const ref = useRef<any>();
    // Generate 5000 stars in a sphere
    const sphere = useMemo(() => random.inSphere(new Float32Array(5000), { radius: 15 }), []);

    useFrame((state, delta) => {
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
                    blending={THREE.AdditiveBlending}
                />
            </Points>
        </group>
    );
}

function JourneyPath() {
    const meshRef = useRef<THREE.Mesh>(null);

    // Create a tunnel/path effect - visualized as moving rings or lines
    // For now, let's add some "speed lines" or floating elements that move towards camera

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.z = state.clock.getElapsedTime() * 0.1;
        }
    })

    return (
        <mesh ref={meshRef} position={[0, 0, 0]} rotation={[1.5, 0, 0]}>
            {/* Placeholder for more complex geometry if needed, simple torus for now */}
            <torusGeometry args={[10, 0.1, 16, 100]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
        </mesh>
    )
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
