# AI Agent Integration for Content Warnings

## 🤖 Overview

This integration uses OpenAI's Agent Builder to automatically generate content warnings for books that don't have them. When a user scans a book, the system checks if content warnings exist, and if not, it uses an AI agent to analyze the book and generate appropriate warnings.

## 🔄 Workflow

```
User Scans Book → Check for Warnings → No Warnings Found → AI Agent Analysis → Generate Warnings → Store in Database
```

## 📁 Files

### **Core Agent Logic**
- **`lib/content-warning-agent.ts`** - OpenAI Agent implementation for content warning generation
- **`app/api/generate-content-warnings/route.ts`** - API endpoint for manual content warning generation
- **`app/api/scan-isbn/route.ts`** - Updated to automatically generate warnings on scan

### **UI Components**
- **`components/ai-warning-badge.tsx`** - Badge to show AI-generated warnings

### **Testing**
- **`test-content-warning-agent.js`** - Test script for the AI agent

## 🎯 Agent Configuration

### **Model**: GPT-4o
- **Reasoning Effort**: Medium (for balanced accuracy and speed)
- **Store**: True (for conversation history and debugging)

### **Instructions**
The agent is specialized to:
- Analyze book metadata (title, author, description, categories)
- Generate appropriate content warnings with proper categories and severity
- Return structured JSON responses
- Be accurate and helpful without over-warning

## 📊 Content Warning Categories

The agent uses your existing database schema:

**Categories:**
- `violence` - Physical violence, fighting, weapons, war
- `sexual_content` - Sexual situations, explicit content, romance
- `substance_abuse` - Alcohol, drugs, smoking, addiction
- `mental_health` - Depression, anxiety, suicide, mental illness
- `death` - Character deaths, grief, loss
- `abuse` - Physical, emotional, or sexual abuse
- `discrimination` - Racism, sexism, homophobia, etc.
- `other` - Any other potentially triggering content

**Severity Levels:**
- `mild` - Brief mentions, minor content, not graphic
- `moderate` - More detailed, some graphic content, significant impact
- `severe` - Graphic, disturbing, or highly triggering content

## 🔧 API Endpoints

### **POST /api/generate-content-warnings**
Manually generate content warnings for a book.

**Request:**
```json
{
  "bookId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "warnings_generated": 3,
  "warnings": [...],
  "confidence": "high",
  "reasoning": "AI-generated content warnings based on book metadata"
}
```

### **GET /api/generate-content-warnings?bookId=uuid**
Check if a book has content warnings.

**Response:**
```json
{
  "book_id": "uuid",
  "has_warnings": true,
  "warning_count": 3,
  "warnings": [...]
}
```

## 🚀 Integration Points

### **Automatic Generation**
- **Trigger**: When a book is scanned and has no existing content warnings
- **Location**: `app/api/scan-isbn/route.ts`
- **Behavior**: Non-blocking - scan succeeds even if warning generation fails

### **Manual Generation**
- **Trigger**: Admin or user request
- **Location**: `app/api/generate-content-warnings/route.ts`
- **Use Case**: Bulk generation, re-generation, or manual review

## 🛡️ Data Handling

### **Database Fields**
- `is_author_approved`: `false` (AI-generated warnings are not author-approved)
- `source`: `"ai_generated"` (tracks the source of the warning)
- `user_id`: `null` (AI-generated warnings don't have a user)

### **Confidence Levels**
- **High**: Book has description and categories
- **Medium**: Book has description OR categories
- **Low**: Book has only title and author

## 🧪 Testing

Run the test script to verify the agent works:

```bash
node test-content-warning-agent.js
```

This will test the agent with sample books and show the generated warnings.

## 🔮 Future Enhancements

1. **Batch Processing**: Generate warnings for multiple books at once
2. **User Feedback**: Allow users to rate AI-generated warnings
3. **Confidence Thresholds**: Only show high-confidence warnings
4. **Custom Instructions**: Allow per-book or per-genre customization
5. **Review Queue**: Flag low-confidence warnings for human review
6. **Web Search Integration**: Use web search tools for better analysis

## 📈 Benefits

- **Automatic Population**: Books get content warnings without manual work
- **Consistent Quality**: AI provides standardized, helpful warnings
- **Scalable**: Can handle large numbers of books efficiently
- **Non-Intrusive**: Doesn't block the scanning workflow
- **Trackable**: All AI-generated warnings are marked and traceable

