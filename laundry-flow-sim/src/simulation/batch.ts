// Batch replication runner — runs N independent sim replications and computes 95% CI
import { LaundrySimulation, type SimConfig, DEFAULT_CONFIG } from './engine';

export interface ReplicationResult {
  avgWait: number;
  utilPercent: number;
  peakQueue: number;
  served: number;
  hogged: number;
  balked: number;
}

export interface BatchResult {
  n: number;
  results: ReplicationResult[];
  mean: Record<string, number>;
  ci95: Record<string, [number, number]>;
  stddev: Record<string, number>;
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr: number[], m: number): number {
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}

export function runBatchReplication(config: Partial<SimConfig> = {}, n = 50): BatchResult {
  const results: ReplicationResult[] = [];
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  for (let i = 0; i < n; i++) {
    const sim = new LaundrySimulation(fullConfig);
    sim.running = true;
    sim.speed = 100;
    for (let t = 0; t < 200000 && sim.time < sim.config.dayDuration; t++) {
      sim.tick(0.5);
    }
    results.push({
      avgWait: sim.stats.avgWait,
      utilPercent: sim.stats.utilPercent,
      peakQueue: sim.stats.peakQueue,
      served: sim.stats.served,
      hogged: sim.stats.hogged,
      balked: sim.stats.balked,
    });
  }

  const keys = ['avgWait', 'utilPercent', 'peakQueue', 'served', 'hogged', 'balked'] as const;
  const meanMap: Record<string, number> = {};
  const ci95Map: Record<string, [number, number]> = {};
  const stddevMap: Record<string, number> = {};

  for (const k of keys) {
    const vals = results.map(r => r[k]);
    const m = mean(vals);
    const s = vals.length > 1 ? stddev(vals, m) : 0;
    const t = 1.96;
    const margin = t * s / Math.sqrt(vals.length);
    meanMap[k] = Math.round(m * 100) / 100;
    ci95Map[k] = [Math.round((m - margin) * 100) / 100, Math.round((m + margin) * 100) / 100];
    stddevMap[k] = Math.round(s * 100) / 100;
  }

  return { n, results, mean: meanMap, ci95: ci95Map, stddev: stddevMap };
}
