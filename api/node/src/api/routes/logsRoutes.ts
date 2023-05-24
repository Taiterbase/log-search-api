import express from 'express';
import { getLogs, getMultiLogs, validateAndSanitizeLogsRequest } from '../handlers/logsHandler';

const router: express.Router = express.Router();

router.get('/', validateAndSanitizeLogsRequest, getLogs);
router.get('/multi', validateAndSanitizeLogsRequest, getMultiLogs);

export default router;
