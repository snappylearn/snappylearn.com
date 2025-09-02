import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, File, X, Loader2, Plus, FileText, PlusCircle, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { documentsApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface AddDocumentDropdownProps {
  collectionId: number;
  onComplete?: () => void;
}

const textContentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

type TextContentForm = z.infer<typeof textContentSchema>;

export function AddDocumentDropdown({ collectionId, onComplete }: AddDocumentDropdownProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [savingText, setSavingText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<TextContentForm>({
    resolver: zodResolver(textContentSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const allowedTypes = ['text/plain', 'application/pdf'];
      return allowedTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Some files were skipped",
        description: "Only PDF and TXT files are supported",
        variant: "destructive",
      });
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => {
        const allowedTypes = ['text/plain', 'application/pdf'];
        return allowedTypes.includes(file.type);
      });

      if (validFiles.length !== files.length) {
        toast({
          title: "Some files were skipped",
          description: "Only PDF and TXT files are supported",
          variant: "destructive",
        });
      }

      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    let successCount = 0;

    try {
      for (const file of selectedFiles) {
        try {
          await documentsApi.upload(collectionId, file);
          successCount++;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }

      if (successCount > 0) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/collections", collectionId, "documents"] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ["/api/collections"] 
        });
        
        toast({
          title: "Upload completed",
          description: `${successCount} of ${selectedFiles.length} files uploaded successfully`,
        });

        setSelectedFiles([]);
        setShowUploadDialog(false);
        onComplete?.();
      }

      if (successCount < selectedFiles.length) {
        toast({
          title: "Some uploads failed",
          description: `${selectedFiles.length - successCount} files failed to upload`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleTextContentSubmit = async (data: TextContentForm) => {
    setSavingText(true);
    try {
      // Create a text file from the form data
      const textContent = data.content;
      const blob = new Blob([textContent], { type: 'text/plain' });
      const file = new File([blob], `${data.title}.txt`, { type: 'text/plain' }) as File;
      
      await documentsApi.upload(collectionId, file);
      
      queryClient.invalidateQueries({ 
        queryKey: ["/api/collections", collectionId, "documents"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/collections"] 
      });
      
      toast({
        title: "Text content added",
        description: "Your text content has been saved successfully",
      });

      form.reset();
      setShowTextDialog(false);
      onComplete?.();
    } catch (error) {
      toast({
        title: "Failed to save",
        description: "Failed to save text content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingText(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Document
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowTextDialog(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Add Text Content
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Card 
              className={`border-2 border-dashed transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <CardContent className="p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop files here or click to browse
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Supports: PDF and TXT files (max 10MB each)
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  disabled={uploading}
                >
                  Choose Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Selected Files:</h4>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <File className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      onClick={() => removeFile(index)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      disabled={uploading}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  onClick={uploadFiles}
                  disabled={uploading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Text Content Dialog */}
      <Dialog open={showTextDialog} onOpenChange={setShowTextDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Text Content</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleTextContentSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Enter document title"
                disabled={savingText}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                {...form.register("content")}
                placeholder="Enter your text content here..."
                rows={10}
                disabled={savingText}
              />
              {form.formState.errors.content && (
                <p className="text-sm text-red-600">{form.formState.errors.content.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTextDialog(false)}
                disabled={savingText}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingText}
                className="bg-primary hover:bg-primary/90"
              >
                {savingText ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Content"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}