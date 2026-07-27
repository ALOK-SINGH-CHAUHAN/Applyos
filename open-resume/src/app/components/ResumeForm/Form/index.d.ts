import { ShowForm } from "lib/redux/settingsSlice";
/**
 * BaseForm is the bare bone form, i.e. just the outline with no title and no control buttons.
 * ProfileForm uses this to compose its outline.
 */
export declare const BaseForm: ({ children, className, }: {
    children: React.ReactNode;
    className?: string;
}) => import("react").JSX.Element;
export declare const Form: ({ form, addButtonText, children, }: {
    form: ShowForm;
    addButtonText?: string;
    children: React.ReactNode;
}) => import("react").JSX.Element;
export declare const FormSection: ({ form, idx, showMoveUp, showMoveDown, showDelete, deleteButtonTooltipText, children, }: {
    form: ShowForm;
    idx: number;
    showMoveUp: boolean;
    showMoveDown: boolean;
    showDelete: boolean;
    deleteButtonTooltipText: string;
    children: React.ReactNode;
}) => import("react").JSX.Element;
