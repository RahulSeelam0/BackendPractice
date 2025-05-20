class ApiError extends Error{
    constructor(sttusCode, message = "Something went wrong",errors=[],stack=""){
        super(message);
        this.statusCode = this.statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if(stack){
            this.stack = stack;
        }else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export{ApiError}