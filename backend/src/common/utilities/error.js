export default class AppError extends Error {
    // Trace point: constructor()
    constructor(message, status=400, errors) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
}
