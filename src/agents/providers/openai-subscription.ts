import { createOpenAI } from '@ai-sdk/openai';

const accessToken = process.env.OPENAI_OAUTH_ACCESS_TOKEN;

export const openai = createOpenAI({
  apiKey: 'oauth-token-supplied-by-fetch',
  fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    if (process.env.CHATGPT_ACCOUNT_ID) {
      headers.set('ChatGPT-Account-Id', process.env.CHATGPT_ACCOUNT_ID);
    }
    headers.set('originator', 'opencode');
    const url = new URL(input instanceof Request ? input.url : input.toString());
    if (url.pathname.endsWith('/responses')) {
      return fetch('https://chatgpt.com/backend-api/codex/responses', {
        ...init,
        headers
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Codex ${response.status}: ${await response.text()}`);
        }
        return response;
      });
    }
    return fetch(input, { ...init, headers });
  }
});
