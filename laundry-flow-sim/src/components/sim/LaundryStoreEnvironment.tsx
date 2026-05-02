import { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

export function LaundryStoreEnvironment({ numMachines }: { numMachines: number }) {
  const storeWidth = Math.max(numMachines * 4 + 4, 14);
  const storeDepth = 18;

  const tileTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#e8e4df';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#d4cfc8';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, 256); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * 64); ctx.lineTo(256, i * 64); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(storeWidth / 3, storeDepth / 3);
    return tex;
  }, [storeWidth, storeDepth]);

  const wallTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#f5f0e8';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#ede8df'; ctx.lineWidth = 1;
    for (let i = 0; i < 16; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * 8); ctx.lineTo(128, i * 8); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  const halfW = storeWidth / 2;
  const halfD = storeDepth / 2;
  const wallH = 5;

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, halfD - 4]} receiveShadow>
        <planeGeometry args={[storeWidth, storeDepth]} />
        <meshStandardMaterial map={tileTex} roughness={0.6} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, wallH / 2, -4 - 0.1]}>
        <planeGeometry args={[storeWidth, wallH]} />
        <meshStandardMaterial map={wallTex} color="#f0ebe3" roughness={0.8} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-halfW, wallH / 2, halfD - 4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[storeDepth, wallH]} />
        <meshStandardMaterial map={wallTex} color="#ede8df" roughness={0.8} />
      </mesh>

      {/* Right wall */}
      <mesh position={[halfW, wallH / 2, halfD - 4]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[storeDepth, wallH]} />
        <meshStandardMaterial map={wallTex} color="#ede8df" roughness={0.8} />
      </mesh>

      {/* Counter behind machines */}
      <mesh position={[0, 0.45, -2.5]} castShadow receiveShadow>
        <boxGeometry args={[storeWidth - 2, 0.9, 1.2]} />
        <meshStandardMaterial color="#c4b5a0" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.92, -2.5]}>
        <boxGeometry args={[storeWidth - 1.8, 0.06, 1.3]} />
        <meshStandardMaterial color="#8b7d6b" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Baseboard */}
      <mesh position={[0, 0.1, -3.9]}>
        <boxGeometry args={[storeWidth, 0.2, 0.05]} />
        <meshStandardMaterial color="#8b7d6b" />
      </mesh>

      {/* Ceiling lights */}
      {[-halfW / 2, 0, halfW / 2].map((x, i) => (
        <group key={i}>
          <mesh position={[x, wallH - 0.15, 3]}>
            <boxGeometry args={[1.5, 0.08, 0.3]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
          <pointLight position={[x, wallH - 0.5, 3]} intensity={0.4} distance={8} color="#fff5e6" />
        </group>
      ))}

      {/* Sign on back wall */}
      <mesh position={[0, wallH - 1, -3.95]}>
        <planeGeometry args={[4, 0.7]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>

      {/* ========= DOOR / ENTRANCE ========= */}
      {/* Door frame */}
      <mesh position={[0, 1.8, halfD - 4 + storeDepth / 2 - 0.05]}>
        <boxGeometry args={[2.4, 3.6, 0.15]} />
        <meshStandardMaterial color="#8b7355" roughness={0.6} />
      </mesh>
      {/* Door panels (glass) */}
      <mesh position={[-0.55, 1.8, halfD - 4 + storeDepth / 2 + 0.02]}>
        <boxGeometry args={[1.0, 3.2, 0.04]} />
        <meshStandardMaterial color="#a8d8ea" transparent opacity={0.35} metalness={0.2} roughness={0.1} />
      </mesh>
      <mesh position={[0.55, 1.8, halfD - 4 + storeDepth / 2 + 0.02]}>
        <boxGeometry args={[1.0, 3.2, 0.04]} />
        <meshStandardMaterial color="#a8d8ea" transparent opacity={0.35} metalness={0.2} roughness={0.1} />
      </mesh>
      {/* Door handles */}
      <mesh position={[-0.1, 1.6, halfD - 4 + storeDepth / 2 + 0.08]}>
        <boxGeometry args={[0.04, 0.4, 0.06]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.1, 1.6, halfD - 4 + storeDepth / 2 + 0.08]}>
        <boxGeometry args={[0.04, 0.4, 0.06]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* ENTRANCE sign */}
      <Text
        position={[0, 3.8, halfD - 4 + storeDepth / 2 + 0.1]}
        fontSize={0.3}
        color="#374151"
        anchorX="center"
        font={undefined}
      >
        ENTRANCE
      </Text>

      {/* ========= WINDOW with outdoor light (left wall) ========= */}
      <mesh position={[-halfW + 0.02, 2.8, 2]}>
        <planeGeometry args={[0.01, 2]} />
        <meshBasicMaterial color="#000" visible={false} />
      </mesh>
      {/* Window frame */}
      <mesh position={[-halfW + 0.05, 2.8, 2]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2.5, 2, 0.12]} />
        <meshStandardMaterial color="#c4b08a" roughness={0.5} />
      </mesh>
      {/* Window glass */}
      <mesh position={[-halfW + 0.12, 2.8, 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.2, 1.7]} />
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.3} emissive="#fff8dc" emissiveIntensity={0.2} />
      </mesh>
      {/* Window cross */}
      <mesh position={[-halfW + 0.14, 2.8, 2]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2.2, 0.06, 0.04]} />
        <meshStandardMaterial color="#c4b08a" />
      </mesh>
      <mesh position={[-halfW + 0.14, 2.8, 2]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.06, 1.7, 0.04]} />
        <meshStandardMaterial color="#c4b08a" />
      </mesh>
      {/* Outdoor light through window */}
      <pointLight position={[-halfW + 1, 2.8, 2]} intensity={0.6} distance={6} color="#fff8dc" />

      {/* ========= VENDING MACHINE (right wall) ========= */}
      <group position={[halfW - 1, 0, 2]}>
        {/* Body */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[1.2, 2.4, 0.9]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.1} />
        </mesh>
        {/* Glass front */}
        <mesh position={[0, 1.4, 0.46]}>
          <planeGeometry args={[0.9, 1.6]} />
          <meshStandardMaterial color="#1a1a2e" transparent opacity={0.7} metalness={0.5} roughness={0.1} />
        </mesh>
        {/* Display items (colored boxes inside) */}
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => (
            <mesh key={`v-${row}-${col}`} position={[-0.25 + col * 0.25, 1.9 - row * 0.4, 0.3]}>
              <boxGeometry args={[0.18, 0.15, 0.15]} />
              <meshStandardMaterial color={['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#14b8a6'][row * 3 + col]} />
            </mesh>
          ))
        )}
        {/* Coin slot */}
        <mesh position={[0.35, 1.0, 0.46]}>
          <boxGeometry args={[0.12, 0.25, 0.03]} />
          <meshStandardMaterial color="#333" metalness={0.6} />
        </mesh>
        {/* Label */}
        <Text position={[0, 2.3, 0.46]} fontSize={0.12} color="#ffffff" anchorX="center" font={undefined}>
          DRINKS
        </Text>
      </group>

      {/* ========= LAUNDRY BASKETS near machines ========= */}
      {Array.from({ length: numMachines }).map((_, i) => {
        const mx = -(numMachines - 1) * 2 + i * 4;
        return (
          <group key={`basket-${i}`}>
            {/* Basket body */}
            <mesh position={[mx + 1.3, 0.35, 0.5]} castShadow>
              <cylinderGeometry args={[0.35, 0.3, 0.7, 8]} />
              <meshStandardMaterial color="#d4a574" roughness={0.7} />
            </mesh>
            {/* Basket rim */}
            <mesh position={[mx + 1.3, 0.72, 0.5]}>
              <torusGeometry args={[0.35, 0.03, 8, 16]} />
              <meshStandardMaterial color="#c4956a" roughness={0.6} />
            </mesh>
            {/* Fabric inside (slight bump) */}
            <mesh position={[mx + 1.3, 0.65, 0.5]}>
              <sphereGeometry args={[0.28, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#e8e0d8" roughness={0.9} />
            </mesh>
          </group>
        );
      })}

      {/* Shelves on left wall */}
      {[1.5, 2.5, 3.5].map((y, i) => (
        <mesh key={i} position={[-halfW + 0.3, y, 6]} castShadow>
          <boxGeometry args={[0.5, 0.06, 2]} />
          <meshStandardMaterial color="#a0916e" roughness={0.5} />
        </mesh>
      ))}

      {/* Folding table */}
      <mesh position={[halfW - 1.5, 0.45, 8]} castShadow>
        <boxGeometry args={[2, 0.9, 1.2]} />
        <meshStandardMaterial color="#d4cabe" roughness={0.4} />
      </mesh>
      <mesh position={[halfW - 1.5, 0.92, 8]}>
        <boxGeometry args={[2.1, 0.05, 1.3]} />
        <meshStandardMaterial color="#9b8e7b" roughness={0.3} />
      </mesh>

      {/* Detergent bottles */}
      {[-halfW + 0.3].map((x) =>
        [0, 0.4, -0.4, 0.8].map((oz, i) => (
          <mesh key={`det-${i}`} position={[x, 3.55 + 0.15, 6 + oz]}>
            <cylinderGeometry args={[0.08, 0.08, 0.3, 8]} />
            <meshStandardMaterial color={['#2563eb', '#dc2626', '#16a34a', '#9333ea'][i]} />
          </mesh>
        ))
      )}

      {/* Floor mat at entrance */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, halfD - 4 + storeDepth / 2 - 1.5]}>
        <planeGeometry args={[2.5, 1.5]} />
        <meshStandardMaterial color="#5c4a3a" roughness={0.9} />
      </mesh>
    </group>
  );
}
