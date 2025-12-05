import { useState } from 'react'
import { TopBar, ChatPanel, InputPanel } from './lib/components'
import { api, playAudio } from './services'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!inputText.trim() || loading) return

    const userMessage: Message = { role: 'user', content: inputText }
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setLoading(true)

    try {
      // Call API
      const response = await api.chat(inputText)
      
      // Add AI response
      const aiMessage: Message = { role: 'assistant', content: response.text }
      setMessages(prev => [...prev, aiMessage])
      
      // Play audio
      await playAudio(response.audio, response.sample_rate)
      
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = { 
        role: 'assistant', 
        content: 'Sorry, something went wrong. Please try again.' 
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-purple-800 bg-200 animate-gradient-shift">
      <div className="container mx-auto h-screen flex flex-col p-6 gap-4">
        <TopBar isLoading={loading} />
        <ChatPanel messages={messages} />
        <InputPanel 
          value={inputText}
          onChange={setInputText}
          onSend={handleSend}
          disabled={loading}
        />
      </div>
    </div>
  )
}

export default App
