'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Copy, Download, Edit3, Check, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface TranscriptDisplayProps {
  transcript: string
  isLive?: boolean
  isFinal?: boolean
  onEdit?: (editedTranscript: string) => void
  onCopy?: () => void
  onDownload?: () => void
}

export default function TranscriptDisplay({
  transcript,
  isLive = false,
  isFinal = false,
  onEdit,
  onCopy,
  onDownload
}: TranscriptDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTranscript, setEditedTranscript] = useState(transcript)
  const [wordConfidence, setWordConfidence] = useState<Array<{word: string, confidence: number}>>([])

  // Simulate word confidence (in real implementation, this would come from Google Speech API)
  useEffect(() => {
    if (transcript) {
      const words = transcript.split(' ')
      const confidenceData = words.map(word => ({
        word,
        confidence: Math.random() * 0.3 + 0.7 // Random confidence between 0.7-1.0
      }))
      setWordConfidence(confidenceData)
    }
  }, [transcript])

  // Handle edit save
  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(editedTranscript)
    }
    setIsEditing(false)
    toast({
      title: "Transcript Updated",
      description: "Your changes have been saved"
    })
  }

  // Handle edit cancel
  const handleCancelEdit = () => {
    setEditedTranscript(transcript)
    setIsEditing(false)
  }

  // Copy transcript to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(transcript)
    toast({
      title: "Copied to Clipboard",
      description: "Transcript copied successfully"
    })
    if (onCopy) onCopy()
  }

  // Download transcript as text file
  const handleDownload = () => {
    const blob = new Blob([transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Download Started",
      description: "Transcript downloaded successfully"
    })
    if (onDownload) onDownload()
  }

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600'
    if (confidence >= 0.8) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Voice Transcript
            {isLive && (
              <Badge variant="outline" className="animate-pulse">
                Live
              </Badge>
            )}
            {isFinal && (
              <Badge variant="secondary">
                Final
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            {!isLive && (
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
                size="sm"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none min-h-[100px]"
              placeholder="Edit transcript..."
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit} size="sm">
                <Check className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button onClick={handleCancelEdit} variant="outline" size="sm">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {transcript || (
                <span className="text-gray-400 italic">
                  {isLive ? "Listening... Speak now" : "No transcript available"}
                </span>
              )}
            </div>
            
            {/* Word confidence indicators (only for final transcripts) */}
            {isFinal && wordConfidence.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-sm text-gray-600 mb-2">Word Confidence:</p>
                <div className="flex flex-wrap gap-1">
                  {wordConfidence.map((item, index) => (
                    <span
                      key={index}
                      className={`text-xs px-2 py-1 rounded ${getConfidenceColor(item.confidence)} bg-gray-100`}
                      title={`Confidence: ${Math.round(item.confidence * 100)}%`}
                    >
                      {item.word}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Transcript Statistics */}
            {transcript && (
              <div className="border-t pt-3">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Words:</span>
                    <span className="ml-1 font-medium">{transcript.split(' ').length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Characters:</span>
                    <span className="ml-1 font-medium">{transcript.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-1 font-medium">
                      {isLive ? 'Recording' : isFinal ? 'Complete' : 'Processing'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}