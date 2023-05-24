const mongoose = require('mongoose');
const {MONGODB_CONNECTION_STRING} = require('../config/index');


const dbConnect = async()=>{
    try{
        const con = await mongoose.connect(MONGODB_CONNECTION_STRING);
        console.log(`Database connected to host: ${con.connection.host}`);
    }
    catch(error){
        console.log(`Eroor: ${error}`);
    }
}

module.exports= dbConnect;