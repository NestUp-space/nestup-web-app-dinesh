import { expect } from 'chai';
import { PERMISSIONS } from '../constants/permissions';
import { expandPermission, hasRequiredPermissions } from '../types/permissions';
import 'mocha';

describe('Permission System', function() {
  describe('Permission Inheritance', function() {
    it('should correctly expand manage permission to include view, create, edit, delete, and approve', function() {
      const expanded = expandPermission(`${PERMISSIONS.USERS.MANAGE}`);
      expect(expanded).to.include(`${PERMISSIONS.USERS.VIEW}`);
      expect(expanded).to.include(`${PERMISSIONS.USERS.CREATE}`);
      expect(expanded).to.include(`${PERMISSIONS.USERS.EDIT}`);
      expect(expanded).to.include(`${PERMISSIONS.USERS.DELETE}`);
      expect(expanded).to.include(`${PERMISSIONS.USERS.APPROVE}`);
    });

    it('should correctly expand edit permission to include view', function() {
      const expanded = expandPermission(`${PERMISSIONS.USERS.EDIT}`);
      expect(expanded).to.include(`${PERMISSIONS.USERS.VIEW}`);
      expect(expanded).to.not.include(`${PERMISSIONS.USERS.CREATE}`);
    });

    it('should correctly handle resource-based permission inheritance', function() {
      const expanded = expandPermission(`${PERMISSIONS.USERS.MANAGE}`);
      expect(expanded).to.include(`${PERMISSIONS.ROLES.VIEW}`);
      expect(expanded).to.include(`${PERMISSIONS.PERMISSIONS.VIEW}`);
    });
  });

  describe('Permission Checking', function() {
    const userPerms = new Set([
      PERMISSIONS.USERS.MANAGE,
      PERMISSIONS.PROJECTS.VIEW
    ]);

    it('should allow access when user has exact permission', function() {
      expect(hasRequiredPermissions(userPerms, [PERMISSIONS.USERS.MANAGE])).to.be.true;
    });

    it('should allow access when user has inherited permission', function() {
      expect(hasRequiredPermissions(userPerms, [PERMISSIONS.USERS.VIEW])).to.be.true;
      expect(hasRequiredPermissions(userPerms, [PERMISSIONS.USERS.EDIT])).to.be.true;
    });

    it('should handle multiple required permissions correctly', function() {
      expect(hasRequiredPermissions(
        userPerms, 
        [PERMISSIONS.USERS.VIEW, PERMISSIONS.PROJECTS.VIEW], 
        { requireAll: true }
      )).to.be.true;

      expect(hasRequiredPermissions(
        userPerms,
        [PERMISSIONS.USERS.VIEW, PERMISSIONS.MATERIALS.VIEW],
        { requireAll: true }
      )).to.be.false;

      expect(hasRequiredPermissions(
        userPerms,
        [PERMISSIONS.USERS.VIEW, PERMISSIONS.MATERIALS.VIEW],
        { requireAll: false }
      )).to.be.true;
    });

    it('should handle permission inheritance options', function() {
      expect(hasRequiredPermissions(
        new Set([PERMISSIONS.USERS.MANAGE]),
        [PERMISSIONS.USERS.VIEW],
        { checkInheritance: false }
      )).to.be.false;

      expect(hasRequiredPermissions(
        new Set([PERMISSIONS.USERS.MANAGE]),
        [PERMISSIONS.USERS.VIEW],
        { checkInheritance: true }
      )).to.be.true;
    });
  });
});
