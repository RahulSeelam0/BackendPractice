import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true,
}));

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

//routes
import userRouter from './routes/user.routes.js';

//routes declaration
app.use("/api/v1/users", userRouter);

// At the very end of your app setup
// app.use((err, req, res, next) => {
//     const statusCode = err.statusCode || 500;
//     const message = err.message || "Internal Server Error";

//     return res.status(statusCode).json({
//         success: false,
//         message,
//         errors: err.errors || [],
//         stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
//     });
// });


app.get('/', (req, res) => {
    res.send("Hello, Everything is working fine");
});

export { app }