import { SignUp } from '@clerk/nextjs';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getI18nPath } from '@/utils/Helpers';
export async function generateMetadata(props) {
    const { locale } = await props.params;
    const t = await getTranslations({
        locale,
        namespace: 'SignUp',
    });
    return {
        title: t('meta_title'),
        description: t('meta_description'),
    };
}
export default async function SignUpPage(props) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    return <SignUp path={getI18nPath('/sign-up', locale)}/>;
}
