"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logsHandler_1 = require("../handlers/logsHandler");
const router = express_1.default.Router();
router.get('/', logsHandler_1.validateAndSanitizeLogsRequest, logsHandler_1.getLogs);
router.get('/multi', logsHandler_1.validateAndSanitizeLogsRequest, logsHandler_1.getMultiLogs);
exports.default = router;
