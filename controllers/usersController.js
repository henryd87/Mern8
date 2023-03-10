const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler') //stop using so many try/catch 
const bcrypt = require('bcrypt') //hash the password, don't save a plain text password


// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req,res) =>{
    const users = await User.find().select('-password').lean() //stops from getting a long document
    if (!users?.length){ //does this have any length, says !false because there's no length
        return res.status(400).json({message:"No users found"})
    }
    res.json(users)
})
// @desc Create the user
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req,res) =>{
    const {username, password, roles} = req.body
    if(!username || !password || !Array.isArray(roles) || !roles.length){
        return res.status(400).json({message:"All fields are required"})
    }
    // Check for duplicate
    const duplicate = await User.findOne({username}).lean().exec()
    if(duplicate){
        return res.status(409).json({message:"duplicate username"}) //conflict
    }
    const hashedPwd = await bcrypt.hash(password,10) //salt rounds, make shash unpredictable
    const userObject = {username, "password": hashedPwd,roles}
    //create and store new user
    const user = await User.create(userObject)
    if(user){
        res.status(201).json({message:`New user ${username} created`})
    }else{
        res.status(400).json({message:"Invalid user data received"})
    }
})
// @desc Update the user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req,res) =>{
    const {id,username, roles, active, password} = req.body
    //confirm data
    if(!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean'){
        return res.status(400).json({message:"All fields are required"})
    }
    const user = await User.findById(id).exec()
    if(!user){
        return res.status(400).json({message:"User not found"})
    }
    //check for duplicate
    const duplicate = await User.findOne({username}).lean().exec
    //Allow updates to the original user
    if(duplicate && duplicate?.id.toString() !== id){ //problem
        return res.status(409).json({message:'Duplicate username'})
    }
    user.username = username
    user.roles = roles
    user.active = active

    if(password){
        //hashing password
        user.password = await bcrypt.hash(password,10)
    }
    const updatedUser = await user.save()
    res.json({message: `${updatedUser.username} updated`})

})
// @desc Delete the user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req,res) =>{
    const {id} = req.body
    if (!id) {
        return res.status(400).json({message:'User ID required'})
    }
    const note = await Note.findOne({user: id}).lean().exec()
    if (note?.legnth){
        return res.status(400).json({message:"User has assigned notes"})
    }
    const user = await User.findById(id).exec()

    if(!user){
        return res.status(400).json({message:"User not found"})
    }
    const result = await user.deleteOne(); //user deleted but the result will hold the deleted user's info

    const reply = `Username ${result.username} with ID ${result._id} deleted`;
    res.json(reply);
})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}