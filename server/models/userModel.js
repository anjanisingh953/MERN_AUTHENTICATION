import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:{
        type: String,
        minLength: [8, "Password must have atleast 8 characters"],
        maxLength: [32, "Password can not be more than 32 characters"],
        select:false
    },
    phone: String,
    accountVerified: {type: Boolean, default: false},
    verificationCode: Number,
    verificationCodeExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type:Date,
        default: Date.now
    }
})

userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return;
    }
    this.password = await bcrypt.hash(this.password,10)
})


userSchema.methods.comparePassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password)
}

userSchema.methods.generateVerificationCode = function(){

    function  generateOtp(){
        const firstDigit = Math.floor( Math.random() *9 ) + 1;
        const remainingDigits = Math.floor(Math.random() * 10000).toString().padStart(5,0);
       return parseInt(firstDigit+remainingDigits); 
    }
    
    const otp = generateOtp();
    this.verificationCode = otp;
    this.verificationCodeExpire = Date.now() + 5 * 60 * 1000;
    return otp; 
}

userSchema.methods.generateToken = function(){
  const token =  jwt.sign({_id: this._id}, process.env.JWT_SECRET_KEY,{expiresIn:process.env.JWT_EXPIRE_TIME});
  return token;
}


userSchema.methods.generateResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 15 * 60 *1000;
    return resetToken;     
}


export const User = mongoose.model('User',userSchema) 