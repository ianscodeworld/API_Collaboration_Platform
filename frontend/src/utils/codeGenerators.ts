export const generateCurl = (request: any) => {
    let curl = `curl --location --request ${request.method || 'GET'} '${request.url || ''}'`;
    
    // Headers
    if (request.headers && Array.isArray(request.headers)) {
      request.headers.forEach((h: any) => {
        if (h.key && h.enabled) curl += ` \
--header '${h.key}: ${h.value}'`;
      });
    }

    // Body
    if (request.bodyType === 'json' && request.bodyContent) {
      const escapedBody = request.bodyContent.replace(/'/g, "'\\''");
      curl += ` \
--data-raw '${escapedBody}'`;
    }

    return curl;
};

export const generateJavascript = (request: any) => {
    const headers: Record<string, string> = {};
    if (request.headers && Array.isArray(request.headers)) {
        request.headers.forEach((h: any) => {
            if (h.key && h.enabled) headers[h.key] = h.value;
        });
    }

    let bodyString = '';
    if (request.bodyType === 'json' && request.bodyContent) {
        bodyString = `  body: JSON.stringify(${request.bodyContent}),`;
    }

    return `const myHeaders = new Headers();
${Object.entries(headers).map(([k, v]) => `myHeaders.append("${k}", "${v}");`).join('\n')}

const requestOptions = {
  method: "${request.method || 'GET'}",
  headers: myHeaders,
${bodyString ? bodyString + '\n' : ''}  redirect: "follow"
};

fetch("${request.url || ''}", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.error(error));`;
};

export const generatePython = (request: any) => {
    const headers: Record<string, string> = {};
    if (request.headers && Array.isArray(request.headers)) {
        request.headers.forEach((h: any) => {
            if (h.key && h.enabled) headers[h.key] = h.value;
        });
    }

    let payload = '';
    if (request.bodyType === 'json' && request.bodyContent) {
        // Simple formatting to make it look Pythonic (replacing true/false/null)
        payload = `payload = json.dumps(${request.bodyContent})`; 
    } else {
        payload = "payload = {}";
    }

    return `import requests
import json

url = "${request.url || ''}"

${payload}
headers = {
${Object.entries(headers).map(([k, v]) => `  '${k}': '${v}'`).join(',\n')}
}

response = requests.request("${request.method || 'GET'}", url, headers=headers, data=payload)

print(response.text)`;
};

export const generateJava = (request: any) => {
    // OkHttp style
    const headers = (request.headers || [])
        .filter((h: any) => h.key && h.enabled)
        .map((h: any) => `.addHeader("${h.key}", "${h.value}")`)
        .join('\n  ');

    let body = '';
    if (request.bodyType === 'json' && request.bodyContent) {
        // Escape double quotes for Java string
        const escapedBody = request.bodyContent.replace(/"/g, '\\"');
        body = `MediaType mediaType = MediaType.parse("application/json");
    RequestBody body = RequestBody.create(mediaType, "${escapedBody}");`;
    } else {
        // Handle methods that might require body or not
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
             body = `MediaType mediaType = MediaType.parse("text/plain");
    RequestBody body = RequestBody.create(mediaType, "");`;
        }
    }

    return `OkHttpClient client = new OkHttpClient().newBuilder()
  .build();
${body ? body + '\n' : ''}
Request request = new Request.Builder()
  .url("${request.url || ''}")
  .method("${request.method || 'GET'}", ${body ? 'body' : 'null'})
  ${headers}
  .build();
Response response = client.newCall(request).execute();`;
};