"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/dashboard/tabs';
import ProjectList from '@/components/dashboard/projects/ProjectList';

interface ProjectTabsProps {
  allProjects: any[];
  activeProjects: any[];
  draftProjects: any[];
  archivedProjects: any[];
}

const ProjectTabs: React.FC<ProjectTabsProps> = ({
  allProjects,
  activeProjects,
  draftProjects,
  archivedProjects,
}) => {
  return (
    <Tabs defaultValue="all">
      <TabsList className="mb-6">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="draft">Draft</TabsTrigger>
        <TabsTrigger value="archived" className="hidden sm:flex">
          Archived
        </TabsTrigger>
      </TabsList>

      {/* All Projects Tab */}
      <TabsContent value="all">
        <ProjectList projects={allProjects} emptyListMessage="No projects found." />
      </TabsContent>

      {/* Active Projects Tab */}
      <TabsContent value="active">
        <ProjectList projects={activeProjects} emptyListMessage="No active projects found." />
      </TabsContent>

      {/* Draft Projects Tab */}
      <TabsContent value="draft">
        <ProjectList projects={draftProjects} emptyListMessage="No draft projects found." />
      </TabsContent>

      {/* Archived Projects Tab */}
      <TabsContent value="archived">
        <ProjectList projects={archivedProjects} emptyListMessage="No archived projects found." />
      </TabsContent>
    </Tabs>
  );
};

export default ProjectTabs;
