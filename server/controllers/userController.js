import ErrorHandler from '../middleware/error.js'
import {catchAsyncError} from '../middleware/catchAsyncError.js'
import {User} from '../models/userModel.js'
import { sendEmail } from '../utils/sendEmail.js';
import twilio from "twilio";

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)

export const register = catchAsyncError(async(req,res,next)=>{

     try {
        const {name,email, phone, password,verificationMethod} = req.body;
        if(!name || !email || !phone || ! password || !verificationMethod){
            return next(new ErrorHandler('All fields are required',400));
        }

        function validatePhone(phone){
            const phoneRegex = /^\+91\d{10}$/ ;
            return phoneRegex.test(phone)
        }

        if(!validatePhone(phone)){
            return next(new ErrorHandler('Invalid phone number',400))
        }

        const existingUser = await User.findOne({
            $or:[
                {email,accountVerified:true},
                {phone,accountVerified:true}
                
            ]
        })

        if(existingUser){
            return next(new ErrorHandler('Email or phone is already used',400   ))
        }

        const registrationAttemptsByUser = await User.find({
            $or:[
                {phone, accountVerified:false},
                {email, accountVerified:false},
            ]
        })  

        if(registrationAttemptsByUser.length >30){
            return next(new ErrorHandler("you have exceed registration limit(3). please try after 1 hours",400))
        }
      const userData = {name,email,phone, password};
      const user = await User.create(userData);
      const verificationCode = await user.generateVerificationCode()
      await user.save();
      sendVerificationCode(verificationMethod,verificationCode,name,email,phone,res);


     } catch (error) {
        next(error)
     }
})


async function sendVerificationCode(verificationMethod,verificationCode,name,email,phone,res){
    try {
     
        if(verificationMethod == 'email'){
            const message = generateEmailTemplate(verificationCode)
            const subject = "Your verification code";
            sendEmail(email,subject,message)
            res.status(200).json({success:true, message: `verification email successfully sent to ${name} at ${email}`});  
        }else if(verificationMethod == 'phone'){
            const verificationCodeWithSpace = verificationCode.toString().split('').join(' ');
            await client.calls.create({
                twiml: `<Response><Say>Your verification code is ${verificationCodeWithSpace}</Say></Response>. <Response><Say>Your verification code is ${verificationCodeWithSpace}</Say></Response>.`,
                from: process.env.TWILIO_PHONE,
                to: phone
            })
            res.status(200).json({success:true, message: `OTP sent`});  
        }else{
            return res.status(500).json({success:false,message:"Invalid verification method"})
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json({success:false,message:"Verification code failed to send"})
    }
}

function generateEmailTemplate(verificationCode){
    return `<div>Your registration verification code is ${verificationCode}</div>`;
}