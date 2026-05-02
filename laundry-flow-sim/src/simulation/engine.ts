// Discrete-event simulation engine for laundry queue

export type ResidentState = 'arriving' | 'queuing' | 'washing' | 'hogged' | 'done' | 'balked';

export interface Resident {
  id: number;
  state: ResidentState;
  arrivalTime: number;
  startWashTime: number | null;
  endWashTime: number | null;
  hogEndTime: number | null;
  assignedMachine: number | null;
  queuePosition: number;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
}

export interface MachineState {
  id: number;
  status: 'free' | 'washing' | 'hogged';
  currentResident: number | null;
  washEndTime: number | null;
  hogEndTime: number | null;
  totalBusyTime: number;
  lastBusyStart: number;
}

export interface SimStats {
  inQueue: number;
  serving: number;
  served: number;
  avgWait: number;
  peakQueue: number;
  utilPercent: number;
  hogged: number;
  balked: number;
}

export interface SimEvent {
  time: number;
  message: string;
}

export interface SimConfig {
  numMachines: number;
  queueCap: number;
  maxCustomers: number | null;
  replications: number;
  washDuration: number; // 25-35 min
  hogProbability: number; // 0.3
  hogMinDuration: number; // 5
  hogMaxDuration: number; // 15
  dayDuration: number; // 960 min
}

export const DEFAULT_CONFIG: SimConfig = {
  numMachines: 2,
  queueCap: 8,
  maxCustomers: null,
  replications: 50,
  washDuration: 30,
  hogProbability: 0.3,
  hogMinDuration: 5,
  hogMaxDuration: 15,
  dayDuration: 960,
};

// Time-varying arrival rate (residents per minute)
function getArrivalRate(time: number): number {
  const hour = 6 + (time / 60); // start at 6 AM
  if (hour >= 6 && hour < 9) return 0.15;   // morning peak
  if (hour >= 9 && hour < 12) return 0.06;
  if (hour >= 12 && hour < 14) return 0.08;
  if (hour >= 14 && hour < 17) return 0.05;
  if (hour >= 17 && hour < 21) return 0.12;  // evening peak
  return 0.03;
}

function exponentialRandom(rate: number): number {
  return -Math.log(1 - Math.random()) / rate;
}

function uniformRandom(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export class LaundrySimulation {
  config: SimConfig;
  time: number = 0;
  residents: Resident[] = [];
  machines: MachineState[] = [];
  queues: number[][] = []; // per-machine queue of resident IDs
  events: SimEvent[] = [];
  stats: SimStats;
  nextResidentId: number = 1;
  totalWaitTime: number = 0;
  totalServed: number = 0;
  running: boolean = false;
  paused: boolean = false;
  speed: number = 1;
  nextArrivalTime: number = 0;
  pendingEvents: { time: number; type: string; data: any }[] = [];

  constructor(config: Partial<SimConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = { inQueue: 0, serving: 0, served: 0, avgWait: 0, peakQueue: 0, utilPercent: 0, hogged: 0, balked: 0 };
    this.initMachines();
    this.scheduleNextArrival();
  }

  initMachines() {
    this.machines = [];
    this.queues = [];
    for (let i = 0; i < this.config.numMachines; i++) {
      this.machines.push({
        id: i,
        status: 'free',
        currentResident: null,
        washEndTime: null,
        hogEndTime: null,
        totalBusyTime: 0,
        lastBusyStart: 0,
      });
      this.queues.push([]);
    }
  }

  scheduleNextArrival() {
    const rate = getArrivalRate(this.time);
    const interArrival = exponentialRandom(rate);
    this.nextArrivalTime = this.time + interArrival;
  }

  reset() {
    this.time = 0;
    this.residents = [];
    this.events = [];
    this.nextResidentId = 1;
    this.totalWaitTime = 0;
    this.totalServed = 0;
    this.running = false;
    this.paused = false;
    this.pendingEvents = [];
    this.stats = { inQueue: 0, serving: 0, served: 0, avgWait: 0, peakQueue: 0, utilPercent: 0, hogged: 0, balked: 0 };
    this.initMachines();
    this.scheduleNextArrival();
  }

  setMachineCount(n: number) {
    this.config.numMachines = n;
    this.reset();
  }

  // Get machine position in 3D space
  getMachineX(machineId: number): number {
    const totalWidth = (this.config.numMachines - 1) * 4;
    return -totalWidth / 2 + machineId * 4;
  }

  // Find the shortest queue
  findShortestQueue(): number {
    let minLen = Infinity;
    let minIdx = 0;
    for (let i = 0; i < this.queues.length; i++) {
      // Prefer free machines
      if (this.machines[i].status === 'free' && this.queues[i].length === 0) return i;
      if (this.queues[i].length < minLen) {
        minLen = this.queues[i].length;
        minIdx = i;
      }
    }
    return minIdx;
  }

  // Check if all queues are full
  allQueuesFull(): boolean {
    return this.queues.every(q => q.length >= this.config.queueCap);
  }

  tick(dt: number) {
    if (!this.running || this.paused) return;
    if (this.time >= this.config.dayDuration) {
      this.running = false;
      return;
    }

    const realDt = dt * this.speed;
    this.time = Math.min(this.time + realDt, this.config.dayDuration);

    // Process arrivals
    while (this.nextArrivalTime <= this.time && this.time < this.config.dayDuration) {
      if (this.config.maxCustomers !== null && this.nextResidentId > this.config.maxCustomers) break;
      this.processArrival(this.nextArrivalTime);
      this.scheduleNextArrival();
    }

    // Process machine completions
    for (const machine of this.machines) {
      if (machine.status === 'washing' && machine.washEndTime !== null && this.time >= machine.washEndTime) {
        this.processWashComplete(machine);
      }
      if (machine.status === 'hogged' && machine.hogEndTime !== null && this.time >= machine.hogEndTime) {
        this.processHogComplete(machine);
      }
    }

    // Try dispatching from queues
    for (let i = 0; i < this.machines.length; i++) {
      if (this.machines[i].status === 'free' && this.queues[i].length > 0) {
        this.dispatchFromQueue(i);
      }
    }

    // Note: visual movement of residents is handled smoothly in BlobPerson
    // (frame-rate independent lerp toward target). The engine only sets targets.

    this.updateStats();
  }

  processArrival(arrivalTime: number) {
    // Check if all queues full → balk
    if (this.allQueuesFull()) {
      const r: Resident = {
        id: this.nextResidentId++,
        state: 'balked',
        arrivalTime,
        startWashTime: null,
        endWashTime: null,
        hogEndTime: null,
        assignedMachine: null,
        queuePosition: -1,
        x: 0, z: 8,
        targetX: 0, targetZ: 8,
      };
      this.residents.push(r);
      this.stats.balked++;
      this.addEvent(`Resident balked - all queues full`);
      return;
    }

    const machineIdx = this.findShortestQueue();
    const mx = this.getMachineX(machineIdx);

    const r: Resident = {
      id: this.nextResidentId++,
      state: 'queuing',
      arrivalTime,
      startWashTime: null,
      endWashTime: null,
      hogEndTime: null,
      assignedMachine: machineIdx,
      queuePosition: this.queues[machineIdx].length,
      x: mx + (Math.random() - 0.5) * 2,
      z: 10,
      targetX: mx,
      targetZ: 4 + this.queues[machineIdx].length * 1.3,
    };

    this.residents.push(r);
    this.queues[machineIdx].push(r.id);

    this.addEvent(`C${r.id} arrived -> M${machineIdx + 1} queue`);

    // If machine is free, dispatch immediately
    if (this.machines[machineIdx].status === 'free') {
      this.dispatchFromQueue(machineIdx);
    }

    this.updateQueuePositions(machineIdx);
  }

  dispatchFromQueue(machineIdx: number) {
    const queue = this.queues[machineIdx];
    if (queue.length === 0) return;

    const resId = queue.shift()!;
    const resident = this.residents.find(r => r.id === resId);
    if (!resident) return;

    const machine = this.machines[machineIdx];
    resident.state = 'washing';
    resident.startWashTime = this.time;
    resident.assignedMachine = machineIdx;
    resident.targetX = this.getMachineX(machineIdx);
    resident.targetZ = 2.5;

    const washTime = uniformRandom(25, 35);
    machine.status = 'washing';
    machine.currentResident = resId;
    machine.washEndTime = this.time + washTime;
    machine.lastBusyStart = this.time;

    const waitTime = this.time - resident.arrivalTime;
    this.totalWaitTime += waitTime;
    this.totalServed++;

    this.addEvent(`C${resId} -> M${machineIdx + 1}`);
    this.updateQueuePositions(machineIdx);
  }

  processWashComplete(machine: MachineState) {
    const resident = this.residents.find(r => r.id === machine.currentResident);

    // Check for hogging
    if (Math.random() < this.config.hogProbability) {
      machine.status = 'hogged';
      const hogDuration = uniformRandom(this.config.hogMinDuration, this.config.hogMaxDuration);
      machine.hogEndTime = this.time + hogDuration;
      this.stats.hogged++;
      this.addEvent(`M${machine.id + 1} HOGGED!`);
      return;
    }

    this.releaseMachine(machine, resident);
  }

  processHogComplete(machine: MachineState) {
    const resident = this.residents.find(r => r.id === machine.currentResident);
    this.releaseMachine(machine, resident);
    this.addEvent(`M${machine.id + 1} hog cleared`);
  }

  releaseMachine(machine: MachineState, resident: Resident | undefined) {
    if (resident) {
      resident.state = 'done';
      resident.endWashTime = this.time;
      resident.targetX = resident.x + (Math.random() - 0.5) * 6;
      resident.targetZ = 12;
    }

    machine.totalBusyTime += this.time - machine.lastBusyStart;
    machine.status = 'free';
    machine.currentResident = null;
    machine.washEndTime = null;
    machine.hogEndTime = null;

    this.stats.served++;
  }

  updateQueuePositions(machineIdx: number) {
    const mx = this.getMachineX(machineIdx);
    this.queues[machineIdx].forEach((resId, pos) => {
      const r = this.residents.find(r => r.id === resId);
      if (r) {
        r.queuePosition = pos;
        r.targetX = mx;
        r.targetZ = 4 + pos * 1.3;
      }
    });
  }

  updateStats() {
    const queueTotal = this.queues.reduce((sum, q) => sum + q.length, 0);
    this.stats.inQueue = queueTotal;
    this.stats.serving = this.machines.filter(m => m.status !== 'free').length;
    this.stats.avgWait = this.totalServed > 0 ? Math.round((this.totalWaitTime / this.totalServed) * 10) / 10 : 0;
    this.stats.peakQueue = Math.max(this.stats.peakQueue, queueTotal);

    if (this.time > 0) {
      const totalUtil = this.machines.reduce((sum, m) => {
        let busy = m.totalBusyTime;
        if (m.status !== 'free') busy += this.time - m.lastBusyStart;
        return sum + busy;
      }, 0);
      this.stats.utilPercent = Math.round((totalUtil / (this.time * this.config.numMachines)) * 100);
    }
  }

  addEvent(message: string) {
    const mins = Math.floor(this.time);
    const timeStr = `[${mins}.0m]`;
    this.events.unshift({ time: this.time, message: `${timeStr}\n${message}` });
    if (this.events.length > 200) this.events.pop();
  }

  getTimeString(): string {
    const totalMins = Math.floor(this.time);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  getDayPercent(): number {
    return Math.round((this.time / this.config.dayDuration) * 100);
  }

  // Get active (visible) residents - filter out old done/balked
  getVisibleResidents(): Resident[] {
    return this.residents.filter(r => {
      if (r.state === 'balked') return false;
      if (r.state === 'done' && r.endWashTime !== null && this.time - r.endWashTime > 30) return false;
      return true;
    });
  }
}
