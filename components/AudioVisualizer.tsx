import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere, MeshDistortMaterial, Environment, MeshWobbleMaterial, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { Theme, VisualizerMode } from '../types';
import { DEFAULT_COVER_ART } from '../constants';

// Fix for missing R3F types in strict TypeScript environments
declare global {
  namespace JSX {
    interface IntrinsicElements {
      instancedMesh: any;
      boxGeometry: any;
      torusGeometry: any;
      meshStandardMaterial: any;
      mesh: any;
      group: any;
      dodecahedronGeometry: any;
      meshPhongMaterial: any;
      ambientLight: any;
      spotLight: any;
      pointLight: any;
      color: any;
    }
  }
}

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  theme: Theme;
  mode: VisualizerMode;
  coverArt?: string;
}

// --- SHARED UTILS ---
const useAudioData = (analyser: AnalyserNode | null, size: number = 1024) => {
    const dataArray = useMemo(() => new Uint8Array(size), [size]);
    
    const getData = () => {
        if (analyser) {
            analyser.getByteFrequencyData(dataArray);
        }
        return dataArray;
    };
    
    return { dataArray, getData };
};

// --- MODE: ORB ---
const ReactiveSphere = ({ analyser, theme }: { analyser: AnalyserNode | null; theme: Theme }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const { dataArray, getData } = useAudioData(analyser);

  useFrame(() => {
    if (!meshRef.current) return;
    getData();

    // Bass focus (0-50)
    let sum = 0;
    for (let i = 0; i < 50; i++) sum += dataArray[i];
    const averageBass = sum / 50;
    
    // High focus (100-200)
    let highSum = 0;
    for(let i = 100; i < 200; i++) highSum += dataArray[i];
    const averageHigh = highSum / 100;

    const scale = 1 + (averageBass / 255) * 1.5;
    const distort = 0.3 + (averageHigh / 255) * 0.8;

    meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
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

// --- MODE: BARS ---
const ReactiveBars = ({ analyser, theme }: { analyser: AnalyserNode | null, theme: Theme }) => {
    const count = 64;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const { dataArray, getData } = useAudioData(analyser);

    useFrame(() => {
        if (!meshRef.current) return;
        getData();

        const radius = 3;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Map freq data to height
            // We use a wider range of the spectrum for bars
            const dataIndex = Math.floor((i / count) * 200); // First 200 bins
            const val = dataArray[dataIndex] / 255;
            
            dummy.position.set(x, 0, z);
            dummy.rotation.y = -angle;
            dummy.scale.set(0.2, 0.1 + val * 5, 0.2); // Scale Y
            
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        // @ts-ignore
        meshRef.current.material.color.lerp(new THREE.Color(theme.secondary), 0.1);
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={theme.secondary} />
        </instancedMesh>
    );
};

// --- MODE: CUBE ---
const ReactiveCube = ({ analyser, theme }: { analyser: AnalyserNode | null, theme: Theme }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<any>(null);
    const { dataArray, getData } = useAudioData(analyser);
  
    useFrame((state) => {
      if (!meshRef.current) return;
      getData();
  
      let sum = 0;
      for (let i = 0; i < 100; i++) sum += dataArray[i];
      const avg = sum / 100;
  
      const scale = 1 + (avg / 255);
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.2);

      if (materialRef.current) {
        materialRef.current.factor = THREE.MathUtils.lerp(materialRef.current.factor, (avg/255) * 2, 0.1);
        materialRef.current.color.lerp(new THREE.Color(theme.accent), 0.05);
      }
    });
  
    return (
      <mesh ref={meshRef}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <MeshWobbleMaterial 
            ref={materialRef}
            color={theme.accent} 
            factor={0.5} 
            speed={2} 
        />
      </mesh>
    );
};

// --- MODE: VINYL ---
const ReactiveVinyl = ({ analyser, theme, coverArt }: { analyser: AnalyserNode | null, theme: Theme, coverArt?: string }) => {
    const meshRef = useRef<THREE.Group>(null);
    const { dataArray, getData } = useAudioData(analyser);
    
    const texture = useLoader(THREE.TextureLoader, coverArt || DEFAULT_COVER_ART);

    useFrame(() => {
        if (!meshRef.current) return;
        getData();

        // Get bass for bump
        let sum = 0;
        for (let i = 0; i < 20; i++) sum += dataArray[i];
        const bass = sum / 20;
        
        const scale = 1 + (bass / 255) * 0.2;
        
        meshRef.current.rotation.y += 0.01 + (bass / 255) * 0.05;
        meshRef.current.scale.set(scale, scale, scale);
        meshRef.current.rotation.z = Math.sin(Date.now() * 0.001) * 0.1;
    });

    return (
        <group ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
             {/* Disc */}
            <Cylinder args={[2, 2, 0.05, 64]}>
                <meshStandardMaterial color="#111" roughness={0.5} metalness={0.8} />
            </Cylinder>
            {/* Label/Art */}
            <Cylinder args={[0.8, 0.8, 0.06, 64]} position={[0, 0.01, 0]}>
                <meshStandardMaterial map={texture} />
            </Cylinder>
        </group>
    );
};

// --- MODE: TUNNEL ---
const ReactiveTunnel = ({ analyser, theme }: { analyser: AnalyserNode | null; theme: Theme }) => {
    const count = 40;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const { dataArray, getData } = useAudioData(analyser);
    
    // Track "virtual" distance traveled
    const distanceRef = useRef(0);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        getData();

        let bassSum = 0;
        for (let i = 0; i < 20; i++) bassSum += dataArray[i];
        const bass = (bassSum / 20) / 255; // 0..1

        // Speed increases with bass
        const speed = 5 + bass * 30;
        distanceRef.current += speed * delta;

        for (let i = 0; i < count; i++) {
            const totalLength = 120;
            const spacing = totalLength / count;
            // Loop positions. Map infinite distance to finite range -80 to 40
            const zPos = ((i * spacing + distanceRef.current) % totalLength) - 80; 
            
            dummy.position.set(0, 0, zPos);
            // Spin visual
            dummy.rotation.z = (distanceRef.current * 0.02) + i * 0.1;
            
            // Pulse radius with bass intensity
            const scale = 1 + Math.pow(bass, 2) * 1.5; 
            dummy.scale.set(scale, scale, 1);
            
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
            
            // Color gradient based on depth (fog effect)
            // Far (-80) -> Transparent/Dark, Near (40) -> Bright
            const depth = THREE.MathUtils.clamp((zPos + 80) / 100, 0, 1);
            const color = new THREE.Color(theme.secondary).lerp(new THREE.Color(theme.primary), depth);
            
            // Flash accent on heavy beats
            if(bass > 0.5) {
                color.lerp(new THREE.Color(theme.accent), (bass - 0.5));
            }
            
            meshRef.current.setColorAt(i, color);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <torusGeometry args={[4, 0.05, 4, 24]} /> {/* Square-ish rings for digital look */}
            <meshStandardMaterial wireframe color="white" toneMapped={false} />
        </instancedMesh>
    );
};

// --- MODE: MATRIX ---
const ReactiveMatrix = ({ analyser, theme }: { analyser: AnalyserNode | null; theme: Theme }) => {
    const size = 16;
    const count = size * size;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const { dataArray, getData } = useAudioData(analyser);

    useFrame((state) => {
        if (!meshRef.current) return;
        getData();
        
        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / size);
            const col = i % size;
            
            const x = (col - size / 2) * 1.2;
            const z = (row - size / 2) * 1.2;
            
            // Calculate distance from center to map to frequency bands
            // Center = low freq, Edges = high freq
            const dist = Math.sqrt(x*x + z*z);
            const maxDist = Math.sqrt((size/2*1.2)**2 + (size/2*1.2)**2);
            const normDist = dist / maxDist;
            
            // Map 0..1 to array index 0..60 (sub-bass to low-mids mostly)
            const freqIndex = Math.floor(normDist * 50); 
            const value = dataArray[freqIndex] / 255;
            
            dummy.position.set(x, -5, z); // Place effectively as a floor
            
            // Scale Y based on volume
            const height = 0.1 + value * 10;
            dummy.scale.set(1, height, 1);
            dummy.position.y = -5 + height / 2; 
            
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
            
            // Color map
            const color = new THREE.Color(theme.primary).lerp(new THREE.Color(theme.accent), value);
            meshRef.current.setColorAt(i, color);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <group rotation={[-Math.PI / 6, 0, 0]}> {/* Tilt grid slightly */}
            <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial roughness={0.1} metalness={0.8} />
            </instancedMesh>
        </group>
    )
}


// --- PARTICLES (Shared) ---
const ReactiveParticles = ({ analyser, theme }: { analyser: AnalyserNode | null, theme: Theme }) => {
    const count = 500;
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useMemo(() => {
        const temp = [];
        for(let i=0; i<count; i++) {
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;
            const xFactor = -50 + Math.random() * 100;
            const yFactor = -50 + Math.random() * 100;
            const zFactor = -50 + Math.random() * 100;
            temp.push({ t: Math.random() * 100, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
        }
        return temp;
    }, []);

    const { dataArray, getData } = useAudioData(analyser);

    useFrame(() => {
        if(!mesh.current) return;
        getData();
        
        let sum = 0;
        for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
        const volume = sum / dataArray.length || 0;
        const excitement = volume / 255;

        particles.forEach((particle, i) => {
            let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
            t = particle.t += speed / 2 + (excitement * 0.01);
            
            const a = Math.cos(t) + Math.sin(t * 1) / 10;
            const b = Math.sin(t) + Math.cos(t * 2) / 10;
            const s = Math.cos(t);
            
            dummy.position.set(
                (particle.mx / 10) * a + xFactor + Math.cos((t/10) * factor) + (Math.sin(t * 1) * factor) / 10,
                (particle.my / 10) * b + yFactor + Math.sin((t/10) * factor) + (Math.cos(t * 2) * factor) / 10,
                (particle.my / 10) * b + zFactor + Math.cos((t/10) * factor) + (Math.sin(t * 3) * factor) / 10
            );
            
            const index = i % dataArray.length;
            const freqVal = dataArray[index] / 255;
            const scale = 0.5 + freqVal * 4;
            
            dummy.scale.set(scale, scale, scale);
            dummy.rotation.set(s * 5, s * 5, s * 5);
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
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

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, theme, mode, coverArt }) => {
  return (
    <div className="absolute inset-0 bg-black">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        
        <Environment preset="city" />
        
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} color={theme.accent} intensity={2} />
        <pointLight position={[10, 10, 10]} color={theme.secondary} intensity={2} />
        
        {mode === 'Orb' && <ReactiveSphere analyser={analyser} theme={theme} />}
        {mode === 'Bars' && <ReactiveBars analyser={analyser} theme={theme} />}
        {mode === 'Cube' && <ReactiveCube analyser={analyser} theme={theme} />}
        {mode === 'Vinyl' && <ReactiveVinyl analyser={analyser} theme={theme} coverArt={coverArt} />}
        {mode === 'Tunnel' && <ReactiveTunnel analyser={analyser} theme={theme} />}
        {mode === 'Matrix' && <ReactiveMatrix analyser={analyser} theme={theme} />}
        
        <ReactiveParticles analyser={analyser} theme={theme} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};

export default AudioVisualizer;