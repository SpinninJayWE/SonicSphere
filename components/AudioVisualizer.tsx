import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere, MeshDistortMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Theme } from '../types';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  theme: Theme;
}

const ReactiveSphere = ({ analyser, theme }: { analyser: AnalyserNode | null; theme: Theme }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  
  // Create a reusable array for frequency data.
  // Use fixed size 1024 (half of 2048 fftSize) to ensure stability even if analyser is momentarily null
  const dataArray = useMemo(() => new Uint8Array(1024), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    if (analyser) {
        analyser.getByteFrequencyData(dataArray);
    }

    // Calculate average frequency for scaling (Bass focus)
    // Lower frequencies are at the start of the array
    let sum = 0;
    const lowerBound = 0;
    const upperBound = 50; // Focus on bass
    for (let i = lowerBound; i < upperBound; i++) {
      sum += dataArray[i];
    }
    const averageBass = sum / (upperBound - lowerBound || 1);
    
    // Calculate high freq for distortion speed/noise
    let highSum = 0;
    for(let i = 100; i < 200; i++) {
        highSum += dataArray[i];
    }
    const averageHigh = highSum / 100;

    const scale = 1 + (averageBass / 255) * 1.5;
    const distort = 0.3 + (averageHigh / 255) * 0.8;

    // Smooth scaling
    meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    
    // Rotate slowly
    meshRef.current.rotation.x += 0.001;
    meshRef.current.rotation.y += 0.002;

    if (materialRef.current) {
        materialRef.current.distort = THREE.MathUtils.lerp(materialRef.current.distort, distort, 0.1);
        materialRef.current.color.lerp(new THREE.Color(theme.primary), 0.05);
    }
  });

  return (
    <Sphere args={[1, 64, 64]} ref={meshRef}>
      <MeshDistortMaterial
        ref={materialRef}
        color={theme.primary}
        envMapIntensity={0.5}
        clearcoat={1}
        clearcoatRoughness={0}
        metalness={0.1}
        radius={1}
        distort={0.4}
        speed={2}
      />
    </Sphere>
  );
};

const ReactiveParticles = ({ analyser, theme }: { analyser: AnalyserNode | null, theme: Theme }) => {
    const count = 1000;
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useMemo(() => {
        const temp = [];
        for(let i=0; i<count; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;
            const xFactor = -50 + Math.random() * 100;
            const yFactor = -50 + Math.random() * 100;
            const zFactor = -50 + Math.random() * 100;
            temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
        }
        return temp;
    }, []);

    const dataArray = useMemo(() => new Uint8Array(1024), []);

    useFrame((state) => {
        if(!mesh.current) return;
        
        if (analyser) {
            analyser.getByteFrequencyData(dataArray);
        }
        
        // Get volume level for particle excitement
        let sum = 0;
        for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
        const volume = sum / dataArray.length || 0;
        const excitement = volume / 255;

        particles.forEach((particle, i) => {
            let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
            
            // Update time
            t = particle.t += speed / 2 + (excitement * 0.01);
            
            // Movement logic
            const a = Math.cos(t) + Math.sin(t * 1) / 10;
            const b = Math.sin(t) + Math.cos(t * 2) / 10;
            const s = Math.cos(t);
            
            dummy.position.set(
                (particle.mx / 10) * a + xFactor + Math.cos((t/10) * factor) + (Math.sin(t * 1) * factor) / 10,
                (particle.my / 10) * b + yFactor + Math.sin((t/10) * factor) + (Math.cos(t * 2) * factor) / 10,
                (particle.my / 10) * b + zFactor + Math.cos((t/10) * factor) + (Math.sin(t * 3) * factor) / 10
            );
            
            // Scale based on audio data (map index to frequency bin)
            const index = i % dataArray.length;
            const freqVal = dataArray[index] / 255;
            const scale = 0.5 + freqVal * 4;
            
            dummy.scale.set(scale, scale, scale);
            dummy.rotation.set(s * 5, s * 5, s * 5);
            dummy.updateMatrix();
            
            if (mesh.current) {
                mesh.current.setMatrixAt(i, dummy.matrix);
            }
        });
        mesh.current.instanceMatrix.needsUpdate = true;
        // Pulse color
        // @ts-ignore
        mesh.current.material.color.lerp(new THREE.Color(theme.secondary), 0.1);
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshPhongMaterial color={theme.secondary} />
        </instancedMesh>
    );
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, theme }) => {
  return (
    <div className="absolute inset-0 bg-black">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        
        {/* Environment for reflections */}
        <Environment preset="city" />
        
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} color={theme.accent} intensity={2} />
        <pointLight position={[10, 10, 10]} color={theme.secondary} intensity={2} />
        
        {/* Objects */}
        <ReactiveSphere analyser={analyser} theme={theme} />
        <ReactiveParticles analyser={analyser} theme={theme} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};

export default AudioVisualizer;