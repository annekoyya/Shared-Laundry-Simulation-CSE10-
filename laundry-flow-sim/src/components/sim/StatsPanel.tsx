import type { LaundrySimulation } from '@/simulation/engine';

interface Props {
  sim: LaundrySimulation;
}

export function StatsPanel({ sim }: Props) {
  const { stats } = sim;

  return (
    <div className="flex flex-col gap-3 p-3 font-mono text-[13px]">
      {/* Live Stats */}
      <Section title="LIVE STATS">
        <StatRow label="In Queue" value={stats.inQueue} />
        <StatRow label="Serving" value={stats.serving} />
        <StatRow label="Served" value={stats.served} color="text-success" />
        <StatRow label="Avg Wait" value={`${stats.avgWait}s`} />
        <StatRow label="Peak Queue" value={stats.peakQueue} />
        <StatRow label="Util %" value={`${stats.utilPercent}%`} />
        <StatRow label="Hogged" value={stats.hogged} color="text-warning" />
        <StatRow label="Balked" value={stats.balked} color="text-destructive" />
      </Section>

      {/* Machines */}
      <Section title="MACHINES">
        {sim.machines.map(m => {
          const statusColor = m.status === 'free' ? 'text-success' : m.status === 'hogged' ? 'text-warning' : 'text-info';
          const q = sim.queues[m.id];
          return (
            <div key={m.id} className="flex items-center gap-2">
              <span className="text-muted-foreground w-8">M{m.id + 1}</span>
              <span className={`${statusColor} font-bold w-16`}>{m.status.toUpperCase()}</span>
              <span className="text-muted-foreground">Q:{q.length}/{sim.config.queueCap}</span>
              {/* Mini progress bar */}
              <div className="flex-1 h-2 bg-secondary rounded overflow-hidden">
                <div
                  className={`h-full transition-all ${m.status === 'hogged' ? 'bg-warning' : m.status === 'washing' ? 'bg-info' : 'bg-success'}`}
                  style={{ width: `${(q.length / sim.config.queueCap) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </Section>

      {/* Event Log */}
      <Section title="EVENT LOG">
        <div className="max-h-[400px] overflow-y-auto space-y-0.5">
          {sim.events.slice(0, 50).map((evt, i) => (
            <div key={i} className="text-[11px] text-muted-foreground leading-tight whitespace-pre-wrap">
              {evt.message}
            </div>
          ))}
        </div>
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

function StatRow({ label, value, color = 'text-foreground' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}
