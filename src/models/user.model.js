import mongoose, {Schema} from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new Schema({
    username : {
        type: String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true,
    },
    emial : {
        type: String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
    },
    fullname : {
        type: String,
        required : true,
        trim : true,
        index : true,
    },
    avatar : {
        type: String, //cloudinary url
        required : true,
    },
    coverImage : {
        type : String,
    },
    watchHistory : [
        {
        type : Schema.Types.ObjectId,
        ref : 'User',
        }
    ],
    password : {
        type : String,
        required : [true, "Password is a required Field"]
    },
    refreshToken : {
        type : String,
    }
},{timestamps : true});

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}
userSchema.methods.generateAccessTokes = function() {
    return jwt.sign({
        _id : this._id,
        emial: this.emial,
        username : this.username,
        fullname : this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    })
}
userSchema.methods.generateRefreshTokes = function() {
    return jwt.sign({
        _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    })
}
userSchema.methods.generateRefreshTokes = function() {}
export const User = mongoose.model('User', userSchema);