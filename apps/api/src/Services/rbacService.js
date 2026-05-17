import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';
import { PERMISSIONS, ROLE_KEYS } from '../config/rbac.js';

export async function getRoleByKey(roleKey) {
  return Role.findOne({ key: String(roleKey || '').toLowerCase() });
}

export async function getPermissionKeysForRoleId(roleId) {
  const role = await Role.findById(roleId).select('key').lean();
  if (role?.key === ROLE_KEYS.ADMIN) {
    return Object.values(PERMISSIONS);
  }

  const mappings = await RolePermission.find({ roleId }).select('permissionId').lean();
  if (!mappings.length) return [];

  const permissionIds = mappings.map((item) => item.permissionId);
  const permissions = await Permission.find({ _id: { $in: permissionIds } }).select('key').lean();
  return permissions.map((item) => item.key);
}

export async function userHasPermissions(user, requiredPermissions = []) {
  if (!user || !user.roleId) return false;
  if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) return true;

  const effectivePermissions = await getPermissionKeysForRoleId(user.roleId);
  const permissionSet = new Set(effectivePermissions);
  return requiredPermissions.every((permission) => permissionSet.has(permission));
}
