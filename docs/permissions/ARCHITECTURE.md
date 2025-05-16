# Permission System Architecture

## Overview

The Nestup Web App implements a comprehensive Role-Based Access Control (RBAC) system with hierarchical permission inheritance. This system provides fine-grained control over user access to various features and resources within the application.

## Core Concepts

### 1. Permissions

Permissions are the fundamental building blocks of the access control system. Each permission follows a standardized format:

```
resource.action
```

Where:
- `resource` represents a system entity (e.g., users, projects, materials)
- `action` represents an operation (e.g., view, create, edit, delete, approve)

Examples:
- `users.view` - Permission to view user information
- `projects.create` - Permission to create new projects
- `materials.edit` - Permission to modify material data

### 2. Roles

Roles are collections of permissions assigned to users. Each user has exactly one role, which determines their access level within the system. Roles simplify permission management by grouping related permissions together.

Examples:
- `Admin` - Has comprehensive system access
- `Client` - Has limited access to specific projects and resources
- `Engineer` - Has specialized access to technical features

### 3. Permission Inheritance

The system implements two types of permission inheritance:

#### Action-based Inheritance

Certain actions automatically imply other actions:

- `manage` includes all other actions (view, create, edit, delete, approve)
- `edit` includes `view`
- `delete` includes `view`
- `approve` includes `view`

This means that if a user has the `projects.edit` permission, they automatically have the `projects.view` permission without it being explicitly assigned.

#### Resource-based Inheritance

Some resources have cross-resource inheritance relationships:

- Users management includes view access to roles and permissions
- Roles management includes view access to permissions
- Projects management includes view access to materials, BIM, and catalogue

For example, if a user has the `users.manage` permission, they automatically have `roles.view` and `permissions.view` permissions.

## Database Schema

The permission system is built on three primary database models:

### UserPermission

Stores individual permissions in the system.

```prisma
model UserPermission {
  id         Int                    @id @default(autoincrement())
  permission String                 @unique
  createdAt  DateTime               @default(now())
  updatedAt  DateTime               @updatedAt
  mappings   RolePermissionMapping[]
}
```

### UserRole

Defines roles in the system.

```prisma
model UserRole {
  id           Int                    @id @default(autoincrement())
  role         String                 @unique
  roleType     String                 @default("custom")
  createdAt    DateTime               @default(now())
  updatedAt    DateTime               @updatedAt
  users        User[]
  roleMappings RolePermissionMapping[]
}
```

### RolePermissionMapping

Maps roles to their permissions.

```prisma
model RolePermissionMapping {
  id           Int            @id @default(autoincrement())
  roleId       Int
  permissionId Int
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  role         UserRole       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   UserPermission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
}
```

## Implementation Components

### Backend Components

#### 1. Permission Constants (`constants/permissions.ts`)

Defines all available permissions in the system using a structured format:

```typescript
export const PERMISSION_GROUPS = {
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  PROJECTS: 'projects',
  MATERIALS: 'materials',
  BIM: 'bim',
  CATALOGUE: 'catalogue',
  SETTINGS: 'settings'
};

export const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  APPROVE: 'approve',
  MANAGE: 'manage'
};

// Generate all possible permissions
export const PERMISSIONS = Object.entries(PERMISSION_GROUPS).reduce((acc, [groupKey, groupValue]) => {
  acc[groupKey] = Object.entries(ACTIONS).reduce((actions, [actionKey, actionValue]) => {
    actions[actionKey] = `${groupValue}.${actionValue}`;
    return actions;
  }, {} as Record<string, string>);
  return acc;
}, {} as Record<string, Record<string, string>>);
```

#### 2. Permission Inheritance (`types/permissions.ts`)

Defines the inheritance rules for permissions:

```typescript
export const PERMISSION_INHERITANCE: Record<string, string[]> = {
  // Action-based inheritance
  [ACTIONS.MANAGE]: [
    ACTIONS.VIEW,
    ACTIONS.CREATE,
    ACTIONS.EDIT,
    ACTIONS.DELETE,
    ACTIONS.APPROVE
  ],
  [ACTIONS.EDIT]: [ACTIONS.VIEW],
  [ACTIONS.DELETE]: [ACTIONS.VIEW],
  [ACTIONS.APPROVE]: [ACTIONS.VIEW],

  // Resource-based inheritance
  [`${PERMISSION_GROUPS.USERS}.${ACTIONS.MANAGE}`]: [
    `${PERMISSION_GROUPS.ROLES}.${ACTIONS.VIEW}`,
    `${PERMISSION_GROUPS.PERMISSIONS}.${ACTIONS.VIEW}`
  ],
  // ... other resource-based inheritance rules
};
```

#### 3. Permission Middleware (`middlewares/permission.middleware.ts`)

Express middleware that checks if a user has the required permissions:

```typescript
export function hasPermission(
  requiredPermissions: string | string[],
  options: PermissionOptions = {}
): RequestHandler {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.user?.id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get user permissions
    const userPerms = await getUserPermissions(req.user.id);

    // Check if user has required permissions
    const perms = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    if (!hasRequiredPermissions(userPerms, perms, options)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: `Insufficient permissions. Required: ${perms.join(', ')}`
      });
    }

    next();
  };
}
```

#### 4. Role Controller (`controllers/role.controller.ts`)

Handles CRUD operations for roles and their permissions:

- `createRole`: Creates a new role with specified permissions
- `getRoles`: Retrieves all roles with their permissions
- `getRoleById`: Gets a specific role by ID
- `updateRole`: Updates a role's name and/or permissions
- `deleteRole`: Deletes a role if it's not assigned to any users

#### 5. Permission Caching

The system implements a caching mechanism to improve performance:

```typescript
// Cache layer for performance optimization
const permissionCache = new Map<number, Set<string>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getUserPermissions(userId: number): Promise<Set<string>> {
  if (permissionCache.has(userId)) {
    return permissionCache.get(userId)!;
  }

  // Fetch permissions from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: {
          roleMappings: {
            select: {
              permission: {
                select: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  const permissions = new Set(
    user?.role?.roleMappings.map(m => m.permission.permission) || []
  );

  // Cache the permissions with TTL
  permissionCache.set(userId, permissions);
  setTimeout(() => permissionCache.delete(userId), CACHE_TTL);

  return permissions;
}
```

### Frontend Components

#### 1. User Context (`context/UserContext.tsx`)

Provides user information, including permissions, to all components:

```typescript
export const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  error: null,
  login: async () => false,
  logout: () => {},
  refreshUser: async () => {}
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  // ... implementation details
  
  // User data includes permissions
  const [user, setUser] = useState<User | null>(null);
  
  // ... fetch user profile with permissions
}
```

#### 2. Permission Checks in Components

Components use the user context to check permissions:

```typescript
const { user } = useUser();

// Check if user has permission to create users
{user?.permissions?.includes('users.create') && (
  <Button onClick={handleCreateUser}>Create User</Button>
)}
```

#### 3. Permission Templates (`RoleManagement/PermissionTemplates/index.ts`)

Predefined sets of permissions for different role types:

```typescript
export const VIEW_PERMISSIONS = {
  [SECTIONS.DASHBOARD]: [`${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.VIEW}`],
  [SECTIONS.USERS]: [`${SECTIONS.USERS.toLowerCase()}.${ACTIONS.VIEW}`],
  // ... other view permissions
};

export const EDIT_PERMISSIONS = {
  [SECTIONS.DASHBOARD]: [
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.VIEW}`,
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.EDIT}`
  ],
  // ... other edit permissions
};

export const ADMIN_PERMISSIONS = {
  [SECTIONS.DASHBOARD]: [
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.VIEW}`,
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.CREATE}`,
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.EDIT}`,
    `${SECTIONS.DASHBOARD.toLowerCase()}.${ACTIONS.DELETE}`
  ],
  // ... other admin permissions
};
```

## Permission Checking Workflow

1. **Authentication**: User logs in and receives a JWT token
2. **Token Verification**: On each request, the auth middleware verifies the token and attaches the user ID to the request
3. **Permission Loading**: The permission middleware loads the user's permissions (from cache if available)
4. **Permission Expansion**: The system expands the user's explicit permissions to include inherited permissions
5. **Permission Check**: The middleware checks if the user has the required permissions for the requested operation
6. **Access Control**: If the user has the required permissions, the request proceeds; otherwise, a 403 Forbidden response is returned

## API Endpoints

### Role Management

- `GET /api/roles`: Get all roles
- `GET /api/roles/:id`: Get a specific role
- `POST /api/roles`: Create a new role
- `PUT /api/roles/:id`: Update a role
- `DELETE /api/roles/:id`: Delete a role

### User Management

- `GET /api/users`: Get all users
- `GET /api/users/:id`: Get a specific user
- `POST /api/users`: Create a new user
- `PUT /api/users/:id`: Update a user
- `DELETE /api/users/:id`: Delete a user
- `GET /api/users/profile`: Get the current user's profile with permissions

## Best Practices

1. **Use the Permission Middleware**: Always use the `hasPermission` middleware to protect routes
2. **Check Permissions in UI**: Use the user context to conditionally render UI elements based on permissions
3. **Clear Cache When Needed**: Clear the permission cache when updating a user's role or a role's permissions
4. **Use Permission Templates**: Use predefined permission templates when creating new roles
5. **Consider Inheritance**: Be aware of permission inheritance when designing the permission system

## Conclusion

The permission system provides a flexible and powerful way to control access to the application's features and resources. By using roles and permissions, the system can accommodate a wide range of access control requirements while remaining maintainable and scalable.
