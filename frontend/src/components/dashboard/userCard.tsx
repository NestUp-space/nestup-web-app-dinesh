'use client'; // Ensure this component is client-side

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/dashboard/card';
import { Button } from '@/components/dashboard/button';

interface UserCardProps {
  user: {
    id: number;
    email: string;
    isActive: boolean;
  };
  onClick?: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onClick }) => {
  const [expanded, setExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure the component is mounted before using the router
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleExpand = () => setExpanded(!expanded);

  return (
    <Card className="mb-4" onClick={onClick} style={{ cursor: 'pointer' }}>
      <CardHeader>
        <CardTitle>{user.email}</CardTitle>
      </CardHeader>
      {expanded ? (
        <CardContent>
          <p>Status: {user.isActive ? 'Active' : 'Inactive'}</p>
        </CardContent>
      ) : (
        <Button onClick={handleExpand}>Expand</Button>
      )}
    </Card>
  );
};

export default UserCard;
