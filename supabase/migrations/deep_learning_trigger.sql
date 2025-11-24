-- Enable pg_net extension for webhooks
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create Trigger Function to call Edge Function
CREATE OR REPLACE FUNCTION trigger_process_chat_deep()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger for assistant messages (AI replies)
    IF NEW.role = 'assistant' THEN
        PERFORM net.http_post(
            url := 'https://xcwlvoqccyxnldyznxln.supabase.co/functions/v1/processChatDeep',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.header.apikey') || '"}',
            body := json_build_object(
                'type', TG_OP,
                'table', TG_TABLE_NAME,
                'record', row_to_json(NEW)
            )::jsonb
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger on messages table
DROP TRIGGER IF EXISTS on_ai_reply_deep_learning ON messages;

CREATE TRIGGER on_ai_reply_deep_learning
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION trigger_process_chat_deep();
