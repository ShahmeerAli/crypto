class CommentDTO {
    constructor(comment){
        this.content= comment.content,
        this._id= comment._id,
        this.authorUsername = comment.author.username,
        this.createdAt = comment.createdAt
    }
}

module.exports= CommentDTO;