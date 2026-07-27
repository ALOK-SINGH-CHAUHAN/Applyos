/**
 * Hook to autosize textarea height.
 *
 * The trick to resize is to first set its height to 0 and then set it back to scroll height.
 * Reference: https://stackoverflow.com/a/25621277/7699841
 *
 * @example // Tailwind CSS
 * const textareaRef = useAutosizeTextareaHeight({ value });
 * <textarea ref={textareaRef} className="resize-none overflow-hidden"/>
 */
export declare const useAutosizeTextareaHeight: ({ value }: {
    value: string;
}) => import("react").RefObject<HTMLTextAreaElement>;
