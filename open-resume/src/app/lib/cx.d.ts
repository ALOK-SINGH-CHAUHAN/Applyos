/**
 * cx is a simple util to join classNames together. Think of it as a simplified version of the open source classnames util
 * Reference: https://dev.to/gugaguichard/replace-clsx-classnames-or-classcat-with-your-own-little-helper-3bf
 *
 * @example
 * cx('px-1', 'mt-2'); // => 'px-1 mt-2'
 * cx('px-1', true && 'mt-2'); // => 'px-1 mt-2'
 * cx('px-1', false && 'mt-2'); // => 'px-1'
 */
export declare const cx: (...classes: Array<string | boolean | undefined>) => string;
