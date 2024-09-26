import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';  // Import Button from the correct location
import { useRouter } from 'next/router';

interface UserCardProps {
  user: {
    id: number;
    email: string;
    isActive: boolean;
  };
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  const handleExpand = () => setExpanded(!expanded);

  const redirectToUserDetail = () => {
    router.push(`/users/${user.id}`);
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{user.email}</CardTitle>
      </CardHeader>
      {expanded ? (
        <CardContent>
          <p>Status: {user.isActive ? 'Active' : 'Inactive'}</p>
          <Button onClick={redirectToUserDetail}>View Details</Button>
        </CardContent>
      ) : (
        <Button onClick={handleExpand}>Expand</Button>
      )}
    </Card>
  );
};

export default UserCard;
