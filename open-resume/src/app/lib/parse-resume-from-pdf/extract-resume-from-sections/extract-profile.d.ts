import type { ResumeSectionToLines, TextItem } from "lib/parse-resume-from-pdf/types";
export declare const matchOnlyLetterSpaceOrPeriod: (item: TextItem) => any;
export declare const matchEmail: (item: TextItem) => any;
export declare const matchPhone: (item: TextItem) => any;
export declare const matchCityAndState: (item: TextItem) => any;
export declare const matchUrl: (item: TextItem) => any;
export declare const extractProfile: (sections: ResumeSectionToLines) => {
    profile: {
        name: any;
        email: any;
        phone: any;
        location: any;
        url: any;
        summary: any;
    };
    profileScores: {
        name: any;
        email: any;
        phone: any;
        location: any;
        url: any;
        summary: any;
    };
};
