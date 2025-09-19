import { NextRequest, NextResponse } from 'next/server'

interface ProcessRequirementsRequest {
  transcript: string
  history: Array<{role: string, content: string}>
  currentState?: string
  previousRequirements?: any
}

interface ConversationResponse {
  type: 'clarification' | 'confirmation' | 'completion'
  message: string
  questions?: string[]
}

interface RequirementsAnalysis {
  platforms: string[]
  coreFeatures: string[]
  uiStyle: 'modern' | 'minimalist' | 'corporate'
  complexity: 'basic' | 'intermediate' | 'advanced'
  technicalRequirements: {
    database: boolean
    authentication: boolean
    externalApis: string[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcessRequirementsRequest = await request.json()
    const { transcript, history, currentState = 'gathering_requirements', previousRequirements } = body

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Analyze the transcript for requirements
    const analysis = analyzeTranscriptForRequirements(transcript, history)
    
    // Generate appropriate response based on analysis
    const response = generateConversationResponse(analysis, currentState)

    return NextResponse.json({
      requirements: analysis.requirements,
      conversationResponse: response,
      nextState: response.type === 'completion' ? 'complete' : currentState
    })

  } catch (error) {
    console.error('Requirements processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process requirements' },
      { status: 500 }
    )
  }
}

function analyzeTranscriptForRequirements(transcript: string, history: any[]): { requirements: RequirementsAnalysis, confidence: number } {
  const lowerTranscript = transcript.toLowerCase()
  
  // Extract platforms
  const platforms: string[] = []
  if (lowerTranscript.includes('web') || lowerTranscript.includes('website')) platforms.push('web')
  if (lowerTranscript.includes('android') || lowerTranscript.includes('mobile')) platforms.push('android')
  if (lowerTranscript.includes('ios') || lowerTranscript.includes('iphone')) platforms.push('ios')
  if (platforms.length === 0) platforms.push('web') // Default to web

  // Extract features based on keywords
  const featureKeywords = {
    'todo': ['task management', 'reminders', 'categories', 'due dates'],
    'recipe': ['ingredients', 'cooking instructions', 'shopping lists', 'meal planning'],
    'fitness': ['workouts', 'exercise tracking', 'progress charts', 'health data'],
    'budget': ['expense tracking', 'categories', 'spending analysis', 'reports'],
    'social': ['user profiles', 'posts', 'comments', 'likes', 'sharing'],
    'habit': ['daily tracking', 'streaks', 'reminders', 'progress visualization'],
    'meditation': ['guided sessions', 'timer', 'progress tracking', 'calming sounds'],
    'language': ['flashcards', 'lessons', 'progress tracking', 'quizzes']
  }

  let coreFeatures: string[] = []
  for (const [keyword, features] of Object.entries(featureKeywords)) {
    if (lowerTranscript.includes(keyword)) {
      coreFeatures = [...coreFeatures, ...features]
    }
  }

  // If no specific features found, add generic ones
  if (coreFeatures.length === 0) {
    coreFeatures = ['user interface', 'data management', 'responsive design']
  }

  // Determine UI style
  let uiStyle: 'modern' | 'minimalist' | 'corporate' = 'modern'
  if (lowerTranscript.includes('minimalist') || lowerTranscript.includes('simple')) uiStyle = 'minimalist'
  if (lowerTranscript.includes('corporate') || lowerTranscript.includes('professional')) uiStyle = 'corporate'

  // Determine complexity
  let complexity: 'basic' | 'intermediate' | 'advanced' = 'intermediate'
  if (lowerTranscript.includes('simple') || lowerTranscript.includes('basic')) complexity = 'basic'
  if (lowerTranscript.includes('complex') || lowerTranscript.includes('advanced')) complexity = 'advanced'

  // Technical requirements
  const needsDatabase = lowerTranscript.includes('data') || lowerTranscript.includes('storage') || 
                       lowerTranscript.includes('save') || lowerTranscript.includes('sync')
  const needsAuth = lowerTranscript.includes('login') || lowerTranscript.includes('user') || 
                    lowerTranscript.includes('account') || lowerTranscript.includes('profile')
  
  const externalApis: string[] = []
  if (lowerTranscript.includes('payment')) externalApis.push('payment processing')
  if (lowerTranscript.includes('map') || lowerTranscript.includes('location')) externalApis.push('maps/geolocation')
  if (lowerTranscript.includes('notification')) externalApis.push('push notifications')
  if (lowerTranscript.includes('social') || lowerTranscript.includes('share')) externalApis.push('social media')

  const requirements: RequirementsAnalysis = {
    platforms,
    coreFeatures: [...new Set(coreFeatures)].slice(0, 5), // Remove duplicates and limit to 5
    uiStyle,
    complexity,
    technicalRequirements: {
      database: needsDatabase,
      authentication: needsAuth,
      externalApis
    }
  }

  return {
    requirements,
    confidence: Math.random() * 0.3 + 0.7 // 0.7-1.0 confidence
  }
}

function generateConversationResponse(analysis: any, currentState: string): ConversationResponse {
  const { requirements, confidence } = analysis
  
  // If confidence is low, ask for clarification
  if (confidence < 0.8) {
    return {
      type: 'clarification',
      message: "I want to make sure I understand your requirements correctly. Could you provide more details about what you'd like your app to do?",
      questions: [
        "What specific features are most important to you?",
        "Which platforms do you need the app to work on?",
        "Do you need user accounts or data storage?"
      ]
    }
  }

  // If platforms are unclear, ask for clarification
  if (requirements.platforms.length === 0) {
    return {
      type: 'clarification',
      message: "I'd like to know which platforms you need your app to support.",
      questions: [
        "Do you need a web app, mobile app, or both?",
        "Should it work on iOS, Android, or both?"
      ]
    }
  }

  // If requirements seem complete, provide confirmation
  if (requirements.coreFeatures.length >= 3 && confidence >= 0.8) {
    return {
      type: 'confirmation',
      message: `Great! I understand you want to create a ${requirements.complexity} ${requirements.uiStyle}-style app for ${requirements.platforms.join(', ')} with features like ${requirements.coreFeatures.slice(0, 3).join(', ')}. Does this sound correct?`,
      questions: [
        "Are these the main features you want?",
        "Would you like to add any other features?",
        "Should I proceed with generating the app?"
      ]
    }
  }

  // Default response for incomplete requirements
  return {
    type: 'clarification',
    message: "I'm getting a good understanding of what you want. To make sure I create the perfect app for you, could you tell me more about:",
    questions: [
      "What's the primary goal of your app?",
      "Who are the main users?",
      "Are there any specific features you definitely want to include?"
    ]
  }
}