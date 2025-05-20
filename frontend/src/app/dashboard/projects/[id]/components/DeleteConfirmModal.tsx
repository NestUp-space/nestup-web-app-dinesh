/**
 * Delete Confirmation Modal Component
 * Modal for confirming project deletion
 */

'use client';

import React from 'react';
import { Button } from '@/components/dashboard/button';
import { Project } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/dashboard/dialog';

interface DeleteConfirmModalProps {
  project: Project;
  isOpen: boolean; // Added to control visibility from parent
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  project,
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the project "{project.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button 
              variant="outline" 
              onClick={onClose} // onClose is already handled by Dialog's onOpenChange
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmModal;
