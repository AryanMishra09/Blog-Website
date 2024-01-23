import User from "../models/userModel.js";
import bcryptjs from 'bcryptjs';
import { errorHandler } from "../utils/error.js";
import jwt from "jsonwebtoken";

// for signing up a user 
export const signup = async(req, res, next) => {
    const {username, email, password } = req.body;
    if(!username || !email || !password || username === '' || email === '' || password === ''){
        next(errorHandler(400, "All fields are required!"));
    }

    // hashing password 
    const hashpassword = bcryptjs.hashSync(password, 10);

    const newUser = new User({
        username,
        email,
        password: hashpassword,
    });
    
    try {
        await newUser.save();
        res.json("Signup is successfull");
    } catch (error) {
        next(error);
    }
};

// for sigining in a user: 
export const signin = async(req, res, next) => {
    const {email, password} = req.body;

    if(!email || !password || email === '' || password === ''){
        next(errorHandler(400, "All fields are required!"));
    }

    try {
        const validUser = await User.findOne({ email });
        if(!validUser){
           return  next(errorHandler(404, "User not Found!"));
        }
        const validPassword = bcryptjs.compareSync(password, validUser.password);
        if(!validPassword){
            return next(errorHandler(400, "Invalid password"));
        }

        const token = jwt.sign({ id: validUser._id}, process.env.JWT_SECRET_KEY );      //without expiresIn property the token is valid only till the browser is open. Once browser is closed, token will be deleted from browser.

        const {password: pass, ...rest} = validUser._doc;
        res.status(200)
            .cookie('access_token', token, { httpOnly: true})
            .json(rest);
    } catch (error) {
        next(error);
    }

};

// for sigining/signingup in a user through google popup:
export const google = async (req, res, next) => {
    const { email, name, googlePhotoUrl } = req.body;
    
    try {
        const user = await User.findOne({ email });
        if (user) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY);
            
            const { password, ...rest } = user._doc;
            res
            .status(200)
            .cookie('access_token', token, { httpOnly: true })
            .json(rest);
        } else {
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
            
            const newUser = new User({
                username: name.toLowerCase().split(' ').join('') + Math.random().toString(9).slice(-4),
                email,
                password: hashedPassword,
                profilePicture: googlePhotoUrl,
            });
            await newUser.save();
            
            const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET_KEY);
            const { password, ...rest } = newUser._doc;
            res
            .status(200)
            .cookie('access_token', token, { httpOnly: true })
            .json(rest);
        }
    } catch (error) {
        next(error);
    }
};


