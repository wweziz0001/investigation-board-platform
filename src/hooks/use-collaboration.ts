'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore, User } from '@/stores/auth-store';
import { EventNode, RelationshipEdge } from '@/stores/project-store';

// Types
interface UserCursor {
  x: number;
  y: number;
}

interface OnlineUser {
  userId: string;
  userName: string;
  cursor: UserCursor | null;
}

interface EventData {
  type: 'event-created' | 'event-updated' | 'event-deleted' | 'relationship-created' | 'relationship-updated' | 'relationship-deleted';
  data: EventNode | RelationshipEdge | { id: string; projectId: string };
  userId: string;
  userName: string;
  timestamp: Date;
}

interface UpdateEvent {
  type: string;
  data: unknown;
  userId: string;
  userName: string;
  timestamp: Date;
}

interface UserPresenceEvent {
  type: 'joined' | 'left' | 'initial';
  user?: OnlineUser;
  users?: OnlineUser[];
}

interface CollaborationState {
  isConnected: boolean;
  isAvailable: boolean;
  currentProjectId: string | null;
  onlineUsers: OnlineUser[];
  lastUpdates: UpdateEvent[];
}

interface CollaborationActions {
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  emitEventCreated: (event: EventNode) => void;
  emitEventUpdated: (event: EventNode) => void;
  emitEventDeleted: (eventId: string, projectId: string) => void;
  emitRelationshipCreated: (relationship: RelationshipEdge) => void;
  emitRelationshipUpdated: (relationship: RelationshipEdge) => void;
  emitRelationshipDeleted: (relationshipId: string, projectId: string) => void;
  emitCursorMove: (x: number, y: number) => void;
  clearLastUpdates: () => void;
}

type CollaborationHook = CollaborationState & CollaborationActions;

// Cursor throttle delay in milliseconds
const CURSOR_THROTTLE_MS = 50;

export function useCollaboration(): CollaborationHook {
  const socketRef = useRef<Socket | null>(null);
  const cursorThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const pendingCursorRef = useRef<UserCursor | null>(null);
  const connectionAttemptedRef = useRef(false);
  const isAvailableRef = useRef(true);
  
  const user = useAuthStore((state) => state.user);
  
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    isAvailable: true, // Assume available until proven otherwise
    currentProjectId: null,
    onlineUsers: [],
    lastUpdates: [],
  });

  // Initialize socket connection
  useEffect(() => {
    // Only attempt connection once
    if (connectionAttemptedRef.current) return;
    connectionAttemptedRef.current = true;

    // Connect to websocket server
    // Using relative path with XTransformPort for gateway routing
    const socketInstance = io({
      path: '/',
      query: { XTransformPort: '3003' },
      transports: ['polling', 'websocket'], // Try polling first
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 3, // Reduce attempts to fail faster
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      timeout: 5000, // Reduced timeout
    });

    socketRef.current = socketInstance;

    // Connection events
    socketInstance.on('connect', () => {
      console.log('[Collaboration] Connected to server');
      setState((prev) => ({ ...prev, isConnected: true, isAvailable: true }));
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Collaboration] Disconnected from server:', reason);
      setState((prev) => ({ 
        ...prev, 
        isConnected: false,
        currentProjectId: null,
        onlineUsers: [],
      }));
    });

    socketInstance.on('connect_error', () => {
      // Only log once to reduce noise
      if (isAvailableRef.current) {
        isAvailableRef.current = false;
        console.warn('[Collaboration] Real-time collaboration unavailable. Working in offline mode.');
        setState((prev) => ({ ...prev, isAvailable: false }));
      }
    });

    socketInstance.io.on('reconnect_failed', () => {
      console.warn('[Collaboration] Connection failed. Collaboration features disabled.');
      setState((prev) => ({ ...prev, isAvailable: false }));
    });

    // User presence events
    socketInstance.on('user-presence', (data: UserPresenceEvent) => {
      if (data.type === 'initial' && data.users) {
        setState((prev) => ({ ...prev, onlineUsers: data.users || [] }));
      } else if (data.type === 'joined' && data.user) {
        setState((prev) => {
          const exists = prev.onlineUsers.some((u) => u.userId === data.user!.userId);
          if (exists) return prev;
          return {
            ...prev,
            onlineUsers: [...prev.onlineUsers, data.user!],
          };
        });
      } else if (data.type === 'left' && data.user) {
        setState((prev) => ({
          ...prev,
          onlineUsers: prev.onlineUsers.filter((u) => u.userId !== data.user!.userId),
        }));
      }
    });

    // Event updates
    socketInstance.on('event-created', (update: UpdateEvent) => {
      setState((prev) => ({
        ...prev,
        lastUpdates: [...prev.lastUpdates.slice(-99), update],
      }));
    });

    socketInstance.on('event-updated', (update: UpdateEvent) => {
      setState((prev) => ({
        ...prev,
        lastUpdates: [...prev.lastUpdates.slice(-99), update],
      }));
    });

    socketInstance.on('event-deleted', (update: UpdateEvent) => {
      setState((prev) => ({
        ...prev,
        lastUpdates: [...prev.lastUpdates.slice(-99), update],
      }));
    });

    // Relationship updates
    socketInstance.on('relationship-created', (update: UpdateEvent) => {
      setState((prev) => ({
        ...prev,
        lastUpdates: [...prev.lastUpdates.slice(-99), update],
      }));
    });

    socketInstance.on('relationship-updated', (update: UpdateEvent) => {
      setState((prev) => ({
        ...prev,
        lastUpdates: [...prev.lastUpdates.slice(-99), update],
      }));
    });

    socketInstance.on('relationship-deleted', (update: UpdateEvent) => {
      setState((prev) => ({
        ...prev,
        lastUpdates: [...prev.lastUpdates.slice(-99), update],
      }));
    });

    // Cursor updates from other users
    socketInstance.on('cursor-move', (data: { userId: string; userName: string; cursor: UserCursor }) => {
      setState((prev) => ({
        ...prev,
        onlineUsers: prev.onlineUsers.map((u) =>
          u.userId === data.userId ? { ...u, cursor: data.cursor } : u
        ),
      }));
    });

    // Server shutdown notification
    socketInstance.on('server-shutdown', (data: { message: string }) => {
      console.warn('[Collaboration] Server shutting down:', data.message);
      setState((prev) => ({
        ...prev,
        isConnected: false,
        currentProjectId: null,
        onlineUsers: [],
      }));
    });

    return () => {
      // Clear any pending cursor throttle
      if (cursorThrottleRef.current) {
        clearTimeout(cursorThrottleRef.current);
      }
      
      // Disconnect socket
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Join a project room
  const joinProject = useCallback((projectId: string) => {
    const socket = socketRef.current;
    if (!socket || !user || !state.isConnected) {
      // Silently skip if collaboration is not available
      return;
    }

    socket.emit('join-project', {
      projectId,
      userId: user.id,
      userName: user.username || user.email,
    });

    setState((prev) => ({ ...prev, currentProjectId: projectId }));
    console.log(`[Collaboration] Joining project: ${projectId}`);
  }, [user, state.isConnected]);

  // Leave a project room
  const leaveProject = useCallback((projectId: string) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('leave-project', { projectId });
    setState((prev) => ({ 
      ...prev, 
      currentProjectId: null,
      onlineUsers: [],
    }));
    console.log(`[Collaboration] Leaving project: ${projectId}`);
  }, []);

  // Emit event created
  const emitEventCreated = useCallback((event: EventNode) => {
    const socket = socketRef.current;
    if (!socket || !state.isConnected) return;

    socket.emit('event-created', { event });
  }, [state.isConnected]);

  // Emit event updated
  const emitEventUpdated = useCallback((event: EventNode) => {
    const socket = socketRef.current;
    if (!socket || !state.isConnected) return;

    socket.emit('event-updated', { event });
  }, [state.isConnected]);

  // Emit event deleted
  const emitEventDeleted = useCallback((eventId: string, projectId: string) => {
    const socket = socketRef.current;
    if (!socket || !state.isConnected) return;

    socket.emit('event-deleted', { eventId, projectId });
  }, [state.isConnected]);

  // Emit relationship created
  const emitRelationshipCreated = useCallback((relationship: RelationshipEdge) => {
    const socket = socketRef.current;
    if (!socket || !state.isConnected) return;

    socket.emit('relationship-created', { relationship });
  }, [state.isConnected]);

  // Emit relationship updated
  const emitRelationshipUpdated = useCallback((relationship: RelationshipEdge) => {
    const socket = socketRef.current;
    if (!socket || !state.isConnected) return;

    socket.emit('relationship-updated', { relationship });
  }, [state.isConnected]);

  // Emit relationship deleted
  const emitRelationshipDeleted = useCallback((relationshipId: string, projectId: string) => {
    const socket = socketRef.current;
    if (!socket || !state.isConnected) return;

    socket.emit('relationship-deleted', { relationshipId, projectId });
  }, [state.isConnected]);

  // Emit cursor move (throttled)
  const emitCursorMove = useCallback((x: number, y: number) => {
    const socket = socketRef.current;
    if (!socket || !state.isConnected) return;

    // Store pending cursor position
    pendingCursorRef.current = { x, y };

    // Throttle cursor updates
    if (!cursorThrottleRef.current) {
      cursorThrottleRef.current = setTimeout(() => {
        if (pendingCursorRef.current && socketRef.current) {
          socketRef.current.emit('cursor-move', pendingCursorRef.current);
        }
        cursorThrottleRef.current = null;
      }, CURSOR_THROTTLE_MS);
    }
  }, [state.isConnected]);

  // Clear last updates
  const clearLastUpdates = useCallback(() => {
    setState((prev) => ({ ...prev, lastUpdates: [] }));
  }, []);

  return {
    // State
    ...state,
    // Actions
    joinProject,
    leaveProject,
    emitEventCreated,
    emitEventUpdated,
    emitEventDeleted,
    emitRelationshipCreated,
    emitRelationshipUpdated,
    emitRelationshipDeleted,
    emitCursorMove,
    clearLastUpdates,
  };
}

// Export types for consumers
export type { OnlineUser, UserCursor, UpdateEvent, EventData };
