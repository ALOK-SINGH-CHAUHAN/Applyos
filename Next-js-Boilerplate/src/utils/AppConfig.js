import { enUS, frFR } from '@clerk/localizations';
/** Locale prefix strategy for next-intl routing. */
const localePrefix = 'as-needed';
// FIXME: Customize this configuration for your product
/** Centralized application configuration */
export const AppConfig = {
    name: 'Nextjs Starter',
    i18n: {
        locales: ['en', 'fr'],
        defaultLocale: 'en',
        localePrefix,
    },
};
const supportedLocales = {
    en: enUS,
    fr: frFR,
};
export const ClerkLocalizations = {
    defaultLocale: enUS,
    supportedLocales,
};
