import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { rbac } from '../middleware/rbac.js';
import { PERMISSIONS } from 'shared';
import * as actionItemController from '../controllers/actionItemController.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

/**
 * @openapi
 * /workspaces/{id}/action-items:
 *   get:
 *     tags: [Action Items]
 *     summary: List action items
 *     description: Returns a list of action items for the workspace.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of action items
 */
router.get('/', rbac(PERMISSIONS.WORKSPACE_VIEW), actionItemController.listActionItems);

/**
 * @openapi
 * /workspaces/{id}/action-items:
 *   post:
 *     tags: [Action Items]
 *     summary: Create action item
 *     description: Creates a new action item in the workspace.
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
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               assigneeId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Action item created
 */
router.post('/', rbac(PERMISSIONS.ACTION_ITEMS_CREATE), actionItemController.createActionItem);

/**
 * @openapi
 * /workspaces/{id}/action-items/{itemId}:
 *   patch:
 *     tags: [Action Items]
 *     summary: Update action item
 *     description: Updates an existing action item.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE]
 *               priority:
 *                 type: string
 *               dueDate:
 *                 type: string
 *               assigneeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Action item updated
 */
router.patch('/:itemId', rbac(PERMISSIONS.ACTION_ITEMS_CREATE), actionItemController.updateActionItem);

/**
 * @openapi
 * /workspaces/{id}/action-items/{itemId}:
 *   delete:
 *     tags: [Action Items]
 *     summary: Delete action item
 *     description: Deletes an action item.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Action item deleted
 */
router.delete('/:itemId', rbac(PERMISSIONS.ACTION_ITEMS_DELETE), actionItemController.deleteActionItem);

export default router;
