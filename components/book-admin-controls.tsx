"use client"

import { useState, useEffect } from "react"
import { Trash2, Edit, X, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

// Check if we're in dev mode
function isDevMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    process.env.NODE_ENV === 'development'
  )
}

interface BookAdminControlsProps {
  isbn: string
  book?: {
    title?: string
    author?: string
    description?: string
  }
  onDeleted?: () => void
}

export function BookAdminControls({ isbn, book, onDeleted }: BookAdminControlsProps) {
  const router = useRouter()
  const [isDev, setIsDev] = useState(false)
  const [showAdminControls, setShowAdminControls] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: book?.title || '',
    author: book?.author || '',
    description: book?.description || '',
  })

  useEffect(() => {
    setIsDev(isDevMode())
    if (isDevMode()) {
      const saved = localStorage.getItem('dev-show-admin-controls')
      setShowAdminControls(saved === 'true')
    }
    
    // Listen for dev settings changes from navbar
    const handleDevSettingsChange = (event: CustomEvent) => {
      setShowAdminControls(event.detail.showAdminControls || false)
    }
    
    window.addEventListener('dev-settings-changed', handleDevSettingsChange as EventListener)
    return () => {
      window.removeEventListener('dev-settings-changed', handleDevSettingsChange as EventListener)
    }
  }, [])

  // Update edit data when book changes
  useEffect(() => {
    if (book) {
      setEditData({
        title: book.title || '',
        author: book.author || '',
        description: book.description || '',
      })
    }
  }, [book])

  if (!isDev || !showAdminControls) {
    return null
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete book ${isbn}?\n\nThis will delete:\n- The book record\n- All content warnings\n- All scan history\n- All audit logs\n\nThis action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/admin/delete-book', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbn }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete book')
      }

      alert(`Book ${isbn} deleted successfully!`)
      
      // Call callback if provided
      if (onDeleted) {
        onDeleted()
      } else {
        // Otherwise redirect to collection
        router.push('/collection')
      }
    } catch (error) {
      console.error('Error deleting book:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete book'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSave = async () => {
    setIsEditing(true)
    try {
      const response = await fetch('/api/admin/edit-book', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isbn,
          updates: editData 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update book')
      }

      alert('Book updated successfully!')
      setIsEditing(false)
      router.refresh() // Refresh the page to show updated data
    } catch (error) {
      console.error('Error updating book:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to update book'}`)
    } finally {
      setIsEditing(false)
    }
  }

  return (
    <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
      <span className="text-xs font-semibold text-red-900 uppercase tracking-wider">Dev Admin</span>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-red-300 text-red-700 hover:bg-red-100"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Book: {isbn}</DialogTitle>
            <DialogDescription>
              Dev-only: Edit book metadata. Changes are permanent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={editData.author}
                onChange={(e) => setEditData({ ...editData, author: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="mt-1 w-full min-h-[200px] p-2 border rounded-md"
                rows={10}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isEditing}
              >
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
        className="h-8 text-xs border-red-300 text-red-700 hover:bg-red-100"
      >
        <Trash2 className="h-3 w-3 mr-1" />
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>
    </div>
  )
}























