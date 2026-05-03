import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { rbac } from '../middleware/rbac.js';
import { PERMISSIONS } from 'shared';
import * as goalController from '../controllers/goalController.js';

const router = express.Router({ mergeParams: true }); // mergeParams to access workspaceId as 'id'

router.use(authenticate);

/**
 * @openapi
 * /workspaces/{id}/goals:
 *   get:
 *     tags: [Goals]
 *     summary: List workspace goals
 *     description: Returns a list of all goals for a specific workspace.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: List of goals
 *       403:
 *         description: Forbidden
 */
router.get('/', rbac(PERMISSIONS.WORKSPACE_VIEW), goalController.listGoals);

/**
 * @openapi
 * /workspaces/{id}/goals:
 *   post:
 *     tags: [Goals]
 *     summary: Create goal
 *     description: Creates a new goal in the workspace.
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
 *             required: [title, targetDate]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               targetDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Goal created
 */
router.post('/', rbac(PERMISSIONS.GOALS_CREATE), goalController.createGoal);

/**
 * @openapi
 * /workspaces/{id}/goals/{goalId}:
 *   patch:
 *     tags: [Goals]
 *     summary: Update goal
 *     description: Updates an existing goal.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: goalId
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
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [IN_PROGRESS, COMPLETED, OVERDUE]
 *     responses:
 *       200:
 *         description: Goal updated
 */
router.patch('/:goalId', rbac(PERMISSIONS.GOALS_CREATE), goalController.updateGoal);

/**
 * @openapi
 * /workspaces/{id}/goals/{goalId}:
 *   delete:
 *     tags: [Goals]
 *     summary: Delete goal
 *     description: Deletes a goal and its associated milestones.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Goal deleted
 */
router.delete('/:goalId', rbac(PERMISSIONS.GOALS_DELETE), goalController.deleteGoal);

/**
 * @openapi
 * /workspaces/{id}/goals/{goalId}/milestones:
 *   post:
 *     tags: [Goals]
 *     summary: Add milestone
 *     description: Adds a milestone to a goal.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: goalId
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
 *     responses:
 *       201:
 *         description: Milestone added
 */
router.post('/:goalId/milestones', rbac(PERMISSIONS.GOALS_CREATE), goalController.addMilestone);

/**
 * @openapi
 * /workspaces/{id}/goals/{goalId}/milestones/{milestoneId}:
 *   patch:
 *     tags: [Goals]
 *     summary: Update milestone
 *     description: Updates a milestone's status or title.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: milestoneId
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
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Milestone updated
 */
router.patch('/:goalId/milestones/:milestoneId', rbac(PERMISSIONS.GOALS_CREATE), goalController.updateMilestone);

/**
 * @openapi
 * /workspaces/{id}/goals/{goalId}/updates:
 *   post:
 *     tags: [Goals]
 *     summary: Post goal update
 *     description: Adds a progress update/comment to a goal.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Update posted
 */
router.post('/:goalId/updates', rbac(PERMISSIONS.GOALS_CREATE), goalController.postUpdate);

/**
 * @openapi
 * /workspaces/{id}/goals/{goalId}/updates:
 *   get:
 *     tags: [Goals]
 *     summary: List goal updates
 *     description: Returns the activity feed for a specific goal.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of goal updates
 */
router.get('/:goalId/updates', rbac(PERMISSIONS.WORKSPACE_VIEW), goalController.getUpdates);

export default router;
