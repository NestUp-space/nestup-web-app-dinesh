"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/dashboard/card";
import { Button } from "@/components/dashboard/button";
import { Input } from "@/components/dashboard/input"; // Import Input
import { Switch } from "@/components/dashboard/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/dashboard/collapsible";
import { ChevronDown, AlertCircle, Edit3, Save, XCircle, Loader2 } from "lucide-react"; // Import icons, Added Loader2
import { SECTIONS, ACTIONS } from "./PermissionTemplates";
import { cn } from "@/lib/utils";
import { useUser } from '@/context/UserContext'; // Import useUser
import { useUpdateRole, Role } from '@/hooks/useRoles'; // Import the new hook and Role type

interface RoleTabProps {
  role: Role; // Use imported Role type
  onUpdate: () => void; // This will be used as onSuccessCallback for the hook
}

export function RoleTab({ role, onUpdate }: RoleTabProps) {
  const { user: loggedInUser } = useUser();
  const { updateRole, loading: isUpdatingRole, error: updateError } = useUpdateRole();
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentPermissions, setCurrentPermissions] = useState(role.permissions);
  // const [isSaving, setIsSaving] = useState(false); // Replaced by isUpdatingRole
  // const [error, setError] = useState<string | null>(null); // Replaced by updateError
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(role.name);

  // Effect to reset editingName if role.name changes from props
  useEffect(() => {
    setEditingName(role.name);
    setCurrentPermissions(role.permissions);
  }, [role.name, role.permissions]);

  const canEditRole = loggedInUser?.permissions?.includes('roles.edit') && role.id !== 1;

  const handleNameEditToggle = () => {
    if (!canEditRole) return;
    setIsEditingName(!isEditingName);
    setEditingName(role.name); // Reset to original name on toggle/cancel
    // Error state is now from updateError hook
  };

  const handleNameSave = async () => {
    if (!canEditRole || editingName.trim() === '') {
      // setError("Role name cannot be empty."); // Handled by hook or component can show custom message
      return;
    }
    if (editingName.trim() === role.name) {
      setIsEditingName(false);
      return;
    }

    try {
      const updatedRole = await updateRole(
        role.id,
        { name: editingName.trim(), permissions: currentPermissions },
        onUpdate // Pass onUpdate as the onSuccessCallback to refetch roles list
      );
      if (updatedRole) {
        setIsEditingName(false);
        // onUpdate is called by the hook's onSuccess
      }
    } catch (err) {
      // Error is handled by the useUpdateRole hook and exposed via updateError
      // Component can display updateError.message if needed
      console.error("Failed to save role name:", err);
    }
  };
  
  const handlePermissionChange = async (section: string, action: string) => {
    if (!canEditRole) return;
    
    const permissionKey = `${section.toLowerCase()}.${action}`;
    const newPermissions = {
      ...currentPermissions,
      [permissionKey]: !currentPermissions[permissionKey]
    };
    
    // Optimistically update UI
    setCurrentPermissions(newPermissions);

    try {
      await updateRole(
        role.id,
        { permissions: newPermissions },
        () => { /* onUpdate is not strictly needed here if parent list doesn't need immediate refresh for this */ }
      );
      // If successful, currentPermissions is already updated.
      // If error, it will be caught below.
    } catch (err) {
      // Revert UI state on error
      setCurrentPermissions(currentPermissions); // Revert to previous state before optimistic update
      console.error("Failed to update permission:", err);
      // updateError from the hook will be set
    }
  };

  return (
    <Card className={cn("bg-lightest-bw border-light-bw shadow-sm transition-opacity duration-200", isUpdatingRole && "opacity-60")}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="px-6 py-4 flex items-center justify-between hover:bg-lighter-bw/50 transition-colors cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <div className="flex items-center gap-3 flex-grow">
            {isEditingName && canEditRole ? (
              <>
                <Input 
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="text-lg font-semibold h-9 flex-grow text-dark-text-bw"
                  disabled={isUpdatingRole}
                  onClick={(e) => e.stopPropagation()} // Prevent collapsible toggle
                />
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleNameSave(); }} disabled={isUpdatingRole} title="Save name">
                  {isUpdatingRole && updateError === null ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 text-theme-color" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleNameEditToggle(); }} disabled={isUpdatingRole} title="Cancel edit">
                  <XCircle className="h-5 w-5 text-red-500" />
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-dark-text-bw">{editingName}</h3>
                {canEditRole && (
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleNameEditToggle(); }} title="Edit name" className="text-dark-text-bw/70 hover:text-theme-color">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
                <p className="text-sm text-dark-text-bw/60 ml-2">({role.type})</p>
              </>
            )}
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto text-dark-text-bw/70 hover:text-theme-color">
              <ChevronDown className={cn(
                "h-5 w-5 transition-transform duration-200",
                isOpen && "rotate-180"
              )} />
              <span className="sr-only">Toggle permissions</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-6 px-6">
            {updateError && (
              <div className="mb-4 flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-5 w-5" />
                {updateError.message || "An error occurred"}
              </div>
            )}
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(SECTIONS).map(([sectionKey, sectionName]) => (
                <div key={sectionKey} className="space-y-3 p-4 border border-light-bw rounded-md bg-lightest-bw">
                  <h4 className="font-semibold text-md text-dark-text-bw">{sectionName}</h4>
                  <div className="space-y-2">
                    {Object.values(ACTIONS).map((action) => {
                      const permissionKey = `${sectionName.toLowerCase()}.${action}`;
                      return (
                        <div key={`${sectionKey}-${action}`} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-lighter-bw transition-colors">
                          <span className="text-sm capitalize text-dark-text-bw/90">{action}</span>
                          <Switch
                            checked={!!currentPermissions[permissionKey]}
                            onCheckedChange={() => handlePermissionChange(sectionName, action)}
                            disabled={!canEditRole || isUpdatingRole}
                            id={`${role.id}-${sectionKey}-${action}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
