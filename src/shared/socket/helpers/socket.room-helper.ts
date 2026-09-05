import { SOCKET_ROOM_PREFIXES } from '../constants/socket.constants';

export function getUserRoom(userId: string): string {
  return `${SOCKET_ROOM_PREFIXES.USER}${userId}`;
}

export function getRoleRoom(role: string, companyId: string): string {
  return `${SOCKET_ROOM_PREFIXES.ROLE}${role}_${companyId}`;
}

export function getSocketRooms(socketRooms: Set<string>): string[] {
  return Array.from(socketRooms);
}

export function isUserRoom(room: string): boolean {
  return room.startsWith(SOCKET_ROOM_PREFIXES.USER);
}

export function isRoleRoom(room: string): boolean {
  return room.startsWith(SOCKET_ROOM_PREFIXES.ROLE);
}

export function extractUserIdFromRoom(room: string): string | null {
  if (!isUserRoom(room)) {
    return null;
  }
  return room.substring(SOCKET_ROOM_PREFIXES.USER.length);
}

export function extractRoleAndCompanyFromRoom(
  room: string,
): { role: string; companyId: string } | null {
  if (!isRoleRoom(room)) {
    return null;
  }
  const parts = room.substring(SOCKET_ROOM_PREFIXES.ROLE.length).split('_');
  if (parts.length !== 2) {
    return null;
  }
  return { role: parts[0], companyId: parts[1] };
}
