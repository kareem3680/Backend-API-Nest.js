export const SOCKET_ROOM_PREFIXES = {
  USER: 'user_',
  ROLE: 'role_',
} as const;

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  NEW_NOTIFICATION: 'newNotification',
  NOTIFICATION_READ: 'notificationRead',
  NOTIFICATIONS_READ: 'notificationsRead',
  SOCKET_ERROR: 'socketError',
  PING: 'ping',
  PONG: 'pong',
} as const;

export const SOCKET_ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required',
  AUTH_FAILED: 'Authentication failed',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please slow down',
  INTERNAL_ERROR: 'Internal server error',
} as const;

export type SocketRoomPrefix =
  (typeof SOCKET_ROOM_PREFIXES)[keyof typeof SOCKET_ROOM_PREFIXES];
export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
export type SocketErrorMessage =
  (typeof SOCKET_ERROR_MESSAGES)[keyof typeof SOCKET_ERROR_MESSAGES];
