import { Socket } from 'socket.io';
import {
  SOCKET_EVENTS,
  SocketErrorMessage,
} from '../constants/socket.constants';
import { SocketErrorPayload } from '../interfaces/socket.interface';

export function emitSocketError(
  socket: Socket,
  message: SocketErrorMessage,
  statusCode: number = 500,
): void {
  const payload: SocketErrorPayload = {
    message: sanitizeErrorMessage(message),
    statusCode,
    timestamp: new Date().toISOString(),
  };

  socket.emit(SOCKET_EVENTS.SOCKET_ERROR, payload);
}

function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return 'An error occurred';
  }

  const cleaned = message
    .split('\n')[0]
    .replace(/at .+:\d+:\d+/g, '')
    .replace(/[/\w.-]+/g, '')
    .trim();

  return cleaned || 'An error occurred';
}

export function createSocketError(
  message: string,
  code: number,
  details: unknown = null,
): { message: string; code: number; details: unknown } {
  return {
    message,
    code,
    details,
  };
}
