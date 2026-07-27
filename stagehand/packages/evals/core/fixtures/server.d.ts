type FixtureRoute = {
    path: string;
    html: string;
};
export declare function getCoreFixtureBaseUrl(): string | undefined;
export declare function ensureCoreFixtureServer(routes: FixtureRoute[]): Promise<string>;
export {};
