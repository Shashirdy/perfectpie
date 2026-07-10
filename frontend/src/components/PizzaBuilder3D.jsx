import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';

// Topping shapes mapped to ingredient names
const Topping = ({ type, position: [x, y, z], rotY, scale }) => {
  switch (type) {
    case 'Onion':
      return (
        <mesh position={[x, y, z]} rotation={[Math.PI / 2 + 0.15, rotY, 0.1]} scale={[scale, scale, scale]}>
          <torusGeometry args={[0.13, 0.025, 8, 20, Math.PI * 0.85]} />
          <meshStandardMaterial color="#7c3aed" roughness={0.4} />
        </mesh>
      );
    case 'Capsicum':
      return (
        <mesh position={[x, y, z]} rotation={[Math.PI / 2 - 0.1, rotY, 0.2]} scale={[scale, scale, scale]}>
          <torusGeometry args={[0.14, 0.032, 8, 18, Math.PI * 0.7]} />
          <meshStandardMaterial color="#16a34a" roughness={0.5} />
        </mesh>
      );
    case 'Mushroom':
      return (
        <group position={[x, y, z]} rotation={[0.1, rotY, 0.1]} scale={[scale, scale, scale]}>
          <mesh position={[0, 0.03, 0]}>
            <sphereGeometry args={[0.07, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#c4b5a0" roughness={0.75} />
          </mesh>
          <mesh position={[0, -0.01, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.05, 8]} />
            <meshStandardMaterial color="#f5f0ea" roughness={0.8} />
          </mesh>
        </group>
      );
    case 'Corn':
      return (
        <mesh position={[x, y, z]} scale={[scale * 0.55, scale * 0.65, scale * 0.55]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.3} />
        </mesh>
      );
    case 'Tomato':
      return (
        <mesh position={[x, y, z]} rotation={[0.1, rotY, 0.1]} scale={[scale * 0.85, scale * 0.7, scale * 0.85]}>
          <boxGeometry args={[0.09, 0.045, 0.09]} />
          <meshStandardMaterial color="#dc2626" roughness={0.5} />
        </mesh>
      );
    case 'Olive':
      return (
        <mesh position={[x, y, z]} rotation={[Math.PI / 2, rotY, 0]} scale={[scale * 0.7, scale * 0.7, scale * 0.7]}>
          <torusGeometry args={[0.07, 0.028, 8, 14]} />
          <meshStandardMaterial color="#1c1917" roughness={0.4} />
        </mesh>
      );
    case 'Jalapeño':
      return (
        <mesh position={[x, y, z]} rotation={[Math.PI / 2 + 0.08, rotY, 0.15]} scale={[scale * 0.85, scale * 0.85, scale * 0.85]}>
          <torusGeometry args={[0.09, 0.028, 8, 14]} />
          <meshStandardMaterial color="#15803d" roughness={0.5} />
        </mesh>
      );
    case 'Broccoli':
      return (
        <group position={[x, y, z]} scale={[scale * 0.8, scale * 0.8, scale * 0.8]}>
          <mesh position={[0, 0.032, 0]}>
            <sphereGeometry args={[0.06, 10, 8]} />
            <meshStandardMaterial color="#166534" roughness={0.9} />
          </mesh>
          <mesh position={[0.022, 0.018, 0.018]}>
            <sphereGeometry args={[0.04, 8, 6]} />
            <meshStandardMaterial color="#14532d" roughness={0.9} />
          </mesh>
        </group>
      );
    case 'Spinach':
      return (
        <mesh position={[x, y, z]} rotation={[0.06, rotY, 0.06]} scale={[scale * 1.1, scale * 0.2, scale * 0.8]}>
          <boxGeometry args={[0.12, 0.02, 0.085]} />
          <meshStandardMaterial color="#14532d" roughness={0.8} />
        </mesh>
      );
    case 'Paneer':
      return (
        <mesh position={[x, y, z]} rotation={[0.1, rotY, 0.05]} scale={[scale * 0.9, scale * 0.9, scale * 0.9]}>
          <boxGeometry args={[0.088, 0.075, 0.088]} />
          <meshStandardMaterial color="#fafaf9" roughness={0.85} />
        </mesh>
      );
    default:
      return null;
  }
};

// Generates stable random positions per topping type using a seed
const useToppingPositions = (crustThickness) =>
  useMemo(() => {
    const result = {};
    const types = ['Onion','Capsicum','Mushroom','Corn','Tomato','Olive','Jalapeño','Broccoli','Spinach','Paneer'];
    types.forEach((type) => {
      let h = 0;
      for (let i = 0; i < type.length; i++) { h = type.charCodeAt(i) + ((h << 5) - h); }
      const rng = () => { const x = Math.sin(h++) * 10000; return x - Math.floor(x); };
      result[type] = Array.from({ length: 14 }, () => {
        const r = 0.25 + rng() * 1.42;
        const theta = rng() * Math.PI * 2;
        return {
          position: [r * Math.cos(theta), crustThickness / 2 + 0.04, r * Math.sin(theta)],
          rotY: rng() * Math.PI * 2,
          scale: 0.8 + rng() * 0.4,
        };
      });
    });
    return result;
  }, [crustThickness]);

// Main pizza mesh
const PizzaMesh = ({ selections, autoRotate }) => {
  const groupRef = useRef();

  useFrame(() => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  const { crustColor, crustThickness } = useMemo(() => {
    switch (selections.base) {
      case 'Thin Crust':   return { crustColor: '#c2915a', crustThickness: 0.07 };
      case 'Cheese Burst': return { crustColor: '#cfa055', crustThickness: 0.17 };
      case 'Stuffed Crust':return { crustColor: '#a46d37', crustThickness: 0.15 };
      case 'Whole Wheat':  return { crustColor: '#855830', crustThickness: 0.11 };
      default:             return { crustColor: '#b47b43', crustThickness: 0.12 };
    }
  }, [selections.base]);

  const sauceColor = useMemo(() => {
    switch (selections.sauce) {
      case 'BBQ Sauce':        return '#3b1a0a';
      case 'Alfredo':          return '#fff8e1';
      case 'Garlic Parmesan':  return '#fdf6d8';
      case 'Spicy Arrabbiata': return '#b91c1c';
      default:                 return '#991b1b';
    }
  }, [selections.sauce]);

  const cheeseColor = useMemo(() => {
    switch (selections.cheese) {
      case 'Cheddar':    return '#d97706';
      case 'Parmesan':   return '#faf5df';
      case 'Provolone':  return '#f7edba';
      case 'Vegan Cheese': return '#fafaf8';
      default:           return '#fef9c3';
    }
  }, [selections.cheese]);

  const toppingPositions = useToppingPositions(crustThickness);

  return (
    <group ref={groupRef} rotation={[0.22, 0, 0]}>
      {/* Base crust disc */}
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[1.9, 1.82, crustThickness, 48]} />
        <meshStandardMaterial color={crustColor} roughness={0.88} />
      </mesh>

      {/* Outer crust rim */}
      <mesh position={[0, crustThickness / 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.83, crustThickness / 2, 14, 48]} />
        <meshStandardMaterial color={crustColor} roughness={0.92} />
      </mesh>

      {/* Sauce layer */}
      {selections.sauce && (
        <mesh position={[0, crustThickness / 2 + 0.005, 0]}>
          <cylinderGeometry args={[1.73, 1.73, 0.018, 40]} />
          <meshStandardMaterial color={sauceColor} roughness={0.4} />
        </mesh>
      )}

      {/* Cheese layer */}
      {selections.cheese && (
        <mesh position={[0, crustThickness / 2 + 0.018, 0]}>
          <cylinderGeometry args={[1.68, 1.68, 0.016, 40]} />
          <meshStandardMaterial color={cheeseColor} roughness={0.55} metalness={0.05} />
        </mesh>
      )}

      {/* Vegetable toppings */}
      {selections.veggies.map((name) =>
        (toppingPositions[name] || []).map((props, i) => (
          <Topping key={`${name}-${i}`} type={name} {...props} />
        ))
      )}
    </group>
  );
};

export default function PizzaBuilder3D({
  selections = { base: 'Hand Tossed', sauce: 'Tomato Basil', cheese: 'Mozzarella', veggies: [] },
  autoRotate = true,
}) {
  return (
    <div className="w-full h-[380px] md:h-[460px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#0f0f11] to-[#18181b] border border-white/5 shadow-inner relative">
      <Canvas
        camera={{ position: [0, 3.8, 4.2], fov: 44 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      >
        <color attach="background" args={['#0f0f11']} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 10, 5]} intensity={1.3} />
        <spotLight position={[-4, 8, 5]} intensity={0.9} angle={Math.PI / 4} penumbra={1} color="#fff8f0" />

        <Center>
          <PizzaMesh selections={selections} autoRotate={autoRotate} />
        </Center>

        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={2.5}
          maxDistance={7}
        />
      </Canvas>

      <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] text-white/40 pointer-events-none">
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}
