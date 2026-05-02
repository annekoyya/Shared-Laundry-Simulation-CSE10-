import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { runBatchReplication, type BatchResult } from '@/simulation/batch';
import type { LaundrySimulation } from '@/simulation/engine';

interface Props {
  sim: LaundrySimulation;
  onClose: () => void;
}

export function BatchReplicationModal({ sim, onClose }: Props) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [reps, setReps] = useState(sim.config.replications);

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => {
      const r = runBatchReplication(sim.config, reps);
      setResult(r);
      setRunning(false);
    }, 50);
  };

  const kpiLabels: Record<string, string> = {
    avgWait: 'Avg Wait (min)',
    utilPercent: 'Utilization (%)',
    peakQueue: 'Peak Queue',
    served: 'Served',
    hogged: 'Hogged',
    balked: 'Balked',
  };

  const chartData = result
    ? Object.keys(kpiLabels).map(k => ({
        name: kpiLabels[k],
        mean: result.mean[k],
        lower: result.ci95[k][0],
        upper: result.ci95[k][1],
        stddev: result.stddev[k],
      }))
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">Batch Replication</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none">&times;</button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-muted-foreground">Replications:</label>
          <input
            type="number"
            min={5}
            max={200}
            value={reps}
            onChange={e => setReps(parseInt(e.target.value) || 50)}
            className="bg-secondary text-foreground border border-border rounded px-2 py-1 w-20 text-sm font-mono"
          />
          <button
            onClick={handleRun}
            disabled={running}
            className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {running ? 'Running...' : 'Run Batch'}
          </button>
          <span className="text-xs text-muted-foreground">Config: {sim.config.numMachines} machines, cap {sim.config.queueCap}</span>
        </div>

        {running && (
          <div className="text-center py-8 text-muted-foreground animate-pulse">
            Running {reps} replications...
          </div>
        )}

        {result && !running && (
          <>
            {/* CI Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">KPI</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Mean</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Std Dev</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">95% CI Lower</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">95% CI Upper</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(kpiLabels).map(k => (
                    <tr key={k} className="border-b border-border/50">
                      <td className="py-2 text-foreground">{kpiLabels[k]}</td>
                      <td className="py-2 text-right font-mono font-bold text-foreground">{result.mean[k]}</td>
                      <td className="py-2 text-right font-mono text-muted-foreground">{result.stddev[k]}</td>
                      <td className="py-2 text-right font-mono text-info">{result.ci95[k][0]}</td>
                      <td className="py-2 text-right font-mono text-info">{result.ci95[k][1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Chart */}
            <h3 className="text-sm font-semibold text-foreground mb-2">Mean KPIs with 95% CI</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" height={50} />
                <YAxis fontSize={11} />
                <Tooltip
                  formatter={(val: number, name: string) => [val, name]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend />
                <Bar dataKey="mean" fill="#2563eb" name="Mean" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lower" fill="#93c5fd" name="CI Lower" radius={[4, 4, 0, 0]} />
                <Bar dataKey="upper" fill="#1d4ed8" name="CI Upper" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <p className="text-xs text-muted-foreground mt-3 text-center">
              {result.n} replications | 960-min day | {sim.config.numMachines} machines | Queue cap {sim.config.queueCap}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
