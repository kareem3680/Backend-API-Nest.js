import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  user?: {
    _id: string;
    role: string;
    companyId?: string | null;
    name: string;
    active: boolean;
  };
}

export interface ExtendedHandshake {
  auth?: {
    token?: string;
  };
  headers?: {
    authorization?: string;
  };
}

export interface SocketErrorPayload {
  message: string;
  statusCode: number;
  timestamp: string;
}
