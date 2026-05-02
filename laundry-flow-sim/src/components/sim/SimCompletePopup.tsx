import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import type { LaundrySimulation } from '@/simulation/engine';

interface Props {
  sim: LaundrySimulation;
  onClose: () => void;
  onViewCharts: () => void;
}

export function SimCompletePopup({ sim, onClose, onViewCharts }: Props) {
  const { stats, machines } = sim;

  const machineData = machines.map((m) => {
    let busy = m.totalBusyTime;
    if (m.status !== 'free' && sim.time > 0) busy += sim.time - m.lastBusyStart;
    return { name: `M${m.id + 1}`, util: sim.time > 0 ? Math.round((busy / sim.time) * 100) : 0 };
  });

  const pieData = [
    { name: 'Served', value: stats.served, color: '#16a34a' },
    { name: 'Hogged', value: stats.hogged, color: '#d97706' },
    { name: 'Balked', value: stats.balked, color: '#dc2626' },
  ].filter(d => d.value > 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl max-w-lg w-full p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-foreground">Simulation Complete</h2>
          <p className="text-sm text-muted-foreground">Day finished — {sim.getTimeString()} elapsed</p>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Served', val: stats.served, color: 'text-success' },
            { label: 'Avg Wait', val: `${stats.avgWait}m`, color: 'text-foreground' },
            { label: 'Util %', val: `${stats.utilPercent}%`, color: 'text-info' },
            { label: 'Balked', val: stats.balked, color: 'text-destructive' },
          ].map(s => (
            <div key={s.label} className="bg-secondary rounded-lg p-2 text-center">
              <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mini charts */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1">Utilization</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={machineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis domain={[0, 100]} fontSize={10} />
                <Tooltip />
                <Bar dataKey="util" fill="#2563eb" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1">Outcomes</div>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={45} label>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onViewCharts}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
          >
            View Full Report
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:opacity-80"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
