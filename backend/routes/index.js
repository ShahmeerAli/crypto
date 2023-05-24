const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');
const blogController  = require('../controllers/blogController');
const commentController = require('../controllers/commentController');

const router = express.Router();

//test
router.get('/test',(req,res)=>res.json({msg:'Welcome to TEST page'}));

//routes for user
//register
router.post('/register', authController.register);


//login
router.post('/login', authController.login);



//logout
router.post('/logout', auth, authController.logout);

//refresh for JWT tokens
router.get('/refresh', authController.refresh);


//routes for blog
//CRUD
//create
router.post('/blog',auth, blogController.create);

//read all blogs
router.get('/blog/all',auth, blogController.getAll);

//read blog by Id
router.get('/blog/:id',auth, blogController.getById);

//update
router.put('/blog',auth, blogController.update);

//delete
router.delete('/blog/:id',auth, blogController.delete);


//routes for comment
//create
router.post('/comment',auth,commentController.create);
//read comments by blogId
router.get('/comment/:blogId',auth,commentController.getAll);

module.exports = router;