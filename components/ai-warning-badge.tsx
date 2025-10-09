"use client"

import { Badge } from "@/components/ui/badge"
import { Bot, Sparkles } from "lucide-react"

interface AIWarningBadgeProps {
  count: number
  confidence?: 'low' | 'medium' | 'high'
}

export function AIWarningBadge({ count, confidence = 'medium' }: AIWarningBadgeProps) {
  if (count === 0) return null

  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className={`flex items-center gap-1 ${getConfidenceColor(confidence)}`}
      >
        <Bot className="h-3 w-3" />
        <span className="text-xs font-medium">
          {count} AI-generated warning{count !== 1 ? 's' : ''}
        </span>
      </Badge>
      
      {confidence === 'high' && (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
          <Sparkles className="h-3 w-3 mr-1" />
          <span className="text-xs">High Confidence</span>
        </Badge>
      )}
    </div>
  )
}

