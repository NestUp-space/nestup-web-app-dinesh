"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useUser } from '@/context/UserContext'; // Assuming User type is needed or user object structure

// Define a more specific type for user if available from UserContext
interface User {
  id: string | number;
  // Add other relevant user properties
}

interface CreateProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProjectCreateSuccess: () => void;
  token: string | null;
  designers: any[]; // Define more specific types if possible
  projectManagers: any[]; // Define more specific types if possible
  engineers: any[]; // Define more specific types if possible
  currentUser: User | null; // Pass the user object
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  isOpen,
  onOpenChange,
  onProjectCreateSuccess,
  token,
  designers,
  projectManagers,
  engineers,
  currentUser,
}) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [projectStatusId, setProjectStatusId] = useState(1); // Default to status ID 1, consider making this configurable or passed as prop
  const [selectedDesigner, setSelectedDesigner] = useState('');
  const [selectedProjectManager, setSelectedProjectManager] = useState('');
  const [selectedEngineer, setSelectedEngineer] = useState('');

  const resetForm = () => {
    setProjectName('');
    setProjectDescription('');
    setProjectAddress('');
    // setProjectStatusId(1); // Reset if needed, or keep default
    setSelectedDesigner('');
    setSelectedProjectManager('');
    setSelectedEngineer('');
  };

  const handleCreateProject = async () => {
    try {
      if (!currentUser) {
        alert("User information not available. Please log in again.");
        return;
      }
      if (!token) {
        alert("Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          address: projectAddress,
          statusId: projectStatusId,
          vbCount: 0, // Default value
          designerId: selectedDesigner || null, // Send null if empty
          projectManagerId: selectedProjectManager || null, // Send null if empty
          engineerId: selectedEngineer || null, // Send null if empty
          createdById: currentUser.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create project');
      }

      onOpenChange(false); // Close modal on success
      resetForm();
      onProjectCreateSuccess(); // Callback to refresh parent list
      alert('Project created successfully!');
    } catch (error) {
      console.error(error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to create project'}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} modal={false}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1">
          <PlusCircle className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Project
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="projectName" className="text-right">
              Name
            </Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="col-span-3"
              placeholder="Project Name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="projectDescription" className="text-right">
              Description
            </Label>
            <textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="col-span-3 min-h-[80px] rounded-md border border-light-bw bg-lightest-bw px-3 py-2 text-sm text-dark-text-bw ring-offset-lightest-bw placeholder:text-dark-text-bw/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-color focus-visible:ring-offset-2"
              placeholder="Project Description"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="projectAddress" className="text-right">
              Address
            </Label>
            <Input
              id="projectAddress"
              value={projectAddress}
              onChange={(e) => setProjectAddress(e.target.value)}
              className="col-span-3"
              placeholder="Project Address"
            />
          </div>
          {/* TODO: Add Project Status Selector if needed, or manage it internally */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="designer" className="text-right">Designer</Label>
            <Select value={selectedDesigner} onValueChange={setSelectedDesigner}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Designer" />
              </SelectTrigger>
              <SelectContent>
                {designers && designers.length > 0 ? (
                  designers.map((designer: any) => (
                    <SelectItem key={designer.id} value={designer.id.toString()}>{designer.name}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-designers" disabled>No designers available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="projectManager" className="text-right">Project Manager</Label>
            <Select value={selectedProjectManager} onValueChange={setSelectedProjectManager}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Project Manager" />
              </SelectTrigger>
              <SelectContent>
                {projectManagers && projectManagers.length > 0 ? (
                  projectManagers.map((manager: any) => (
                    <SelectItem key={manager.id} value={manager.id.toString()}>{manager.name}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-managers" disabled>No project managers available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="engineer" className="text-right">Engineer</Label>
            <Select value={selectedEngineer} onValueChange={setSelectedEngineer}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Engineer" />
              </SelectTrigger>
              <SelectContent>
                {engineers && engineers.length > 0 ? (
                  engineers.map((engineer: any) => (
                    <SelectItem key={engineer.id} value={engineer.id.toString()}>{engineer.name}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-engineers" disabled>No engineers available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleCreateProject}>Create Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
