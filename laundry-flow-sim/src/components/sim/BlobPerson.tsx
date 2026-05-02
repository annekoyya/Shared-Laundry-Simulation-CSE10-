import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import type { Resident } from '@/simulation/engine';

const COLORS = {
  queuing: '#d97706',
  arriving: '#d97706',
  washing: '#2563eb',
  hogged: '#2563eb',
  done: '#16a34a',
  balked: '#d97706',
};

interface BlobPersonProps {
  resident: Resident;
}

export function BlobPerson({ resident }: BlobPersonProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const time = useRef(Math.random() * 100);
  const initialized = useRef(false);
  const walkingRef = useRef(false);
  const walkPhase = useRef(0);

  const color = COLORS[resident.state] || '#d97706';

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Clamp delta to avoid huge jumps when tab refocuses or sim runs at high speed
    const dt = Math.min(delta, 0.1);
    time.current += dt;

    const g = groupRef.current;

    // First frame: snap to target so new residents don't fly in from origin
    if (!initialized.current) {
      g.position.set(resident.x, 0, resident.z);
      initialized.current = true;
    }

    // Frame-rate independent exponential smoothing
    const smoothing = 4;
    const t = 1 - Math.exp(-smoothing * dt);

    const dx = resident.targetX - g.position.x;
    const dz = resident.targetZ - g.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Snap when extremely close to kill micro-jitter from smoothing residuals
    if (dist < 0.01) {
      g.position.x = resident.targetX;
      g.position.z = resident.targetZ;
    } else {
      g.position.x += dx * t;
      g.position.z += dz * t;
    }

    // Face direction of travel — only when meaningfully moving
    if (dist > 0.3) {
      const targetRot = Math.atan2(dx, dz);
      const cur = g.rotation.y;
      let diff = targetRot - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      g.rotation.y = cur + diff * t;
    }

    // Walking state with hysteresis — prevents flicker when smoothing residual
    // hovers near the threshold.
    if (walkingRef.current) {
      if (dist < 0.15) walkingRef.current = false;
    } else {
      if (dist > 0.4) walkingRef.current = true;
    }
    const walking = walkingRef.current;

    // Advance walk phase only while walking, freeze when idle
    if (walking) walkPhase.current += dt * 8;

    if (bodyRef.current) {
      if (walking) {
        // Step bob — vertical bounce while walking
        bodyRef.current.position.y = 0.5 + Math.abs(Math.sin(walkPhase.current)) * 0.07;
      } else {
        // Calm idle: gentle breathing only, no vertical bounce
        bodyRef.current.position.y = 0.5;
      }
      // Slow breathing scale (always, but very subtle)
      const breath = 1 + Math.sin(time.current * 1.8) * 0.015;
      bodyRef.current.scale.x = breath;
      bodyRef.current.scale.z = breath;
    }

    // Arm swing while walking; smoothly relax to rest pose when idle
    if (leftArmRef.current && rightArmRef.current) {
      const swing = walking ? Math.sin(walkPhase.current) * 0.6 : 0;
      const ease = 1 - Math.exp(-6 * dt);
      leftArmRef.current.rotation.x += (swing - leftArmRef.current.rotation.x) * ease;
      rightArmRef.current.rotation.x += (-swing - rightArmRef.current.rotation.x) * ease;
    }
  });

  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05 }), [color]);

  return (
    <group ref={groupRef} position={[resident.x, 0, resident.z]}>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0.5, 0]} material={mat}>
        <capsuleGeometry args={[0.2, 0.4, 8, 16]} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.05, 0]} material={mat}>
        <sphereGeometry args={[0.15, 16, 16]} />
      </mesh>
      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.28, 0.55, 0]} material={mat} rotation={[0, 0, 0.3]}>
        <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.28, 0.55, 0]} material={mat} rotation={[0, 0, -0.3]}>
        <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
      </mesh>
      {/* ID label */}
      <Text
        position={[0, 1.45, 0]}
        fontSize={0.22}
        color={color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
        outlineWidth={0.03}
        outlineColor="#ffffff"
      >
        {resident.id}
      </Text>
    </group>
  );
}
