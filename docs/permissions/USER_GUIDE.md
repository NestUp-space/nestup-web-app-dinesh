# Permission System User Guide

This guide explains how to use the permission system in the Nestup Web App, including managing roles, assigning permissions, and understanding how permissions affect user access.

## Understanding Roles and Permissions

### What are Permissions?

Permissions are specific access rights that control what actions a user can perform in the system. Each permission follows the format `resource.action`, where:

- `resource` is the part of the system being accessed (e.g., users, projects, materials)
- `action` is the operation being performed (e.g., view, create, edit, delete)

For example, the permission `projects.create` allows a user to create new projects.

### What are Roles?

Roles are collections of permissions assigned to users. Each user has exactly one role, which determines what they can do in the system. Using roles simplifies permission management by allowing you to assign multiple permissions at once.

Common roles include:
- **Admin**: Full system access
- **Manager**: Can manage projects and teams
- **Engineer**: Technical access to BIM and materials
- **Client**: Limited access to specific projects

## Managing Roles

### Viewing Roles

1. Navigate to **Dashboard > Users > Roles**
2. The page displays all existing roles with their permissions
3. Click on a role to expand and view its detailed permissions

### Creating a New Role

1. Navigate to **Dashboard > Users > Roles**
2. Click the **Create Role** button
3. Enter a name for the role
4. Select a permission template:
   - **View Only**: Can only view information
   - **View & Edit**: Can view and modify information
5. Click **Create Role**
6. After creation, you can customize the role's permissions

### Editing Role Permissions

1. Navigate to **Dashboard > Users > Roles**
2. Find the role you want to edit and click to expand it
3. Toggle individual permissions on or off
4. Changes are saved automatically

### Deleting a Role

1. Navigate to **Dashboard > Users > Roles**
2. Find the role you want to delete
3. Click the **Delete** button
4. Confirm the deletion

> **Note**: You cannot delete a role that is assigned to users. You must reassign those users to different roles first.

## Managing Users and Their Roles

### Viewing Users

1. Navigate to **Dashboard > Users**
2. The page displays all users with their basic information and roles
3. Use the filter to find specific users by role

### Assigning a Role to a User

1. Navigate to **Dashboard > Users**
2. Find the user you want to modify
3. Click the **Manage** button
4. In the user details page, select a role from the dropdown
5. Click **Save Changes**

### Creating a New User with a Role

1. Navigate to **Dashboard > Users**
2. Click the **Create User** button
3. Fill in the user details
4. Select a role from the dropdown
5. Click **Create User**

## Permission Inheritance

The permission system includes automatic inheritance, which means some permissions automatically include others:

### Action-based Inheritance

- If you have `edit` permission, you automatically have `view` permission
- If you have `delete` permission, you automatically have `view` permission
- If you have `approve` permission, you automatically have `view` permission
- If you have `manage` permission, you have all other permissions

### Resource-based Inheritance

- If you have `users.manage` permission, you automatically have `roles.view` and `permissions.view` permissions
- If you have `roles.manage` permission, you automatically have `permissions.view` permission
- If you have `projects.manage` permission, you automatically have `materials.view`, `bim.view`, and `catalogue.view` permissions

This inheritance means you don't need to explicitly assign every permission.

## Permission Templates

The system includes predefined permission templates to simplify role creation:

### View Only Template

Grants only view permissions for all resources. Users can see information but not modify it.

### View & Edit Template

Grants view and edit permissions for all resources. Users can see and modify information but not delete it.

### Admin Template

Grants all permissions for all resources. Users have full control over the system.

## Best Practices

### Role Design

1. **Follow the Principle of Least Privilege**: Give users only the permissions they need
2. **Use Role Templates**: Start with a template and customize as needed
3. **Create Functional Roles**: Design roles based on job functions, not individuals
4. **Audit Regularly**: Review roles and permissions periodically

### Permission Management

1. **Be Careful with Delete Permissions**: Limit who can delete data
2. **Consider Inheritance**: Remember that some permissions automatically include others
3. **Test After Changes**: After changing permissions, test to ensure they work as expected
4. **Document Custom Roles**: Keep a record of custom roles and their purposes

## Troubleshooting

### User Cannot Access a Feature

1. Check the user's assigned role
2. Verify the role has the necessary permissions
3. Remember to consider permission inheritance
4. Check if the feature requires multiple permissions

### Permission Changes Not Taking Effect

1. The user may need to log out and log back in
2. The permission cache may need to be cleared (contact an administrator)
3. The feature may require additional permissions

### Cannot Delete a Role

1. Check if any users are assigned to the role
2. Reassign those users to different roles
3. Try deleting the role again

## Glossary

- **Permission**: A specific access right in the format `resource.action`
- **Role**: A collection of permissions assigned to users
- **Resource**: A part of the system that can be accessed (e.g., users, projects)
- **Action**: An operation that can be performed (e.g., view, create, edit)
- **Inheritance**: The automatic inclusion of certain permissions when others are granted
- **Template**: A predefined set of permissions for common role types
