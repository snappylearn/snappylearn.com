import { Loader2 } from "lucide-react";

export function ChatLoading() {
  return (
    <div className="flex items-start space-x-4 p-4">
      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-purple-600">SL</span>
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
          <span className="text-sm text-gray-600">SnappyLearn is thinking...</span>
        </div>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}