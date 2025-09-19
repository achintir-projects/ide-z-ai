'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, Bot, User, Volume2, VolumeX } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ConversationDialogProps {
  messages: Array<{role: string, content: string}>
  onSendMessage: (message: string) => void
  onVoiceResponse: (text: string) => void
  isProcessing?: boolean
  voiceEnabled?: boolean
}

export default function ConversationDialog({ 
  messages, 
  onSendMessage, 
  onVoiceResponse,
  isProcessing = false,
  voiceEnabled = true
}: ConversationDialogProps) {
  const [inputMessage, setInputMessage] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle sending a message
  const handleSend = () => {
    if (!inputMessage.trim() || isProcessing) return
    
    onSendMessage(inputMessage.trim())
    setInputMessage('')
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Speak text using Web Speech API
  const speakText = async (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) {
      toast({
        title: "Speech Not Supported",
        description: "Your browser doesn't support text-to-speech",
        variant: "destructive"
      })
      return
    }

    try {
      // Stop any current speech
      window.speechSynthesis.cancel()
      
      setIsSpeaking(true)
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      utterance.onend = () => {
        setIsSpeaking(false)
      }
      
      utterance.onerror = () => {
        setIsSpeaking(false)
        toast({
          title: "Speech Error",
          description: "Failed to speak the text",
          variant: "destructive"
        })
      }
      
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      setIsSpeaking(false)
      console.error('Speech synthesis error:', error)
    }
  }

  // Speak the last assistant message
  const speakLastResponse = () => {
    const lastAssistantMessage = messages
      .slice()
      .reverse()
      .find(msg => msg.role === 'assistant')
    
    if (lastAssistantMessage) {
      speakText(lastAssistantMessage.content)
    }
  }

  return (
    <Card className="w-full h-96 flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Conversation
        </CardTitle>
        <CardDescription>
          Chat with AI to refine your app requirements
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2 bg-gray-50 rounded-lg">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Start a conversation to refine your app requirements</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                    <span className="text-xs font-medium opacity-75">
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Controls */}
        <div className="flex items-center gap-2 mb-3">
          {voiceEnabled && messages.some(m => m.role === 'assistant') && (
            <Button
              onClick={speakLastResponse}
              disabled={isSpeaking || isProcessing}
              variant="outline"
              size="sm"
            >
              {isSpeaking ? (
                <><VolumeX className="mr-2 h-4 w-4" /> Stop</>
              ) : (
                <><Volume2 className="mr-2 h-4 w-4" /> Speak Response</>
              )}
            </Button>
          )}
          
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              AI is thinking...
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or question..."
            className="min-h-[60px] resize-none"
            disabled={isProcessing}
          />
          
          <div className="flex gap-2">
            <Button
              onClick={handleSend}
              disabled={!inputMessage.trim() || isProcessing}
              className="flex-1"
            >
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
            
            {voiceEnabled && (
              <Button
                onClick={() => speakText(inputMessage)}
                disabled={!inputMessage.trim() || isSpeaking || isProcessing}
                variant="outline"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}