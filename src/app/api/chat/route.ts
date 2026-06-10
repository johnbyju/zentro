import { type NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Gemini chat handler
async function chatGemini(
  messages: ChatMessage[],
  systemPrompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Map roles: user stays user, assistant becomes model
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const body: any = {
    contents
  };

  if (systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(`Gemini API returned ${response.status}: ${rawText}`);
  }

  const result = JSON.parse(rawText);
  return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Groq chat handler
async function chatGroq(
  messages: ChatMessage[],
  systemPrompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  const formattedMessages = [];
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }
  messages.forEach(m => {
    formattedMessages.push({ role: m.role, content: m.content });
  });

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      temperature: 0.7
    }),
  });

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(`Groq API returned ${response.status}: ${rawText}`);
  }

  const json = JSON.parse(rawText);
  return json.choices?.[0]?.message?.content || '';
}

// OpenRouter chat handler
async function chatOpenRouter(
  messages: ChatMessage[],
  systemPrompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  const formattedMessages = [];
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }
  messages.forEach(m => {
    formattedMessages.push({ role: m.role, content: m.content });
  });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Zentro'
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      temperature: 0.7
    }),
  });

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(`OpenRouter API returned ${response.status}: ${rawText}`);
  }

  const json = JSON.parse(rawText);
  return json.choices?.[0]?.message?.content || '';
}

export async function POST(request: NextRequest) {
  try {
    const { messages, model, systemPrompt, userKeys } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const targetModel = model || 'gemini-2.5-flash';

    // User-supplied keys ONLY (no fallback to process.env server-side keys to prevent billing)
    const geminiKey     = userKeys?.geminiKey;
    const groqKey       = userKeys?.groqKey;
    const openRouterKey = userKeys?.openrouterKey;

    let responseText = '';

    if (targetModel.startsWith('groq/')) {
      if (!groqKey) {
        throw new Error('No Groq API key found. Add your key via the API Keys button in the header.');
      }
      const actualModel = targetModel.replace('groq/', '');
      responseText = await chatGroq(messages, systemPrompt, groqKey, actualModel);
    } else if (targetModel.startsWith('openrouter/')) {
      if (!openRouterKey) {
        throw new Error('No OpenRouter API key found. Add your key via the API Keys button in the header.');
      }
      // Strip the "openrouter/" routing prefix — OpenRouter expects just "provider/model:variant"
      const actualModel = targetModel.replace('openrouter/', '');
      responseText = await chatOpenRouter(messages, systemPrompt, openRouterKey, actualModel);
    } else {
      if (!geminiKey) {
        throw new Error('No Gemini API key found. Add your key via the API Keys button in the header.');
      }
      responseText = await chatGemini(messages, systemPrompt, geminiKey, targetModel);
    }

    return new Response(JSON.stringify({ text: responseText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[api/chat] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

