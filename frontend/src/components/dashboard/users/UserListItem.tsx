"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/dashboard/button';
import { User } from '@/types'; // Using global User type

interface UserListItemProps {
  user: User;
  canEdit: boolean; // Pass permission rather than loggedInUser object
}

export const UserListItem: React.FC<UserListItemProps> = ({ user, canEdit }) => {
  return (
    <div
      key={user.id}
      className="flex items-center justify-between p-4 hover:bg-lighter-bw transition-colors duration-150"
    >
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-dark-text-bw">{user.name}</p>
        <p className="text-xs text-dark-text-bw/70">{user.email}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-dark-text-bw/70 px-2 py-0.5 bg-lighter-bw rounded-full border border-light-bw">
          {user.role?.name || 'N/A'}
        </span>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href={`/dashboard/users/${user.id}`}>
              Manage
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};
