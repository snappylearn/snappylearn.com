import { useState, useEffect } from "react";
import { ChevronLeft, X, Code } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArtifactManagerProps {
  onArtifactDetected: (artifactHtml: string, messageWithoutArtifact: string) => void;
}

export interface ArtifactData {
  html: string;
  title: string;
}

export function ArtifactManager({ onArtifactDetected }: ArtifactManagerProps) {
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);
  const [currentArtifact, setCurrentArtifact] = useState<ArtifactData | null>(null);
  const [showToggle, setShowToggle] = useState(false);

  // Function to process LLM responses and detect artifacts
  const processLLMResponse = (response: string): string => {
    const artifactMatch = response.match(/\[ARTIFACT_START\]([\s\S]*?)\[ARTIFACT_END\]/);
    
    if (artifactMatch) {
      const artifactHtml = artifactMatch[1];
      const messageWithoutArtifact = response.replace(/\[ARTIFACT_START\][\s\S]*?\[ARTIFACT_END\]/, '').trim();
      
      // Extract title from artifact if available
      const titleMatch = artifactHtml.match(/<!-- Artifact Title: (.*?) -->/);
      const title = titleMatch ? titleMatch[1] : 'Interactive Content';
      
      // Store the artifact
      setCurrentArtifact({ html: artifactHtml, title });
      setShowToggle(true);
      
      // Call the callback with the artifact and cleaned message
      onArtifactDetected(artifactHtml, messageWithoutArtifact);
      
      return messageWithoutArtifact;
    }
    
    return response;
  };

  const openArtifact = () => {
    if (currentArtifact) {
      setIsArtifactOpen(true);
    }
  };

  const closeArtifact = () => {
    setIsArtifactOpen(false);
  };

  // Expose the processLLMResponse function globally for use in other components
  useEffect(() => {
    (window as any).artifactManager = { processLLMResponse };
  }, []);

  return (
    <>
      {/* Artifact Toggle Button */}
      {showToggle && !isArtifactOpen && (
        <Button
          onClick={openArtifact}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white p-2 rounded-l-lg shadow-lg hover:bg-blue-600 z-40 transition-all duration-300 hover:transform hover:-translate-x-1"
          size="sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}

      {/* Artifact Panel */}
      {isArtifactOpen && currentArtifact && (
        <div className="fixed right-0 top-0 w-1/2 h-full bg-white border-l border-gray-300 shadow-xl z-50 flex flex-col">
          {/* Artifact Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Code className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-800">Artifact</h3>
            </div>
            <Button
              onClick={closeArtifact}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Artifact Content */}
          <div className="flex-1 overflow-hidden">
            <iframe
              srcDoc={currentArtifact.html}
              className="w-full h-full border-none"
              sandbox="allow-scripts allow-same-origin"
              title={currentArtifact.title}
            />
          </div>
        </div>
      )}

      {/* Mobile responsiveness - handled by Tailwind classes */}
    </>
  );
}

// Artifact Card Component for chat messages
interface ArtifactCardProps {
  title: string;
  onViewArtifact: () => void;
}

export function ArtifactCard({ title, onViewArtifact }: ArtifactCardProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 my-3 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700 flex items-center">
            <Code className="w-4 h-4 mr-1" />
            Artifact Generated
          </p>
          <p className="text-lg font-semibold text-gray-800">{title}</p>
        </div>
        <Button
          onClick={onViewArtifact}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors hover:transform hover:translate-y-[-1px]"
          size="sm"
        >
          View Artifact
        </Button>
      </div>
    </div>
  );
}