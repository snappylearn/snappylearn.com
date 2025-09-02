import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Shield, Paperclip, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  onSend: (message: string, attachments?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function ChatInput({ onSend, disabled = false, placeholder = "Ask me anything...", value, onChange }: ChatInputProps) {
  const [message, setMessage] = useState("");
  
  // Use controlled value if provided, otherwise use local state
  const inputValue = value !== undefined ? value : message;
  const handleInputChange = (newValue: string) => {
    if (onChange) {
      onChange(newValue);
    } else {
      setMessage(newValue);
    }
  };
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSubmit = () => {
    if ((inputValue.trim() || attachments.length > 0) && !disabled) {
      onSend(inputValue.trim(), attachments);
      handleInputChange("");
      setAttachments([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    
    for (const file of files) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB. Please select a smaller file.`,
          variant: "destructive",
        });
        continue;
      }
      
      // Check file type
      const allowedTypes = [
        'text/plain',
        'text/markdown',
        'text/csv',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Unsupported file type",
          description: `${file.name} is not a supported file type. Please select a text, PDF, or document file.`,
          variant: "destructive",
        });
        continue;
      }
      
      validFiles.push(file);
    }
    
    setAttachments(prev => [...prev, ...validFiles]);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  return (
    <div className="w-full max-w-2xl">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center bg-gray-100 rounded-lg px-3 py-2 text-sm">
              <Paperclip className="w-4 h-4 mr-2 text-gray-500" />
              <span className="truncate max-w-32">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-4 w-4 p-0 hover:bg-gray-200"
                onClick={() => removeAttachment(index)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.csv,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full p-4 pl-12 pr-20 border-2 border-gray-200 rounded-xl resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[60px] max-h-32"
          rows={1}
        />
        
        {/* Attachment Button - Inside chatbox, left side */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-3 bottom-3 h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          onClick={triggerFileInput}
          disabled={disabled}
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        {/* Send Button - Inside chatbox, right side */}
        <Button
          onClick={handleSubmit}
          disabled={(!inputValue.trim() && attachments.length === 0) || disabled}
          size="sm"
          className="absolute right-3 bottom-3 h-8 w-8 p-0 bg-primary hover:bg-primary/90"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
        <span>Press Enter to send, Shift+Enter for new line</span>
        <span className="flex items-center space-x-1">
          <Shield className="w-3 h-3" />
          <span>Secure & Private</span>
        </span>
      </div>
    </div>
  );
}
