import React from 'react';
import ListUsers from './ListUsers';
import CreateUser from './CreateUser';

const UsersPage = () => {
  return (
    <div>
      <h1>Manage Users</h1>
      <CreateUser />
      <ListUsers />
    </div>
  );
};

export default UsersPage;
