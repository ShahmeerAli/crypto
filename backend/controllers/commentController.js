const Joi = require('joi');
const Comment = require('../models/comment');
const CommentDTO = require('../dto/comment');
const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;

const commentController = {
    async create(req,res,next){
        //1. Validate input
        const createCommentSchema = Joi.object({
            content: Joi.string().required(),
            blog: Joi.string().regex(mongodbIdPattern).required(),
            author: Joi.string().regex(mongodbIdPattern).required()
        });

        const {error} = createCommentSchema.validate(req.body);

        if(error){
            return next(error);
        }

        const {content,author,blog} = req.body;
    
        //2. Store in db
        let comment;
        try{
            comment = new Comment({
                author,
                content,
                blog
            });

            await comment.save();

        }
        catch(error){
            return next(error);
        }
        //3. Send Response
        return res.status(201).json({comment:comment});
    },
    async getAll(req,res,next){
        //1. Get all comments by BlogId
        const getAllByBlogIdSchema = Joi.object({
            blogId: Joi.string().regex(mongodbIdPattern).required()
        });

        const {error} = getAllByBlogIdSchema.validate(req.params);
        if(error){
            return next(error);
        }

        const {blogId} = req.params;
        let comments;
        try{
            comments = await Comment.find({blog:blogId}).populate('author');
        }
        catch(error){
            return next(error);
        }
        //2. Send Reponse
        let commentDto = [];
        try{
            for(let i=0;i<comments.length;i++){
                const dto = new CommentDTO(comments[i]);
                commentDto.push(dto);
            }
        }
        catch(error){
            return next(error);
        }

        return res.status(200).json({data:commentDto});
    }
}

module.exports = commentController;