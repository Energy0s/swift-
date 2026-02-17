/**
 * Serviço do header SWIFT
 * GET /api/swift/header
 * GET /api/swift/search
 */

import api from './api';

export interface SwiftHeaderData {
  environment: 'PROD' | 'UAT' | 'TEST';
  logicalTerminal: string;
  entityBic: string | null;
  finStatus: 'UP' | 'DEGRADED' | 'DOWN';
  gatewayStatus: 'UP' | 'DOWN';
  rmaStatus: 'OK' | 'RESTRICTED' | 'UNKNOWN';
  queues: {
    inboxPending: number;
    outboxPending: number;
  };
  alerts: {
    criticalCount: number;
    items: SwiftHeaderAlert[];
  };
  serverTime: {
    iso: string;
    tz: string;
  };
  operator: {
    id: string;
    nameShort: string;
    nameFull: string;
    registration: string | null;
    roles: string[];
    lastLoginAt: string | null;
    avatarUrl: string | null;
  };
}

export interface SwiftHeaderAlert {
  id: string;
  severity: 'CRITICAL' | 'WARN' | 'INFO';
  type: 'NACK' | 'NETWORK' | 'COMPLIANCE_HOLD' | 'QUEUE_FAIL';
  title: string;
  createdAt: string;
  messageId: string | null;
  mtType: string | null;
  reference20: string | null;
  uetr: string | null;
  status: string | null;
}

export type SwiftSearchType = 'ALL' | 'REF20' | 'UETR' | 'BIC' | 'MT' | 'STATUS';

export interface SwiftSearchResult {
  messageId: string;
  mtType: string;
  direction: 'IN' | 'OUT';
  reference20: string | null;
  uetr: string | null;
  senderBic: string | null;
  receiverBic: string | null;
  status: string;
  createdAt: string;
}

export interface SwiftSearchResponse {
  q: string;
  type: SwiftSearchType;
  results: SwiftSearchResult[];
}

export function getSwiftHeader() {
  return api.get<{ status: string; data: SwiftHeaderData }>('/swift/header');
}

export function swiftSearch(q: string, type: SwiftSearchType = 'ALL') {
  return api.get<SwiftSearchResponse>('/swift/search', { params: { q, type } });
}

export interface SwiftFooterData {
  environment: 'PROD' | 'UAT' | 'TEST';
  logicalTerminal: string;
  session: {
    sessionNumber: string | null;
    sequenceNumber: string | null;
  };
  operator: {
    idShort: string | null;
  };
  serverTime: {
    iso: string;
    tz: string;
  };
  lastRefreshAt: {
    iso: string;
    tz: string;
  };
  traffic15m: {
    sentCount: number;
    receivedCount: number;
    nackCount: number;
    holdsCount: number;
  };
  build: {
    version: string;
    commit: string;
  };
}

export function getSwiftFooter() {
  return api.get<{ status: string; data: SwiftFooterData }>('/swift/footer');
}
