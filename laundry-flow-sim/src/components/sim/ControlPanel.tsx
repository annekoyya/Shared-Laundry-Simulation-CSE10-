import { useState } from 'react';
import type { LaundrySimulation } from '@/simulation/engine';

interface Props {
  sim: LaundrySimulation;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onFullRun: () => void;
  onSpeedChange: (s: number) => void;
  onMachineChange: (n: number) => void;
  onConfigChange: (key: string, value: any) => void;
  onShowHelp: () => void;
  onShowChart: () => void;
  onShowBatch: () => void;
  onExport: (format: 'json' | 'csv') => void;
}

const SPEEDS = [1, 2, 5, 10, 50, 100];
const SCENARIOS = [1, 2, 3, 4];

export function ControlPanel({
  sim, onStart, onPause, onReset, onFullRun,
  onSpeedChange, onMachineChange, onConfigChange,
  onShowHelp, onShowChart, onShowBatch, onExport,
}: Props) {
  const [repInput, setRepInput] = useState(String(sim.config.replications));
  const [maxInput, setMaxInput] = useState(sim.config.maxCustomers ? String(sim.config.maxCustomers) : 'no limit');
  const [queueCapInput, setQueueCapInput] = useState(String(sim.config.queueCap));

  return (
    <div className="flex flex-col gap-3 p-3 font-mono text-[13px]">
      <h1 className="text-base font-bold text-foreground tracking-wider text-center">LAUNDRY QUEUE SIM</h1>

      {/* Machines */}
      <Section title="MACHINES">
        <div className="text-center text-2xl font-bold text-foreground">{sim.config.numMachines}</div>
        <div className="flex gap-2 justify-center">
          <SimButton onClick={() => onMachineChange(sim.config.numMachines + 1)} color="primary">+Add</SimButton>
          <SimButton onClick={() => onMachineChange(Math.max(1, sim.config.numMachines - 1))} color="destructive">Remove</SimButton>
        </div>
      </Section>

      {/* Scenarios */}
      <Section title="SCENARIOS">
        <div className="grid grid-cols-2 gap-1">
          {SCENARIOS.map(n => (
            <SimButton
              key={n}
              onClick={() => onMachineChange(n)}
              active={sim.config.numMachines === n}
              color="secondary"
            >
              {n} Machine{n > 1 ? 's' : ''}
            </SimButton>
          ))}
        </div>
      </Section>

      {/* Speed */}
      <Section title="SPEED">
        <div className="text-center text-xl font-bold text-foreground">{sim.speed}x</div>
        <div className="flex flex-wrap gap-1 justify-center">
          {SPEEDS.map(s => (
            <SimButton
              key={s}
              onClick={() => onSpeedChange(s)}
              active={sim.speed === s}
              color="secondary"
              small
            >
              {s}x
            </SimButton>
          ))}
        </div>
      </Section>

      {/* Config */}
      <Section title="CONFIG">
        <ConfigRow label="Replications:">
          <input
            className="bg-secondary text-foreground border border-border rounded px-2 py-1 w-20 text-[13px] font-mono"
            value={repInput}
            onChange={e => { setRepInput(e.target.value); onConfigChange('replications', parseInt(e.target.value) || 50); }}
          />
        </ConfigRow>
        <ConfigRow label="Max customers:">
          <input
            className="bg-secondary text-foreground border border-border rounded px-2 py-1 w-20 text-[13px] font-mono"
            value={maxInput}
            onChange={e => {
              setMaxInput(e.target.value);
              const v = parseInt(e.target.value);
              onConfigChange('maxCustomers', isNaN(v) ? null : v);
            }}
          />
        </ConfigRow>
        <ConfigRow label="Queue cap/mach:">
          <input
            className="bg-secondary text-foreground border border-border rounded px-2 py-1 w-20 text-[13px] font-mono"
            value={queueCapInput}
            onChange={e => { setQueueCapInput(e.target.value); onConfigChange('queueCap', parseInt(e.target.value) || 8); }}
          />
        </ConfigRow>
      </Section>

      {/* Controls */}
      <Section title="CONTROLS">
        <SimButton onClick={onStart} color="success" full>Start</SimButton>
        <SimButton onClick={onPause} color="warning" full>Pause</SimButton>
        <SimButton onClick={onReset} color="destructive" full>Reset</SimButton>
        <SimButton onClick={onFullRun} color="info" full>Full Run</SimButton>
        <SimButton onClick={onShowBatch} color="primary" full>Batch Replication</SimButton>
        <SimButton onClick={onShowChart} color="secondary" full>Chart</SimButton>
        <SimButton onClick={onShowHelp} color="secondary" full>Help / Info</SimButton>
      </Section>

      <Section title="EXPORT">
        <SimButton onClick={() => onExport('json')} color="secondary" full>Save JSON</SimButton>
        <SimButton onClick={() => onExport('csv')} color="secondary" full>Save CSV</SimButton>
      </Section>

      {/* Legend */}
      <Section title="LEGEND">
        <LegendItem color="bg-success" label="FREE - available" />
        <LegendItem color="bg-queue-blue" label="WASHING - 25-35 min" />
        <LegendItem color="bg-warning" label="HOGGED - 30% after wash" />
        <LegendItem color="bg-queue-orange" label="Queuing (ORANGE)" />
        <LegendItem color="bg-queue-blue" label="Waiting at machine (BLUE)" />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-muted-foreground text-[11px] tracking-widest border-b border-border pb-1 mb-2 text-center">{title}</div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function ConfigRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-[12px]">{label}</span>
      {children}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
      <div className={`w-3 h-3 rounded-sm ${color} shrink-0`} />
      <span>{label}</span>
    </div>
  );
}

type BtnColor = 'primary' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info';

function SimButton({ children, onClick, color = 'secondary', active = false, full = false, small = false }: {
  children: React.ReactNode;
  onClick: () => void;
  color?: BtnColor;
  active?: boolean;
  full?: boolean;
  small?: boolean;
}) {
  const base = "rounded border font-mono transition-colors cursor-pointer";
  const size = small ? "px-2 py-0.5 text-[11px]" : "px-3 py-1.5 text-[13px]";
  const width = full ? "w-full" : "";

  const colorMap: Record<BtnColor, string> = {
    primary: "border-primary text-primary hover:bg-primary hover:text-primary-foreground",
    secondary: active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border text-foreground hover:border-primary hover:text-primary",
    destructive: "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground",
    success: "border-success text-success hover:bg-success hover:text-success-foreground",
    warning: "border-warning text-warning hover:bg-warning hover:text-warning-foreground",
    info: "border-info text-info hover:bg-info hover:text-info-foreground",
  };

  return (
    <button className={`${base} ${size} ${width} ${colorMap[color]}`} onClick={onClick}>
      {children}
    </button>
  );
}
