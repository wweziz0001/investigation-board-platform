import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Types
interface UserCursor {
  x: number
  y: number
}

interface OnlineUser {
  socketId: string
  userId: string
  userName: string
  projectId: string
  cursor: UserCursor | null
  joinedAt: Date
}

interface EventData {
  id: string
  projectId: string
  title: string
  description?: string
  eventDate?: string
  eventTime?: string
  location?: string
  eventType: string
  status: string
  confidence: number
  importance: number
  verified: boolean
  positionX: number
  positionY: number
  width: number
  height: number
  zIndex: number
  isExpanded: boolean
  isLocked: boolean
  color?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface RelationshipData {
  id: string
  projectId: string
  sourceEventId: string
  targetEventId: string
  relationType: string
  label?: string
  description?: string
  strength: number
  confidence: number
  color?: string
  lineStyle: string
  lineWidth: number
  isAnimated: boolean
  isCurved: boolean
  createdAt: string
  updatedAt: string
}

interface UpdateEvent {
  type: 'event-created' | 'event-updated' | 'event-deleted' | 'relationship-created' | 'relationship-updated' | 'relationship-deleted'
  data: EventData | RelationshipData | { id: string; projectId: string }
  userId: string
  userName: string
  timestamp: Date
}

// Storage
const connectedUsers = new Map<string, OnlineUser>()
const projectRooms = new Map<string, Set<string>>() // projectId -> Set of socketIds

// Helper functions
const getProjectRoom = (projectId: string) => `project:${projectId}`

const getUsersInProject = (projectId: string): OnlineUser[] => {
  const socketIds = projectRooms.get(projectId)
  if (!socketIds) return []
  
  return Array.from(socketIds)
    .map(socketId => connectedUsers.get(socketId))
    .filter((user): user is OnlineUser => user !== undefined)
}

const broadcastToProject = (projectId: string, event: string, data: unknown, excludeSocket?: Socket) => {
  const room = getProjectRoom(projectId)
  if (excludeSocket) {
    excludeSocket.to(room).emit(event, data)
  } else {
    io.to(room).emit(event, data)
  }
}

// Connection handler
io.on('connection', (socket: Socket) => {
  console.log(`[Collaboration] User connected: ${socket.id}`)

  // ========== Project Room Management ==========

  socket.on('join-project', (data: { projectId: string; userId: string; userName: string }) => {
    const { projectId, userId, userName } = data
    
    // Leave any existing project rooms
    const existingUser = connectedUsers.get(socket.id)
    if (existingUser) {
      const existingRoom = getProjectRoom(existingUser.projectId)
      socket.leave(existingRoom)
      
      // Remove from project room tracking
      const roomUsers = projectRooms.get(existingUser.projectId)
      if (roomUsers) {
        roomUsers.delete(socket.id)
        if (roomUsers.size === 0) {
          projectRooms.delete(existingUser.projectId)
        }
      }
      
      // Notify others that user left
      broadcastToProject(existingUser.projectId, 'user-presence', {
        type: 'left',
        user: {
          userId: existingUser.userId,
          userName: existingUser.userName,
          cursor: existingUser.cursor
        }
      })
    }
    
    // Join new project room
    const roomName = getProjectRoom(projectId)
    socket.join(roomName)
    
    // Track user
    const onlineUser: OnlineUser = {
      socketId: socket.id,
      userId,
      userName,
      projectId,
      cursor: null,
      joinedAt: new Date()
    }
    connectedUsers.set(socket.id, onlineUser)
    
    // Track project room membership
    if (!projectRooms.has(projectId)) {
      projectRooms.set(projectId, new Set())
    }
    projectRooms.get(projectId)!.add(socket.id)
    
    // Get current users in project
    const usersInProject = getUsersInProject(projectId)
    
    // Send current users to the joining user
    socket.emit('user-presence', {
      type: 'initial',
      users: usersInProject.map(u => ({
        userId: u.userId,
        userName: u.userName,
        cursor: u.cursor
      }))
    })
    
    // Notify others that user joined
    broadcastToProject(projectId, 'user-presence', {
      type: 'joined',
      user: {
        userId,
        userName,
        cursor: null
      }
    }, socket)
    
    console.log(`[Collaboration] ${userName} (${userId}) joined project ${projectId}. Total users in project: ${usersInProject.length}`)
  })

  socket.on('leave-project', (data: { projectId: string }) => {
    const { projectId } = data
    const user = connectedUsers.get(socket.id)
    
    if (user && user.projectId === projectId) {
      const roomName = getProjectRoom(projectId)
      socket.leave(roomName)
      
      // Remove from tracking
      connectedUsers.delete(socket.id)
      const roomUsers = projectRooms.get(projectId)
      if (roomUsers) {
        roomUsers.delete(socket.id)
        if (roomUsers.size === 0) {
          projectRooms.delete(projectId)
        }
      }
      
      // Notify others
      broadcastToProject(projectId, 'user-presence', {
        type: 'left',
        user: {
          userId: user.userId,
          userName: user.userName,
          cursor: user.cursor
        }
      })
      
      console.log(`[Collaboration] ${user.userName} left project ${projectId}`)
    }
  })

  // ========== Event Operations ==========

  socket.on('event-created', (data: { event: EventData }) => {
    const user = connectedUsers.get(socket.id)
    if (!user) return
    
    const { event } = data
    
    const update: UpdateEvent = {
      type: 'event-created',
      data: event,
      userId: user.userId,
      userName: user.userName,
      timestamp: new Date()
    }
    
    broadcastToProject(user.projectId, 'event-created', update, socket)
    console.log(`[Collaboration] Event created: ${event.id} by ${user.userName}`)
  })

  socket.on('event-updated', (data: { event: EventData }) => {
    const user = connectedUsers.get(socket.id)
    if (!user) return
    
    const { event } = data
    
    const update: UpdateEvent = {
      type: 'event-updated',
      data: event,
      userId: user.userId,
      userName: user.userName,
      timestamp: new Date()
    }
    
    broadcastToProject(user.projectId, 'event-updated', update, socket)
    console.log(`[Collaboration] Event updated: ${event.id} by ${user.userName}`)
  })

  socket.on('event-deleted', (data: { eventId: string; projectId: string }) => {
    const user = connectedUsers.get(socket.id)
    if (!user) return
    
    const { eventId, projectId } = data
    
    const update: UpdateEvent = {
      type: 'event-deleted',
      data: { id: eventId, projectId },
      userId: user.userId,
      userName: user.userName,
      timestamp: new Date()
    }
    
    broadcastToProject(projectId, 'event-deleted', update, socket)
    console.log(`[Collaboration] Event deleted: ${eventId} by ${user.userName}`)
  })

  // ========== Relationship Operations ==========

  socket.on('relationship-created', (data: { relationship: RelationshipData }) => {
    const user = connectedUsers.get(socket.id)
    if (!user) return
    
    const { relationship } = data
    
    const update: UpdateEvent = {
      type: 'relationship-created',
      data: relationship,
      userId: user.userId,
      userName: user.userName,
      timestamp: new Date()
    }
    
    broadcastToProject(user.projectId, 'relationship-created', update, socket)
    console.log(`[Collaboration] Relationship created: ${relationship.id} by ${user.userName}`)
  })

  socket.on('relationship-updated', (data: { relationship: RelationshipData }) => {
    const user = connectedUsers.get(socket.id)
    if (!user) return
    
    const { relationship } = data
    
    const update: UpdateEvent = {
      type: 'relationship-updated',
      data: relationship,
      userId: user.userId,
      userName: user.userName,
      timestamp: new Date()
    }
    
    broadcastToProject(user.projectId, 'relationship-updated', update, socket)
    console.log(`[Collaboration] Relationship updated: ${relationship.id} by ${user.userName}`)
  })

  socket.on('relationship-deleted', (data: { relationshipId: string; projectId: string }) => {
    const user = connectedUsers.get(socket.id)
    if (!user) return
    
    const { relationshipId, projectId } = data
    
    const update: UpdateEvent = {
      type: 'relationship-deleted',
      data: { id: relationshipId, projectId },
      userId: user.userId,
      userName: user.userName,
      timestamp: new Date()
    }
    
    broadcastToProject(projectId, 'relationship-deleted', update, socket)
    console.log(`[Collaboration] Relationship deleted: ${relationshipId} by ${user.userName}`)
  })

  // ========== Cursor Tracking ==========

  socket.on('cursor-move', (data: { x: number; y: number }) => {
    const user = connectedUsers.get(socket.id)
    if (!user) return
    
    const { x, y } = data
    
    // Update user cursor
    user.cursor = { x, y }
    
    // Broadcast cursor position to project room
    broadcastToProject(user.projectId, 'cursor-move', {
      userId: user.userId,
      userName: user.userName,
      cursor: { x, y }
    }, socket)
  })

  // ========== Disconnection ==========

  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id)
    
    if (user) {
      // Remove from tracking
      connectedUsers.delete(socket.id)
      
      // Remove from project room
      const roomUsers = projectRooms.get(user.projectId)
      if (roomUsers) {
        roomUsers.delete(socket.id)
        if (roomUsers.size === 0) {
          projectRooms.delete(user.projectId)
        }
      }
      
      // Notify others in the project
      broadcastToProject(user.projectId, 'user-presence', {
        type: 'left',
        user: {
          userId: user.userId,
          userName: user.userName,
          cursor: user.cursor
        }
      })
      
      console.log(`[Collaboration] ${user.userName} disconnected from project ${user.projectId}`)
    } else {
      console.log(`[Collaboration] User disconnected: ${socket.id}`)
    }
  })

  // ========== Error Handling ==========

  socket.on('error', (error: Error) => {
    console.error(`[Collaboration] Socket error (${socket.id}):`, error.message)
  })
})

// Start server
const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[Collaboration] WebSocket server running on port ${PORT}`)
})

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`[Collaboration] Received ${signal} signal, shutting down server...`)
  
  // Notify all connected users
  io.emit('server-shutdown', {
    message: 'Server is shutting down',
    timestamp: new Date()
  })
  
  httpServer.close(() => {
    console.log('[Collaboration] WebSocket server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
