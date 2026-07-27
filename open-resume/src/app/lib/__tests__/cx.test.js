"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cx_1 = require("lib/cx");
test("cx", () => {
    expect((0, cx_1.cx)("px-1", "mt-2")).toEqual("px-1 mt-2");
    expect((0, cx_1.cx)("px-1", true && "mt-2")).toEqual("px-1 mt-2");
    expect((0, cx_1.cx)("px-1", false && "mt-2")).toEqual("px-1");
});
