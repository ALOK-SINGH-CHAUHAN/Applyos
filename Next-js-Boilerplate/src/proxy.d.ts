import type { NextFetchEvent, NextRequest } from 'next/server';
export default function proxy(request: NextRequest, event: NextFetchEvent): Promise<any>;
export declare const config: {
    matcher: string;
};
