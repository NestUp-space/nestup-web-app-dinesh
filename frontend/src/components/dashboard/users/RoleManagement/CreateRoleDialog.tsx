"use client";

import React, { useEffect } from 'react'; // Added useEffect
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogClose, // Added DialogClose
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
import { AlertCircle, Loader2 } from "lucide-react"; // Added Loader2
import { VIEW_PERMISSIONS, EDIT_PERMISSIONS, PermissionTemplate } from './PermissionTemplates'; // Added PermissionTemplate type
import { cn } from '@/lib/utils';
import { useCreateRole, PermissionRecord } from '@/hooks/useRoles'; // Added PermissionRecord type
import { getAllPermissions as getAllAppPermissions } from '@/constants/permissions'; // Import helper

interface CreateRoleDialogProps {
  onRoleCreated: () => void;
}

const createRoleSchema = z.object({
  name: z.string()
    .min(3, "Role name must be at least 3 characters")
    .max(50, "Role name must be less than 50 characters")
    .regex(/^[a-zA-Z0-9\s-_]+$/, "Role name can only contain letters, numbers, spaces, hyphens, and underscores"),
  type: z.enum(['view', 'edit'], { required_error: "Permission template type is required" }),
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;

export function CreateRoleDialog({ onRoleCreated }: CreateRoleDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { createRole, loading: isCreating, error: createError } = useCreateRole();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: '',
      type: 'view',
    },
  });

  const selectedType = watch('type');

  useEffect(() => {
    if (!open) {
      reset({ name: '', type: 'view' }); // Reset form when dialog closes
    }
  }, [open, reset]);

  const transformTemplateToPermissionRecord = (template: PermissionTemplate): PermissionRecord => {
    const record: PermissionRecord = {};
    const allAppPermissionsList = getAllAppPermissions();

    allAppPermissionsList.forEach(permString => {
      record[permString] = false; // Initialize all to false
    });

    for (const sectionKey in template) {
      // It's possible template is not perfectly aligned with SECTIONS from PermissionTemplates,
      // so access its keys directly.
      const sectionPermissions = template[sectionKey as keyof typeof template];
      if (Array.isArray(sectionPermissions)) {
        for (const permString of sectionPermissions) {
          if (record.hasOwnProperty(permString)) {
            record[permString] = true;
          }
        }
      }
    }
    return record;
  };

  const onSubmitHandler = async (data: CreateRoleFormData) => {
    const selectedTemplateObject = data.type === 'view' ? VIEW_PERMISSIONS : EDIT_PERMISSIONS;
    const permissionsRecord = transformTemplateToPermissionRecord(selectedTemplateObject);
    
    try {
      const newRole = await createRole(
        { name: data.name, permissions: permissionsRecord },
        onRoleCreated // Pass onRoleCreated as the onSuccessCallback
      );
      if (newRole) {
        setOpen(false); // Close dialog on success
        // reset is handled by useEffect when open changes
      }
    } catch (err) {
      // Error is handled by useCreateRole hook and exposed via createError
      console.error("Failed to create role:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Role</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Role</DialogTitle>
          <DialogDescription>
            Define a new role and select a base permission template. You can customize specific permissions later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitHandler)}>
          <div className="space-y-6 py-4">
            {createError && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-100 border border-red-200 p-3 rounded-md">
                <AlertCircle className="h-5 w-5" />
                {createError.message || "An error occurred"}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                placeholder="e.g., Content Editor, Project Viewer"
                {...register('name')}
                className={cn(errors.name && "border-red-500 focus-visible:ring-red-500")}
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Permission Template</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={field.value === 'view' ? 'default' : 'outline'}
                      onClick={() => field.onChange('view')}
                      className={cn("justify-start text-left h-auto py-3", field.value === 'view' && 'ring-2 ring-theme-color')}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">View Only</span>
                        <span className={cn("text-xs", field.value === 'view' ? 'text-white/80' : 'text-dark-text-bw/70')}>
                          Can view records but not modify.
                        </span>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === 'edit' ? 'default' : 'outline'}
                      onClick={() => field.onChange('edit')}
                      className={cn("justify-start text-left h-auto py-3", field.value === 'edit' && 'ring-2 ring-theme-color')}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">View & Edit</span>
                        <span className={cn("text-xs", field.value === 'edit' ? 'text-white/80' : 'text-dark-text-bw/70')}>
                          Can view and modify records.
                        </span>
                      </div>
                    </Button>
                  </div>
                )}
              />
               {errors.type && (
                <p className="text-xs text-red-600 mt-1">{errors.type.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isCreating}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
