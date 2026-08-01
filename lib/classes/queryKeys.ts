/** Chave única compartilhada entre o prefetch do servidor e o useQuery do chat. */
export const classChatMessagesQueryKey = (classId: string) => ["classes", classId, "chat"] as const;
