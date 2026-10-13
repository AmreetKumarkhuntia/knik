-- conversations.total_tokens was not written for a while; rebuild it from the usage saved on each assistant message.
-- It only ever raises a total, so it is safe to re-run and keeps counts older code wrote for messages without usage.
UPDATE conversations c
SET total_tokens = s.total
FROM (
    SELECT conversations.id, SUM(COALESCE((m -> 'metadata' -> 'usage' ->> 'total_tokens')::numeric, 0)) AS total
    FROM conversations, jsonb_array_elements(conversations.messages) AS m
    WHERE m ->> 'role' = 'assistant'
    GROUP BY conversations.id
) s
WHERE c.id = s.id AND COALESCE(c.total_tokens, 0) < s.total;
