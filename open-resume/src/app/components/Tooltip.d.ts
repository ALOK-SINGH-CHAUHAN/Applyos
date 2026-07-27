/**
 * A simple Tooltip component that shows tooltip text center below children on hover and on focus
 *
 * @example
 * <Tooltip text="Tooltip Text">
 *   <div>Hello</div>
 * </Tooltip>
 */
export declare const Tooltip: ({ text, children, }: {
    text: string;
    children: React.ReactNode;
}) => import("react").JSX.Element;
