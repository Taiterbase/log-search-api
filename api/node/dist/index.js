"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const connect_timeout_1 = __importDefault(require("connect-timeout"));
const cors_1 = __importDefault(require("cors"));
const logsRoutes_1 = __importDefault(require("./api/routes/logsRoutes"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
const corsOptions = {
    origin: (origin, callback) => {
        if (origin.startsWith("http://localhost:")) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use((0, cors_1.default)());
app.use((0, connect_timeout_1.default)("30s"));
// Error-handling middleware
app.use((err, req, res, next) => {
    if (!req.timedout)
        next(err);
    else
        res.status(504).send('Request timed out');
});
app.use(express_1.default.json());
app.use('/logs', logsRoutes_1.default);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
