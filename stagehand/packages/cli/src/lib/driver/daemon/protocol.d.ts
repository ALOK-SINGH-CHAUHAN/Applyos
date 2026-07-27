import { z } from "zod";
export declare const OpenRequestSchema: z.ZodObject<{
    id: z.ZodString;
    forwardedEnv: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    type: z.ZodLiteral<"open">;
    timeoutMs: z.ZodOptional<z.ZodNumber>;
    url: z.ZodString;
    waitUntil: z.ZodOptional<z.ZodEnum<{
        load: "load";
        domcontentloaded: "domcontentloaded";
        networkidle: "networkidle";
    }>>;
}, z.core.$strip>;
export declare const CommandRequestSchema: z.ZodObject<{
    id: z.ZodString;
    forwardedEnv: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    command: z.ZodEnum<{
        type: "type";
        fill: "fill";
        is: "is";
        viewport: "viewport";
        select: "select";
        get: "get";
        cursor: "cursor";
        key: "key";
        wait: "wait";
        open: "open";
        back: "back";
        click: "click";
        eval: "eval";
        forward: "forward";
        highlight: "highlight";
        "mouse.click": "mouse.click";
        "mouse.drag": "mouse.drag";
        "mouse.hover": "mouse.hover";
        "mouse.scroll": "mouse.scroll";
        "network.clear": "network.clear";
        "network.off": "network.off";
        "network.on": "network.on";
        "network.path": "network.path";
        reload: "reload";
        screenshot: "screenshot";
        snapshot: "snapshot";
        "tab.close": "tab.close";
        "tab.list": "tab.list";
        "tab.new": "tab.new";
        "tab.switch": "tab.switch";
        upload: "upload";
    }>;
    params: z.ZodOptional<z.ZodUnknown>;
    type: z.ZodLiteral<"command">;
}, z.core.$strip>;
export declare const StatusRequestSchema: z.ZodObject<{
    id: z.ZodString;
    forwardedEnv: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    type: z.ZodLiteral<"status">;
}, z.core.$strip>;
export declare const StopRequestSchema: z.ZodObject<{
    id: z.ZodString;
    forwardedEnv: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    type: z.ZodLiteral<"stop">;
}, z.core.$strip>;
export declare const RequestSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    id: z.ZodString;
    forwardedEnv: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    type: z.ZodLiteral<"open">;
    timeoutMs: z.ZodOptional<z.ZodNumber>;
    url: z.ZodString;
    waitUntil: z.ZodOptional<z.ZodEnum<{
        load: "load";
        domcontentloaded: "domcontentloaded";
        networkidle: "networkidle";
    }>>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    forwardedEnv: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    command: z.ZodEnum<{
        type: "type";
        fill: "fill";
        is: "is";
        viewport: "viewport";
        select: "select";
        get: "get";
        cursor: "cursor";
        key: "key";
        wait: "wait";
        open: "open";
        back: "back";
        click: "click";
        eval: "eval";
        forward: "forward";
        highlight: "highlight";
        "mouse.click": "mouse.click";
        "mouse.drag": "mouse.drag";
        "mouse.hover": "mouse.hover";
        "mouse.scroll": "mouse.scroll";
        "network.clear": "network.clear";
        "network.off": "network.off";
        "network.on": "network.on";
        "network.path": "network.path";
        reload: "reload";
        screenshot: "screenshot";
        snapshot: "snapshot";
        "tab.close": "tab.close";
        "tab.list": "tab.list";
        "tab.new": "tab.new";
        "tab.switch": "tab.switch";
        upload: "upload";
    }>;
    params: z.ZodOptional<z.ZodUnknown>;
    type: z.ZodLiteral<"command">;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    forwardedEnv: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    type: z.ZodLiteral<"status">;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    forwardedEnv: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    type: z.ZodLiteral<"stop">;
}, z.core.$strip>], "type">;
export declare const SuccessResponseSchema: z.ZodObject<{
    data: z.ZodUnknown;
    id: z.ZodString;
    type: z.ZodLiteral<"success">;
}, z.core.$strip>;
export declare const ErrorResponseSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    error: z.ZodString;
    httpStatus: z.ZodOptional<z.ZodNumber>;
    id: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"error">;
}, z.core.$strip>;
export declare const ResponseSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    data: z.ZodUnknown;
    id: z.ZodString;
    type: z.ZodLiteral<"success">;
}, z.core.$strip>, z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    error: z.ZodString;
    httpStatus: z.ZodOptional<z.ZodNumber>;
    id: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"error">;
}, z.core.$strip>], "type">;
export type DriverRequest = z.infer<typeof RequestSchema>;
export type DriverResponse = z.infer<typeof ResponseSchema>;
export declare function parseRequest(line: string): DriverRequest;
export declare function serializeResponse(response: DriverResponse): string;
