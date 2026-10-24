import type { Plugin, ViteDevServer, PreviewServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { parseExpenseWithGemini } from './geminiService.ts';

/**
 * Ensures root .env / .env.local file is read server-side into process.env
 * without exposing secrets to frontend client bundles.
 * Never prints or logs the key value.
 */
export function ensureServerEnvLoaded(cwd: string = process.cwd()): void {
  if (process.env.GEMINI_API_KEY) return;

  const envFiles = ['.env.local', '.env'];
  for (const filename of envFiles) {
    const filePath = path.resolve(cwd, filename);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            // Remove surrounding quotes if present
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.slice(1, -1);
            }
            if (key === 'GEMINI_API_KEY' && !process.env.GEMINI_API_KEY && val) {
              process.env.GEMINI_API_KEY = val;
            } else if (key === 'GOOGLE_API_KEY' && !process.env.GOOGLE_API_KEY && val) {
              process.env.GOOGLE_API_KEY = val;
            }
          }
        }
      } catch {
        // Silently ignore file read error
      }
    }
  }
}

/**
 * Reads the request body from an IncomingMessage as a JSON string
 */
function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Protect against overly large payloads (limit to 64KB)
      if (body.length > 65536) {
        reject(new Error('Payload Too Large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', (err) => reject(err));
  });
}

/**
 * Node request handler for /api/gemini/parse-expense
 */
export async function handleGeminiApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  // Ensure server-side environment variables from root .env are loaded before handling
  ensureServerEnvLoaded();

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, errorType: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' }));
    return;
  }

  try {
    const rawBody = await readRequestBody(req);
    let prompt = '';

    if (rawBody.trim()) {
      try {
        const parsed = JSON.parse(rawBody);
        prompt = typeof parsed.prompt === 'string' ? parsed.prompt : '';
      } catch {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          success: false,
          errorType: 'EMPTY_PROMPT',
          message: 'Invalid JSON payload received in request.',
        }));
        return;
      }
    }

    const result = await parseExpenseWithGemini(prompt);

    res.setHeader('Content-Type', 'application/json');
    if (!result.success) {
      if (result.errorType === 'EMPTY_PROMPT') {
        res.statusCode = 400;
      } else if (result.errorType === 'API_KEY_MISSING' || result.errorType === 'SERVICE_UNAVAILABLE') {
        res.statusCode = 503;
      } else if (result.errorType === 'RATE_LIMIT') {
        res.statusCode = 429;
      } else {
        res.statusCode = 502;
      }
    } else {
      res.statusCode = 200;
    }

    res.end(JSON.stringify(result));
  } catch (err: unknown) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      errorType: 'API_ERROR',
      message: err instanceof Error ? err.message : 'Internal Server Error',
    }));
  }
}

/**
 * Vite plugin that provides the server-side /api/gemini/parse-expense endpoint
 * for both `vite` (dev) and `vite preview`.
 * Runs strictly on the server; the GEMINI_API_KEY is NEVER exposed to the browser.
 */
export function geminiServerPlugin(): Plugin {
  const attachMiddleware = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use(async (req, res, next) => {
      const url = req.url?.split('?')[0];
      if (url === '/api/gemini/parse-expense') {
        await handleGeminiApiRequest(req, res);
        return;
      }
      next();
    });
  };

  return {
    name: 'gemini-server-plugin',
    configureServer(server) {
      ensureServerEnvLoaded();
      attachMiddleware(server);
    },
    configurePreviewServer(server) {
      ensureServerEnvLoaded();
      attachMiddleware(server);
    },
  };
}
