export type Decision = 'ALLOWED' | 'BLOCKED' | 'SANITIZED';
export type ThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type StreamDirection = 'input' | 'output';

export interface HeuristicsBranch {
  score: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  explanations: string[];
  features?: Record<string, unknown>;
  timingMs?: number;
}

export interface SemanticBranch {
  score: number;
  attackSimilarity: number;
  safeSimilarity: number;
  matchedCategory?: string;
  timingMs?: number;
}

export interface PiiBranch {
  detected: boolean;
  entityCount: number;
  categories: string[];
  timingMs?: number;
}

export interface LlmGuardBranch {
  score: number;
  verdict: string;
  modelUsed: string;
  timingMs?: number;
}

export interface VgeResponse {
  requestId: string;
  decision: Decision;
  score: number;
  threatLevel: ThreatLevel;
  confidence: number;
  categories: string[];
  branches: {
    heuristics?: HeuristicsBranch;
    semantic?: SemanticBranch;
    pii?: PiiBranch;
    llmGuard?: LlmGuardBranch;
  };
  latencyMs: number;
  timestamp: string;
  sanitizedText?: string;
  outputText?: string;
  decisionReason?: string;
  blockMessage?: string;
  missingBranches?: string[];
  waitedMs?: number;
  decisionFlags?: string[];
  requestReceivedAt?: string;
  decisionFinalizedAt?: string;
  decisionLatencyMs?: number;
  languageInfo?: {
    detectedLanguage: string;
    confidence: number;
    method: string;
  };
  arbiterSignal?: 'ALLOW' | 'BLOCK';
  ruleAction?: 'ALLOW' | 'BLOCK' | 'LOG' | 'SANITIZE';
  ruleSetId?: number;
  ruleSetName?: string;
  redactionApplied?: boolean;
  redactedText?: string;
  redactionMatchCount?: number;
  failOpen?: boolean;
}

export interface NodeOptions {
  timeout?: number;
  failOpen?: boolean;
  includeFullResponse?: boolean;
  metadata?: string;
}
