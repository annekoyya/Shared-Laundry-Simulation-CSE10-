import type { LaundrySimulation } from '@/simulation/engine';

interface Props {
  sim: LaundrySimulation;
}

export function StatusBar({ sim }: Props) {
  const status = sim.running ? (sim.paused ? 'PAUSED' : 'RUNNING') : (sim.time >= sim.config.dayDuration ? 'COMPLETE' : 'IDLE');
  const statusColor = status === 'RUNNING' ? 'text-success' : status === 'PAUSED' ? 'text-warning' : status === 'COMPLETE' ? 'text-info' : 'text-muted-foreground';

  return (
    <div className="flex items-center justify-center gap-6 px-4 py-2 bg-card border-t border-border font-mono text-[13px]">
      <span className="text-muted-foreground">Time: <span className="text-foreground font-bold">{sim.getTimeString()}</span></span>
      <span className={statusColor}>| {status}</span>
      <span className="text-muted-foreground">| Speed: <span className="text-foreground">x{sim.speed}</span></span>
      <span className="text-muted-foreground">| Day: <span className="text-foreground">{sim.getDayPercent()}%</span></span>
      <span className="text-muted-foreground">| SPACE=start/pause R=reset</span>
    </div>
  );
}
