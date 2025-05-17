"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/dashboard/card";
import { Button } from "@/components/dashboard/button";
import { Input } from "@/components/dashboard/input"; // Import Input
import { Switch } from "@/components/dashboard/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/dashboard/collapsible";
import { ChevronDown, AlertCircle, Edit3, Save, XCircle } from "lucide-react"; // Import icons
import { SECTIONS, ACTIONS } from "./PermissionTemplates";
import { cn } from "@/lib/utils";
import { useUser } from '@/context/UserContext'; // Import useUser

interface RoleTabProps {
  role: {
    id: number;
    name: string;
    type: string;
    permissions: Record<string, boolean>;
  };
  onUpdate: () => void;
}

export function RoleTab({ role, onUpdate }: RoleTabProps) {
  const { user: loggedInUser } = useUser(); // Get the logged-in user's data
  const [isOpen, setIsOpen] = useState(false);
  const [currentPermissions, setCurrentPermissions] = useState(role.permissions);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
  };

  const handleNameSave = async () => {
    if (!canEditRole || editingName.trim() === '') {
      setError("Role name cannot be empty.");
      return;
    }
    if (editingName.trim() === role.name) {
      setIsEditingName(false);
      setError(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/roles/${role.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingName.trim(),
          permissions: currentPermissions // Send current permissions to avoid accidental overwrite
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to update role name" }));
        throw new Error(errorData.message || "Failed to update role name");
      }
      
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to update role name");

      setIsEditingName(false);
      onUpdate(); // Re-fetch roles to get updated list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving name');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePermissionChange = async (section: string, action: string) => {
    if (!canEditRole) return;
    try {
      setError(null);
      const permissionKey = `${section.toLowerCase()}.${action}`;
      const newPermissions = {
        ...currentPermissions,
        [permissionKey]: !currentPermissions[permissionKey]
      };

      setIsSaving(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/roles/${role.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: role.name, // Send current name when updating permissions
          permissions: newPermissions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to update permissions" }));
        throw new Error(errorData.message || "Failed to update permissions");
      }
      
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to update permissions");

      setCurrentPermissions(newPermissions);
      // onUpdate(); // No need to call onUpdate if only permissions changed locally, backend is source of truth on next fetch
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating permissions');
      // Revert UI state on error
      setCurrentPermissions(role.permissions);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={cn("bg-lightest-bw border-light-bw shadow-sm transition-opacity duration-200", isSaving && "opacity-60")}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="px-6 py-4 flex items-center justify-between hover:bg-lighter-bw/50 transition-colors cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <div className="flex items-center gap-3 flex-grow">
            {isEditingName && canEditRole ? (
              <>
                <Input 
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="text-lg font-semibold h-9 flex-grow text-dark-text-bw"
                  disabled={isSaving}
                  onClick={(e) => e.stopPropagation()} // Prevent collapsible toggle
                />
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleNameSave(); }} disabled={isSaving} title="Save name">
                  <Save className="h-5 w-5 text-theme-color" />
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleNameEditToggle(); }} disabled={isSaving} title="Cancel edit">
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
            {error && (
              <div className="mb-4 flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-5 w-5" />
                {error}
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
                            disabled={!canEditRole || isSaving}
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
