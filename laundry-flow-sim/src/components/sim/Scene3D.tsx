import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { WashingMachine3D } from './WashingMachine3D';
import { BlobPerson } from './BlobPerson';
import type { LaundrySimulation } from '@/simulation/engine';

interface Props {
  sim: LaundrySimulation;
}

export function Scene3D({ sim }: Props) {
  const visible = sim.getVisibleResidents();

  return (
    <Canvas
      camera={{ position: [0, 8, 14], fov: 50 }}
      style={{ background: 'hsl(220, 25%, 12%)' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, 0]} intensity={0.3} color="#22d3ee" />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 4]}>
        <planeGeometry args={[20, 16]} />
        <meshStandardMaterial color="#1a2332" />
      </mesh>

      {/* Counter / shelf behind machines */}
      <mesh position={[0, 0.5, -1.5]}>
        <boxGeometry args={[sim.config.numMachines * 4 + 2, 1, 0.5]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>

      {/* Grid lines on floor */}
      <gridHelper args={[20, 20, '#1e3a5f', '#1e3a5f']} position={[0, 0.01, 4]} />

      {/* Machines */}
      {sim.machines.map((machine) => (
        <WashingMachine3D
          key={machine.id}
          machine={machine}
          position={[sim.getMachineX(machine.id), 1, 0]}
          queueCount={sim.queues[machine.id].length}
          queueCap={sim.config.queueCap}
        />
      ))}

      {/* People */}
      {visible.map((r) => (
        <BlobPerson key={r.id} resident={r} />
      ))}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={25}
      />
    </Canvas>
  );
}
