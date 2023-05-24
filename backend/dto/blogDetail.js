class BlogDetailDTO {
    constructor(blog){
        this.id = blog.id;
        this.title=blog.title;
        this.username = blog.author.username;
        this.name = blog.author.name;
        this.createdAt = blog.createdAt;
        this.content=blog.content;
        this.photoPath=blog.photoPath;
    }
}

module.exports = BlogDetailDTO;