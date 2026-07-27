import { NextIntlClientProvider } from 'next-intl';
import messages from '@/locales/en.json';
import { BaseTemplate } from './BaseTemplate';
const meta = {
    title: 'Example/BaseTemplate',
    component: BaseTemplate,
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [
        (Story) => (<NextIntlClientProvider locale="en" messages={messages}>
        <Story />
      </NextIntlClientProvider>),
    ],
};
export default meta;
export const BaseWithReactComponent = {
    args: {
        children: <div>Children node</div>,
        leftNav: (<>
        <li>Link 1</li>
        <li>Link 2</li>
      </>),
    },
};
export const BaseWithString = {
    args: {
        ...BaseWithReactComponent.args,
        children: 'String',
    },
};
