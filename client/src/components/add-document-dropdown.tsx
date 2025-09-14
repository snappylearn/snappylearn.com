import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, FileText, ChevronDown } from "lucide-react";
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
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [savingText, setSavingText] = useState(false);
  const { toast } = useToast();

  const form = useForm<TextContentForm>({
    resolver: zodResolver(textContentSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });


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
          <DropdownMenuItem onClick={() => setShowTextDialog(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Add Text Content
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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