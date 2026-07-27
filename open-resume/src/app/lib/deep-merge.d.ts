type Object = {
    [key: string]: any;
};
/**
 * Deep merge two objects by overriding target with fields in source.
 * It returns a new object and doesn't modify any object in place since
 * it deep clones the target object first.
 */
export declare const deepMerge: (target: Object, source: Object, level?: number) => Object;
export {};
