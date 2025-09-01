import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Code, Copy, Eye } from "lucide-react";

interface ArtifactViewerProps {
  artifact: {
    html: string;
    title: string;
    type?: string;
  };
  onClose: () => void;
  isOpen: boolean;
}

export function ArtifactViewer({ artifact, onClose, isOpen }: ArtifactViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && iframeRef.current && artifact.html) {
      const iframe = iframeRef.current;
      
      // Create a complete HTML document with TailwindCSS
      const fullHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${artifact.title}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: white;
            }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>
          ${artifact.html}
        </body>
        </html>
      `;
      
      // Write the HTML to the iframe
      iframe.srcdoc = fullHtml;
    }
  }, [isOpen, artifact.html, artifact.title]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(artifact.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-1/2 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Code className="w-4 h-4 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{artifact.title}</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCode(!showCode)}
            className="text-gray-500 hover:text-gray-700"
          >
            {showCode ? <Eye className="w-4 h-4" /> : <Code className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="text-gray-500 hover:text-gray-700"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {showCode ? (
          <div className="h-full overflow-auto p-4">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
              <code>{artifact.html}</code>
            </pre>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            title={artifact.title}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Live interactive artifact</span>
          {copied && <span className="text-green-600">Copied to clipboard!</span>}
        </div>
      </div>
    </div>
  );
}