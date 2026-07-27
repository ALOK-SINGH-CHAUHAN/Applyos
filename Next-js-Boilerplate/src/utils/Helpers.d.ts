/**
 * Resolves the public base URL of the application.
 * @returns The configured public app URL or the local development URL.
 */
export declare const getBaseUrl: () => any;
/**
 * Builds a locale-aware path by prefixing non-default locales.
 * @param url The base application-relative path starting with a slash.
 * @param locale The active locale identifier.
 * @returns The localized path, prefixed when the locale is not the default locale.
 */
export declare const getI18nPath: (url: string, locale: string) => string;
