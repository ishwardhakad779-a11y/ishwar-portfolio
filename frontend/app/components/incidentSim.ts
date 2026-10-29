/* =========================================================
   Incident simulator: scenarios + state machine (no UI, no network)
   Flow tumhare Incident_AI project jaisa:
   diagnose -> propose_fix -> human_approval -> execute
   ========================================================= */

export type Phase = "idle" | "diagnosing" | "proposing" | "awaiting" | "executing" | "done";
export type StepName = "diagnose" | "propose_fix" | "human_approval" | "execute";

export type Scenario = {
  id: string;
  title: string;
  severity: "SEV-1" | "SEV-2" | "SEV-3";
  report: string;
  diagnosis: string;
  fix: string;
  confidence: number;
};

export type LogEntry = { step: StepName; detail: string; at: number };

export type SimState = {
  scenarioId: string;
  phase: Phase;
  approved: boolean | null;
  log: LogEntry[];
};

export type Action =
  | { type: "SELECT"; scenarioId: string }
  | { type: "START" }
  | { type: "DIAGNOSED"; at: number }
  | { type: "PROPOSED"; at: number }
  | { type: "DECIDE"; approved: boolean; at: number }
  | { type: "EXECUTED"; at: number }
  | { type: "RESET" };

export const LOW_CONFIDENCE = 0.6;

export const SCENARIOS: Scenario[] = [
  {
    id: "checkout",
    title: "Checkout API returning 500s",
    severity: "SEV-1",
    report:
      "02:14 UTC: checkout-service error rate jumped from 0.2% to 38% right after the 02:05 deploy (v2.31). Logs show NullPointerException in PaymentMapper. Database and queue metrics look healthy.",
    diagnosis:
      "A bad release (v2.31) introduced a null-handling bug in PaymentMapper that crashes on orders without a coupon. The error spike started 9 minutes after the deploy, and infrastructure metrics are normal.",
    fix: "Roll back checkout-service to v2.30",
    confidence: 0.91,
  },
  {
    id: "database",
    title: "Database connections exhausted",
    severity: "SEV-2",
    report:
      "orders-db is throwing 'too many connections'. Active connections are 500/500 and API p95 latency went from 180 ms to 9 s. A nightly reporting job started at 01:00.",
    diagnosis:
      "A long-running reporting query is holding connections open, so the pool is exhausted and the API is starved. The job started at 01:00 and never released its connections.",
    fix: "Terminate the stuck reporting sessions and cap the job's pool at 20 connections",
    confidence: 0.74,
  },
  {
    id: "memory",
    title: "Worker memory keeps climbing",
    severity: "SEV-3",
    report:
      "worker-3 memory is at 94% and rising about 2% per hour for three days. The pod restarts roughly every 14 hours with OOMKilled. Traffic has not changed.",
    diagnosis:
      "Slow memory leak in the image-resize worker: the in-process cache has no eviction limit, so memory grows until the pod is OOM-killed.",
    fix: "Add a max-size LRU limit to the cache and restart the workers",
    confidence: 0.52,
  },
];

export function getScenario(id: string): Scenario {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
}

export function executionResult(scenario: Scenario, approved: boolean): string {
  return approved
    ? `Executed fix: ${scenario.fix} (simulated)`
    : "Fix rejected by human reviewer. No action taken.";
}

export function initialState(scenarioId: string = SCENARIOS[0].id): SimState {
  return { scenarioId, phase: "idle", approved: null, log: [] };
}

export function simReducer(state: SimState, action: Action): SimState {
  const scenario = getScenario(state.scenarioId);

  switch (action.type) {
    case "SELECT":
      if (state.phase !== "idle" && state.phase !== "done") return state;
      if (!SCENARIOS.some((s) => s.id === action.scenarioId)) return state;
      return initialState(action.scenarioId);

    case "START":
      if (state.phase !== "idle" && state.phase !== "done") return state;
      return { scenarioId: state.scenarioId, phase: "diagnosing", approved: null, log: [] };

    case "DIAGNOSED":
      if (state.phase !== "diagnosing") return state;
      return {
        ...state,
        phase: "proposing",
        log: [...state.log, { step: "diagnose", detail: scenario.diagnosis, at: action.at }],
      };

    case "PROPOSED":
      if (state.phase !== "proposing") return state;
      return {
        ...state,
        phase: "awaiting",
        log: [
          ...state.log,
          {
            step: "propose_fix",
            detail: `${scenario.fix} (confidence=${scenario.confidence})`,
            at: action.at,
          },
        ],
      };

    case "DECIDE":
      if (state.phase !== "awaiting") return state;
      return {
        ...state,
        phase: "executing",
        approved: action.approved,
        log: [
          ...state.log,
          { step: "human_approval", detail: `approved=${action.approved}`, at: action.at },
        ],
      };

    case "EXECUTED":
      if (state.phase !== "executing" || state.approved === null) return state;
      return {
        ...state,
        phase: "done",
        log: [
          ...state.log,
          { step: "execute", detail: executionResult(scenario, state.approved), at: action.at },
        ],
      };

    case "RESET":
      return initialState(state.scenarioId);

    default:
      return state;
  }
}
