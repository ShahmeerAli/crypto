class BlogDTO {
    constructor(blog){
        this.id = blog.id;
        this.title=blog.title;
        this.author=blog.author;
        this.content=blog.content;
        this.photoPath=blog.photoPath;
    }
}

module.exports = BlogDTO;