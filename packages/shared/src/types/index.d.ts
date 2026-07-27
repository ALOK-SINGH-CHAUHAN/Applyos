export interface StructuredResume {
    contact: {
        fullName: string;
        email: string;
        phone?: string;
        location?: string;
        links?: string[];
    };
    summary?: string;
    experience: {
        company: string;
        title: string;
        startDate: string;
        endDate?: string;
        current?: boolean;
        highlights: string[];
    }[];
    education: {
        institution: string;
        degree: string;
        fieldOfStudy?: string;
        graduationYear?: string;
    }[];
    skills: string[];
    projects?: {
        name: string;
        description: string;
        highlights?: string[];
        url?: string;
    }[];
}
export interface ExtractedJobRequirements {
    requiredSkills: string[];
    seniorityLevel: string;
    atsKeywords: string[];
    summary: string;
}
