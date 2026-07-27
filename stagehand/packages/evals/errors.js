export class EvalsError extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = "EvalsError";
    }
}
