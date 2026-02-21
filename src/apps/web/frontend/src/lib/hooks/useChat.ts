import { useState } from 'react';
import { streamChat, queueAudio, clearAudioQueue } from '../../services';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface UseChatProps {
    setAudioPlaying: (playing: boolean) => void;
    streamControllerRef: React.MutableRefObject<AbortController | null>;
    success: (msg: string) => void;
    error: (msg: string) => void;
}

export function useChat({
    setAudioPlaying,
    streamControllerRef,
    success,
    error,
}: UseChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleNewChat = () => {
        setMessages([]);
        setInputText('');
    };

    const handleClearHistory = () => {
        setMessages([]);
        success('History cleared!');
    };

    const handleSend = async () => {
        if (!inputText.trim() || loading) return;

        const userMessage: Message = { role: 'user', content: inputText };
        const messageCopy = inputText;
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setLoading(true);

        const assistantMessageIndex = messages.length + 1;
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            clearAudioQueue();
            setAudioPlaying(true);

            let audioChunkCount = 0;

            const controller = await streamChat(messageCopy, {
                onText: (textChunk: string) => {
                    setMessages(prev => {
                        const updated = [...prev];
                        if (updated[assistantMessageIndex]) {
                            updated[assistantMessageIndex] = {
                                ...updated[assistantMessageIndex],
                                content: updated[assistantMessageIndex].content + textChunk,
                            };
                        }
                        return updated;
                    });
                },
                onAudio: (audioBase64: string) => {
                    audioChunkCount++;
                    console.log(`[useChat] Queueing audio chunk ${audioChunkCount}`);
                    queueAudio(audioBase64, 24000);
                },
                onComplete: (count: number) => {
                    console.log(`[useChat] Stream complete: ${count} audio chunks`);
                    setLoading(false);
                    success('Response received!');
                },
                onError: (errorMsg: string) => {
                    console.error('[useChat] Stream error:', errorMsg);
                    error(`Error: ${errorMsg}`);
                    setLoading(false);
                    setAudioPlaying(false);
                },
            });

            streamControllerRef.current = controller;
        } catch (err) {
            console.error('Chat error:', err);
            const errorMsg =
                err instanceof Error ? err.message : 'Something went wrong';
            error(`Error: ${errorMsg}`);

            setMessages(prev => {
                const updated = [...prev];
                if (updated[assistantMessageIndex]) {
                    updated[assistantMessageIndex] = {
                        role: 'assistant',
                        content: 'Sorry, something went wrong. Please try again.',
                    };
                }
                return updated;
            });
            setLoading(false);
            setAudioPlaying(false);
        }
    };

    return {
        messages,
        inputText,
        setInputText,
        loading,
        setLoading,
        handleNewChat,
        handleClearHistory,
        handleSend,
    };
}
