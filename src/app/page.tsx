'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Download, Sparkles, Code, Smartphone, Monitor, Eye, Settings, Play, Loader2, Mic, MicOff, Volume2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import dynamic from 'next/dynamic'

// Dynamically import voice components to avoid SSR issues
const VoiceInputGoogle = dynamic(() => import('@/components/voice/VoiceInputGoogle'), { ssr: false })
const ConversationDialog = dynamic(() => import('@/components/voice/ConversationDialog'), { ssr: false })
const TranscriptDisplay = dynamic(() => import('@/components/voice/TranscriptDisplay'), { ssr: false })

interface GeneratedApp {
  name: string
  platforms: string[]
  buildCommand: string
  generatedFiles: Array<{
    filename: string
    content: string
    path: string
  }>
  instructions: string
  assumptions: string[]
}

interface BuildStatus {
  platform: string
  status: 'pending' | 'building' | 'completed' | 'failed'
  downloadUrl?: string
  progress: number
}

export default function Home() {
  const [idea, setIdea] = useState('')
  const [platform, setPlatform] = useState<{ web: boolean; android: boolean; ios: boolean }>({ web: false, android: false, ios: false })
  const [buildSystem, setBuildSystem] = useState<'eas' | 'capacitor'>('eas')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedApp, setGeneratedApp] = useState<GeneratedApp | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [buildStatuses, setBuildStatuses] = useState<BuildStatus[]>([])
  const [selectedFile, setSelectedFile] = useState<string>('App.js')
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Complete project proposal', due: 'Due today', completed: false, priority: 'blue' },
    { id: 2, title: 'Review code changes', due: 'Completed', completed: true, priority: 'green' },
    { id: 3, title: 'Team meeting at 2 PM', due: 'High priority', completed: false, priority: 'yellow' }
  ])
  const [newTask, setNewTask] = useState('')
  const [testState, setTestState] = useState('Initial State')
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [voiceRequirements, setVoiceRequirements] = useState<any>(null)
  const [conversationMessages, setConversationMessages] = useState<Array<{role: string, content: string}>>([])
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text')
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Initialize speech synthesis
    synthRef.current = window.speechSynthesis
    
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        setTranscript(finalTranscript + interimTranscript)
        if (finalTranscript) {
          setIdea(prev => prev + finalTranscript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        setIsRecording(false)
        toast({
          title: "Voice Recognition Error",
          description: `Error: ${event.error}`,
          variant: "destructive"
        })
      }

      recognitionRef.current.onend = () => {
        if (isListening) {
          // Restart recognition if we're still supposed to be listening
          recognitionRef.current.start()
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [isListening])

  // Voice control functions
  const startVoiceInput = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Recognition Not Supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive"
      })
      return
    }

    setIsListening(true)
    setIsRecording(true)
    recognitionRef.current.start()
    
    toast({
      title: "Voice Input Activated",
      description: "Speak your app idea now..."
    })
  }

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
    setIsRecording(false)
    
    toast({
      title: "Voice Input Stopped",
      description: "Your speech has been transcribed."
    })
  }

  const speakText = (text: string) => {
    if (!synthRef.current) {
      toast({
        title: "Speech Synthesis Not Supported",
        description: "Your browser doesn't support speech synthesis.",
        variant: "destructive"
      })
      return
    }

    if (synthRef.current.speaking) {
      synthRef.current.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1
    
    synthRef.current.speak(utterance)
  }

  const speakAppSummary = () => {
    if (!generatedApp) return
    
    const summary = `I have generated ${generatedApp.name} for ${generatedApp.platforms.join(', ')}. 
      The app is ready for preview and build. You can download the project files or start building for your selected platforms.`
    
    speakText(summary)
  }

  // Voice-to-App handlers
  const handleVoiceTranscript = (transcript: string) => {
    setVoiceTranscript(transcript)
    setIdea(transcript) // Update the main idea field
  }

  const handleVoiceRequirementsExtracted = (requirements: any) => {
    setVoiceRequirements(requirements)
    
    // Update platform selection based on voice requirements
    if (requirements.platforms) {
      const newPlatform = { ...platform }
      requirements.platforms.forEach((p: string) => {
        if (p === 'web') newPlatform.web = true
        if (p === 'android') newPlatform.android = true
        if (p === 'ios') newPlatform.ios = true
      })
      setPlatform(newPlatform)
    }
  }

  const handleVoiceConversationResponse = (response: any) => {
    setConversationMessages(prev => [...prev, { role: 'assistant', content: response.message }])
    
    // If voice response is available, speak it
    if (voiceEnabled && response.message) {
      speakText(response.message)
    }
  }

  const handleConversationMessage = (message: string) => {
    setConversationMessages(prev => [...prev, { role: 'user', content: message }])
    
    // In a real implementation, this would send to the conversation API
    // For now, simulate a response
    setTimeout(() => {
      const aiResponse = generateAIResponse(message)
      setConversationMessages(prev => [...prev, { role: 'assistant', content: aiResponse }])
      
      if (voiceEnabled) {
        speakText(aiResponse)
      }
    }, 1000)
  }

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm here to help you create your perfect app. Tell me what you have in mind!"
    }
    
    if (lowerMessage.includes('todo')) {
      return "A todo app sounds great! I can help you create a task management system. Would you like features like reminders, categories, and due dates?"
    }
    
    if (lowerMessage.includes('recipe')) {
      return "A recipe manager is an excellent idea! I can include features like ingredient lists, cooking instructions, and shopping lists. What else would you like it to do?"
    }
    
    if (lowerMessage.includes('fitness') || lowerMessage.includes('workout')) {
      return "A fitness tracker would be awesome! I can build exercise logging, progress tracking, and workout planning features. What specific exercises do you want to track?"
    }
    
    return "That sounds interesting! Tell me more about what features you'd like in your app, and I'll help you create something amazing."
  }

  const generateAppFromVoice = () => {
    if (!voiceRequirements) {
      toast({
        title: "No Voice Requirements",
        description: "Please use voice input first to capture your app requirements",
        variant: "destructive"
      })
      return
    }

    // Set the idea based on voice transcript
    setIdea(voiceTranscript)
    
    // Generate the app
    handleGenerate()
  }

  const handleGenerate = async () => {
    if (!idea.trim() || !Object.values(platform).some(v => v)) {
      toast({
        title: "Missing Information",
        description: "Please provide your app idea and select at least one platform.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    
    try {
      // Simulate API call to generate app
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const app = generateAppFromIdea(idea, platform, buildSystem)
      setGeneratedApp(app)
      setPreviewMode(true) // Automatically switch to preview mode after generation
      
      // Initialize build statuses
      const initialStatuses: BuildStatus[] = app.platforms.map(p => ({
        platform: p,
        status: 'pending' as const,
        progress: 0
      }))
      setBuildStatuses(initialStatuses)
      
      toast({
        title: "App Generated Successfully!",
        description: `Your ${app.name} is ready for preview and build.`
      })
      
      // Voice feedback for successful generation
      setTimeout(() => {
        speakText(`Great! I've generated ${app.name} for ${app.platforms.join(', ')}. Your app is ready for preview and build.`)
      }, 500)
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate your app. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard.`
    })
  }

  const downloadProject = () => {
    if (!generatedApp) return
    
    // Create a zip-like structure in memory
    const files = generatedApp.generatedFiles.map(file => ({
      path: file.path + file.filename,
      content: file.content
    }))
    
    // For simplicity, download as a single JSON file containing all files
    const blob = new Blob([JSON.stringify({ files }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${generatedApp.name.toLowerCase().replace(/\s+/g, '-')}-project.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const startBuild = async (targetPlatform: string) => {
    if (!generatedApp) return
    
    // Update build status
    setBuildStatuses(prev => prev.map(status => 
      status.platform === targetPlatform 
        ? { ...status, status: 'building', progress: 0 }
        : status
    ))
    
    // Simulate build process
    const buildSteps = [
      { progress: 20, message: "Installing dependencies..." },
      { progress: 40, message: "Configuring build..." },
      { progress: 60, message: "Compiling code..." },
      { progress: 80, message: "Packaging application..." },
      { progress: 100, message: "Build completed!" }
    ]
    
    for (const step of buildSteps) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setBuildStatuses(prev => prev.map(status => 
        status.platform === targetPlatform 
          ? { ...status, progress: step.progress }
          : status
      ))
    }
    
    // Generate mock download URL with educational content
    const buildInfo = {
      appName: generatedApp.name,
      platform: targetPlatform,
      buildDate: new Date().toISOString(),
      message: "This is a demonstration build file.",
      explanation: "In a real implementation, this would be an actual compiled application file.",
      whatYouWouldGet: targetPlatform === 'android' ? 
        "A real APK file would contain compiled Android application code, resources, and metadata ready for installation on Android devices." :
        targetPlatform === 'ios' ?
        "A real IPA file would contain compiled iOS application code and resources ready for installation on iOS devices." :
        "A real web build would contain compiled static files ready for deployment to web servers.",
      nextSteps: "To create real builds, you would need to set up proper build environments with Android Studio, Xcode, or web build tools."
    }
    
    const mockDownloadUrl = `data:application/json;base64,${btoa(JSON.stringify(buildInfo, null, 2))}`
    
    // Complete build
    setBuildStatuses(prev => prev.map(status => 
      status.platform === targetPlatform 
        ? { 
            ...status, 
            status: 'completed', 
            progress: 100,
            downloadUrl: mockDownloadUrl
          }
        : status
    ))
    
    toast({
      title: "Build Completed!",
      description: `${targetPlatform} build info is ready for download. Note: This contains build information, not the actual app file.`
    })
  }

  const startAllBuilds = async () => {
    if (!generatedApp) return
    
    const platforms = generatedApp.platforms
    for (const platform of platforms) {
      await startBuild(platform)
      // Small delay between builds
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const toggleTask = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ))
  }

  const addTask = () => {
    if (newTask.trim()) {
      const newTaskObj = {
        id: tasks.length + 1,
        title: newTask.trim(),
        due: 'New task',
        completed: false,
        priority: 'blue'
      }
      setTasks([...tasks, newTaskObj])
      setNewTask('')
      toast({
        title: "Task Added!",
        description: "New task has been added to your list."
      })
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'web': return Monitor
      case 'android': return Smartphone
      case 'ios': return Smartphone
      default: return Code
    }
  }

  const getBuildStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-500'
      case 'building': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const selectedPlatforms = Object.entries(platform)
    .filter(([_, selected]) => selected)
    .map(([name, _]) => name)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Heavy Lifter v3
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Project Genesis v3 - Transform your ideas into cloud-ready applications with 
            multi-platform support, preview functionality, and automatic builds.
          </p>
        </div>

        {/* ALWAYS VISIBLE TEST PREVIEW */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-500">ALWAYS VISIBLE TEST</h2>
              <p>This should always be visible to test basic rendering.</p>
              <p className="text-sm">Test State: {testState}</p>
              <button 
                onClick={() => setTestState('Updated State!')}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Update State
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Main Interface */}
        {!generatedApp ? (
          <div className="space-y-8 mb-12">
            {/* Input Mode Tabs */}
            <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as 'text' | 'voice')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Text Input
                </TabsTrigger>
                <TabsTrigger value="voice" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Voice Input
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Text Input Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Your App Idea
                      </CardTitle>
                      <CardDescription>
                        Describe your app idea in plain English. I'll handle the rest.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="relative">
                        <Textarea
                          placeholder="e.g., A todo app that syncs across devices, A recipe manager with shopping lists, A fitness tracker for workouts..."
                          value={idea}
                          onChange={(e) => setIdea(e.target.value)}
                          className="min-h-[120px] resize-none pr-12"
                        />
                        <Button
                          size="sm"
                          variant={isRecording ? "destructive" : "outline"}
                          className="absolute top-2 right-2 h-8 w-8 p-0"
                          onClick={isRecording ? stopVoiceInput : startVoiceInput}
                        >
                          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      {/* Voice input status */}
                      {isListening && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-blue-700">Listening... Speak your app idea</span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={stopVoiceInput}
                            className="ml-auto"
                          >
                            Stop
                          </Button>
                        </div>
                      )}
                      
                      {transcript && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Live transcription:</div>
                          <div className="text-sm">{transcript}</div>
                        </div>
                      )}
                      
                      <div>
                        <label className="text-sm font-medium mb-3 block">Select Platforms</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'web', icon: Monitor, label: 'Web', desc: 'Next.js' },
                            { id: 'android', icon: Smartphone, label: 'Android', desc: 'React Native' },
                            { id: 'ios', icon: Smartphone, label: 'iOS', desc: 'React Native' }
                          ].map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setPlatform(prev => ({ ...prev, [p.id]: !prev[p.id as keyof typeof prev] }))}
                              className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                                platform[p.id as keyof typeof platform]
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <p.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                              <div className="font-medium">{p.label}</div>
                              <div className="text-xs text-muted-foreground">{p.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-3 block">Build System</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'eas', label: 'Expo EAS', desc: 'Cloud builds' },
                            { id: 'capacitor', label: 'Capacitor', desc: 'Native builds' }
                          ].map((b) => (
                            <button
                              key={b.id}
                              onClick={() => setBuildSystem(b.id as 'eas' | 'capacitor')}
                              className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                                buildSystem === b.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="font-medium">{b.label}</div>
                              <div className="text-xs text-muted-foreground">{b.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleGenerate} 
                        disabled={!idea.trim() || !selectedPlatforms.length || isGenerating}
                        className="w-full"
                        size="lg"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Your App...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate My App
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Examples Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Example Ideas</CardTitle>
                      <CardDescription>
                        Click on any example to get started quickly
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          "A simple todo list with categories and due dates",
                          "A recipe manager with ingredient lists and cooking instructions",
                          "A workout tracker for logging exercises and progress",
                          "A habit tracker with streaks and daily reminders",
                          "A note-taking app with tags and search functionality",
                          "A budget tracker for income and expenses",
                          "A water intake tracker with reminders",
                          "A book club snack organizer"
                        ].map((example, index) => (
                          <button
                            key={index}
                            onClick={() => setIdea(example)}
                            className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Example {index + 1}
                              </Badge>
                              <span className="text-sm">{example}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="voice" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Voice Input Section */}
                  <div className="space-y-6">
                    {typeof window !== 'undefined' && (
                      <VoiceInputGoogle
                        onTranscript={handleVoiceTranscript}
                        onRequirementsExtracted={handleVoiceRequirementsExtracted}
                        onConversationResponse={handleVoiceConversationResponse}
                        disabled={isGenerating}
                      />
                    )}
                    
                    {/* Voice Controls */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Volume2 className="h-5 w-5" />
                          Voice Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Voice Feedback</span>
                          <Button
                            onClick={() => setVoiceEnabled(!voiceEnabled)}
                            variant={voiceEnabled ? "default" : "outline"}
                            size="sm"
                          >
                            {voiceEnabled ? "Enabled" : "Disabled"}
                          </Button>
                        </div>
                        
                        <Button
                          onClick={generateAppFromVoice}
                          disabled={!voiceRequirements || isGenerating}
                          className="w-full"
                          size="lg"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating from Voice...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generate App from Voice
                            </>
                          )}
                        </Button>
                        
                        {voiceRequirements && (
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="text-sm text-green-800">
                              ✓ Voice requirements captured! Ready to generate your app.
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Conversation and Transcript */}
                  <div className="space-y-6">
                    {typeof window !== 'undefined' && (
                      <ConversationDialog
                        messages={conversationMessages}
                        onSendMessage={handleConversationMessage}
                        onVoiceResponse={speakText}
                        isProcessing={isGenerating}
                        voiceEnabled={voiceEnabled}
                      />
                    )}
                    
                    {voiceTranscript && (
                      <TranscriptDisplay
                        transcript={voiceTranscript}
                        isLive={isListening}
                        isFinal={!isListening && voiceTranscript.length > 0}
                        onEdit={(edited) => {
                          setVoiceTranscript(edited)
                          setIdea(edited)
                        }}
                      />
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          /* Generated App Interface */
          <div className="space-y-8">
            {/* App Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  {generatedApp.name}
                </CardTitle>
                <CardDescription>
                  Generated for: {generatedApp.platforms.join(', ')} • Build System: {buildSystem.toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 flex-wrap">
                  <Button onClick={() => setPreviewMode(!previewMode)} variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    {previewMode ? 'Edit Code' : 'Preview App'}
                  </Button>
                  <Button onClick={speakAppSummary} variant="outline">
                    <Volume2 className="mr-2 h-4 w-4" />
                    Speak Summary
                  </Button>
                  <Button onClick={downloadProject} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download Project
                  </Button>
                  <Button onClick={startAllBuilds}>
                    <Play className="mr-2 h-4 w-4" />
                    Build All Platforms
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview Mode - SIMPLE TEST */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-500">SIMPLE TEST PREVIEW</h2>
                    <p className="text-lg">This should always show up!</p>
                    <p className="text-sm">Preview Mode: {previewMode ? 'TRUE' : 'FALSE'}</p>
                    <p className="text-sm">Generated App: {generatedApp ? 'YES' : 'NO'}</p>
                    {generatedApp && (
                      <p className="text-sm">App Name: {generatedApp.name}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            {!previewMode && generatedApp && (
              /* Code Editor Mode */
              <Card>
                <CardHeader>
                  <CardTitle>Project Files</CardTitle>
                  <CardDescription>
                    Review and edit your generated code before building.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* File Tabs */}
                    <div className="flex gap-2 border-b">
                      {generatedApp.generatedFiles.map((file) => (
                        <button
                          key={file.filename}
                          onClick={() => setSelectedFile(file.filename)}
                          className={`px-4 py-2 border-b-2 transition-colors ${
                            selectedFile === file.filename
                              ? 'border-primary text-primary'
                              : 'border-transparent text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {file.filename}
                        </button>
                      ))}
                    </div>

                    {/* Code Editor */}
                    <div className="relative">
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 z-10"
                        onClick={() => {
                          const file = generatedApp.generatedFiles.find(f => f.filename === selectedFile)
                          if (file) {
                            copyToClipboard(file.content, file.filename)
                          }
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
                        <code>
                          {generatedApp.generatedFiles.find(f => f.filename === selectedFile)?.content || ''}
                        </code>
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Preview Mode - Enhanced Interactive Preview */}
            {previewMode && generatedApp && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Interactive App Preview
                  </CardTitle>
                  <CardDescription>
                    Experience your generated app with interactive functionality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <div className="relative w-80 h-[600px] bg-black rounded-[3rem] p-4 shadow-2xl">
                      {/* Phone notch */}
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-lg z-10"></div>
                      
                      {/* Phone screen */}
                      <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                        {/* Status bar */}
                        <div className="bg-gray-100 px-4 py-2 flex justify-between items-center text-xs">
                          <span>9:41</span>
                          <div className="flex gap-1">
                            <div className="w-4 h-3 bg-green-500 rounded-sm"></div>
                            <div className="w-4 h-3 bg-gray-300 rounded-sm"></div>
                            <div className="w-4 h-3 bg-gray-300 rounded-sm"></div>
                          </div>
                        </div>
                        
                        {/* App content */}
                        <div className="p-4 h-full overflow-y-auto">
                          {generatedApp.name.toLowerCase().includes('todo') ? (
                            /* Todo App Preview */
                            <div className="space-y-4">
                              <h2 className="text-2xl font-bold text-center mb-4">{generatedApp.name}</h2>
                              
                              {/* Add todo input */}
                              <div className="flex gap-2 mb-4">
                                <input
                                  type="text"
                                  placeholder="Add a new todo..."
                                  className="flex-1 p-2 border rounded-lg text-sm"
                                  value={newTask}
                                  onChange={(e) => setNewTask(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                                />
                                <button
                                  onClick={addTask}
                                  className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                                >
                                  Add
                                </button>
                              </div>
                              
                              {/* Todo list */}
                              <div className="space-y-2">
                                {tasks.map((task) => (
                                  <div
                                    key={task.id}
                                    className="bg-gray-50 rounded-lg p-3 flex items-center gap-3"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={task.completed}
                                      onChange={() => toggleTask(task.id)}
                                      className="w-4 h-4"
                                    />
                                    <div className="flex-1">
                                      <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                        {task.title}
                                      </span>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {task.due}
                                      </div>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full bg-${task.priority}-500`}></div>
                                  </div>
                                ))}
                                
                                {tasks.length === 0 && (
                                  <div className="text-center py-8 text-gray-500 text-sm">
                                    No todos yet. Add one above!
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : generatedApp.name.toLowerCase().includes('recipe') ? (
                            /* Recipe App Preview */
                            <div className="space-y-4">
                              <h2 className="text-2xl font-bold text-center mb-4">{generatedApp.name}</h2>
                              
                              {/* Recipe card */}
                              <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-lg p-4 text-white mb-4">
                                <h3 className="font-bold text-lg mb-2">Delicious Pasta</h3>
                                <p className="text-sm opacity-90">Creamy carbonara with bacon</p>
                                <div className="flex gap-2 mt-2">
                                  <span className="text-xs bg-white/20 px-2 py-1 rounded">30 min</span>
                                  <span className="text-xs bg-white/20 px-2 py-1 rounded">Easy</span>
                                </div>
                              </div>
                              
                              {/* Ingredients */}
                              <div>
                                <h3 className="font-semibold mb-2">Ingredients</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {['Pasta', 'Bacon', 'Eggs', 'Parmesan', 'Black Pepper', 'Salt'].map((ingredient, index) => (
                                    <div key={index} className="bg-gray-50 rounded-lg p-2 text-center">
                                      {ingredient}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Instructions */}
                              <div>
                                <h3 className="font-semibold mb-2">Instructions</h3>
                                <div className="space-y-2 text-sm">
                                  <div className="flex gap-2">
                                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                                    <span>Cook pasta according to package directions</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                                    <span>Fry bacon until crispy</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                                    <span>Mix eggs and cheese</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Generic App Preview */
                            <div className="space-y-4">
                              <h2 className="text-2xl font-bold text-center mb-4">{generatedApp.name}</h2>
                              
                              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white text-center">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Sparkles className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">Welcome to Your App</h3>
                                <p className="text-sm opacity-90">This is a preview of your generated application</p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                {['Dashboard', 'Profile', 'Settings', 'Analytics'].map((feature, index) => (
                                  <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                    </div>
                                    <span className="text-sm font-medium">{feature}</span>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="bg-blue-50 rounded-lg p-4">
                                <h4 className="font-medium text-blue-900 mb-2">App Features</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                  <li>• Cross-platform compatibility</li>
                                  <li>• Modern, responsive design</li>
                                  <li>• Interactive user interface</li>
                                  <li>• Cloud-ready architecture</li>
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Build Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Build Status
                </CardTitle>
                <CardDescription>
                  Monitor build progress and download build information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">📱 About This Demo</h4>
                  <p className="text-sm text-blue-800">
                    This is a demonstration of the Heavy Lifter v3 system. The downloads contain build information, 
                    not actual installable app files. Real APK/IPA files require proper build environments 
                    with Android Studio, Xcode, or cloud build services like EAS Build.
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {generatedApp.platforms.map((platform) => {
                    const status = buildStatuses.find(s => s.platform === platform)
                    const IconComponent = getPlatformIcon(platform)
                    
                    return (
                      <Card key={platform} className="relative">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-5 w-5" />
                              <span className="font-medium capitalize">{platform}</span>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${getBuildStatusColor(status?.status || 'pending')}`} />
                          </div>
                          
                          {status?.status === 'building' && (
                            <div className="space-y-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${status.progress}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-600">
                                Building... {status.progress}%
                              </div>
                            </div>
                          )}
                          
                          {status?.status === 'completed' && (
                            <div className="space-y-2">
                              <div className="text-sm text-green-600 font-medium">
                                Build Completed
                              </div>
                              <Button 
                                size="sm" 
                                className="w-full"
                                onClick={() => {
                                  if (status.downloadUrl) {
                                    // Create a download from the mock data URL
                                    const link = document.createElement('a')
                                    link.href = status.downloadUrl
                                    link.download = `${generatedApp.name}-${status.platform}-build-info.json`
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)
                                    
                                    toast({
                                      title: "Download Started",
                                      description: `Downloading ${status.platform} build information file...`
                                    })
                                  }
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download Build Info
                              </Button>
                              <div className="text-xs text-gray-500 text-center">
                                Contains build information, not the actual app file
                              </div>
                            </div>
                          )}
                          
                          {status?.status === 'pending' && (
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => startBuild(platform)}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Build {platform}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Build Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">How to deploy your app:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    {generatedApp.instructions.split('\n').map((line, index) => (
                      <li key={index}>{line}</li>
                    ))}
                  </ol>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-medium mb-3">What I Included:</h3>
                  <div className="flex flex-wrap gap-2">
                    {generatedApp.assumptions.map((assumption, index) => (
                      <Badge key={index} variant="secondary">
                        {assumption}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// Enhanced app generation logic
function generateAppFromIdea(idea: string, platforms: { web: boolean; android: boolean; ios: boolean }, buildSystem: 'eas' | 'capacitor'): GeneratedApp {
  const appName = generateAppName(idea)
  const selectedPlatforms = Object.entries(platforms)
    .filter(([_, selected]) => selected)
    .map(([name, _]) => name)

  const generatedFiles = []
  
  // Generate based on selected platforms
  if (platforms.web) {
    generatedFiles.push(...generateWebFiles(idea, appName))
  }
  
  if (platforms.android || platforms.ios) {
    generatedFiles.push(...generateMobileFiles(idea, appName, buildSystem))
  }

  const buildCommand = platforms.web 
    ? "vercel --prod" 
    : `eas build --platform ${platforms.android && platforms.ios ? 'all' : platforms.android ? 'android' : 'ios'} --non-interactive`

  const instructions = platforms.web
    ? "Deploy to Vercel: Connect your repository and deploy automatically."
    : "Build with EAS: Run the build command and deploy to app stores."

  const assumptions = [
    "Cloud-ready project structure",
    "Automated build configuration",
    "Cross-platform compatibility",
    "Production-ready code"
  ]

  return {
    name: appName,
    platforms: selectedPlatforms,
    buildCommand,
    generatedFiles,
    instructions,
    assumptions
  }
}

function generateWebFiles(idea: string, appName: string) {
  const isTodoApp = idea.toLowerCase().includes('todo')
  
  let appCode = ''
  if (isTodoApp) {
    appCode = `import { useState, useEffect } from 'react'

export default function ${appName}() {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('${appName.toLowerCase()}-todos')
    if (saved) setTodos(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('${appName.toLowerCase()}-todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, {
        id: Date.now(),
        text: newTodo,
        completed: false,
        createdAt: new Date().toISOString()
      }])
      setNewTodo('')
    }
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">${appName}</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new todo..."
              className="flex-1 p-2 border rounded"
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            />
            <button
              onClick={addTodo}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {todos.map(todo => (
            <div
              key={todo.id}
              className="bg-white rounded-lg shadow p-4 flex items-center"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="mr-3"
              />
              <div className="flex-1">
                <span className={todo.completed ? 'line-through text-gray-500' : ''}>
                  {todo.text}
                </span>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(todo.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
          
          {todos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No todos yet. Add one above!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}`
  } else {
    appCode = `import { useState, useEffect } from 'react'

export default function ${appName}() {
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('${appName.toLowerCase()}-items')
    if (saved) setItems(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('${appName.toLowerCase()}-items', JSON.stringify(items))
  }, [items])

  const addItem = () => {
    if (newItem.trim()) {
      setItems([...items, {
        id: Date.now(),
        text: newItem,
        createdAt: new Date().toISOString()
      }])
      setNewItem('')
    }
  }

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">${appName}</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add a new item..."
              className="flex-1 p-2 border rounded"
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
            />
            <button
              onClick={addItem}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
            >
              <div>
                <span>{item.text}</span>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => deleteItem(item.id)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
          
          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No items yet. Add one above!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}`
  }

  return [
    {
      filename: "pages/index.js",
      content: appCode,
      path: "/"
    },
    {
      filename: "package.json",
      content: `{
  "name": "${appName.toLowerCase().replace(/\\s+/g, '-')}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "next": "14.0.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.0.0",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  }
}`,
      path: "/"
    },
    {
      filename: "next.config.js",
      content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['example.com'],
  },
}

module.exports = nextConfig`,
      path: "/"
    },
    {
      filename: "vercel.json",
      content: `{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}`,
      path: "/"
    }
  ]
}

function generateMobileFiles(idea: string, appName: string, buildSystem: 'eas' | 'capacitor') {
  const isTodoApp = idea.toLowerCase().includes('todo')
  
  let appCode = ''
  if (isTodoApp) {
    appCode = `import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ${appName}() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const saved = await AsyncStorage.getItem('${appName.toLowerCase()}-todos');
      if (saved) setTodos(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load todos', e);
    }
  };

  const saveTodos = async (todosList) => {
    try {
      await AsyncStorage.setItem('${appName.toLowerCase()}-todos', JSON.stringify(todosList));
    } catch (e) {
      console.error('Failed to save todos', e);
    }
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      const newTodos = [...todos, {
        id: Date.now(),
        text: newTodo,
        completed: false,
        createdAt: new Date().toISOString()
      }];
      setTodos(newTodos);
      saveTodos(newTodos);
      setNewTodo('');
    }
  };

  const toggleTodo = (id) => {
    const newTodos = todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(newTodos);
    saveTodos(newTodos);
  };

  const deleteTodo = (id) => {
    const newTodos = todos.filter(todo => todo.id !== id);
    setTodos(newTodos);
    saveTodos(newTodos);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>${appName}</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newTodo}
          onChangeText={setNewTodo}
          placeholder="Add a new todo..."
        />
        <Button title="Add" onPress={addTodo} />
      </View>

      <FlatList
        data={todos}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.todoItem}>
            <View style={styles.todoContent}>
              <Switch
                value={item.completed}
                onValueChange={() => toggleTodo(item.id)}
              />
              <Text style={[
                styles.todoText,
                item.completed ? styles.completedTodo : {}
              ]}>
                {item.text}
              </Text>
            </View>
            <TouchableOpacity onPress={() => deleteTodo(item.id)}>
              <Text style={styles.deleteButton}>×</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No todos yet. Add one above!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  todoItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  todoText: {
    marginLeft: 10,
    fontSize: 16,
  },
  completedTodo: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  deleteButton: {
    fontSize: 20,
    color: 'red',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
  },
});`
  } else {
    appCode = `import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ${appName}() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const saved = await AsyncStorage.getItem('${appName.toLowerCase()}-items');
      if (saved) setItems(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load items', e);
    }
  };

  const saveItems = async (itemsList) => {
    try {
      await AsyncStorage.setItem('${appName.toLowerCase()}-items', JSON.stringify(itemsList));
    } catch (e) {
      console.error('Failed to save items', e);
    }
  };

  const addItem = () => {
    if (newItem.trim()) {
      const newItems = [...items, {
        id: Date.now(),
        text: newItem,
        createdAt: new Date().toISOString()
      }];
      setItems(newItems);
      saveItems(newItems);
      setNewItem('');
    }
  };

  const deleteItem = (id) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    saveItems(newItems);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>${appName}</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newItem}
          onChangeText={setNewItem}
          placeholder="Add a new item..."
        />
        <Button title="Add" onPress={addItem} />
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
              <Text style={styles.itemText}>{item.text}</Text>
              <Text style={styles.itemDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => deleteItem(item.id)}>
              <Text style={styles.deleteButton}>×</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items yet. Add one above!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  itemContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    marginBottom: 5,
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    fontSize: 20,
    color: 'red',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
  },
});`
  }

  const files = [
    {
      filename: "App.js",
      content: appCode,
      path: "/"
    },
    {
      filename: "package.json",
      content: `{
  "name": "${appName.toLowerCase().replace(/\\s+/g, '-')}",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build": "eas build --platform all"
  },
  "dependencies": {
    "expo": "~49.0.0",
    "react": "18.2.0",
    "react-native": "0.72.0",
    "@react-native-async-storage/async-storage": "1.18.2"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0"
  },
  "private": true
}`,
      path: "/"
    }
  ]

  if (buildSystem === 'eas') {
    files.push(
      {
        filename: "app.json",
        content: `{
  "expo": {
    "name": "${appName}",
    "slug": "${appName.toLowerCase().replace(/\\s+/g, '-')}",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "owner": "your-username",
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}`,
        path: "/"
      },
      {
        filename: "eas.json",
        content: `{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "preview"
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {}
  }
}`,
        path: "/"
      }
    )
  } else {
    files.push(
      {
        filename: "capacitor.config.json",
        content: `{
  "appId": "com.example.${appName.toLowerCase().replace(/\\s+/g, '')}",
  "appName": "${appName}",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  },
  "plugins": {
    "CapacitorHttp": {
      "enabled": true
    }
  }
}`,
        path: "/"
      }
    )
  }

  return files
}

function generateAppName(idea: string): string {
  const keywords = idea.toLowerCase().split(' ')
  const nameWords = keywords.filter(word => 
    word.length > 3 && 
    !['with', 'that', 'for', 'and', 'the', 'app', 'application'].includes(word)
  ).slice(0, 2)
  
  if (nameWords.length === 0) {
    return 'MyApp'
  }
  
  return nameWords.map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('')
}