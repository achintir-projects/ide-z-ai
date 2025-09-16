'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Download, Sparkles, Code, Smartphone, Monitor } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface GeneratedApp {
  name: string
  platform: string
  packageJson: string
  appCode: string
  instructions: string
  assumptions: string[]
}

export default function Home() {
  const [idea, setIdea] = useState('')
  const [platform, setPlatform] = useState<'web' | 'android' | 'ios' | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedApp, setGeneratedApp] = useState<GeneratedApp | null>(null)

  const handleGenerate = async () => {
    if (!idea.trim() || !platform) {
      toast({
        title: "Missing Information",
        description: "Please provide your app idea and select a platform.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    
    try {
      // Simulate API call to generate app
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const app = generateAppFromIdea(idea, platform)
      setGeneratedApp(app)
      
      toast({
        title: "App Generated Successfully!",
        description: `Your ${app.name} for ${platform.toUpperCase()} is ready.`
      })
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

  const downloadApp = () => {
    if (!generatedApp) return
    
    const blob = new Blob([
      `// package.json\n${generatedApp.packageJson}\n\n`,
      `// App.js\n${generatedApp.appCode}`
    ], { type: 'text/javascript' })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${generatedApp.name.toLowerCase().replace(/\s+/g, '-')}-app.js`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Heavy Lifter
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Project Genesis v2 - Transform your ideas into working applications instantly. 
            Zero configuration, maximum magic.
          </p>
        </div>

        {/* Main Interface */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Input Section */}
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
              <Textarea
                placeholder="e.g., A todo app that syncs across devices, A recipe manager with shopping lists, A fitness tracker for workouts..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              
              <div>
                <label className="text-sm font-medium mb-3 block">Choose Platform</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'web', icon: Monitor, label: 'Web', desc: 'Next.js App' },
                    { id: 'android', icon: Smartphone, label: 'Android', desc: 'React Native' },
                    { id: 'ios', icon: Smartphone, label: 'iOS', desc: 'React Native' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id as any)}
                      className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                        platform === p.id
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
              
              <Button 
                onClick={handleGenerate} 
                disabled={!idea.trim() || !platform || isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
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
                  "A budget tracker for income and expenses"
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

        {/* Results Section */}
        {generatedApp && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Your App Is Ready!
              </CardTitle>
              <CardDescription>
                {generatedApp.name} for {generatedApp.platform.toUpperCase()} - Complete and runnable
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Instructions */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">How to Run Your App:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    {generatedApp.instructions.split('\n').map((line, index) => (
                      <li key={index}>{line}</li>
                    ))}
                  </ol>
                </div>

                {/* Assumptions */}
                <div>
                  <h3 className="font-medium mb-3">What I Included:</h3>
                  <div className="flex flex-wrap gap-2">
                    {generatedApp.assumptions.map((assumption, index) => (
                      <Badge key={index} variant="secondary">
                        {assumption}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Code Tabs */}
                <Tabs defaultValue="app" className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <TabsList>
                      <TabsTrigger value="app">App Code</TabsTrigger>
                      <TabsTrigger value="package">Package.json</TabsTrigger>
                    </TabsList>
                    <Button onClick={downloadApp} size="sm" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                  
                  <TabsContent value="app">
                    <div className="relative">
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 z-10"
                        onClick={() => copyToClipboard(generatedApp.appCode, 'App Code')}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
                        <code>{generatedApp.appCode}</code>
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="package">
                    <div className="relative">
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 z-10"
                        onClick={() => copyToClipboard(generatedApp.packageJson, 'Package.json')}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
                        <code>{generatedApp.packageJson}</code>
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// App generation logic
function generateAppFromIdea(idea: string, platform: 'web' | 'android' | 'ios'): GeneratedApp {
  const appName = generateAppName(idea)
  
  if (platform === 'web') {
    return generateWebApp(idea, appName)
  } else {
    return generateMobileApp(idea, appName, platform)
  }
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

function generateWebApp(idea: string, appName: string): GeneratedApp {
  const isTodoApp = idea.toLowerCase().includes('todo')
  const isRecipeApp = idea.toLowerCase().includes('recipe')
  const isWorkoutApp = idea.toLowerCase().includes('workout')
  const isHabitApp = idea.toLowerCase().includes('habit')
  const isNoteApp = idea.toLowerCase().includes('note')
  const isBudgetApp = idea.toLowerCase().includes('budget')

  let appCode = ''
  
  if (isTodoApp) {
    appCode = `import { useState, useEffect } from 'react'

export default function ${appName}() {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [category, setCategory] = useState('personal')

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
        category,
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

  const categories = ['personal', 'work', 'shopping', 'health']
  const filteredTodos = todos.filter(todo => todo.category === category)

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
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-2 border rounded"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              onClick={addTodo}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          
          <div className="flex gap-2 mb-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={\`px-3 py-1 rounded text-sm \${
                  category === cat 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }\`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filteredTodos.map(todo => (
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
          
          {filteredTodos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No todos yet. Add one above!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}`
  } else if (isRecipeApp) {
    appCode = `import { useState, useEffect } from 'react'

export default function ${appName}() {
  const [recipes, setRecipes] = useState([])
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    ingredients: '',
    instructions: '',
    cookingTime: 30
  })
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('${appName.toLowerCase()}-recipes')
    if (saved) setRecipes(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('${appName.toLowerCase()}-recipes', JSON.stringify(recipes))
  }, [recipes])

  const addRecipe = () => {
    if (newRecipe.name.trim()) {
      const recipe = {
        id: Date.now(),
        ...newRecipe,
        ingredients: newRecipe.ingredients.split('\\n').filter(i => i.trim()),
        createdAt: new Date().toISOString()
      }
      setRecipes([...recipes, recipe])
      setNewRecipe({
        name: '',
        ingredients: '',
        instructions: '',
        cookingTime: 30
      })
    }
  }

  const deleteRecipe = (id) => {
    setRecipes(recipes.filter(recipe => recipe.id !== id))
    if (selectedRecipe && selectedRecipe.id === id) {
      setSelectedRecipe(null)
    }
  }

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">${appName}</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Add New Recipe</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Recipe Name</label>
                <input
                  type="text"
                  value={newRecipe.name}
                  onChange={(e) => setNewRecipe({...newRecipe, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Chocolate Chip Cookies"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Ingredients (one per line)</label>
                <textarea
                  value={newRecipe.ingredients}
                  onChange={(e) => setNewRecipe({...newRecipe, ingredients: e.target.value})}
                  className="w-full p-2 border rounded h-24"
                  placeholder="2 cups flour\\n1 cup sugar..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Instructions</label>
                <textarea
                  value={newRecipe.instructions}
                  onChange={(e) => setNewRecipe({...newRecipe, instructions: e.target.value})}
                  className="w-full p-2 border rounded h-32"
                  placeholder="Mix ingredients... Bake at 350°F..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Cooking Time (minutes)</label>
                <input
                  type="number"
                  value={newRecipe.cookingTime}
                  onChange={(e) => setNewRecipe({...newRecipe, cookingTime: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded"
                  min="1"
                />
              </div>
              
              <button
                onClick={addRecipe}
                className="w-full py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
              >
                Add Recipe
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Your Recipes</h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recipes.map(recipe => (
                <div
                  key={recipe.id}
                  className={\`p-3 border rounded cursor-pointer hover:bg-amber-50 \${
                    selectedRecipe && selectedRecipe.id === recipe.id ? 'border-amber-500 bg-amber-50' : ''
                  }\`}
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{recipe.name}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteRecipe(recipe.id)
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {recipe.ingredients.length} ingredients • {recipe.cookingTime} mins
                  </div>
                </div>
              ))}
              
              {recipes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No recipes yet. Add one above!
                </div>
              )}
            </div>
          </div>
        </div>
        
        {selectedRecipe && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedRecipe.name}</h2>
              <div className="text-amber-600 font-medium">
                {selectedRecipe.cookingTime} mins
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Ingredients</h3>
                <ul className="space-y-1">
                  {selectedRecipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Instructions</h3>
                <p className="whitespace-pre-line">{selectedRecipe.instructions}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}`
  } else {
    // Generic app template
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

  const packageJson = `{
  "name": "${appName.toLowerCase().replace(/\s+/g, '-')}",
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
}`

  const instructions = `Copy the code into a Next.js project.
Run \`npx create-next-app@latest .\` then \`npm run dev\`
Open your browser to the local URL.`

  const assumptions = [
    "Local data saving so your work isn't lost",
    "A clean, modern interface",
    "The ability to add, view, and delete items"
  ]

  return {
    name: appName,
    platform: 'web',
    packageJson,
    appCode,
    instructions,
    assumptions
  }
}

function generateMobileApp(idea: string, appName: string, platform: 'android' | 'ios'): GeneratedApp {
  const isTodoApp = idea.toLowerCase().includes('todo')
  const isRecipeApp = idea.toLowerCase().includes('recipe')
  const isWorkoutApp = idea.toLowerCase().includes('workout')
  const isHabitApp = idea.toLowerCase().includes('habit')
  const isNoteApp = idea.toLowerCase().includes('note')
  const isBudgetApp = idea.toLowerCase().includes('budget')

  let appCode = ''
  
  if (isTodoApp) {
    appCode = `import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, Modal, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ${appName}() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [category, setCategory] = useState('personal');

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
        category,
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

  const openTodo = (todo) => {
    setSelectedTodo(todo);
    setModalVisible(true);
  };

  const categories = ['personal', 'work', 'shopping', 'health'];
  const filteredTodos = todos.filter(todo => todo.category === category);

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
        <View style={styles.categoryContainer}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[
                styles.categoryButton,
                category === cat ? styles.selectedCategory : {}
              ]}
            >
              <Text style={[
                styles.categoryText,
                category === cat ? styles.selectedCategoryText : {}
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Button title="Add" onPress={addTodo} />
      </View>

      <FlatList
        data={filteredTodos}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.todoItem}
            onPress={() => openTodo(item)}
          >
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
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No todos yet. Add one above!</Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedTodo && (
              <>
                <Text style={styles.modalTitle}>{selectedTodo.text}</Text>
                <Text style={styles.modalCategory}>Category: {selectedTodo.category}</Text>
                <Text style={styles.modalDate}>
                  Created: {new Date(selectedTodo.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.modalStatus}>
                  Status: {selectedTodo.completed ? 'Completed' : 'Pending'}
                </Text>
                <Button
                  title="Close"
                  onPress={() => setModalVisible(!modalVisible)}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
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
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryButton: {
    padding: 5,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
  },
  selectedCategory: {
    backgroundColor: '#2196F3',
  },
  categoryText: {
    fontSize: 12,
  },
  selectedCategoryText: {
    color: 'white',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalCategory: {
    fontSize: 16,
    marginBottom: 5,
  },
  modalDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  modalStatus: {
    fontSize: 16,
    marginBottom: 20,
  },
});`
  } else if (isRecipeApp) {
    appCode = `import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ${appName}() {
  const [recipes, setRecipes] = useState([]);
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    ingredients: '',
    instructions: '',
    cookingTime: 30
  });
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const saved = await AsyncStorage.getItem('${appName.toLowerCase()}-recipes');
      if (saved) setRecipes(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load recipes', e);
    }
  };

  const saveRecipes = async (recipesList) => {
    try {
      await AsyncStorage.setItem('${appName.toLowerCase()}-recipes', JSON.stringify(recipesList));
    } catch (e) {
      console.error('Failed to save recipes', e);
    }
  };

  const addRecipe = () => {
    if (newRecipe.name.trim()) {
      const recipe = {
        id: Date.now(),
        ...newRecipe,
        ingredients: newRecipe.ingredients.split('\\n').filter(i => i.trim()),
        createdAt: new Date().toISOString()
      };
      const newRecipes = [...recipes, recipe];
      setRecipes(newRecipes);
      saveRecipes(newRecipes);
      setNewRecipe({
        name: '',
        ingredients: '',
        instructions: '',
        cookingTime: 30
      });
    }
  };

  const deleteRecipe = (id) => {
    const newRecipes = recipes.filter(recipe => recipe.id !== id);
    setRecipes(newRecipes);
    saveRecipes(newRecipes);
    if (selectedRecipe && selectedRecipe.id === id) {
      setSelectedRecipe(null);
    }
  };

  const openRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>${appName}</Text>
      
      <ScrollView style={styles.formContainer}>
        <Text style={styles.label}>Recipe Name</Text>
        <TextInput
          style={styles.input}
          value={newRecipe.name}
          onChangeText={(text) => setNewRecipe({...newRecipe, name: text})}
          placeholder="e.g., Chocolate Chip Cookies"
        />
        
        <Text style={styles.label}>Ingredients (one per line)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={newRecipe.ingredients}
          onChangeText={(text) => setNewRecipe({...newRecipe, ingredients: text})}
          placeholder="2 cups flour\\n1 cup sugar..."
          multiline
        />
        
        <Text style={styles.label}>Instructions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={newRecipe.instructions}
          onChangeText={(text) => setNewRecipe({...newRecipe, instructions: text})}
          placeholder="Mix ingredients... Bake at 350°F..."
          multiline
        />
        
        <Text style={styles.label}>Cooking Time (minutes)</Text>
        <TextInput
          style={styles.input}
          value={newRecipe.cookingTime.toString()}
          onChangeText={(text) => setNewRecipe({...newRecipe, cookingTime: parseInt(text) || 0})}
          placeholder="30"
          keyboardType="numeric"
        />
        
        <Button title="Add Recipe" onPress={addRecipe} />
      </ScrollView>

      <Text style={styles.sectionTitle}>Your Recipes</Text>
      <FlatList
        data={recipes}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.recipeItem}
            onPress={() => openRecipe(item)}
          >
            <View style={styles.recipeContent}>
              <Text style={styles.recipeName}>{item.name}</Text>
              <Text style={styles.recipeInfo}>
                {item.ingredients.length} ingredients • {item.cookingTime} mins
              </Text>
            </View>
            <TouchableOpacity onPress={() => deleteRecipe(item.id)}>
              <Text style={styles.deleteButton}>×</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recipes yet. Add one above!</Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedRecipe && (
              <ScrollView>
                <Text style={styles.modalTitle}>{selectedRecipe.name}</Text>
                <Text style={styles.modalCookingTime}>{selectedRecipe.cookingTime} mins</Text>
                
                <Text style={styles.modalSectionTitle}>Ingredients</Text>
                {selectedRecipe.ingredients.map((ingredient, index) => (
                  <Text key={index} style={styles.modalIngredient}>• {ingredient}</Text>
                ))}
                
                <Text style={styles.modalSectionTitle}>Instructions</Text>
                <Text style={styles.modalInstructions}>{selectedRecipe.instructions}</Text>
                
                <Button
                  title="Close"
                  onPress={() => setModalVisible(!modalVisible)}
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fffbeb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#92400e',
  },
  formContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#92400e',
  },
  input: {
    height: 40,
    borderColor: '#d97706',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#92400e',
  },
  recipeItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  recipeContent: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  recipeInfo: {
    fontSize: 12,
    color: '#92400e',
    marginTop: 2,
  },
  deleteButton: {
    fontSize: 20,
    color: '#dc2626',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#92400e',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#92400e',
    textAlign: 'center',
  },
  modalCookingTime: {
    fontSize: 16,
    color: '#d97706',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
    color: '#92400e',
  },
  modalIngredient: {
    fontSize: 14,
    marginBottom: 5,
    color: '#374151',
  },
  modalInstructions: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
});`
  } else {
    // Generic mobile app template
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

  const packageJson = `{
  "name": "${appName.toLowerCase().replace(/\\s+/g, '-')}",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
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
}`

  const instructions = `Copy all code into a single App.js file.
Run \`npm install\` then \`npx expo start\`
Scan the QR code with your phone's camera (Expo Go app required).`

  const assumptions = [
    "Local data saving so your work isn't lost",
    "A clean, modern interface",
    "The ability to add, view, and delete items"
  ]

  return {
    name: appName,
    platform,
    packageJson,
    appCode,
    instructions,
    assumptions
  }
}