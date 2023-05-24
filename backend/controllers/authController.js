const Joi = require('joi');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const UserDTO = require('../dto/user');
const JWTService = require('../services/JWTService');
const RefreshToken = require('../models/token');


const passwordPattern =  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/;

const authController = {
    async register(req,res,next){
        // 1.Validate user input
        console.log("this----"+req.body);
        const userRegisterSchema = Joi.object ({
            username : Joi.string().min(5).max(30).required(),
            name : Joi.string().min(5).max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string().pattern(passwordPattern).required(),
            confirmPassword: Joi.ref('password')
        });

        const {error} = userRegisterSchema.validate(req.body);
        
        // 2.If error in validation__ return error via middleware
        if(error){
            next(error);
        }

        // 3.If username or email already exist__ return error
        const {username,name,email,password} =req.body;

        try{
            const usernameInUse = await User.exists({username});
            const emailInUse = await User.exists({email});

            if(usernameInUse){
                const error = {
                    status : 409,
                    message: 'Username is not available, choose another username!'
                }
                return next(error);
            }


            if(emailInUse){
                const error = {
                    status : 409,
                    message: 'Email already registered, choose another email!'
                }
                return next(error);
            }
        }
        catch(error){
            return next(error);
        }
        // 4.Password Hashed
        const hashedPassword = await bcrypt.hash(password,10);

        let accessToken;
        let refreshToken;
        let user;
        try{
             // 5.Store User data in db
            const userToRegister = new User({
                username:username,
                name,//if key and value are same we can just write it once
                email,
                password:hashedPassword
            });
    
            user = await userToRegister.save();
            
            //generate token
            accessToken = JWTService.signAccessToken(
                {_id:user._id, email:user.email},'30m'
                );
            refreshToken = JWTService.signRefreshToken(
                {_id:user._id},'60m'
                );

        }
        catch(error){
            return next(error);
        }
        //saving Refresh Token in db
        await JWTService.storeRefreshToken(refreshToken,user._id);

        //sending response in cookie
        res.cookie('accessToken',accessToken,{
            maxAge: 1000*60*60*24,
            httpOnly:true
        });

        res.cookie('refreshToken',refreshToken,{
            maxAge: 1000*60*60*24,
            httpOnly:true
        });


        // 6.Response send
        const userDto = new UserDTO(user);

        return res.status(201).json({user:userDto});
    },


    async login(req,res,next){
        // 1.Validate user Input
        const userLoginSchema = Joi.object({
            username: Joi.string().min(5).max(30).required(),
            password:Joi.string().pattern(passwordPattern)
        })
        
        const {error} = userLoginSchema.validate(req.body);

        // 2.If validation error, return error
        if(error){
            return next(error);
        }
        // 3.Match password and username
        const {username,password} = req.body;
        let user;

        try{
            user = await User.findOne({username});

            if(!user){
                const error = {
                    status:401,
                    message:'Invalid Username'
                };
                return next(error);
            }

            const match = await bcrypt.compare(password, user.password);

            if(!match){
                const error = {
                    status:401,
                    message:'Invalid Password'
                }
                return next(error);
            }
        }
        catch(error){
            return next(error);
        }
        
        const accessToken = JWTService.signAccessToken({_id:user._id},'30m');
        const refreshToken = JWTService.signRefreshToken({_id:user._id},'60m');

        //updating refreshToken in db if exists otherwise storing it
        await JWTService.updateRefreshToken(refreshToken,user._id);


        //Seding response in cookie
        res.cookie('accessToken',accessToken,{
            maxAge: 1000*60*60*24,
            httpOnly:true
        });

        res.cookie('refreshToken',refreshToken,{
            maxAge: 1000*60*60*24,
            httpOnly:true
        });

        // 4.Send response
        const userDto = new UserDTO(user);

        return res.status(200).json({user:userDto});
    },

    async logout(req, res, next){

        //1. delete refreshToken from db
        //2. clear accessToken and refreshToken from cookies
        //3. response

        //1.Delete refreshToken from db
        const {refreshToken} = req.cookies;
        await JWTService.deteleRefreshToken(refreshToken);

        //2. Delete cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        //3. Response
        res.status(200).json({user:null, auth:false});
    },
    async refresh(req,res,next){
        //1. get refresh token from cookies
        //2. verify refresh token
        //3. Match the token with userId in db
        //4. generate new tokens
        //5. update db, return response

        //1. get refresh token from cookies
        const originalRefreshToken = req.cookies.refreshToken;
        let id;
        try{
            id = await JWTService.verifyRefreshToken(originalRefreshToken);
        }
        catch(e){
            const error = {
                status:401,
                message:'Unauthorized'
            }
            return next(error);
        }

        //3. Match token and userId
        try{
            const match = RefreshToken.findOne({_id:id,token:originalRefreshToken});
            
            if(!match){
                const error = {
                    status:401,
                    message:'Unauthorized'
                }
                return next(error);
            }
        }
        catch(e){
            return next(e);
        }
        
        try{
            const accessToken = JWTService.signAccessToken({_id:id},'30m');
            const refreshToken = JWTService.signRefreshToken({_id:id},'60m');

            await JWTService.updateRefreshToken(refreshToken,id);

            res.cookie("accessToken", accessToken,{
                maxAge: 1000*60*60*24,
                httpOnly:true
            });

            res.cookie("refreshToken",refreshToken,{
                maxAge: 1000*60*60*24,
                httpOnly:true
            });
        }
        catch(e){
            return next(e);
        }
    
        const user = await User.findOne({_id:id});
        const userDto = new UserDTO(user);

        res.status(200).json({user:userDto, auth:true});
    }


    


}

module.exports = authController;