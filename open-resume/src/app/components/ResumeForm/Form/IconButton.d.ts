export declare const ShowIconButton: ({ show, setShow, }: {
    show: boolean;
    setShow: (show: boolean) => void;
}) => import("react").JSX.Element;
type MoveIconButtonType = "up" | "down";
export declare const MoveIconButton: ({ type, size, onClick, }: {
    type: MoveIconButtonType;
    size?: "small" | "medium";
    onClick: (type: MoveIconButtonType) => void;
}) => import("react").JSX.Element;
export declare const DeleteIconButton: ({ onClick, tooltipText, }: {
    onClick: () => void;
    tooltipText: string;
}) => import("react").JSX.Element;
export declare const BulletListIconButton: ({ onClick, showBulletPoints, }: {
    onClick: (newShowBulletPoints: boolean) => void;
    showBulletPoints: boolean;
}) => import("react").JSX.Element;
export {};
