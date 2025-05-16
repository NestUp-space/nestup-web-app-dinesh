# Permission System Developer Guide

This guide provides technical information for developers who need to extend, maintain, or integrate with the permission system in the Nestup Web App.

## System Architecture

The permission system follows a Role-Based Access Control (RBAC) pattern with hierarchical permission inheritance. It consists of several key components:

1. **Database Models**: `UserPermission`, `UserRole`, and `RolePermissionMapping`
2. **Permission Constants**: Defined in `constants/permissions.ts`
3. **Permission Inheritance Rules**: Defined in `types/permissions.ts`
4. **Permission Middleware**: Implemented in `middlewares/permission.middleware.ts`
5. **Role Controller**: Implemented in `controllers/role.controller.ts`
6. **Frontend Components**: For managing roles and permissions

For a detailed overview of the architecture, refer to the [Architecture Documentation](./ARCHITECTURE.md).

## Adding New Permissions

### Step 1: Define the Permission

Add the new permission group and/or action to the constants in `constants/permissions.ts`:

```typescript
// Add a new permission group
export const PERMISSION_GROUPS = {
  // Existing groups...
  NEW_GROUP: 'new_group'
} as const;

// Or add a new action
export const ACTIONS = {
  // Existing actions...
  NEW_ACTION: 'new_action'
} as const;
```

### Step 2: Update Inheritance Rules (if needed)

If the new permission should inherit or be inherited by other permissions, update the inheritance rules in `types/permissions.ts`:

```typescript
export const PERMISSION_INHERITANCE: Record<string, string[]> = {
  // Existing rules...
  
  // Add action-based inheritance
  [ACTIONS.NEW_ACTION]: [ACTIONS.VIEW],
  
  // Or add resource-based inheritance
  [`${PERMISSION_GROUPS.NEW_GROUP}.${ACTIONS.MANAGE}`]: [
    `${PERMISSION_GROUPS.RELATED_GROUP}.${ACTIONS.VIEW}`
  ]
};
```

### Step 3: Update Permission Templates

Update the permission templates in `frontend/src/components/dashboard/users/RoleManagement/PermissionTemplates/index.ts`:

```typescript
export const SECTIONS = {
  // Existing sections...
  NEW_GROUP: "New Group"
} as const;

export const VIEW_PERMISSIONS = {
  // Existing permissions...
  [SECTIONS.NEW_GROUP]: [`${SECTIONS.NEW_GROUP.toLowerCase()}.${ACTIONS.VIEW}`]
};

export const EDIT_PERMISSIONS = {
  // Existing permissions...
  [SECTIONS.NEW_GROUP]: [
    `${SECTIONS.NEW_GROUP.toLowerCase()}.${ACTIONS.VIEW}`,
    `${SECTIONS.NEW_GROUP.toLowerCase()}.${ACTIONS.EDIT}`
  ]
};

export const ADMIN_PERMISSIONS = {
  // Existing permissions...
  [SECTIONS.NEW_GROUP]: [
    `${SECTIONS.NEW_GROUP.toLowerCase()}.${ACTIONS.VIEW}`,
    `${SECTIONS.NEW_GROUP.toLowerCase()}.${ACTIONS.CREATE}`,
    `${SECTIONS.NEW_GROUP.toLowerCase()}.${ACTIONS.EDIT}`,
    `${SECTIONS.NEW_GROUP.toLowerCase()}.${ACTIONS.DELETE}`
  ]
};
```

### Step 4: Seed the Permission in the Database

Create a migration or update the seed script to add the new permission to the database:

```typescript
// In a migration or seed script
await prisma.userPermission.create({
  data: {
    permission: 'new_group.new_action'
  }
});
```

## Protecting Routes with Permissions

### Backend Routes

Use the `hasPermission` middleware to protect API routes:

```typescript
import { hasPermission } from '../middlewares/permission.middleware';
import { PERMISSIONS } from '../constants/permissions';

// Protect a route with a single permission
router.get('/api/resource',
  hasPermission(PERMISSIONS.NEW_GROUP.VIEW),
  resourceController.getResources
);

// Protect a route with multiple permissions (ANY)
router.post('/api/resource',
  hasPermission([PERMISSIONS.NEW_GROUP.CREATE, PERMISSIONS.NEW_GROUP.EDIT]),
  resourceController.createResource
);

// Protect a route with multiple permissions (ALL)
router.delete('/api/resource/:id',
  hasPermission([PERMISSIONS.NEW_GROUP.DELETE, PERMISSIONS.ADMIN.MANAGE], { requireAll: true }),
  resourceController.deleteResource
);

// Protect a route without checking inheritance
router.put('/api/resource/:id',
  hasPermission(PERMISSIONS.NEW_GROUP.EDIT, { checkInheritance: false }),
  resourceController.updateResource
);
```

### Frontend Components

Use the `useUser` hook to check permissions in React components:

```typescript
import { useUser } from '@/context/UserContext';

function MyComponent() {
  const { user } = useUser();
  
  // Check if user has a specific permission
  const canCreateResource = user?.permissions?.includes('new_group.create');
  
  return (
    <div>
      {canCreateResource && (
        <Button onClick={handleCreateResource}>Create Resource</Button>
      )}
    </div>
  );
}
```

## Extending the Permission System

### Adding Custom Inheritance Rules

To add custom inheritance rules beyond the standard action-based and resource-based rules:

1. Update the `PERMISSION_INHERITANCE` object in `types/permissions.ts`
2. If needed, modify the `expandPermission` function to handle the new inheritance logic

```typescript
export function expandPermission(permission: string): Set<string> {
  const result = new Set<string>();
  result.add(permission);

  // Add custom inheritance logic here
  if (permission === 'custom.permission') {
    result.add('inherited.permission');
  }

  // Existing inheritance logic...

  return result;
}
```

### Adding Permission Caching Strategies

The current implementation uses an in-memory cache with a TTL. To implement a different caching strategy:

1. Modify the caching logic in `middlewares/permission.middleware.ts`
2. Update the cache clearing functions as needed

```typescript
// Example: Using Redis for caching
import Redis from 'ioredis';
const redis = new Redis();
const CACHE_KEY_PREFIX = 'user_permissions:';
const CACHE_TTL = 300; // 5 minutes in seconds

async function getUserPermissions(userId: number): Promise<Set<string>> {
  const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
  
  // Try to get from cache
  const cachedPermissions = await redis.get(cacheKey);
  if (cachedPermissions) {
    return new Set(JSON.parse(cachedPermissions));
  }
  
  // Fetch from database
  const user = await prisma.user.findUnique({
    // ... existing query
  });
  
  const permissions = new Set(
    user?.role?.roleMappings.map(m => m.permission.permission) || []
  );
  
  // Cache with TTL
  await redis.set(cacheKey, JSON.stringify([...permissions]), 'EX', CACHE_TTL);
  
  return permissions;
}

export function clearUserPermissionCache(userId: number): void {
  const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
  redis.del(cacheKey);
}

export function clearAllPermissionCache(): void {
  redis.keys(`${CACHE_KEY_PREFIX}*`).then(keys => {
    if (keys.length > 0) {
      redis.del(keys);
    }
  });
}
```

## Testing Permission Logic

### Unit Testing

Use unit tests to verify permission inheritance and checking logic:

```typescript
import { expandPermission, hasRequiredPermissions } from '../types/permissions';

describe('Permission Inheritance', () => {
  test('edit permission includes view permission', () => {
    const expanded = expandPermission('resource.edit');
    expect(expanded.has('resource.view')).toBe(true);
  });
  
  test('manage permission includes all other permissions', () => {
    const expanded = expandPermission('resource.manage');
    expect(expanded.has('resource.view')).toBe(true);
    expect(expanded.has('resource.create')).toBe(true);
    expect(expanded.has('resource.edit')).toBe(true);
    expect(expanded.has('resource.delete')).toBe(true);
  });
});

describe('Permission Checking', () => {
  test('user with required permission passes check', () => {
    const userPermissions = new Set(['resource.view']);
    const result = hasRequiredPermissions(userPermissions, ['resource.view']);
    expect(result).toBe(true);
  });
  
  test('user with inherited permission passes check', () => {
    const userPermissions = new Set(['resource.edit']);
    const result = hasRequiredPermissions(userPermissions, ['resource.view'], { checkInheritance: true });
    expect(result).toBe(true);
  });
  
  test('requireAll option requires all permissions', () => {
    const userPermissions = new Set(['resource.view', 'resource.edit']);
    const result = hasRequiredPermissions(
      userPermissions,
      ['resource.view', 'resource.create'],
      { requireAll: true }
    );
    expect(result).toBe(false);
  });
});
```

### Integration Testing

Use integration tests to verify the permission middleware:

```typescript
import request from 'supertest';
import { app } from '../server';
import { createTestUser, createTestRole, assignRoleToUser } from './helpers';

describe('Permission Middleware', () => {
  let token: string;
  
  beforeAll(async () => {
    // Create a test role with specific permissions
    const role = await createTestRole({
      name: 'Test Role',
      permissions: ['resource.view']
    });
    
    // Create a test user with the role
    const user = await createTestUser({
      email: 'test@example.com',
      password: 'password',
      roleId: role.id
    });
    
    // Get a token for the user
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    token = response.body.token;
  });
  
  test('user with permission can access protected route', async () => {
    const response = await request(app)
      .get('/api/resource')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
  });
  
  test('user without permission cannot access protected route', async () => {
    const response = await request(app)
      .post('/api/resource')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Resource' });
    
    expect(response.status).toBe(403);
  });
});
```

## Debugging Permission Issues

### Logging Permission Checks

Add logging to the permission middleware to debug permission issues:

```typescript
export function hasPermission(
  requiredPermissions: string | string[],
  options: PermissionOptions = {}
): RequestHandler {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      // ... existing code
      
      const userPerms = await getUserPermissions(req.user.id);
      const perms = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
      
      // Add debug logging
      console.log('Permission Check:', {
        userId: req.user.id,
        requiredPermissions: perms,
        userPermissions: [...userPerms],
        options,
        hasPermission: hasRequiredPermissions(userPerms, perms, options)
      });
      
      if (!hasRequiredPermissions(userPerms, perms, options)) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: `Insufficient permissions. Required: ${perms.join(', ')}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in permission middleware:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
}
```

### Inspecting User Permissions

Create a debug endpoint to inspect a user's permissions:

```typescript
router.get('/api/debug/permissions',
  hasPermission(PERMISSIONS.ADMIN.MANAGE),
  async (req: CustomRequest, res: Response) => {
    try {
      const userId = Number(req.query.userId) || req.user?.id;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: {
            select: {
              id: true,
              role: true,
              roleType: true,
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
      
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const explicitPermissions = user.role?.roleMappings.map(m => m.permission.permission) || [];
      const expandedPermissions = new Set<string>();
      
      explicitPermissions.forEach(permission => {
        expandPermission(permission).forEach(p => expandedPermissions.add(p));
      });
      
      res.status(StatusCodes.OK).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: {
            id: user.role?.id,
            name: user.role?.role,
            type: user.role?.roleType
          }
        },
        permissions: {
          explicit: explicitPermissions,
          expanded: [...expandedPermissions]
        }
      });
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error fetching user permissions'
      });
    }
  }
);
```

## Performance Considerations

### Optimizing Permission Checks

1. **Use Caching**: The current implementation uses an in-memory cache with a TTL. Consider using a distributed cache like Redis for production environments.

2. **Batch Permission Checks**: If you need to check multiple permissions, use a single call to `hasRequiredPermissions` instead of multiple calls.

3. **Minimize Database Queries**: The `getUserPermissions` function fetches permissions from the database only when they're not in the cache. Ensure the cache TTL is appropriate for your application.

4. **Consider Denormalization**: For very performance-critical applications, consider denormalizing permissions into a JSON field on the user record.

### Frontend Optimization

1. **Memoize Permission Checks**: Use React's `useMemo` to memoize permission checks:

```typescript
const canCreateResource = React.useMemo(() => {
  return user?.permissions?.includes('resource.create');
}, [user?.permissions]);
```

2. **Batch UI Updates**: Group permission-based UI updates to minimize re-renders:

```typescript
const permissions = React.useMemo(() => {
  return {
    canView: user?.permissions?.includes('resource.view'),
    canCreate: user?.permissions?.includes('resource.create'),
    canEdit: user?.permissions?.includes('resource.edit'),
    canDelete: user?.permissions?.includes('resource.delete')
  };
}, [user?.permissions]);
```

## Security Considerations

### Permission Validation

Always validate permissions on the server side, even if the UI hides functionality based on permissions. Client-side permission checks are for UI purposes only and can be bypassed.

### Role Assignment

Be careful when allowing users to assign roles to other users. A user should not be able to assign a role with more permissions than they have themselves.

### Superuser Roles

Consider having a "superuser" role that cannot be modified or deleted through the normal UI. This ensures there's always a way to access the system with full permissions.

### Audit Logging

Implement audit logging for permission-related actions:

```typescript
async function logPermissionAction(
  userId: number,
  action: 'create' | 'update' | 'delete',
  resourceType: 'role' | 'permission',
  resourceId: number,
  details: any
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resourceType,
      resourceId,
      details: JSON.stringify(details),
      timestamp: new Date()
    }
  });
}
```

## Conclusion

The permission system provides a flexible and powerful way to control access to the application's features and resources. By following the guidelines in this document, you can extend and maintain the system to meet your application's needs.

For more information, refer to the [Architecture Documentation](./ARCHITECTURE.md) and [User Guide](./USER_GUIDE.md).
