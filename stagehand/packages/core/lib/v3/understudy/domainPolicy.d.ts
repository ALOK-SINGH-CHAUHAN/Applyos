import type { Protocol } from "devtools-protocol";
import type { DomainPolicy } from "../types/public/context.js";
type DomainRule = {
    type: "exact";
    hostname: string;
} | {
    type: "wildcard";
    hostname: string;
};
export type NormalizedDomainPolicy = {
    allowedDomains: string[];
    blockedDomains: string[];
    allowedDomainRules: DomainRule[];
    blockedDomainRules: DomainRule[];
    fetchPatterns: Protocol.Fetch.RequestPattern[];
};
export type DomainPolicyDecision = {
    action: "continue";
} | {
    action: "block";
    reason: "allowedDomains" | "blockedDomains";
};
export declare function normalizeDomainPolicy(policy: DomainPolicy | null | undefined): NormalizedDomainPolicy | null;
export declare function getDomainPolicyDecision(url: string, policy: NormalizedDomainPolicy | null): DomainPolicyDecision;
export {};
