export class ResponseErrorClass {
    
    status_code: number
    status_message: string
    success: boolean
    
    constructor(status: number, message: string) {
        this.status_code = status
        this.status_message = message
        this.success = status === 200
    }
}