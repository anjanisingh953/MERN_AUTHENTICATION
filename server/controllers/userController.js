import ErrorHandler from '../middleware/error.js'
import { catchAsyncError } from '../middleware/catchAsyncError.js'
import { User } from '../models/userModel.js'
import { sendEmail } from '../utils/sendEmail.js';
import twilio from "twilio";
import { sendToken } from '../utils/sendToken.js';


export const register = catchAsyncError(async (req, res, next) => {
    // console.log('process.env.TWILIO_SID>>>>>>>', process.env.TWILIO_SID)
    try {
        const { name, email, phone, password, verificationMethod } = req.body;
        if (!name || !email || !phone || !password || !verificationMethod) {
            return next(new ErrorHandler('All fields are required', 400));
        }

        function validatePhone(phone) {
            const phoneRegex = /^\+91\d{10}$/;
            return phoneRegex.test(phone)
        }

        if (!validatePhone(phone)) {
            return next(new ErrorHandler('Invalid phone number', 400))
        }

        const existingUser = await User.findOne({
            $or: [
                { email, accountVerified: true },
                { phone, accountVerified: true }

            ]
        })

        if (existingUser) {
            return next(new ErrorHandler('Email or phone is already used', 400))
        }

        const registrationAttemptsByUser = await User.find({
            $or: [
                { phone, accountVerified: false },
                { email, accountVerified: false },
            ]
        })

        if (registrationAttemptsByUser.length > 30) {
            return next(new ErrorHandler("you have exceed registration limit(3). please try after 1 hours", 400))
        }
        const userData = { name, email, phone, password };
        const user = await User.create(userData);
        const verificationCode = await user.generateVerificationCode()
        await user.save();
        sendVerificationCode(verificationMethod, verificationCode, name, email, phone, res);


    } catch (error) {
        next(error)
    }
})


async function sendVerificationCode(verificationMethod, verificationCode, name, email, phone, res) {
    // console.log("TWILIO_SID:", process.env.TWILIO_SID);
    // console.log("TWILIO_AUTH_TOKEN:", process.env.TWILIO_AUTH_TOKEN);


    try {

        if (verificationMethod == 'email') {
            const message = generateEmailTemplate(verificationCode)
            const subject = "Your verification code";
            sendEmail(email, subject, message)
            res.status(200).json({ success: true, message: `verification email successfully sent to ${name} at ${email}` });
        } else if (verificationMethod == 'phone') {

            const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)
            const verificationCodeWithSpace = verificationCode.toString().split('').join(' ');
            await client.messages.create({
                // twiml: `<Response><Say>Your verification code is ${verificationCodeWithSpace}</Say></Response>. <Response><Say>Your verification code is ${verificationCodeWithSpace}</Say></Response>.`,
                body: `Your verification code is ${verificationCodeWithSpace}`,
                from: process.env.TWILIO_PHONE,
                to: phone
            })
            res.status(200).json({ success: true, message: `OTP sent` });
        } else {
            return res.status(500).json({ success: false, message: "Invalid verification method" })
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Verification code failed to send" })
    }
}

function generateEmailTemplate(verificationCode) {
    return `<div>Your registration verification code is ${verificationCode}</div>`;
}


export const verifyOTP = catchAsyncError(async (req, res, next) => {

    const { email, otp, phone } = req.body;

    function validatePhone(phone) {
        const phoneRegex = /^\+91\d{10}$/;
        return phoneRegex.test(phone)
    }

    if (!validatePhone(phone)) {
        return next(new ErrorHandler('Invalid phone number', 400))
    }

    try {
        const userAllEntries = await User.find({
            $or: [
                { email, accountVerified: false },
                { phone, accountVerified: false }
            ]
        }).sort({ createdAt: -1 });

        if (!userAllEntries) {
            return next(new ErrorHandler('User not found', 404));
        }

        let user;
        if (userAllEntries.length > 1) {
            user = userAllEntries[0];
            await User.deleteMany({
                _id: { $ne: user._id },
                $or: [
                    { email, accountVerified: false },
                    { phone, accountVerified: false }
                ]
            })
        } else {
            user = userAllEntries[0];
        }

        if (user.verificationCode !== Number(otp)) {
            return next(new ErrorHandler('Invalid Otp', 400));
        }

        const currentTime = Date.now();
        const verificationCodeExpire = new Date(user.verificationCodeExpire).getTime();

        if (currentTime > verificationCodeExpire) {
            return next(new ErrorHandler('OTP Expired', 400));
        }

        user.accountVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpire = null;
        await user.save({ validateModifiedOnly: true });

        sendToken(user, 200, 'Account Verified successfully', res);

    } catch (error) {
        console.log('opt-verification error>>>>', error)
        return next(new ErrorHandler('Internal Server Error', 500));
    }


})


export const login = catchAsyncError(async(req,res,next)=>{
    const {email, password} =  req.body;
    
    if(!email || !password){
      return next(new ErrorHandler('Email and password are required', 400));
    }

    const user = await User.findOne({email, accountVerified:true}).select('+password');

    if(!user){
        return next(new ErrorHandler('Invalid email or password', 400));
    }
    
    const isPasswordMatched = await user.comparePassword(password);
    
    if(!isPasswordMatched){
        return next(new ErrorHandler('Invalid email or password', 400));
    }

    sendToken(user, 200, 'user loggedin successfully', res);


})


export const logout = catchAsyncError(async(req,res,next)=>{

    res.status(200).cookie('token','',{
        expires:new Date(Date.now()),
        httpOnly:true
    })
    .json({
        success:true,
        message:'Logged out successfully.'
    })
})