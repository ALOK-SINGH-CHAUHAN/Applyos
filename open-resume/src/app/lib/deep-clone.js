"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepClone = void 0;
/**
 * Server side object deep clone util using JSON serialization.
 * Not efficient for large objects but good enough for most use cases.
 *
 * Client side can simply use structuredClone.
 */
const deepClone = (object) => JSON.parse(JSON.stringify(object));
exports.deepClone = deepClone;
