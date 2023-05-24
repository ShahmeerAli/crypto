const fs = require('fs');
const Blog = require('../models/blog');
const {BACKEND_SERVER_PATH} = require('../config/index');
const BlogDTO = require('../dto/blog');
const Joi = require('joi');
const BlogDetailDTO = require('../dto/blogDetail');
const Comment = require('../models/comment');

const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;

const blogController = {
    async create(req,res,next){
        //1. Validate input using Joi
        const createBlogSchema = Joi.object(
            {
                title: Joi.string().required(),
                content: Joi.string().required(),
                author: Joi.string().regex(mongodbIdPattern).required(),
                photo: Joi.string().required()      
            }
        );

        const {error} = createBlogSchema.validate(req.body);

        if(error){
            return next(error);
        }

        const {title,author,content,photo} = req.body;

        //2. Handle Image and store
            //the image in reqBody is a base64 binary format data
            //1. Need to decode using Buffer
            //2. Allot a random name
            //3. Store Locally using "fs" 
        
        const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/ , ""), 'base64');

        const imagePath = `${Date.now()}-${author}.png`;
        try{
            fs.writeFileSync(`storage/${imagePath}`,buffer);
        }
        catch(error){
            return next(error);
        }

        //3. Save blog in Db
            //Creating BACKEND_SERVER_PATH in env
        let newBlog;
        try{
            newBlog = new Blog({
                title,
                author,
                content,
                photoPath:`${BACKEND_SERVER_PATH}/storage/${imagePath}`
            });

            await newBlog.save();
        }
        catch(error){
            return next(error);
        }
        //4. Send reponse
            //creating BlogDTO
        
        const blogDto = new BlogDTO(newBlog);

        return res.status(201).json({blog:blogDto});

    },
    async getAll(req,res,next){
        //1. Get blogs from database
        //2. Send Response

        try{
            const blogs = await Blog.find({});

            let blogsDto = [];
            for(let i=0;i<blogs.length;i++){
                const dto = new BlogDTO(blogs[i]);
                blogsDto.push(dto);
            }

            return res.status(200).json({blog:blogsDto});
        }
        catch{
            return next(error);
        }
    },
    async getById(req,res,next){
        //1. Validate id using Joi
        //2. Get Blog from database by id
        //3. Send Response

        const getByIdSchema = Joi.object({
            id:Joi.string().regex(mongodbIdPattern).required()
        });

        const {error} = getByIdSchema.validate(req.params);

        if(error){
            return next(error);
        }
        const {id} = req.params;
        let blog;
        try{
            blog = await Blog.findOne({_id:id}).populate('author');
        }
        catch(error){
            return next(error);
        }
        const blogDto = new BlogDetailDTO(blog);

        return res.status(200).json({blog:blogDto});
    },
    async update(req,res,next){
        const updateBlogSchema = Joi.object({
            title:Joi.string().required(),
            content: Joi.string().required(),
            blogId: Joi.string().regex(mongodbIdPattern).required(),
            author:Joi.string().regex(mongodbIdPattern).required(),
            photo: Joi.string()
        })

        const {error} = updateBlogSchema.validate(req.body);
        if(error){
            return next(error);
        }

        const {title,content,author,blogId,photo} = req.body;
        let blog;
        try{    
            blog = await Blog.findOne({_id:blogId});
        }
        catch(error){
            return next(error);
        }
        if(photo){
            let prevPhoto = blog.photoPath;
            prevPhoto = prevPhoto.split('/').at(-1); //getting the file name from photoPath

            //delete photo
            fs.unlinkSync(`storage/${prevPhoto}`);

            //Buffering
            const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg\jpeg);base64,/ , ''),"base64");

            const imagePath = `${Date.now()}-${author}.png`;
            try{
                fs.writeFileSync(`storage/${imagePath}`,buffer);
            }
            catch(error){
                return next(error);
            }
            
            try{
                await Blog.updateOne({_id:blogId},{
                    title,
                    content,
                    photoPath:`${BACKEND_SERVER_PATH}/storage/${imagePath}`
                });

            }
            catch(error){
                return next(error);
            }
        }

        else{
            try{
                await Blog.updateOne({_id:blogId},{
                    content,
                    title
                });
            }
            catch(error){
                return next(error);
            }
        }

        //extra work
        const updatedBlog = await Blog.findOne({_id:blogId});
        
        const blogDto = new BlogDTO(updatedBlog);

        return res.status(200).json({blog:blogDto});

    },
    async delete(req,res,next){
        //1. Validate id using Joi
        //2. Delete Blog
        //3. Delete Comment

        const deleteBlogSchema = Joi.object({
            id: Joi.string().regex(mongodbIdPattern).required()
        })

        const {error} = deleteBlogSchema.validate(req.params);

        if(error){
            return next(error);
        }

        const {id} = req.params;

        try{
            await Blog.deleteOne({_id:id});
            await Comment.deleteMany({blog:id});
        }
        catch(error){
            return next(error);
        }

        return res.status(200).json({message:"Blog Deleted"});
    },

};

module.exports = blogController;