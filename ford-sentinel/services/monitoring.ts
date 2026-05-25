import { auditLog } from './security';

export interface Event {
  type: string;
  message: string;
  data?: any;
}

export function logEvent(event: Event) {
  // Logging estruturado JSON
  auditLog(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: event.type,
    message: event.message,
    data: event.data || null
  }));
}

export function alertCritical(message: string, data?: any) {
  logEvent({ type: 'CRITICAL', message, data });
}