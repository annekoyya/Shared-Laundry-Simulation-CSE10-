import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { MachineState } from '@/simulation/engine';

const STATUS_COLORS: Record<string, string> = {
  free: '#16a34a',
  washing: '#2563eb',
  hogged: '#d97706',
};

const STATUS_LABELS: Record<string, string> = {
  free: 'FREE',
  washing: 'WASHING',
  hogged: 'HOGGED',
};

interface Props {
  machine: MachineState;
  position: [number, number, number];
  queueCount: number;
  queueCap: number;
  scale?: [number, number, number];
  rotation?: [number, number, number];
}

export function WashingMachine3D({ 
  machine, 
  position, 
  queueCount, 
  queueCap, 
  scale = [10, 10, 10],
  rotation = [0, 0, 0] 
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Mesh>(null);
  const { scene } = useGLTF('/models/washing_machine.glb');
  const clothesModel = useGLTF('/models/large_pile_of_cloth.glb');

  useFrame(() => {
    if (!groupRef.current) return;

    if (machine.status === 'washing') {
      const t = Date.now() * 0.015;
      groupRef.current.rotation.z = Math.sin(t * 3) * 0.03;
      groupRef.current.rotation.x = Math.cos(t * 2.5) * 0.015;
      groupRef.current.position.x = Math.sin(t * 4) * 0.02;
      groupRef.current.position.y = Math.abs(Math.sin(t * 5)) * 0.015;
    } else {
      groupRef.current.rotation.z *= 0.9;
      groupRef.current.rotation.x *= 0.9;
      groupRef.current.position.x *= 0.9;
      groupRef.current.position.y *= 0.9;
    }

    if (lidRef.current) {
      const targetRot = machine.status === 'free' ? -0.8 : 0;
      lidRef.current.rotation.x += (targetRot - lidRef.current.rotation.x) * 0.08;
    }
  });

  const statusColor = STATUS_COLORS[machine.status];
  const machineScale = 40;

  return (
    <group position={position} rotation={rotation}>
      <group ref={groupRef} scale={[machineScale, machineScale, machineScale]}>
        <primitive object={scene.clone()} />
      </group>

      {/* Lid (opens when free) */}
      {/* <mesh ref={lidRef} position={[0, machineScale * 0.07, -machineScale * 0.01]} rotation={[0, 0, 0]}>
        <boxGeometry args={[machineScale * 0.025, 0.06, machineScale * 0.02]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.3} roughness={0.5} transparent opacity={machine.status === 'free' ? 0.8 : 0} />
      </mesh> */}

      {/* Clothes pile on top when hogged - small, sits on top */}
{machine.status === 'hogged' && (
  <group
    position={[0, 2, 0]}   // 👈 sits on top of machine (y=0 base)
    scale={[0.07, 0.07, 0.07]} // 👈 smaller, more realistic pile
  >
    <primitive object={clothesModel.scene.clone()} />
  </group>
)}
      {/* Status badge */}
      <mesh position={[0, machineScale * 0.085, machineScale * 0.02]}>
        <planeGeometry args={[2.0, 0.5]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.9} />
      </mesh>
      <Text
        position={[0, machineScale * 0.085, machineScale * 0.02 + 0.01]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        font={undefined}
      >
        {STATUS_LABELS[machine.status]}
      </Text>

      {/* Machine label */}
      <Text position={[0, -0.7, 0]} fontSize={0.5} color="#374151" anchorX="center" font={undefined}>
        {`M${machine.id + 1}`}
      </Text>

      {/* Queue badge */}
      <mesh position={[0, -1.3, 0]}>
        <planeGeometry args={[1.2, 0.38]} />
        <meshBasicMaterial color="#e5e7eb" />
      </mesh>
      <Text position={[0, -1.3, 0.01]} fontSize={0.22} color="#6b7280" anchorX="center" font={undefined}>
        {`Q:${queueCount}/${queueCap}`}
      </Text>

      {/* Queue slot indicators */}
      {Array.from({ length: queueCap }).map((_, i) => (
        <mesh key={i} position={[0, 0.01, 2 + i * 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.28, 16]} />
          <meshBasicMaterial
            color={i < queueCount ? '#d97706' : '#d1d5db'}
            transparent
            opacity={i < queueCount ? 0.9 : 0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

useGLTF.preload('/models/washing_machine.glb');
useGLTF.preload('/models/large_pile_of_cloth.glb');