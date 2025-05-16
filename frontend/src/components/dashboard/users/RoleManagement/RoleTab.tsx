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
    <Card className={cn("transition-opacity duration-200", isSaving && "opacity-50")}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="px-6 py-4 flex items-center justify-between">
          {isEditingName ? (
            <div className="flex items-center gap-2 flex-grow">
              <Input 
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="text-lg font-medium h-9"
                disabled={isSaving}
              />
              <Button variant="ghost" size="icon" onClick={handleNameSave} disabled={isSaving} title="Save name">
                <Save className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNameEditToggle} disabled={isSaving} title="Cancel edit">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">{role.name}</h3>
              {canEditRole && (
                <Button variant="ghost" size="icon" onClick={handleNameEditToggle} title="Edit name">
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
              <p className="text-sm text-muted-foreground ml-2">Type: {role.type}</p>
            </div>
          )}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0 ml-auto">
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200 min-w-[1rem]",
                isOpen && "rotate-180"
              )} />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <CardContent>
            {error && (
              <div className="mb-4 flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div className="grid gap-6">
              {Object.entries(SECTIONS).map(([sectionKey, sectionName]) => (
                <div key={sectionKey} className="space-y-2">
                  <h4 className="font-medium">{sectionName}</h4>
                  <div className="grid gap-2">
                    {Object.values(ACTIONS).map((action) => {
                      const permissionKey = `${sectionName.toLowerCase()}.${action}`;
                      return (
                        <div key={`${sectionKey}-${action}`} className="flex items-center justify-between py-2 hover:bg-muted/50 px-2 rounded-md">
                          <span className="text-sm capitalize">{action}</span>
                          <Switch
                            checked={!!currentPermissions[permissionKey]}
                            onCheckedChange={() => handlePermissionChange(sectionName, action)}
                            disabled={!canEditRole || isSaving}
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
