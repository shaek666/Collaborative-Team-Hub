import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { rbac } from '../middleware/rbac.js';
import { PERMISSIONS } from 'shared';
import * as workspaceController from '../controllers/workspaceController.js';

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /workspaces:
 *   get:
 *     tags: [Workspaces]
 *     summary: List user's workspaces
 *     description: Returns a list of all workspaces the current user is a member of.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of workspaces
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Workspace'
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/', workspaceController.listWorkspaces);

/**
 * @openapi
 * /workspaces:
 *   post:
 *     tags: [Workspaces]
 *     summary: Create a new workspace
 *     description: Creates a new workspace and makes the creator an Admin.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, accentColour]
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Awesome Team
 *               description:
 *                 type: string
 *                 example: A space for collaboration
 *               accentColour:
 *                 type: string
 *                 example: '#3b82f6'
 *     responses:
 *       201:
 *         description: Workspace created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workspace'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.post('/', workspaceController.createWorkspace);

/**
 * @openapi
 * /workspaces/{id}:
 *   get:
 *     tags: [Workspaces]
 *     summary: Get workspace details
 *     description: Returns detailed information about a specific workspace including members.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The workspace ID
 *     responses:
 *       200:
 *         description: Workspace details
 *       403:
 *         description: Access denied
 *       404:
 *         description: Workspace not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', rbac(PERMISSIONS.WORKSPACE_VIEW), workspaceController.getWorkspace);

// Admin only routes
/**
 * @openapi
 * /workspaces/{id}:
 *   patch:
 *     tags: [Workspaces]
 *     summary: Update workspace
 *     description: Updates workspace settings. Requires Admin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               accentColour:
 *                 type: string
 *     responses:
 *       200:
 *         description: Workspace updated
 *       403:
 *         description: Forbidden
 */
router.patch('/:id', rbac(PERMISSIONS.MEMBERS_MANAGE_ROLES), workspaceController.updateWorkspace); // Reusing manageRoles as proxy for Admin

/**
 * @openapi
 * /workspaces/{id}/invite:
 *   post:
 *     tags: [Workspaces]
 *     summary: Invite member
 *     description: Invites a new member to the workspace via email. Requires Admin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, role]
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MEMBER, VIEWER]
 *     responses:
 *       200:
 *         description: Invitation sent
 */
router.post('/:id/invite', rbac(PERMISSIONS.MEMBERS_INVITE), workspaceController.inviteMember);

/**
 * @openapi
 * /workspaces/{id}/members/{userId}/role:
 *   patch:
 *     tags: [Workspaces]
 *     summary: Change member role
 *     description: Updates the role of an existing workspace member. Requires Admin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MEMBER, VIEWER]
 *     responses:
 *       200:
 *         description: Role updated
 */
router.patch('/:id/members/:userId/role', rbac(PERMISSIONS.MEMBERS_MANAGE_ROLES), workspaceController.changeMemberRole);

export default router;
