import type { LaundrySimulation } from '@/simulation/engine';

export function exportSimData(sim: LaundrySimulation, format: 'json' | 'csv') {
  const data = {
    config: sim.config,
    stats: sim.stats,
    time: sim.time,
    timeString: sim.getTimeString(),
    machines: sim.machines.map(m => ({
      id: m.id,
      status: m.status,
      totalBusyTime: Math.round(m.totalBusyTime * 100) / 100,
      utilization: sim.time > 0
        ? Math.round(((m.totalBusyTime + (m.status !== 'free' ? sim.time - m.lastBusyStart : 0)) / sim.time) * 10000) / 100
        : 0,
    })),
  };

  let content: string;
  let filename: string;
  let mime: string;

  if (format === 'json') {
    content = JSON.stringify(data, null, 2);
    filename = `laundry_sim_${Date.now()}.json`;
    mime = 'application/json';
  } else {
    const rows: string[] = [];
    rows.push('Metric,Value');
    rows.push(`Sim Time,${data.timeString}`);
    rows.push(`Machines,${data.config.numMachines}`);
    rows.push(`Queue Cap,${data.config.queueCap}`);
    rows.push(`Served,${data.stats.served}`);
    rows.push(`Avg Wait (min),${data.stats.avgWait}`);
    rows.push(`Peak Queue,${data.stats.peakQueue}`);
    rows.push(`Utilization %,${data.stats.utilPercent}`);
    rows.push(`Hogged,${data.stats.hogged}`);
    rows.push(`Balked,${data.stats.balked}`);
    rows.push('');
    rows.push('Machine,Status,BusyTime,Utilization%');
    data.machines.forEach(m => {
      rows.push(`M${m.id + 1},${m.status},${m.totalBusyTime},${m.utilization}`);
    });
    content = rows.join('\n');
    filename = `laundry_sim_${Date.now()}.csv`;
    mime = 'text/csv';
  }

  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
