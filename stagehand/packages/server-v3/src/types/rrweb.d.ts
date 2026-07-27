export interface Node {
    type: string;
    tagName?: string;
    attributes?: Record<string, string>;
    childNodes?: Node[];
    textContent?: string;
    id: number;
}
export interface Event {
    type: number;
    data: {
        node: Node;
    };
    sessionId?: string;
    timestamp: Date;
    actionId: string;
}
