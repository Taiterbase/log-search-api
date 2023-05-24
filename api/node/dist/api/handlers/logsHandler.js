"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMultiLogs = exports.getLogs = exports.validateAndSanitizeLogsRequest = void 0;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const express_validator_1 = require("express-validator");
const axios_1 = __importDefault(require("axios"));
// Pull these from a config or environment variable
const servers = Array.from({ length: 4 }, (_, i) => `http://localhost:${3001 + i}`);
// Middleware to validate and sanitize logsRequest
exports.validateAndSanitizeLogsRequest = [
    (0, express_validator_1.check)('filename').optional().isString().trim(),
    (0, express_validator_1.check)('keyword').optional().isString().trim(),
    (0, express_validator_1.check)('last').optional().isInt({ gt: -1 }),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
// Handler for /logs
function getLogs(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const logsRequest = req.query;
        const { filename, keyword, last } = logsRequest;
        if (!filename) {
            return res.status(400).send("Missing filename");
        }
        // can add support for other operating systems, but keep in mind two things:
        // the path to the log files may be different, and the log files may have different line endings
        let baseDir;
        switch (process.platform) {
            case 'darwin': // mac 
                baseDir = '/private/var/log';
                break;
            case 'linux':
                baseDir = '/var/log';
                break;
            case 'win32':
                baseDir = 'C:\\Windows\\System32\\config';
                break;
            default:
                console.error(`Unsupported OS: ${process.platform}`);
                return res.status(400).send('Unsupported OS');
        }
        let logPath = path.join(baseDir, filename);
        let canonicalPath;
        try {
            canonicalPath = (0, fs_1.realpathSync)(logPath);
        }
        catch (e) {
            console.error(`Invalid path: ${logPath}`);
            return res.status(400).send('Invalid path');
        }
        let basePath = (0, fs_1.realpathSync)(baseDir);
        if (!canonicalPath.startsWith(basePath)) {
            console.error(`Path is outside of base directory: ${logPath}`);
            return res.status(400).send('Bad Request');
        }
        console.time('getLogsFromFile');
        const stats = (0, fs_1.statSync)(logPath);
        const initialChunkSize = 128; // 8KB
        let filePosition = stats.size; // Current position starts at end of the file
        let buffer = Buffer.alloc(initialChunkSize);
        const fd = (0, fs_1.openSync)(logPath, 'r');
        let lines = [];
        let lastLine = '';
        while (filePosition > 0) {
            // Adjust chunk size for last chunk if it's smaller than initial chunk size
            let chunkSize = Math.min(initialChunkSize, filePosition);
            console.log(`filePosition: ${filePosition}, chunkSize: ${chunkSize}, buffer.length: ${buffer.length}, size: ${stats.size}`);
            (0, fs_1.readSync)(fd, buffer, 0, chunkSize, filePosition - chunkSize);
            // Split by any of the three types of end-of-line sequences
            let chunkLines = buffer.toString().split(/\r?\n|\r/);
            console.log(chunkLines);
            // If a line spans multiple chunks, append the remaining part from the last chunk.
            chunkLines[0] = lastLine + chunkLines[0];
            // Store the last line of the current chunk as it may be the first part of a line that spans to the next chunk.
            lastLine = (chunkLines.pop() || '') + lastLine;
            // If 'keyword' is provided, filter lines by keyword.
            if (keyword) {
                lines.push(...chunkLines.filter((line) => line.includes(keyword)));
            }
            else {
                lines.push(...chunkLines);
            }
            // If 'last' is provided, limit output to last 'n' lines.
            // we can put this in the while condition but it's more readable here.
            if (last && lines.length >= last) {
                lines = lines.slice(-last);
                break;
            }
            filePosition -= chunkSize;
        }
        (0, fs_1.closeSync)(fd);
        const response = {
            status: 'fulfilled',
            data: lines.reverse(),
        };
        res.send(response);
    });
}
exports.getLogs = getLogs;
// Handler for /logs/multi
const getMultiLogs = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract logsRequest from the incoming request query
    const logsRequest = req.query;
    try {
        // Initiate concurrent requests to all secondary servers
        const serverRequests = servers.map(server => axios_1.default.get(`${server}/logs`, { params: logsRequest })
            .then(response => ({ status: 'fulfilled', server, data: response.data }))
            .catch(error => {
            console.error(`Server ${server} failed with error: ${error}`);
            return { status: 'rejected', server, reason: error.message };
        }));
        // Use Promise.allSettled to wait for all Promises to settle
        const results = yield Promise.allSettled(serverRequests);
        // Send the response object
        res.status(200).json(results);
    }
    catch (error) {
        next(error);
    }
});
exports.getMultiLogs = getMultiLogs;
