'use client';

import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  MessageSquare,
  Send,
  MoreHorizontal,
  Edit2,
  Trash2,
  Reply,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// Types
interface CommentUser {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
}

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  parentId: string;
  user: CommentUser;
}

interface Comment {
  id: string;
  content: string;
  position: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  eventId: string | null;
  relationshipId: string | null;
  userId: string;
  user: CommentUser;
  replies: Reply[];
  _count?: {
    replies: number;
  };
}

interface CommentsPanelProps {
  projectId: string;
  eventId?: string;
  relationshipId?: string;
  currentUserId?: string;
  className?: string;
}

export function CommentsPanel({
  projectId,
  eventId,
  relationshipId,
  currentUserId,
  className,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    const socketInstance = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      // Join project room for real-time updates
      socketInstance.emit('join-project', { projectId });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for comment updates
    socketInstance.on('comment-created', (comment: Comment) => {
      if (
        comment.projectId === projectId &&
        comment.eventId === (eventId || null) &&
        comment.relationshipId === (relationshipId || null)
      ) {
        setComments((prev) => [comment, ...prev]);
      }
    });

    socketInstance.on('comment-updated', (comment: Comment) => {
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? comment : c))
      );
    });

    socketInstance.on('comment-deleted', ({ id }: { id: string }) => {
      setComments((prev) => prev.filter((c) => c.id !== id));
    });

    socketInstance.on('reply-created', (data: { parentId: string; reply: Reply }) => {
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === data.parentId) {
            return {
              ...c,
              replies: [...c.replies, data.reply],
              _count: { replies: (c._count?.replies || 0) + 1 },
            };
          }
          return c;
        })
      );
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [projectId, eventId, relationshipId]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ projectId });
      if (eventId) params.append('eventId', eventId);
      if (relationshipId) params.append('relationshipId', relationshipId);

      const response = await fetch(`/api/comments?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, eventId, relationshipId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Create new comment
  const handleCreateComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          eventId,
          relationshipId,
          content: newComment.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewComment('');
        // Add to local state immediately for optimistic update
        setComments((prev) => [data.data, ...prev]);
        
        // Broadcast to other users
        if (socket && isConnected) {
          socket.emit('comment-created', {
            projectId,
            comment: data.data,
          });
        }
      }
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  // Create reply
  const handleCreateReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          parentId,
          content: replyContent.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setReplyContent('');
        setReplyingTo(null);
        
        // Add reply to parent comment
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: [...c.replies, data.data],
                _count: { replies: (c._count?.replies || 0) + 1 },
              };
            }
            return c;
          })
        );
        
        // Expand replies to show the new one
        setExpandedReplies((prev) => new Set(prev).add(parentId));

        // Broadcast to other users
        if (socket && isConnected) {
          socket.emit('reply-created', {
            projectId,
            parentId,
            reply: data.data,
          });
        }
      }
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  // Update comment
  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingComment(null);
        setEditContent('');
        
        // Update local state
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? data.data : c))
        );

        // Broadcast to other users
        if (socket && isConnected) {
          socket.emit('comment-updated', {
            projectId,
            comment: data.data,
          });
        }
      }
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  // Delete comment
  const handleDeleteComment = async () => {
    if (!deleteCommentId) return;

    try {
      const response = await fetch(`/api/comments/${deleteCommentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setComments((prev) => prev.filter((c) => c.id !== deleteCommentId));
        setDeleteCommentId(null);

        // Broadcast to other users
        if (socket && isConnected) {
          socket.emit('comment-deleted', {
            projectId,
            id: deleteCommentId,
          });
        }
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  // Toggle replies visibility
  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  // Get user initials
  const getUserInitials = (user: CommentUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  // Get user display name
  const getUserDisplayName = (user: CommentUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username;
  };

  // Format timestamp
  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Check if user can modify comment
  const canModifyComment = (comment: Comment) => {
    return comment.userId === currentUserId;
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Comments</h3>
          <Badge variant="secondary" className="ml-2">
            {comments.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-gray-300'
            )}
          />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* New Comment Input */}
      <div className="p-4 border-b">
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCreateComment();
              }
            }}
          />
          <Button
            onClick={handleCreateComment}
            disabled={!newComment.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                {/* Main Comment */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(comment.user)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {getUserDisplayName(comment.user)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(comment.createdAt)}
                        </p>
                      </div>
                    </div>
                    {canModifyComment(comment) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingComment(comment.id);
                              setEditContent(comment.content);
                            }}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteCommentId(comment.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {editingComment === comment.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[60px] resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateComment(comment.id)}
                          disabled={!editContent.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingComment(null);
                            setEditContent('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}

                  {/* Reply Button */}
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setReplyingTo(comment.id)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                    {comment.replies.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleReplies(comment.id)}
                      >
                        {expandedReplies.has(comment.id) ? (
                          <ChevronUp className="h-3 w-3 mr-1" />
                        ) : (
                          <ChevronDown className="h-3 w-3 mr-1" />
                        )}
                        {comment.replies.length}{' '}
                        {comment.replies.length === 1 ? 'reply' : 'replies'}
                      </Button>
                    )}
                  </div>

                  {/* Reply Input */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 space-y-2 pl-4 border-l-2">
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="min-h-[60px] resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleCreateReply(comment.id)}
                          disabled={!replyContent.trim()}
                        >
                          Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {expandedReplies.has(comment.id) && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3 pl-4 border-l-2">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="bg-muted/30 rounded p-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={reply.user.avatar || undefined} />
                              <AvatarFallback className="text-xs">
                                {getUserInitials(reply.user)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-xs font-medium">
                              {getUserDisplayName(reply.user)}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(reply.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteCommentId}
        onOpenChange={() => setDeleteCommentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot
              be undone. Any replies to this comment will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
