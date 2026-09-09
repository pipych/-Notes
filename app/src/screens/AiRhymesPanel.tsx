import React, { useState, useRef, useEffect } from 'react';
import { RhymeMessage } from '../types';
import { parseRhymeItems } from '../services/ai';

interface AiRhymesPanelProps {
  chatHistory: RhymeMessage[];
  isLoading: boolean;
  onSendQuery: (query: string) => void;
  onRhymeSelected: (rhyme: string) => void;
}

export const AiRhymesPanel: React.FC<AiRhymesPanelProps> = ({
  chatHistory,
  isLoading,
  onSendQuery,
  onRhymeSelected,
}) => {
  const [query, setQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleSend = () => {
    const q = query.trim();
    if (!q || isLoading) return;
    setQuery('');
    onSendQuery(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = query.trim().length > 0 && !isLoading;

  return (
    <div className="w-full h-full flex flex-col rounded-[24px] bg-m3-surface-container border border-m3-outline-variant/30 overflow-hidden shadow-2xl select-none">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-m3-outline-variant/20 flex-shrink-0">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C4C7C5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        <span className="font-nunito font-bold text-m3-on-surface text-[15px]">
          Рифмы AI
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
        {chatHistory.length === 0 ? (
          <div className="self-start max-w-[85%] rounded-[16px] rounded-bl-[4px] bg-m3-surface-container-high p-3.5 text-m3-on-surface text-[14px] leading-5 font-nunito shadow">
            Привет! Напиши слово, и я подберу 10 лучших рифм для твоего трека. Нажми на рифму, чтобы добавить её в текст!
          </div>
        ) : (
          chatHistory.map((msg) => {
            const isUser = msg.role === 'user';
            const text = msg.parts[0]?.text || '';

            if (isUser) {
              return (
                <div
                  key={msg.id}
                  className="self-end max-w-[85%] rounded-[16px] rounded-br-[4px] bg-m3-primary-container text-m3-on-primary-container px-3.5 py-2 text-[14px] leading-5 font-nunito font-medium shadow"
                >
                  {text}
                </div>
              );
            }

            const rhymes = parseRhymeItems(text);

            return (
              <div
                key={msg.id}
                className="self-start max-w-[92%] rounded-[16px] rounded-bl-[4px] bg-m3-surface-container-high p-3 text-m3-on-surface text-[14px] font-nunito shadow"
              >
                {rhymes.length <= 1 ? (
                  <div className="leading-5">{text}</div>
                ) : (
                  <div>
                    <div className="text-m3-on-surface-variant text-[12px] font-medium mb-2.5">
                      Нажми на рифму, чтобы вставить в трек:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rhymes.map((rhyme, idx) => (
                        <button
                          key={idx}
                          onClick={() => onRhymeSelected(rhyme)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-m3-surface-container-highest text-m3-on-surface text-[13px] font-nunito font-medium hover:brightness-125 active:scale-95 transition-all focus:outline-none"
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="text-m3-on-surface-variant flex-shrink-0"
                          >
                            <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
                          </svg>
                          <span>{rhyme}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="self-start flex items-center gap-2 rounded-[16px] rounded-bl-[4px] bg-m3-surface-container-high px-3.5 py-2.5 text-m3-on-surface-variant text-[13px] font-nunito">
            <svg
              className="animate-spin w-4 h-4 text-m3-secondary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span>Подбираю рифмы...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="flex items-center gap-2 p-2 bg-m3-surface-container-low border-t border-m3-outline-variant/20 flex-shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напиши слово..."
          className="flex-1 h-11 rounded-full bg-m3-surface-container-highest px-4 text-m3-on-surface placeholder:text-m3-on-surface-variant font-nunito text-[14px] focus:outline-none"
        />

        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all focus:outline-none ${
            canSend
              ? 'bg-m3-primary text-m3-on-primary active:scale-95 shadow'
              : 'bg-m3-surface-container-highest text-m3-on-surface-variant/40 cursor-not-allowed'
          }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
