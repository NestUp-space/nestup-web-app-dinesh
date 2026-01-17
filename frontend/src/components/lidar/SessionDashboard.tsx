"use client";

/**
 * Session Dashboard Component
 * List and manage LiDAR scanning sessions
 */

import React, { useState } from "react";
import {
  useLidarSessions,
  useLidarSessionMutations,
} from "@/hooks/lidar/useLidarSession";
import { LidarSession, LidarSessionStatus } from "@/types/lidar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface SessionDashboardProps {
  onSessionSelect?: (sessionId: string) => void;
}

// Status color mapping
const statusColors: Record<LidarSessionStatus, string> = {
  CREATED: "bg-gray-100 text-gray-800",
  UPLOADING: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-yellow-100 text-yellow-800",
  PROCESSED: "bg-green-100 text-green-800",
  DESIGNING: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
};

// Status icons
const statusIcons: Record<LidarSessionStatus, string> = {
  CREATED: "📄",
  UPLOADING: "⬆️",
  PROCESSING: "⏳",
  PROCESSED: "✅",
  DESIGNING: "✏️",
  COMPLETED: "🎉",
  FAILED: "❌",
};

function SessionCard({
  session,
  onSelect,
  onDelete,
}: {
  session: LidarSession;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-2" onClick={onSelect}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {session.name || `Session ${session.id.slice(0, 8)}...`}
            </CardTitle>
            <CardDescription>
              Created {new Date(session.createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge className={statusColors[session.status]}>
            {statusIcons[session.status]} {session.status.toLowerCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent onClick={onSelect}>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Walls:</span>{" "}
            <span className="font-medium">{session.wallCount || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Modules:</span>{" "}
            <span className="font-medium">{session.moduleCount || 0}</span>
          </div>
          {session.scanData && (
            <>
              <div>
                <span className="text-gray-500">Format:</span>{" "}
                <span className="font-medium">
                  {session.scanData.scanFormat.replace("_", " ")}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Upload:</span>{" "}
                <span className="font-medium">
                  {session.scanData.uploadStatus.toLowerCase()}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onSelect}
          >
            Open
          </Button>
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive">
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Session</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this session? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    onDelete();
                    setShowDeleteDialog(false);
                  }}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateSessionDialog({
  open,
  onOpenChange,
  onCreate,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");

  const handleCreate = () => {
    onCreate(name || undefined!);
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
          <DialogDescription>
            Start a new LiDAR scanning session. You can upload scan data after
            creating the session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-name">Session Name (optional)</Label>
            <Input
              id="session-name"
              placeholder="e.g., Living Room Scan"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SessionDashboard({
  onSessionSelect,
}: SessionDashboardProps) {
  const { sessions, isLoading, error, refresh } = useLidarSessions({ limit: 50 });
  const {
    createSession,
    deleteSession,
    isLoading: isMutating,
  } = useLidarSessionMutations();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filter, setFilter] = useState<LidarSessionStatus | "ALL">("ALL");

  const handleCreateSession = async (name: string) => {
    try {
      const session = await createSession({ name: name || undefined });
      setShowCreateDialog(false);
      if (session && onSessionSelect) {
        onSessionSelect(session.id);
      }
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      refresh();
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  // Filter sessions
  const filteredSessions =
    filter === "ALL"
      ? sessions
      : sessions.filter((s) => s.status === filter);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LiDAR Sessions</h1>
          <p className="text-gray-500">
            Manage your room scanning sessions
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          + New Session
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["ALL", "CREATED", "PROCESSING", "PROCESSED", "DESIGNING", "COMPLETED", "FAILED"] as const).map(
          (status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === "ALL" ? "All" : status.toLowerCase()}
            </Button>
          )
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Failed to load sessions: {error.message}</p>
          <Button variant="outline" size="sm" onClick={refresh} className="mt-2">
            Retry
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === "ALL"
              ? "No sessions yet"
              : `No ${filter.toLowerCase()} sessions`}
          </h3>
          <p className="text-gray-500 mb-4">
            {filter === "ALL"
              ? "Create your first LiDAR scanning session to get started."
              : "Try changing the filter or create a new session."}
          </p>
          {filter === "ALL" && (
            <Button onClick={() => setShowCreateDialog(true)}>
              Create Session
            </Button>
          )}
        </div>
      )}

      {/* Sessions Grid */}
      {!isLoading && filteredSessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onSelect={() => onSessionSelect?.(session.id)}
              onDelete={() => handleDeleteSession(session.id)}
            />
          ))}
        </div>
      )}

      {/* Create Session Dialog */}
      <CreateSessionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreateSession}
        isLoading={isMutating}
      />
    </div>
  );
}
