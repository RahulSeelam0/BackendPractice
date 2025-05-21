const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        return Promise.resolve(requestHandler(req, res, next)).catch(next);
    };
};



export{asyncHandler};


// const asyncHandler = (fn) => async (req,res,next)=>{
//     try{
//         await fn(req,res, next)
//     }catch(error){
//         res.status(error.code || 400).json({
//             success : false,
//             message : error.message,
//         });

//     }
// };