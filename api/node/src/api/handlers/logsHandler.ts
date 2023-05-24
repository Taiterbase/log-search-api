import { NextFunction, Request, Response } from "express";
import timeout from "connect-timeout";
import { openSync, readSync, statSync, closeSync, realpathSync } from 'fs';
import * as path from 'path';
import { check, validationResult } from "express-validator";
import axios from "axios";

// Pull these from a config or environment variable
const servers = Array.from({ length: 4 }, (_, i) => `http://localhost:${3001 + i}`);

interface LogsRequest {
    filename?: string;
    keyword?: string;
    last?: number;
}

interface LogsResponse {
    status: string;
    server?: string;
    data?: string[];
    reason?: string;
}

// Middleware to validate and sanitize logsRequest
export const validateAndSanitizeLogsRequest = [
    check('filename').optional().isString().trim(),
    check('keyword').optional().isString().trim(),
    check('last').optional().isInt({ gt: -1 }),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

// Handler for /logs
export async function getLogs(req: Request, res: Response, next: NextFunction) {
    const logsRequest: LogsRequest = req.query;
    const { filename, keyword, last } = logsRequest;

    if (!filename) {
        return res.status(400).send("Missing filename");
    }

    // can add support for other operating systems, but keep in mind two things:
    // the path to the log files may be different, and the log files may have different line endings
    let baseDir: string;
    switch (process.platform) {
        case 'darwin':  // mac 
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
    let canonicalPath: string;
    try {
        canonicalPath = realpathSync(logPath);
    } catch (e) {
        console.error(`Invalid path: ${logPath}`);
        return res.status(400).send('Invalid path');
    }

    let basePath = realpathSync(baseDir);
    if (!canonicalPath.startsWith(basePath)) {
        console.error(`Path is outside of base directory: ${logPath}`);
        return res.status(400).send('Bad Request');
    }

    const stats = statSync(logPath);
    const initialChunkSize = 8192; // 8KB

    let filePosition = stats.size; // Current position starts at end of the file
    let buffer = Buffer.alloc(initialChunkSize);
    const fd = openSync(logPath, 'r');
    let lines: string[] = [];
    let lastLine = '';
    while (filePosition > 0) {
        // Adjust chunk size for last chunk if it's smaller than initial chunk size
        let chunkSize = Math.min(initialChunkSize, filePosition);
        readSync(fd, buffer, 0, chunkSize, filePosition - chunkSize);

        // Split by any of the three types of end-of-line sequences
        let chunkLines = buffer.toString().split(/\r?\n|\r/).reverse();

        // If a line spans multiple chunks, append the remaining part from the last chunk.
        chunkLines[0] = chunkLines[0].concat(lastLine);

        // Store the last line of the current chunk as it may be the first part of a line that spans to the next chunk.
        lastLine = (chunkLines.pop() || '') + lastLine;

        // If 'keyword' is provided, filter lines by keyword.
        if (keyword) {
            lines.push(...chunkLines.filter((line) => line.includes(keyword)));
        } else {
            lines.push(...chunkLines);
        }

        // If 'last' is provided, limit output to last 'n' lines.
        // we can put this in the while condition but it's more readable here.
        if (last && lines.length >= last) {
            lines = lines.slice(0, last);
            break;
        }
        filePosition -= chunkSize;
    }
    closeSync(fd);

    const response: LogsResponse = {
        status: 'fulfilled',
        data: lines,
    };

    res.send(response);
}

// Handler for /logs/multi
export const getMultiLogs = async (req: Request, res: Response, next: NextFunction) => {
    // Extract logsRequest from the incoming request query
    const logsRequest: LogsRequest = req.query;
    try {
        // Initiate concurrent requests to all secondary servers
        const serverRequests = servers.map(server =>
            axios.get(`${server}/logs`, { params: logsRequest })
                .then(response => ({ status: 'fulfilled', server, data: response.data }))
                .catch(error => {
                    console.error(`Server ${server} failed with error: ${error}`);
                    return { status: 'rejected', server, reason: error.message }
                })
        );

        // Use Promise.allSettled to wait for all Promises to settle
        const results: LogsResponse[] = await Promise.allSettled(serverRequests)

        // Send the response object
        res.status(200).json(results);
    } catch (error) {
        next(error);
    }
};