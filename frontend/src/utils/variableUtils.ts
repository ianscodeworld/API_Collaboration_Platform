export const extractVariables = (text: string | null | undefined): string[] => {
    if (!text) return [];
    const regex = /\{\{(.+?)\}\}/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(text)) !== null) {
        matches.add(match[1].trim());
    }
    return Array.from(matches);
};

export const getRequiredVariablesForApi = (apiContent: string): string[] => {
    try {
        const content = JSON.parse(apiContent);
        const vars = new Set<string>();
        
        // Check URL
        extractVariables(content.url).forEach(v => vars.add(v));
        
        // Check Headers
        if (content.headers) {
            content.headers.forEach((h: any) => {
                extractVariables(h.key).forEach(v => vars.add(v));
                extractVariables(h.value).forEach(v => vars.add(v));
            });
        }
        
        // Check Query Params
        if (content.queryParams) {
            content.queryParams.forEach((p: any) => {
                extractVariables(p.key).forEach(v => vars.add(v));
                extractVariables(p.value).forEach(v => vars.add(v));
            });
        }
        
        // Check Body
        if (content.bodyType === 'json' && content.bodyContent) {
            extractVariables(content.bodyContent).forEach(v => vars.add(v));
        }
        
        return Array.from(vars);
    } catch (e) {
        return [];
    }
};
