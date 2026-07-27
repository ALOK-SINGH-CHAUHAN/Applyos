type ReactButtonProps = React.ComponentProps<"button">;
type ReactAnchorProps = React.ComponentProps<"a">;
type ButtonProps = ReactButtonProps | ReactAnchorProps;
export declare const Button: (props: ButtonProps) => import("react").JSX.Element;
export declare const PrimaryButton: ({ className, ...props }: ButtonProps) => import("react").JSX.Element;
type IconButtonProps = ButtonProps & {
    size?: "small" | "medium";
    tooltipText: string;
};
export declare const IconButton: ({ className, size, tooltipText, ...props }: IconButtonProps) => import("react").JSX.Element;
export {};
