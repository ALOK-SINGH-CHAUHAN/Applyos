export default function GlobalError(props: {
    error: Error & {
        digest?: string;
    };
}): import("react").JSX.Element;
