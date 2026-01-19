export interface ParsedCurl {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export function parseCurl(curlCommand: string): ParsedCurl {
  const result: ParsedCurl = {
    method: 'GET',
    url: '',
    headers: {},
  };

  // 1. Pre-process: Handle line continuations and identify platform
  const normalizedText = curlCommand.replace(/\r?\n/g, ' ');
  const isPowerShell = normalizedText.includes('Invoke-WebRequest') || normalizedText.includes(' iwr ');
  const isCMD = normalizedText.includes('curl ^"') || normalizedText.includes('curl ^%');

  let fullCommand = '';
  if (isPowerShell) {
      fullCommand = curlCommand.replace(/`\r?\n/g, ' ').trim();
  } else if (isCMD) {
      fullCommand = curlCommand.replace(/\^\r?\n/g, ' ').trim();
      // CMD specific: replace caret escapes (do it twice for things like ^\^")
      fullCommand = fullCommand.replace(/\^(.)/g, '$1').replace(/\^(.)/g, '$1');
  } else {
      fullCommand = curlCommand.replace(/\\[\r?\n]/g, ' ').trim();
  }

  // 2. Handle PowerShell Invoke-WebRequest / iwr
  if (isPowerShell) {
    const cmdStart = Math.max(fullCommand.indexOf('Invoke-WebRequest'), fullCommand.indexOf('iwr '));
    const cmd = fullCommand.substring(cmdStart);

    const uriMatch = cmd.match(/-Uri\s+["']?([^"'\s]+)["']?/i);
    if (uriMatch) result.url = uriMatch[1];

    const methodMatch = cmd.match(/-Method\s+["']?(\w+)["']?/i);
    if (methodMatch) result.method = methodMatch[1].toUpperCase();

    const headersMatch = cmd.match(/-Headers\s+@\{([\s\S]+?)\}/i);
    if (headersMatch) {
      const headerBlock = headersMatch[1];
      const pairRegex = /["']?([^"'\s=]+)["']?\s*=\s*["']?([^"'\r\n]+)["']?/g;
      let pair;
      while ((pair = pairRegex.exec(headerBlock)) !== null) {
        result.headers[pair[1].trim()] = pair[2].trim().replace(/`"/g, '"');
      }
    }

    const bodyMatch = cmd.match(/-Body\s+["']([\s\S]+?)["'](?:\s+|$)/i);
    if (bodyMatch) {
        result.body = bodyMatch[1].replace(/`"/g, '"').replace(/`n/g, '\n').replace(/`r/g, '\r');
    }
    return result;
  }

  // 3. Handle cURL (Bash and Unescaped CMD)
  const tokens: string[] = [];
  let currentToken = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < fullCommand.length; i++) {
      const char = fullCommand[i];
      if ((char === '"' || char === "'") && (i === 0 || fullCommand[i-1] !== '\\')) {
          if (inQuotes && char === quoteChar) {
              inQuotes = false;
          } else if (!inQuotes) {
              inQuotes = true;
              quoteChar = char;
          }
      } else if (char === ' ' && !inQuotes) {
          if (currentToken) tokens.push(currentToken);
          currentToken = '';
      } else {
          currentToken += char;
      }
  }
  if (currentToken) tokens.push(currentToken);

  // Parse Tokens
  for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const cleanT = t.replace(/^["']|["']$/g, '');

      if (cleanT === '-X' || cleanT === '--request') {
          result.method = tokens[++i].replace(/^["']|["']$/g, '').toUpperCase();
      } else if (cleanT === '-H' || cleanT === '--header') {
          let header = tokens[++i].replace(/^["']|["']$/g, '');
          header = header.replace(/\\"/g, '"'); // Handle CMD style escapes
          const sepIndex = header.indexOf(':');
          if (sepIndex !== -1) {
              result.headers[header.substring(0, sepIndex).trim()] = header.substring(sepIndex + 1).trim();
          }
      } else if (cleanT === '-d' || cleanT === '--data' || cleanT === '--data-raw' || cleanT === '--data-binary') {
          let body = tokens[++i];
          if (body.startsWith('"') || body.startsWith("'")) {
              body = body.slice(1, -1);
          }
          result.body = body.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          result.method = 'POST';
      } else if ((cleanT.startsWith('http') || cleanT.startsWith('localhost')) && !result.url) {
          result.url = cleanT;
      }
  }

  // Fallback for URL if not found via token prefix
  if (!result.url && tokens.length > 1) {
      for (let i = 1; i < tokens.length; i++) {
          const t = tokens[i].replace(/^["']|["']$/g, '');
          if (!t.startsWith('-') && !tokens[i-1].startsWith('-') && t !== 'curl') {
              result.url = t;
              break;
          }
      }
  }

  return result;
}
