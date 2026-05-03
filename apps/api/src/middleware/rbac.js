import { ROLE_PERMISSIONS } from 'shared';
import { sendError } from '../utils/httpResponses.js';
import { checkWorkspaceMember, getWorkspaceId } from '../utils/workspaceAccess.js';

/**
 * RBAC Middleware Factory
 * @param {string} requiredPermission - The permission string to check (e.g., 'goals:create')
 * @returns {Function} Express middleware
 */
export const rbac = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const workspaceId = getWorkspaceId(req);

      if (!userId) {
        return sendError(res, 401, 'Authentication required');
      }

      if (!workspaceId) {
        return sendError(res, 400, 'Workspace ID is required for this operation');
      }

      const membership = await checkWorkspaceMember(userId, workspaceId);
      if (!membership) {
        return sendError(res, 403, 'You are not a member of this workspace');
      }

      const userRole = membership.role;
      const allowedPermissions = ROLE_PERMISSIONS[userRole] || [];

      // Check if the user's role has the required permission
      if (!allowedPermissions.includes(requiredPermission)) {
        return sendError(res, 403, `Permission denied: ${requiredPermission} required for role ${userRole}`);
      }

      // Attach membership info to request for downstream use if needed
      req.membership = membership;
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
