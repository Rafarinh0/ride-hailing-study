import { Reading, Sender } from './loop';

/** Sem limite de tempo, um servico travado deixaria cada motorista "em voo" para sempre. */
const REQUEST_TIMEOUT_MS = 5_000;

export function httpSender(baseUrl: string): Sender {
  return async (reading: Reading) => {
    const response = await fetch(`${baseUrl}/drivers/${reading.driverId}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: reading.lat, lng: reading.lng, recordedAt: reading.recordedAt.toISOString() }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.status !== 204) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
  };
}
