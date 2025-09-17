import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  Circle, 
  Camera, 
  Upload, 
  X,
  FileImage,
  Check
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  category: 'mindfulness' | 'physical' | 'social' | 'reflection';
}

interface TaskDetailDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (taskId: string, journalEntry?: string, photoUrl?: string) => void;
}

export const TaskDetailDialog = ({ task, isOpen, onClose, onComplete }: TaskDetailDialogProps) => {
  const [journalEntry, setJournalEntry] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, etc.)",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setSelectedFile(null);
    setPhotoPreview(null);
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    setIsUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('taskId', task?.id || '');

      // Here you would typically upload to your storage service
      // For now, we'll simulate an upload and return a mock URL
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload time
      
      const mockPhotoUrl = `https://example.com/photos/${task?.id}_${Date.now()}.jpg`;
      
      toast({
        title: "Photo uploaded successfully!",
        description: "Your photo has been saved with this task."
      });

      return mockPhotoUrl;
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleComplete = async () => {
    if (!task) return;

    let photoUrl: string | null = null;
    
    // Upload photo if one is selected
    if (selectedFile) {
      photoUrl = await uploadPhoto();
      if (!photoUrl) return; // Don't complete if photo upload failed
    }

    // Complete the task
    onComplete(task.id, journalEntry || undefined, photoUrl || undefined);
    
    // Show success message if additional data was provided
    if (journalEntry || photoUrl) {
      toast({
        title: "Task completed with evidence!",
        description: "Your journal entry and photo have been saved.",
      });
    }
    
    // Reset form
    setJournalEntry("");
    setSelectedFile(null);
    setPhotoPreview(null);
    
    onClose();
  };

  const requiresPhoto = task?.category === 'physical' || 
                       task?.title.toLowerCase().includes('park') ||
                       task?.title.toLowerCase().includes('walk') ||
                       task?.title.toLowerCase().includes('exercise') ||
                       task?.description.toLowerCase().includes('photo');

  const requiresJournal = task?.category === 'reflection' ||
                         task?.title.toLowerCase().includes('journal') ||
                         task?.title.toLowerCase().includes('reflect') ||
                         task?.description.toLowerCase().includes('write');

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass border-border/30">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {task.completed ? (
              <div className="w-8 h-8 gradient-encouragement rounded-full flex items-center justify-center glow">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            ) : (
              <div className="w-8 h-8 border-2 border-muted-foreground rounded-full flex items-center justify-center">
                <Circle className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-healing bg-clip-text text-transparent">
              {task.title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-lg text-muted-foreground">
            {task.description}
          </DialogDescription>
          <Badge 
            variant="outline" 
            className="mt-3 w-fit px-3 py-1 border-primary/50 text-primary"
          >
            {task.category}
          </Badge>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Journal Entry Section */}
          {requiresJournal && (
            <div className="space-y-3">
              <Label htmlFor="journal" className="text-base font-medium flex items-center gap-2">
                <FileImage className="w-4 h-4 text-primary" />
                Journal Entry
              </Label>
              <Textarea
                id="journal"
                placeholder="Share your thoughts, feelings, or reflections about this activity..."
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                className="glass border-border/30 focus:border-primary/50 focus:glow transition-all duration-300 min-h-24"
              />
            </div>
          )}

          {/* Photo Upload Section */}
          {requiresPhoto && (
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Camera className="w-4 h-4 text-healing" />
                Photo Evidence
                <span className="text-sm text-muted-foreground">(Optional but recommended)</span>
              </Label>
              
              {!photoPreview ? (
                <div className="border-2 border-dashed border-border/30 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-2">Click to upload a photo</p>
                    <p className="text-sm text-muted-foreground">JPG, PNG up to 5MB</p>
                  </Label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Task photo"
                    className="w-full h-48 object-cover rounded-2xl"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 glass hover-glow"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 glass hover-glow"
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={isUploading || (requiresJournal && !journalEntry.trim())}
              className="flex-1 gradient-primary hover-glow text-white font-semibold"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Complete Task
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
