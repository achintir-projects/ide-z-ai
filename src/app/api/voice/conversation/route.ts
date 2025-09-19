import { NextRequest, NextResponse } from 'next/server'

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  messageId: string
}

interface ConversationState {
  conversationId: string
  messages: ConversationMessage[]
  currentStep: 'greeting' | 'requirement_gathering' | 'clarification' | 'confirmation' | 'completion'
  extractedRequirements: any
  context: {
    userPreferences: any
    technicalConstraints: any
    previousApps?: string[]
  }
}

// In-memory storage for conversations (in production, use a database)
const conversations = new Map<string, ConversationState>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, conversationId, message, userId } = body

    switch (action) {
      case 'start':
        return handleStartConversation(userId)
      
      case 'send_message':
        return handleSendMessage(conversationId, message)
      
      case 'get_conversation':
        return handleGetConversation(conversationId)
      
      case 'end_conversation':
        return handleEndConversation(conversationId)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Conversation management error:', error)
    return NextResponse.json(
      { error: 'Failed to manage conversation' },
      { status: 500 }
    )
  }
}

async function handleStartConversation(userId: string) {
  const conversationId = generateConversationId()
  
  const initialState: ConversationState = {
    conversationId,
    messages: [],
    currentStep: 'greeting',
    extractedRequirements: null,
    context: {
      userPreferences: {},
      technicalConstraints: {},
      previousApps: []
    }
  }

  // Add greeting message
  const greetingMessage: ConversationMessage = {
    role: 'assistant',
    content: "Hello! I'm your AI app development assistant. I'd love to help you create your perfect app. To get started, could you tell me what kind of app you'd like to build?",
    timestamp: new Date().toISOString(),
    messageId: generateMessageId()
  }

  initialState.messages.push(greetingMessage)
  conversations.set(conversationId, initialState)

  return NextResponse.json({
    conversationId,
    message: greetingMessage,
    currentState: initialState
  })
}

async function handleSendMessage(conversationId: string, message: string) {
  const conversation = conversations.get(conversationId)
  
  if (!conversation) {
    return NextResponse.json(
      { error: 'Conversation not found' },
      { status: 404 }
    )
  }

  // Add user message
  const userMessage: ConversationMessage = {
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
    messageId: generateMessageId()
  }

  conversation.messages.push(userMessage)

  // Process the message and generate AI response
  const aiResponse = await generateAIResponse(conversation, message)
  
  // Add AI response
  const assistantMessage: ConversationMessage = {
    role: 'assistant',
    content: aiResponse.content,
    timestamp: new Date().toISOString(),
    messageId: generateMessageId()
  }

  conversation.messages.push(assistantMessage)
  conversation.currentStep = aiResponse.nextStep

  // Update conversation state
  if (aiResponse.extractedRequirements) {
    conversation.extractedRequirements = aiResponse.extractedRequirements
  }

  conversations.set(conversationId, conversation)

  return NextResponse.json({
    userMessage,
    assistantMessage,
    currentState: conversation,
    requiresAction: aiResponse.requiresAction
  })
}

async function handleGetConversation(conversationId: string) {
  const conversation = conversations.get(conversationId)
  
  if (!conversation) {
    return NextResponse.json(
      { error: 'Conversation not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(conversation)
}

async function handleEndConversation(conversationId: string) {
  const conversation = conversations.get(conversationId)
  
  if (!conversation) {
    return NextResponse.json(
      { error: 'Conversation not found' },
      { status: 404 }
    )
  }

  // Add closing message
  const closingMessage: ConversationMessage = {
    role: 'assistant',
    content: "Thank you for sharing your app idea! I have a good understanding of what you want to create. You can now proceed to generate your app, or feel free to ask me any other questions.",
    timestamp: new Date().toISOString(),
    messageId: generateMessageId()
  }

  conversation.messages.push(closingMessage)
  conversation.currentStep = 'completion'

  conversations.set(conversationId, conversation)

  return NextResponse.json({
    message: closingMessage,
    finalRequirements: conversation.extractedRequirements,
    conversationSummary: generateConversationSummary(conversation)
  })
}

async function generateAIResponse(conversation: ConversationState, userMessage: string): Promise<{
  content: string
  nextStep: ConversationState['currentStep']
  extractedRequirements?: any
  requiresAction?: boolean
}> {
  const lowerMessage = userMessage.toLowerCase()
  
  // Analyze the message for requirements and intent
  const analysis = analyzeUserMessage(userMessage, conversation.context)
  
  // Generate response based on current step and message content
  switch (conversation.currentStep) {
    case 'greeting':
      if (containsAppIdea(lowerMessage)) {
        return {
          content: "That sounds like a great app idea! I can help you build that. Let me ask a few questions to make sure I understand exactly what you need. Which platforms would you like this app to work on - web, mobile, or both?",
          nextStep: 'requirement_gathering',
          extractedRequirements: analysis.initialRequirements
        }
      } else {
        return {
          content: "I'd love to help you create an app! Could you tell me what kind of app you have in mind? For example, is it a todo app, a fitness tracker, a recipe manager, or something else entirely?",
          nextStep: 'greeting'
        }
      }

    case 'requirement_gathering':
      if (containsPlatformInfo(lowerMessage)) {
        return {
          content: "Perfect! Now, what specific features are most important to you? For example, do you need user accounts, data storage, notifications, or integration with other services?",
          nextStep: 'requirement_gathering',
          extractedRequirements: { ...conversation.extractedRequirements, ...analysis.platformRequirements }
        }
      } else if (containsFeatureInfo(lowerMessage)) {
        return {
          content: "Excellent! I'm getting a clear picture of what you want. Just to make sure I understand correctly, you want an app with [summarize features]. Is that right?",
          nextStep: 'clarification',
          extractedRequirements: { ...conversation.extractedRequirements, ...analysis.featureRequirements }
        }
      } else {
        return {
          content: "I'm listening! Tell me more about what you'd like your app to do. What are the main features or functionality you need?",
          nextStep: 'requirement_gathering'
        }
      }

    case 'clarification':
      if (containsConfirmation(lowerMessage)) {
        return {
          content: "Wonderful! I have all the information I need to create your app. You can now generate the app, or if you'd like to make any changes, just let me know!",
          nextStep: 'completion',
          requiresAction: true
        }
      } else {
        return {
          content: "I want to make sure I get this exactly right. Could you clarify what you meant by [clarification point]?",
          nextStep: 'clarification'
        }
      }

    default:
      return {
        content: "I'm here to help you create your app! What would you like to discuss?",
        nextStep: 'greeting'
      }
  }
}

function analyzeUserMessage(message: string, context: any) {
  const lowerMessage = message.toLowerCase()
  
  // Extract platforms
  const platforms = []
  if (lowerMessage.includes('web')) platforms.push('web')
  if (lowerMessage.includes('android') || lowerMessage.includes('mobile')) platforms.push('android')
  if (lowerMessage.includes('ios') || lowerMessage.includes('iphone')) platforms.push('ios')
  
  // Extract features
  const features = []
  if (lowerMessage.includes('login') || lowerMessage.includes('user')) features.push('authentication')
  if (lowerMessage.includes('data') || lowerMessage.includes('storage')) features.push('database')
  if (lowerMessage.includes('notification')) features.push('push notifications')
  if (lowerMessage.includes('social')) features.push('social features')
  
  return {
    initialRequirements: { platforms, features },
    platformRequirements: { platforms },
    featureRequirements: { features }
  }
}

function containsAppIdea(message: string): boolean {
  const appKeywords = ['app', 'application', 'build', 'create', 'develop', 'make']
  return appKeywords.some(keyword => message.includes(keyword))
}

function containsPlatformInfo(message: string): boolean {
  const platformKeywords = ['web', 'mobile', 'android', 'ios', 'iphone', 'website']
  return platformKeywords.some(keyword => message.includes(keyword))
}

function containsFeatureInfo(message: string): boolean {
  const featureKeywords = ['feature', 'function', 'do', 'should', 'need', 'want']
  return featureKeywords.some(keyword => message.includes(keyword))
}

function containsConfirmation(message: string): boolean {
  const confirmKeywords = ['yes', 'correct', 'right', 'exactly', 'perfect', 'good']
  return confirmKeywords.some(keyword => message.includes(keyword))
}

function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateConversationSummary(conversation: ConversationState): string {
  const messageCount = conversation.messages.length
  const userMessages = conversation.messages.filter(m => m.role === 'user').length
  const duration = conversation.messages.length > 0 
    ? new Date(conversation.messages[conversation.messages.length - 1].timestamp).getTime() - 
      new Date(conversation.messages[0].timestamp).getTime()
    : 0

  return `Conversation with ${userMessages} user messages and ${messageCount - userMessages} AI responses, lasting ${Math.round(duration / 1000)} seconds.`
}