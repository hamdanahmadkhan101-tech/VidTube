class apiResponse{
    constructor(statusCode, message="Success", data=null){
        this.statusCode = statusCode;
        this.message = message;
        this.success = statusCode < 400;
        this.error = [];
        this.data = data;
    }
}

export default apiResponse;