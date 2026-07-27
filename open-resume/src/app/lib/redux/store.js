"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const resumeSlice_1 = __importDefault(require("lib/redux/resumeSlice"));
const settingsSlice_1 = __importDefault(require("lib/redux/settingsSlice"));
exports.store = (0, toolkit_1.configureStore)({
    reducer: {
        resume: resumeSlice_1.default,
        settings: settingsSlice_1.default,
    },
});
