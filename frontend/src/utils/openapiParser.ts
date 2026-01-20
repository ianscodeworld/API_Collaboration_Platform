export interface ApiDefinitionContent {
    method: string;
    url: string;
    queryParams: any[];
    headers: any[];
    bodyType: string;
    bodyContent: string;
}

export interface ParsedOpenApi {
    title: string;
    content: string;
}

export const parseOpenApi = (json: any): ParsedOpenApi[] => {
    const apis: ParsedOpenApi[] = [];
    const baseUrl = json.servers?.[0]?.url || '';
    const paths = json.paths || {};

    Object.entries(paths).forEach(([path, pathItem]: [string, any]) => {
        Object.entries(pathItem).forEach(([method, operation]: [string, any]) => {
            // Skip non-HTTP methods like 'parameters', 'summary', etc.
            if (!['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method.toLowerCase())) {
                return;
            }

            const queryParams: any[] = [];
            const headers: any[] = [];
            
            // Handle parameters (both in path and operation)
            const allParams = [...(pathItem.parameters || []), ...(operation.parameters || [])];
            allParams.forEach((param: any) => {
                const item = {
                    id: Math.floor(Math.random() * 1000000000),
                    key: param.name || '',
                    value: '',
                    type: 'string',
                    description: param.description || '',
                    enabled: true
                };

                if (param.in === 'query') {
                    queryParams.push(item);
                } else if (param.in === 'header') {
                    headers.push(item);
                }
            });

            // Handle Request Body (JSON only for now)
            let bodyType = 'none';
            let bodyContent = '';
            const requestBody = operation.requestBody;
            if (requestBody && requestBody.content) {
                const jsonContent = requestBody.content['application/json'];
                if (jsonContent) {
                    bodyType = 'json';
                    // If schema exists, we could generate a sample, but for now empty JSON
                    bodyContent = '{}';
                }
            }

            const content: ApiDefinitionContent = {
                method: method.toUpperCase(),
                url: baseUrl + path,
                queryParams,
                headers,
                bodyType,
                bodyContent
            };

            apis.push({
                title: operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`,
                content: JSON.stringify(content)
            });
        });
    });

    return apis;
};
