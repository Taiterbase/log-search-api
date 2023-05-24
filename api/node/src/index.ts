import express from "express";
import timeout from "connect-timeout";
import cors from "cors";
import logsRoutes from "./api/routes/logsRoutes";

const app: express.Application = express();
const port: string | number = process.env.PORT || 3001;
const corsOptions = {
    origin: (origin: string, callback: Function) => {
        if (origin.startsWith("http://localhost:")) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors());
app.use(timeout("30s"));
// Error-handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.timedout) next(err);
    else res.status(504).send('Request timed out');
});

app.use(express.json());
app.use('/logs', logsRoutes);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
