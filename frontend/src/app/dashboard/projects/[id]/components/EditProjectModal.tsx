/**
 * Edit Project Modal Component
 * Modal for editing project details
 */

'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Project, User, UpdateProjectData, Status } from '@/types'; // Added Status
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface EditProjectModalProps {
  project: Project;
  clientsList: User[];
  engineersList: User[];
  designersList: User[]; // New
  projectManagersList: User[]; // New
  statusesList: Status[]; // New
  onClose: () => void;
  onSave: (data: UpdateProjectData) => Promise<void>; // Changed any to UpdateProjectData
  isOpen: boolean;
}

// Define Zod schema for form validation
const editProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  sqft: z.number({ invalid_type_error: "Square footage must be a number or empty" })
    .positive("Square footage must be a positive number")
    .optional()
    .nullable(), // Allow null for optional number fields
  engineerId: z.string().optional().nullable(),
  designerId: z.string().optional().nullable(), // New
  projectManagerId: z.string().optional().nullable(), // New
  statusId: z.string().min(1, "Status is required"), // New - assuming string from select
  estimatedTime: z.string().optional().nullable(), // New
});

type EditProjectFormData = z.infer<typeof editProjectSchema>;

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  clientsList, // Keep for potential future use if client field is added
  engineersList,
  designersList, // New
  projectManagersList, // New
  statusesList, // New
  onClose,
  onSave,
  isOpen
}) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description || '',
      address: project.address || '',
      location: project.location || '',
      sqft: project.sqft ?? undefined,
      engineerId: project.engineer?.id?.toString() || '',
      designerId: project.designer?.id?.toString() || '', // New
      projectManagerId: project.projectManager?.id?.toString() || '', // New
      statusId: project.statusId?.toString() || '', // New
      estimatedTime: project.estimatedTime || '', // New
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: project.name,
        description: project.description || '',
        address: project.address || '',
        location: project.location || '',
        sqft: project.sqft ?? undefined,
        engineerId: project.engineer?.id?.toString() || '',
        designerId: project.designer?.id?.toString() || '', // New
        projectManagerId: project.projectManager?.id?.toString() || '', // New
        statusId: project.statusId?.toString() || '', // New
        estimatedTime: project.estimatedTime || '', // New
      });
    }
  }, [isOpen, project, reset]);

  const onSubmitHandler = async (data: EditProjectFormData) => {
    const payload: UpdateProjectData = {
      name: data.name,
      description: data.description ?? undefined,
      address: data.address ?? undefined,
      location: data.location ?? undefined,
      sqft: (typeof data.sqft === 'number' && !isNaN(data.sqft)) ? data.sqft : undefined,
      engineerId: (data.engineerId && data.engineerId !== "__NO_ENGINEER__") ? Number(data.engineerId) : undefined,
      designerId: (data.designerId && data.designerId !== "__NO_DESIGNER__") ? Number(data.designerId) : undefined, // New
      projectManagerId: (data.projectManagerId && data.projectManagerId !== "__NO_PROJECT_MANAGER__") ? Number(data.projectManagerId) : undefined, // New
      statusId: Number(data.statusId), // New: Assuming statusId is always selected
      estimatedTime: data.estimatedTime ?? undefined, // New
    };
    // Ensure nulls from Zod (for string fields) become undefined for UpdateProjectData
    if (payload.description === null) payload.description = undefined;
    if (payload.address === null) payload.address = undefined;
    if (payload.location === null) payload.location = undefined;
    if (payload.estimatedTime === null) payload.estimatedTime = undefined;

    await onSave(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitHandler)}>
          <div className="grid grid-cols-1 gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Project Name</Label>
              <Input
                id="edit-name"
                {...register('name')}
                className={cn(errors.name && "border-red-500 focus-visible:ring-red-500")}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <textarea
                id="edit-description"
                rows={3}
                {...register('description')}
                className={cn("block w-full rounded-md border border-light-bw bg-lightest-bw px-3 py-2 text-sm text-dark-text-bw ring-offset-lightest-bw placeholder:text-dark-text-bw/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-color focus-visible:ring-offset-2")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                {...register('address')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-location">Location (Lat, Long)</Label>
              <Input
                id="edit-location"
                {...register('location')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-sqft">Square Footage</Label>
              <Input
                type="number"
                id="edit-sqft"
                {...register('sqft', { setValueAs: v => (v === "" || v === null || v === undefined) ? undefined : Number(v) })}
                className={cn(errors.sqft && "border-red-500 focus-visible:ring-red-500")}
              />
              {errors.sqft && <p className="mt-1 text-xs text-red-500">{errors.sqft.message}</p>}
            </div>
            {/* Status Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-status">Status</Label>
              <Controller
                name="statusId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusesList.map(status => (
                        <SelectItem key={status.id} value={status.id.toString()}>{status.status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.statusId && <p className="mt-1 text-xs text-red-500">{errors.statusId.message}</p>}
            </div>
            {/* Designer Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-designer">Designer</Label>
              <Controller
                name="designerId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="edit-designer">
                      <SelectValue placeholder="Select Designer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NO_DESIGNER__">Select Designer</SelectItem>
                      {designersList.map(designer => (
                        <SelectItem key={designer.id} value={designer.id.toString()}>{designer.name} ({designer.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {/* Project Manager Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-project-manager">Project Manager</Label>
              <Controller
                name="projectManagerId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="edit-project-manager">
                      <SelectValue placeholder="Select Project Manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NO_PROJECT_MANAGER__">Select Project Manager</SelectItem>
                      {projectManagersList.map(pm => (
                        <SelectItem key={pm.id} value={pm.id.toString()}>{pm.name} ({pm.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {/* Engineer Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-engineer">Engineer</Label>
              <Controller
                name="engineerId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="edit-engineer">
                      <SelectValue placeholder="Select Engineer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NO_ENGINEER__">Select Engineer</SelectItem>
                      {engineersList.map(engineer => (
                        <SelectItem key={engineer.id} value={engineer.id.toString()}>{engineer.name} ({engineer.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {/* Estimated Completion Input */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-estimated-time">Estimated Completion</Label>
              <Input
                id="edit-estimated-time"
                {...register('estimatedTime')}
                placeholder="e.g., YYYY-MM-DD or a descriptive string"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectModal;
