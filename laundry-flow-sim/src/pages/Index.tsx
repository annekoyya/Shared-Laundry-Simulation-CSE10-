import { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { LaundrySimulation } from '@/simulation/engine';
import { WashingMachine3D } from '@/components/sim/WashingMachine3D';
import { BlobPerson } from '@/components/sim/BlobPerson';
import { ControlPanel } from '@/components/sim/ControlPanel';
import { StatsPanel } from '@/components/sim/StatsPanel';
import { StatusBar } from '@/components/sim/StatusBar';
import { HelpModal } from '@/components/sim/HelpModal';
import { SimTicker } from '@/components/sim/SimTicker';
import { LaundryStoreEnvironment } from '@/components/sim/LaundryStoreEnvironment';
import { PerformanceCharts } from '@/components/sim/PerformanceCharts';
import { SimCompletePopup } from '@/components/sim/SimCompletePopup';
import { BatchReplicationModal } from '@/components/sim/BatchReplicationModal';
import { exportSimData } from '@/simulation/export';

const Index = () => {
  const simRef = useRef(new LaundrySimulation());
  const [, forceUpdate] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const wasRunning = useRef(false);
  const rerender = useCallback(() => forceUpdate(n => n + 1), []);

  const sim = simRef.current;

  const handleTick = useCallback((dt: number) => {
    sim.tick(dt);
  }, [sim]);

  useEffect(() => {
    const id = setInterval(() => {
      rerender();
      if (wasRunning.current && !sim.running && sim.time >= sim.config.dayDuration - 1) {
        setPopupOpen(true);
        wasRunning.current = false;
      }
      if (sim.running && !sim.paused) {
        wasRunning.current = true;
      }
    }, 66);
    return () => clearInterval(id);
  }, [rerender, sim]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const speeds = [1, 2, 5, 10, 50, 100];
      if (e.key >= '1' && e.key <= '6') { sim.speed = speeds[parseInt(e.key) - 1]; rerender(); }
      if (e.key === ' ') { e.preventDefault(); if (!sim.running) { sim.running = true; sim.paused = false; } else sim.paused = !sim.paused; rerender(); }
      if (e.key === 'r' || e.key === 'R') { sim.reset(); rerender(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sim, rerender]);

  const onStart = () => { sim.running = true; sim.paused = false; wasRunning.current = true; rerender(); };
  const onPause = () => { sim.paused = !sim.paused; rerender(); };
  const onReset = () => { sim.reset(); wasRunning.current = false; rerender(); };
  const onFullRun = () => {
    sim.reset(); sim.running = true; sim.speed = 100;
    for (let i = 0; i < 100000 && sim.time < sim.config.dayDuration; i++) sim.tick(0.5);
    sim.running = false; rerender(); setPopupOpen(true);
  };
  const onSpeedChange = (s: number) => { sim.speed = s; rerender(); };
  const onMachineChange = (n: number) => { sim.setMachineCount(Math.min(Math.max(n, 1), 6)); rerender(); };
  const onConfigChange = (key: string, value: any) => { (sim.config as any)[key] = value; rerender(); };

  const visible = sim.getVisibleResidents();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <div className="flex flex-1 overflow-hidden">
        <div className="w-60 shrink-0 border-r border-border overflow-y-auto bg-card shadow-sm">
          <ControlPanel
            sim={sim}
            onStart={onStart}
            onPause={onPause}
            onReset={onReset}
            onFullRun={onFullRun}
            onSpeedChange={onSpeedChange}
            onMachineChange={onMachineChange}
            onConfigChange={onConfigChange}
            onShowHelp={() => setHelpOpen(true)}
            onShowChart={() => setChartOpen(true)}
            onShowBatch={() => setBatchOpen(true)}
            onExport={(fmt) => exportSimData(sim, fmt)}
          />
        </div>

        <div className="flex-1 relative">
          <Canvas
            shadows
            camera={{ position: [0, 9, 16], fov: 50 }}
            style={{ background: 'linear-gradient(180deg, #dbeafe 0%, #f0f4f8 40%, #e8e4df 100%)' }}
          >
            <SimTicker onTick={handleTick} />
            <ambientLight intensity={0.7} color="#fff8f0" />
            <directionalLight position={[8, 12, 6]} intensity={1.2} color="#fffaf0" castShadow shadow-mapSize={[1024, 1024]} />
            <directionalLight position={[-5, 8, -3]} intensity={0.3} color="#e0f0ff" />
            <hemisphereLight args={['#b0d4f1', '#e8e0d4', 0.4]} />

            <LaundryStoreEnvironment numMachines={sim.config.numMachines} />

            <Text position={[0, 4.05, -3.9]} fontSize={0.35} color="#ffffff" anchorX="center" font={undefined} letterSpacing={0.15}>
              LAUNDRY ROOM
            </Text>

            {/* Machines */}
{sim.machines.map((machine) => (
  <WashingMachine3D
    key={`${machine.id}-${sim.config.numMachines}`}
    machine={machine}
    position={[sim.getMachineX(machine.id), 0, -1]}
    queueCount={sim.queues[machine.id]?.length || 0}
    queueCap={sim.config.queueCap}
     scale={[40, 40, 40]}  // 80% larger
    rotation={[0, Math.PI, 0]}  // 180 degrees
  />
))}

            {visible.map((r) => (
              <BlobPerson key={r.id} resident={r} />
            ))}

            <OrbitControls enablePan enableZoom enableRotate maxPolarAngle={Math.PI / 2.2} minDistance={5} maxDistance={30} target={[0, 1, 3]} />
          </Canvas>
        </div>

        <div className="w-64 shrink-0 border-l border-border overflow-y-auto bg-card shadow-sm">
          <StatsPanel sim={sim} />
        </div>
      </div>

      <StatusBar sim={sim} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      {chartOpen && <PerformanceCharts sim={sim} onClose={() => setChartOpen(false)} />}
      {batchOpen && <BatchReplicationModal sim={sim} onClose={() => setBatchOpen(false)} />}
      {popupOpen && (
        <SimCompletePopup
          sim={sim}
          onClose={() => setPopupOpen(false)}
          onViewCharts={() => { setPopupOpen(false); setChartOpen(true); }}
        />
      )}
    </div>
  );
};

export default Index;