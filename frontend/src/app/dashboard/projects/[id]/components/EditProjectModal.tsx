/**
 * Edit Project Modal Component
 * Modal for editing project details
 */

'use client';

import React, { useEffect } from 'react'; // Added useEffect
import { Button } from '@/components/dashboard/button';
import { Project, User, UpdateProjectData } from '@/types'; // Added UpdateProjectData
// import { useForm } from '@/hooks'; // To be replaced
import { useForm, Controller } from 'react-hook-form'; // Import from react-hook-form
import { zodResolver } from '@hookform/resolvers/zod'; // For Zod validation
import { z } from 'zod'; // For Zod schema
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose, // Added DialogClose for cancel button
  DialogDescription // Optional: if a description is needed
} from '@/components/dashboard/dialog';
import { Input } from '@/components/dashboard/input';
import { Label } from '@/components/dashboard/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/select';
import { cn } from '@/lib/utils'; // For conditional class names

interface EditProjectModalProps {
  project: Project;
  clientsList: User[];
  engineersList: User[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  // isOpen prop will be controlled by the parent page (ProjectDetailPage)
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
    .optional(), // This makes the type number | undefined
  // clientId: z.string().optional().nullable(), // Keep commented out
  engineerId: z.string().optional().nullable(),
});

type EditProjectFormData = z.infer<typeof editProjectSchema>;

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  clientsList, // Keep for potential future use if client field is added
  engineersList,
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
      sqft: project.sqft ?? undefined, // react-hook-form handles number conversion
      // clientId: project.client?.id?.toString() || '', // Keep commented out
      engineerId: project.engineer?.id?.toString() || '',
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
      });
    }
  }, [isOpen, project, reset]);

  const onSubmitHandler = async (data: EditProjectFormData) => {
    // Align with UpdateProjectData which expects description: string | undefined
    // and sqft: number | undefined
    const payload: UpdateProjectData = {
      name: data.name,
      description: data.description ?? undefined,
      address: data.address ?? undefined,
      location: data.location ?? undefined,
      sqft: (typeof data.sqft === 'number' && !isNaN(data.sqft)) ? data.sqft : undefined,
      engineerId: (data.engineerId && data.engineerId !== "__NO_ENGINEER__") ? Number(data.engineerId) : undefined,
    };
    // Ensure nulls from Zod (for string fields) become undefined for UpdateProjectData
    if (payload.description === null) payload.description = undefined;
    if (payload.address === null) payload.address = undefined;
    if (payload.location === null) payload.location = undefined;
    if (payload.engineerId === null) payload.engineerId = undefined; // Should not happen with current Zod

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
