interface InputProps<K extends string, V extends string> {
    label: string;
    labelClassName?: string;
    name: K;
    value?: V;
    placeholder: string;
    inputStyle?: React.CSSProperties;
    onChange: (name: K, value: V) => void;
}
export declare const InlineInput: <K extends string>({ label, labelClassName, name, value, placeholder, inputStyle, onChange, }: InputProps<K, string>) => import("react").JSX.Element;
export {};
