import mongoose from "mongoose";

export const dbConnection = ()=>{
    mongoose.connect(process.env.MONGO_URI,{dbName:"MERN_AUTH"})
    .then(()=>{console.log('database connected successfully');
    })
    .catch((err)=>console.log('db  err>>>',err))
}