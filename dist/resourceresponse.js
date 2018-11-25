"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const response_1 = require("./response");
class ResourceResponse extends response_1.GenericResponse {
    constructor(scenario, url, response) {
        super(scenario, url, response);
        this.status().between(200, 299);
    }
}
exports.ResourceResponse = ResourceResponse;
