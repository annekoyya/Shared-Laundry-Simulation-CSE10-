interface Props {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 m-4 font-mono text-[13px]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-foreground">System Description & Help</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">[X]</button>
        </div>

        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <HelpSection title="Introduction">
            This is a discrete-event simulation of a shared dormitory laundry room. Residents arrive at
            time-varying rates throughout a 16-hour operating day (6:00 AM - 10:00 PM / 960 minutes),
            following a non-homogeneous Poisson process with peaks during morning (6-9 AM) and evening (5-9 PM) hours.
          </HelpSection>

          <HelpSection title="Process Flow">
            1. Residents arrive stochastically based on time-of-day demand patterns.{'\n'}
            2. Each resident is assigned to the shortest queue.{'\n'}
            3. If all queues are full (queue cap reached), the resident balks (leaves).{'\n'}
            4. When a machine becomes free, the front person in that queue starts washing.{'\n'}
            5. Wash cycle: 25-35 minutes (uniform distribution).{'\n'}
            6. After washing: 30% chance of hogging (5-15 min delay).{'\n'}
            7. Machine releases and the next queued resident is dispatched.
          </HelpSection>

          <HelpSection title="Color Coding">
            <span className="text-queue-orange font-bold">ORANGE</span> = Queuing / walking toward machine{'\n'}
            <span className="text-queue-blue font-bold">BLUE</span> = Waiting at machine while it washes{'\n'}
            <span className="text-success font-bold">GREEN</span> = Done, walking away
          </HelpSection>

          <HelpSection title="Machine States">
            <span className="text-success font-bold">FREE</span> - Available for next resident{'\n'}
            <span className="text-queue-blue font-bold">WASHING</span> - Currently running a cycle{'\n'}
            <span className="text-warning font-bold">HOGGED</span> - Cycle done but clothes not collected (blocking)
          </HelpSection>

          <HelpSection title="Performance Metrics">
            - Average Wait Time: Mean time from arrival to machine access{'\n'}
            - Machine Utilization: % of time machines are actively in use{'\n'}
            - Peak Queue Length: Maximum simultaneous waiting residents{'\n'}
            - Hogged Count: Times machines were blocked by uncollected clothes{'\n'}
            - Balked Count: Residents who left because all queues were full
          </HelpSection>

          <HelpSection title="Scenarios">
            Test 1-4 machines. The simulation evaluates which count satisfies a max 10-minute
            average wait constraint at minimum cost. Default queue capacity is 8 per machine
            (industry standard for small laundry rooms: 5-10).
          </HelpSection>

          <HelpSection title="Controls">
            - Speed: 1x, 2x, 5x, 10x, 50x, 100x (keyboard 1-6){'\n'}
            - SPACE: Start/Pause toggle{'\n'}
            - R: Reset simulation{'\n'}
            - Full Run: Completes entire 960-min day instantly{'\n'}
            - Chart: Shows performance charts after simulation
          </HelpSection>

          <HelpSection title="Simulation Parameters">
            - Operating day: 960 minutes (6 AM - 10 PM){'\n'}
            - Wash cycle: 25-35 min (uniform){'\n'}
            - Hog probability: 30%{'\n'}
            - Hog duration: 5-15 min (uniform){'\n'}
            - Default replications: 50 for statistical analysis{'\n'}
            - Queue discipline: FIFO per machine
          </HelpSection>
        </div>
      </div>
    </div>
  );
}

function HelpSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-foreground font-bold text-[14px] border-b border-border pb-1 mb-2">{title}</h3>
      <p className="whitespace-pre-wrap">{children}</p>
    </div>
  );
}
