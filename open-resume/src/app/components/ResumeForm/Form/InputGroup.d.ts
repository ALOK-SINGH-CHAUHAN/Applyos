interface InputProps<K extends string, V extends string | string[]> {
    label: string;
    labelClassName?: string;
    name: K;
    value?: V;
    placeholder: string;
    onChange: (name: K, value: V) => void;
}
/**
 * InputGroupWrapper wraps a label element around a input children. This is preferable
 * than having input as a sibling since it makes clicking label auto focus input children
 */
export declare const InputGroupWrapper: ({ label, className, children, }: {
    label: string;
    className?: string;
    children?: React.ReactNode;
}) => import("react").JSX.Element;
export declare const INPUT_CLASS_NAME = "mt-1 px-3 py-2 block w-full rounded-md border border-gray-300 text-gray-900 shadow-sm outline-none font-normal text-base";
export declare const Input: <K extends string>({ name, value, placeholder, onChange, label, labelClassName, }: InputProps<K, string>) => import("react").JSX.Element;
export declare const Textarea: <T extends string>({ label, labelClassName: wrapperClassName, name, value, placeholder, onChange, }: InputProps<T, string>) => import("react").JSX.Element;
export declare const BulletListTextarea: <T extends string>(props: InputProps<T, string[]> & {
    showBulletPoints?: boolean;
}) => import("react").JSX.Element;
export {};
