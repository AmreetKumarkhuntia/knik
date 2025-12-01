from typing import List, Dict, Any
from datetime import datetime


class ConversationHistory:
    def __init__(self, max_size: int = 50):
        self.max_size = max_size
        self.entries: List[Dict[str, Any]] = []
    
    def add_entry(self, user_input: str, ai_response: str):
        entry = {
            'timestamp': datetime.now(),
            'user': user_input,
            'assistant': ai_response
        }
        self.entries.append(entry)
        
        if len(self.entries) > self.max_size:
            self.entries = self.entries[-self.max_size:]
    
    def get_context(self, last_n: int = 5) -> str:
        if not self.entries:
            return ""
        
        context_entries = self.entries[-last_n:]
        context_parts = []
        
        for entry in context_entries:
            context_parts.append(f"User: {entry['user']}")
            context_parts.append(f"Assistant: {entry['assistant']}")
        
        return "\n".join(context_parts)
    
    def get_all_entries(self) -> List[Dict[str, Any]]:
        return self.entries.copy()
    
    def clear(self):
        self.entries.clear()
