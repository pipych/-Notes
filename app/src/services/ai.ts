import { RhymeMessage } from '../types';

export const SYSTEM_INSTRUCTION = "Ты — гениальный поэт и рифмоплет. Твоя задача — подбирать сочные, идеальные и современные рифмы. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать форматирование Markdown (никакого жирного шрифта **, никаких звездочек, заголовков). Запрещено писать любые приветствия, комментарии, вводные или заключительные слова. Выдавай ИСКЛЮЧИТЕЛЬНО нумерованный чистый список рифм (или чистый список ответов по смыслу без разметки и без лишних слов). Каждый пункт списка пиши с новой строки.";

export async function fetchAiRhymes(chatHistory: RhymeMessage[]): Promise<string> {
  const contents = chatHistory.map(m => ({
    role: m.role,
    parts: m.parts,
  }));

  const response = await fetch('/api/rhymes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: SYSTEM_INSTRUCTION,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  let replyText: string = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Не удалось подобрать рифмы, попробуй еще раз.';
  replyText = replyText.replace(/\*\*/g, '').replace(/\*/g, '');
  return replyText;
}

export function parseRhymeItems(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map(line => line.replace(/^\d+[\.\)]\s*/, '').replace(/^[-*•]\s*/, '').trim())
    .filter(line => line.length > 0);
}
