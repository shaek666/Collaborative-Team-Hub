import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate.js';
import { rbac } from '../middleware/rbac.js';
import { PERMISSIONS } from 'shared';
import * as announcementController from '../controllers/announcementController.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router({ mergeParams: true });

router.use(authenticate);

/**
 * @openapi
 * /workspaces/{id}/announcements:
 *   get:
 *     tags: [Announcements]
 *     summary: List announcements
 *     description: Returns a feed of announcements for the workspace, sorted pinned-first.
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
 *         description: List of announcements
 */
router.get('/', rbac(PERMISSIONS.WORKSPACE_VIEW), announcementController.listAnnouncements);

/**
 * @openapi
 * /workspaces/{id}/announcements:
 *   post:
 *     tags: [Announcements]
 *     summary: Create announcement
 *     description: Posts a new announcement. Requires Admin role.
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
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Announcement created
 */
router.post('/', rbac(PERMISSIONS.ANNOUNCEMENTS_CREATE), announcementController.createAnnouncement);

/**
 * @openapi
 * /workspaces/{id}/announcements/{announcementId}/pin:
 *   patch:
 *     tags: [Announcements]
 *     summary: Toggle pin
 *     description: Pins or unpins an announcement. Requires Admin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: announcementId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pin status toggled
 */
router.patch('/:announcementId/pin', rbac(PERMISSIONS.ANNOUNCEMENTS_PIN), announcementController.togglePin);

/**
 * @openapi
 * /workspaces/{id}/announcements/{announcementId}:
 *   delete:
 *     tags: [Announcements]
 *     summary: Delete announcement
 *     description: Deletes an announcement. Requires Admin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: announcementId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcement deleted
 */
router.delete('/:announcementId', rbac(PERMISSIONS.ANNOUNCEMENTS_CREATE), announcementController.deleteAnnouncement);

/**
 * @openapi
 * /workspaces/{id}/announcements/{announcementId}/reactions:
 *   post:
 *     tags: [Announcements]
 *     summary: Add reaction
 *     description: Toggles an emoji reaction on an announcement.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: announcementId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emoji]
 *             properties:
 *               emoji:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reaction toggled
 */
router.post('/:announcementId/reactions', rbac(PERMISSIONS.REACTIONS_CREATE), announcementController.addReaction);

/**
 * @openapi
 * /workspaces/{id}/announcements/{announcementId}/comments:
 *   post:
 *     tags: [Announcements]
 *     summary: Add comment
 *     description: Adds a comment to an announcement.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: announcementId
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
 *         description: Comment added
 */
router.post('/:announcementId/comments', rbac(PERMISSIONS.COMMENTS_CREATE), announcementController.addComment);

/**
 * @openapi
 * /workspaces/{id}/attachments:
 *   post:
 *     tags: [Announcements]
 *     summary: Upload attachment
 *     description: Uploads a file (image, PDF, text) to Cloudinary for use in announcements.
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                 publicId:
 *                   type: string
 */
router.post('/attachments', authenticate, upload.single('file'), announcementController.uploadAttachment);

export default router;
