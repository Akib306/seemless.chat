-- Create function to update chat updated_at when message is inserted
CREATE OR REPLACE FUNCTION update_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the chat's updated_at field to current timestamp
  UPDATE chats 
  SET updated_at = NOW() 
  WHERE id = NEW.chat_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update chat's updated_at when a message is inserted
CREATE TRIGGER messages_update_chat_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_updated_at();