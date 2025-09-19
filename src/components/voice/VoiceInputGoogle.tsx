'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Volume2, Loader2, Wifi, WifiOff } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import io, { Socket } from 'socket.io-client'

interface VoiceInputGoogleProps {
  onTranscript: (transcript: string) => void
  onRequirementsExtracted: (requirements: any) => void
  onConversationResponse: (response: any) => void
  disabled?: boolean
}

interface ConversationState {
  state: 'idle' | 'listening' | 'processing' | 'responding'
  transcript: string
  requirements: any
  conversationHistory: Array<{role: string, content: string}>
}

export default function VoiceInputGoogle({ 
  onTranscript, 
  onRequirementsExtracted, 
  onConversationResponse, 
  disabled = false 
}: VoiceInputGoogleProps) {
  const [conversationState, setConversationState] = useState<ConversationState>({
    state: 'idle',
    transcript: '',
    requirements: null,
    conversationHistory: []
  })
  
  const [isConnected, setIsConnected] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const socketRef = useRef<Socket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling']
    })

    socketRef.current.on('connect', () => {
      setIsConnected(true)
      toast({
        title: "Voice System Connected",
        description: "Ready to capture your voice input"
      })
    })

    socketRef.current.on('disconnect', () => {
      setIsConnected(false)
      toast({
        title: "Voice System Disconnected",
        description: "Please check your connection",
        variant: "destructive"
      })
    })

    socketRef.current.on('transcription', (data: { transcript: string, isFinal: boolean }) => {
      setConversationState(prev => ({
        ...prev,
        transcript: data.transcript
      }))
      onTranscript(data.transcript)
      
      if (data.isFinal) {
        // Send to processing
        socketRef.current?.emit('process-requirements', {
          transcript: data.transcript,
          history: prev.conversationHistory
        })
      }
    })

    socketRef.current.on('requirements-extracted', (data: any) => {
      setConversationState(prev => ({
        ...prev,
        requirements: data.requirements,
        conversationHistory: [...prev.conversationHistory, { role: 'assistant', content: data.conversationResponse.message }]
      }))
      onRequirementsExtracted(data.requirements)
      onConversationResponse(data.conversationResponse)
    })

    socketRef.current.on('voice-response', (data: { audioData: string, text: string }) => {
      // Play audio response
      const audio = new Audio(`data:audio/mp3;base64,${data.audioData}`)
      audio.play()
      
      setConversationState(prev => ({
        ...prev,
        state: 'idle',
        conversationHistory: [...prev.conversationHistory, { role: 'assistant', content: data.text }]
      }))
    })

    return () => {
      socketRef.current?.disconnect()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [onTranscript, onRequirementsExtracted, onConversationResponse])

  // Initialize audio context and analyser
  const initAudioContext = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      // Start audio level monitoring
      monitorAudioLevel()
    } catch (error) {
      console.error('Error initializing audio context:', error)
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use voice input",
        variant: "destructive"
      })
    }
  }

  // Monitor audio levels for visualization
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    setAudioLevel(average)

    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel)
  }

  // Start voice recording
  const startVoiceInput = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please wait for voice system to connect",
        variant: "destructive"
      })
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Initialize audio context for visualization
      if (!audioContextRef.current) {
        await initAudioContext()
      }

      // Setup media recorder for streaming
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current) {
          socketRef.current.emit('audio-stream', event.data)
        }
      }

      mediaRecorderRef.current.start(100) // Send chunks every 100ms
      
      setConversationState(prev => ({
        ...prev,
        state: 'listening',
        transcript: ''
      }))

      socketRef.current?.emit('start-listening')

      toast({
        title: "Voice Input Active",
        description: "Speak your app idea now..."
      })
    } catch (error) {
      console.error('Error starting voice input:', error)
      toast({
        title: "Microphone Error",
        description: "Failed to access microphone",
        variant: "destructive"
      })
    }
  }

  // Stop voice recording
  const stopVoiceInput = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }

    setConversationState(prev => ({
      ...prev,
      state: 'processing'
    }))

    socketRef.current?.emit('stop-listening')

    toast({
      title: "Processing Voice Input",
      description: "Analyzing your requirements..."
    })
  }

  // Generate app from extracted requirements
  const generateAppFromVoice = () => {
    if (!conversationState.requirements) {
      toast({
        title: "No Requirements",
        description: "Please speak your app idea first",
        variant: "destructive"
      })
      return
    }

    onRequirementsExtracted(conversationState.requirements)
    
    toast({
      title: "Requirements Captured",
      description: "Generating your app based on voice input..."
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Voice-to-App AI
        </CardTitle>
        <CardDescription>
          Speak your app idea and let AI generate it for you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <><Wifi className="h-4 w-4 text-green-500" /><span className="text-sm text-green-600">Connected</span></>
          ) : (
            <><WifiOff className="h-4 w-4 text-red-500" /><span className="text-sm text-red-600">Connecting...</span></>
          )}
        </div>

        {/* Audio Level Visualizer */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-100"
            style={{ width: `${Math.min(audioLevel / 2, 100)}%` }}
          />
        </div>

        {/* Voice Controls */}
        <div className="flex gap-2">
          <Button
            onClick={conversationState.state === 'listening' ? stopVoiceInput : startVoiceInput}
            disabled={!isConnected || disabled || conversationState.state === 'processing'}
            className="flex-1"
            variant={conversationState.state === 'listening' ? "destructive" : "default"}
          >
            {conversationState.state === 'listening' ? (
              <><MicOff className="mr-2 h-4 w-4" /> Stop Recording</>
            ) : (
              <><Mic className="mr-2 h-4 w-4" /> Start Voice Input</>
            )}
          </Button>

          <Button
            onClick={generateAppFromVoice}
            disabled={!conversationState.requirements || disabled}
            variant="outline"
          >
            Generate App
          </Button>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center">
          {conversationState.state === 'listening' && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600">Listening...</span>
            </div>
          )}
          {conversationState.state === 'processing' && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-blue-600">Processing...</span>
            </div>
          )}
        </div>

        {/* Live Transcript */}
        {conversationState.transcript && (
          <Card>
            <CardContent className="p-3">
              <div className="text-sm">
                <strong>Live Transcript:</strong>
                <p className="mt-1 text-gray-600">{conversationState.transcript}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extracted Requirements */}
        {conversationState.requirements && (
          <Card>
            <CardContent className="p-3">
              <div className="space-y-2">
                <strong className="text-sm">Extracted Requirements:</strong>
                <div className="flex flex-wrap gap-1">
                  {conversationState.requirements.platforms?.map((platform: string, index: number) => (
                    <Badge key={index} variant="secondary">{platform}</Badge>
                  ))}
                </div>
                {conversationState.requirements.coreFeatures && (
                  <div className="text-xs text-gray-600">
                    Features: {conversationState.requirements.coreFeatures.join(', ')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversation History */}
        {conversationState.conversationHistory.length > 0 && (
          <Card>
            <CardContent className="p-3">
              <div className="space-y-2">
                <strong className="text-sm">Conversation:</strong>
                {conversationState.conversationHistory.map((msg, index) => (
                  <div key={index} className={`text-xs p-2 rounded ${
                    msg.role === 'user' ? 'bg-blue-50' : 'bg-gray-50'
                  }`}>
                    <strong>{msg.role}:</strong> {msg.content}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}