"use client";

import React from 'react';
import { Card, CardContent } from "@/components/dashboard/card";
import { Button } from "@/components/dashboard/button";
import { Switch } from "@/components/dashboard/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/dashboard/collapsible";
import { ChevronDown, AlertCircle } from "lucide-react";
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
  const [isOpen, setIsOpen] = React.useState(false);
  const [permissions, setPermissions] = React.useState(role.permissions);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handlePermissionChange = async (section: string, action: string) => {
    try {
      setError(null);
      const permissionKey = `${section.toLowerCase()}.${action}`;
      const newPermissions = {
        ...permissions,
        [permissionKey]: !permissions[permissionKey]
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
          name: role.name,
          permissions: newPermissions
        }),
      });

      if (!response.ok) throw new Error("Failed to update permissions");
      
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to update permissions");

      setPermissions(newPermissions);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Revert UI state on error
      setPermissions(role.permissions);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={cn("transition-opacity duration-200", isSaving && "opacity-50")}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">{role.name}</h3>
            <p className="text-sm text-muted-foreground">Type: {role.type}</p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200",
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
                            checked={!!permissions[permissionKey]}
                            onCheckedChange={() => handlePermissionChange(sectionName, action)}
                            disabled={role.type === 'super admin' || isSaving || !loggedInUser?.permissions?.includes('roles.edit')}
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
