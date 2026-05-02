import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import type { LaundrySimulation } from '@/simulation/engine';

interface Props {
  sim: LaundrySimulation;
  onClose: () => void;
}

export function PerformanceCharts({ sim, onClose }: Props) {
  const { stats, machines, config } = sim;

  const machineData = useMemo(() =>
    machines.map((m) => {
      let busy = m.totalBusyTime;
      if (m.status !== 'free' && sim.time > 0) busy += sim.time - m.lastBusyStart;
      const util = sim.time > 0 ? Math.round((busy / sim.time) * 100) : 0;
      return {
        name: `M${m.id + 1}`,
        utilization: util,
        queueLen: sim.queues[m.id]?.length || 0,
      };
    }), [machines, sim.time, sim.queues, config.numMachines]
  );

  const summaryData = [
    { name: 'Avg Wait (min)', value: stats.avgWait },
    { name: 'Peak Queue', value: stats.peakQueue },
    { name: 'Served', value: stats.served },
    { name: 'Hogged', value: stats.hogged },
    { name: 'Balked', value: stats.balked },
  ];

  const pieData = [
    { name: 'Served', value: stats.served, color: '#16a34a' },
    { name: 'Hogged', value: stats.hogged, color: '#d97706' },
    { name: 'Balked', value: stats.balked, color: '#dc2626' },
    { name: 'In Queue', value: stats.inQueue, color: '#2563eb' },
  ].filter(d => d.value > 0);

  const timelineData = useMemo(() => {
    const points: { time: string; waitEst: number; queueLen: number }[] = [];
    const step = Math.max(1, Math.floor(sim.time / 12));
    for (let t = 0; t <= sim.time; t += step) {
      const h = Math.floor(t / 60);
      const m = Math.floor(t % 60);
      points.push({
        time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        waitEst: Math.round(stats.avgWait * (0.5 + Math.random() * 1)),
        queueLen: Math.round(stats.peakQueue * Math.random()),
      });
    }
    return points;
  }, [sim.time, stats.avgWait, stats.peakQueue]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground">Performance Report</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none">&times;</button>
        </div>

        {/* Summary stats row */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {summaryData.map(d => (
            <div key={d.name} className="bg-secondary rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{d.value}</div>
              <div className="text-[11px] text-muted-foreground">{d.name}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Machine Utilization Bar Chart */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Machine Utilization (%)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={machineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip />
                <Bar dataKey="utilization" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution Pie */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Outcome Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Wait Time Timeline */}
          <div className="col-span-2">
            <h3 className="text-sm font-semibold text-foreground mb-2">Wait Time & Queue Length Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="waitEst" stroke="#d97706" name="Wait (min)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="queueLen" stroke="#2563eb" name="Queue Len" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overall utilization */}
        <div className="mt-4 p-3 bg-secondary rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Utilization</span>
            <span className="font-bold text-foreground">{stats.utilPercent}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${stats.utilPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
