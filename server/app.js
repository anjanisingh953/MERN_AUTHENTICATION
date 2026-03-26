import express from 'express';
import {config} from 'dotenv';
import cookieParser  from "cookie-parser";
import cors from 'cors';
import { dbConnection } from "./db/conn.js";
import { errorMiddleware } from './middleware/error.js';
import userRouter  from './routes/userRoutes.js'


export const app = express();
config({path:'./config.env'});

app.use(cors({
    origin:[process.env.FRONTEND_URL],
    methods:['GET','POST','PUT','PATCH','DELETE'],
    credentials:true
}));


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/api/v1/user/',userRouter);

dbConnection()
app.use(errorMiddleware)