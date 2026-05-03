import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { rbac } from '../middleware/rbac.js';
import { PERMISSIONS } from 'shared';
import * as analyticsController from '../controllers/analyticsController.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

// Analytics & Export (Workspace scoped)
/**
 * @openapi
 * /workspaces/{id}/analytics:
 *   get:
 *     tags: [Analytics]
 *     summary: Get workspace analytics
 *     description: Returns statistics for the workspace (total goals, completion rates, etc.).
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
 *         description: Analytics data
 */
router.get('/analytics', rbac(PERMISSIONS.ANALYTICS_VIEW), analyticsController.getAnalytics);

/**
 * @openapi
 * /workspaces/{id}/export:
 *   get:
 *     tags: [Analytics]
 *     summary: Export workspace data
 *     description: Generates a CSV export of all workspace data.
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
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/export', rbac(PERMISSIONS.ANALYTICS_VIEW), analyticsController.exportWorkspaceData);

// Notifications (Global)
/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get user notifications
 *     description: Returns a list of notifications for the current user.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/notifications', analyticsController.getNotifications);

/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     description: Updates every unread notification for the current user.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Notifications updated
 */
router.patch('/notifications/read-all', analyticsController.markAllAsRead);

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     description: Updates a notification status to read.
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
 *         description: Notification updated
 */
router.patch('/notifications/:id/read', analyticsController.markAsRead);

export default router;
