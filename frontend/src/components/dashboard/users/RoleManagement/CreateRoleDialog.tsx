"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dashboard/dialog";
import { Button } from "@/components/dashboard/button";
import { Input } from "@/components/dashboard/input";
import { Label } from "@/components/dashboard/label";
import { AlertCircle } from "lucide-react";
import { VIEW_PERMISSIONS, EDIT_PERMISSIONS } from './PermissionTemplates';
import { cn } from '@/lib/utils';

interface CreateRoleDialogProps {
  onRoleCreated: () => void;
}

export function CreateRoleDialog({ onRoleCreated }: CreateRoleDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<'view' | 'edit'>('view');
  const [error, setError] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [nameError, setNameError] = React.useState<string | null>(null);

  const validateName = (value: string) => {
    if (!value) {
      setNameError('Role name is required');
      return false;
    }
    if (value.length < 3) {
      setNameError('Role name must be at least 3 characters');
      return false;
    }
    if (value.length > 50) {
      setNameError('Role name must be less than 50 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9\s-_]+$/.test(value)) {
      setNameError('Role name can only contain letters, numbers, spaces, hyphens, and underscores');
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    validateName(value);
  };

  const resetForm = () => {
    setName('');
    setType('view');
    setError(null);
    setNameError(null);
    setIsCreating(false);
  };

  const handleCreate = async () => {
    try {
      if (!validateName(name)) {
        return;
      }

      setError(null);
      setIsCreating(true);

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      // Select permissions based on type
      const permissions = type === 'view' ? VIEW_PERMISSIONS : EDIT_PERMISSIONS;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          permissions,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create role');
      }

      setOpen(false);
      resetForm();
      onRoleCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value: boolean) => {
      setOpen(value);
      if (!value) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button> 
          Create Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Role</DialogTitle>
          <DialogDescription>
            Define a new role and select a base permission template. You can customize specific permissions later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-100 border border-red-200 p-3 rounded-md">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="role-name">Role Name</Label>
            <Input
              id="role-name"
              placeholder="e.g., Content Editor, Project Viewer"
              value={name}
              onChange={handleNameChange}
              className={cn(nameError && "border-red-500 focus-visible:ring-red-500")}
            />
            {nameError && (
              <p className="text-xs text-red-600 mt-1">{nameError}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Permission Template</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                type="button"
                variant={type === 'view' ? 'default' : 'outline'}
                onClick={() => setType('view')}
                className={cn("justify-start text-left h-auto py-3", type === 'view' && 'ring-2 ring-theme-color')}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold">View Only</span>
                  <span className={cn("text-xs", type === 'view' ? 'text-white/80' : 'text-dark-text-bw/70')}>
                    Can view records but not modify.
                  </span>
                </div>
              </Button>
              <Button
                type="button"
                variant={type === 'edit' ? 'default' : 'outline'}
                onClick={() => setType('edit')}
                className={cn("justify-start text-left h-auto py-3", type === 'edit' && 'ring-2 ring-theme-color')}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold">View & Edit</span>
                  <span className={cn("text-xs", type === 'edit' ? 'text-white/80' : 'text-dark-text-bw/70')}>
                    Can view and modify records.
                  </span>
                </div>
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { setOpen(false); resetForm();}}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name || !!nameError || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
