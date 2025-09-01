import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Code, Calculator, FileText, MessageSquare, BarChart3, 
  GitBranch, Filter, Search, Plus, Edit, Trash2, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/sidebar";
import { ArtifactViewer } from "@/components/artifact-viewer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Artifact } from "@shared/schema";
import snappyLearnLogo from "@assets/Transparent Snappy Logo_1751027278079.png";



const artifactTypes = [
  { value: "code_playground", label: "Code Playground", icon: Code, color: "bg-blue-500" },
  { value: "math_visualizer", label: "Math Visualizer", icon: Calculator, color: "bg-green-500" },
  { value: "document_generator", label: "Document Generator", icon: FileText, color: "bg-purple-500" },
  { value: "quiz_builder", label: "Quiz Builder", icon: MessageSquare, color: "bg-orange-500" },
  { value: "presentation_maker", label: "Presentation Maker", icon: BarChart3, color: "bg-red-500" },
  { value: "data_visualizer", label: "Data Visualizer", icon: BarChart3, color: "bg-cyan-500" },
  { value: "mind_map_creator", label: "Mind Map Creator", icon: GitBranch, color: "bg-pink-500" },
  { value: "interactive", label: "Interactive Tool", icon: Code, color: "bg-indigo-500" },
];

// Sample artifacts data - moved outside the component to be accessible by both functions
const sampleArtifacts = {
  'code_playground': {
    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Playground</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="p-6 bg-gray-50">
    <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold mb-6 text-gray-800">Code Playground</h1>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg p-6 shadow-lg">
                <h2 class="text-xl font-semibold mb-4">HTML</h2>
                <textarea id="html" class="w-full h-32 p-3 border rounded-lg font-mono text-sm" placeholder="Enter HTML..."><div class="p-4 bg-blue-100 rounded-lg">
  <h2 class="text-xl font-bold text-blue-800">Hello World!</h2>
  <p class="text-blue-600">This is a sample HTML content.</p>
  <button id="clickMe" class="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Click Me!</button>
</div></textarea>
                
                <h2 class="text-xl font-semibold mb-4 mt-6">CSS</h2>
                <textarea id="css" class="w-full h-32 p-3 border rounded-lg font-mono text-sm" placeholder="Enter CSS...">body { font-family: Arial, sans-serif; }
.highlight { background-color: #fef3c7; padding: 8px; border-radius: 4px; }
.animate-bounce { animation: bounce 1s infinite; }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }</textarea>
                
                <h2 class="text-xl font-semibold mb-4 mt-6">JavaScript</h2>
                <textarea id="js" class="w-full h-32 p-3 border rounded-lg font-mono text-sm" placeholder="Enter JavaScript...">document.addEventListener('DOMContentLoaded', function() {
  const button = document.getElementById('clickMe');
  let clicks = 0;
  
  button.addEventListener('click', function() {
    clicks++;
    button.textContent = \`Clicked \${clicks} times!\`;
    button.classList.add('animate-bounce');
    setTimeout(() => button.classList.remove('animate-bounce'), 1000);
  });
});</textarea>
                
                <button onclick="runCode()" class="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">Run Code</button>
            </div>
            
            <div class="bg-white rounded-lg p-6 shadow-lg">
                <h2 class="text-xl font-semibold mb-4">Output</h2>
                <div id="output" class="w-full h-96 border rounded-lg bg-gray-50"></div>
            </div>
        </div>
    </div>
    
    <script>
        function runCode() {
            const html = document.getElementById('html').value;
            const css = document.getElementById('css').value;
            const js = document.getElementById('js').value;
            
            const output = document.getElementById('output');
            const fullCode = \`
                <style>\${css}</style>
                \${html}
                <script>\${js}<\/script>
            \`;
            
            output.innerHTML = '';
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            output.appendChild(iframe);
            
            iframe.contentDocument.write(fullCode);
            iframe.contentDocument.close();
        }
        
        // Run code on page load
        runCode();
    </script>
</body>
</html>`,
    title: 'Code Playground'
  },
  'math_visualizer': {
    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Math Visualizer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</head>
<body class="p-6 bg-gray-50">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-6 text-gray-800">Math Visualizer</h1>
        <div class="bg-white rounded-lg p-6 shadow-lg">
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Enter Function (e.g., x^2, sin(x), etc.)</label>
                <input type="text" id="functionInput" class="w-full p-3 border rounded-lg" placeholder="x^2" value="x^2">
                <button onclick="plotFunction()" class="mt-2 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600">Plot Function</button>
            </div>
            <div id="plot" class="w-full h-96 border rounded-lg"></div>
        </div>
    </div>
    
    <script>
        function plotFunction() {
            const funcStr = document.getElementById('functionInput').value;
            const x = [];
            const y = [];
            
            try {
                for (let i = -10; i <= 10; i += 0.1) {
                    x.push(i);
                    let result = eval(funcStr.replace(/x/g, i).replace(/sin/g, 'Math.sin').replace(/cos/g, 'Math.cos').replace(/tan/g, 'Math.tan').replace(/\\^/g, '**'));
                    y.push(result);
                }
                
                const trace = {
                    x: x,
                    y: y,
                    type: 'scatter',
                    mode: 'lines',
                    name: funcStr
                };
                
                const layout = {
                    title: \`Graph of \${funcStr}\`,
                    xaxis: { title: 'x' },
                    yaxis: { title: 'y' },
                    grid: true
                };
                
                Plotly.newPlot('plot', [trace], layout);
            } catch (error) {
                alert('Invalid function. Please check your input.');
            }
        }
        
        plotFunction();
    </script>
</body>
</html>`,
    title: 'Math Visualizer'
  },
  'quiz_builder': {
    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quiz Builder</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="p-6 bg-gray-50">
    <div class="max-w-2xl mx-auto">
        <h1 class="text-3xl font-bold mb-6 text-gray-800">Interactive Quiz</h1>
        <div id="quizContainer" class="bg-white rounded-lg p-6 shadow-lg">
            <div id="questionContainer"></div>
            <div id="optionsContainer" class="mt-4"></div>
            <div id="resultContainer" class="mt-4 hidden"></div>
            <button id="nextBtn" onclick="nextQuestion()" class="mt-4 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 hidden">Next Question</button>
        </div>
        <div id="scoreContainer" class="mt-6 bg-white rounded-lg p-6 shadow-lg hidden">
            <h2 class="text-xl font-semibold mb-2">Quiz Complete!</h2>
            <p id="finalScore" class="text-lg"></p>
            <button onclick="restartQuiz()" class="mt-4 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600">Restart Quiz</button>
        </div>
    </div>
    
    <script>
        const quizData = [
            {
                question: "What is the capital of France?",
                options: ["London", "Berlin", "Paris", "Madrid"],
                correct: 2
            },
            {
                question: "Which planet is closest to the Sun?",
                options: ["Venus", "Mercury", "Earth", "Mars"],
                correct: 1
            },
            {
                question: "What is 2 + 2?",
                options: ["3", "4", "5", "6"],
                correct: 1
            }
        ];
        
        let currentQuestion = 0;
        let score = 0;
        let selectedAnswer = null;
        
        function loadQuestion() {
            const question = quizData[currentQuestion];
            document.getElementById('questionContainer').innerHTML = \`
                <h2 class="text-xl font-semibold mb-4">Question \${currentQuestion + 1} of \${quizData.length}</h2>
                <p class="text-lg mb-4">\${question.question}</p>
            \`;
            
            const optionsHtml = question.options.map((option, index) => \`
                <div class="mb-2">
                    <button onclick="selectAnswer(\${index})" class="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors" id="option\${index}">
                        \${option}
                    </button>
                </div>
            \`).join('');
            
            document.getElementById('optionsContainer').innerHTML = optionsHtml;
            document.getElementById('resultContainer').classList.add('hidden');
            document.getElementById('nextBtn').classList.add('hidden');
            selectedAnswer = null;
        }
        
        function selectAnswer(index) {
            selectedAnswer = index;
            const question = quizData[currentQuestion];
            const isCorrect = index === question.correct;
            
            for (let i = 0; i < question.options.length; i++) {
                const option = document.getElementById(\`option\${i}\`);
                option.classList.remove('bg-green-200', 'bg-red-200');
                if (i === question.correct) {
                    option.classList.add('bg-green-200');
                } else if (i === index && !isCorrect) {
                    option.classList.add('bg-red-200');
                }
                option.disabled = true;
            }
            
            if (isCorrect) {
                score++;
                document.getElementById('resultContainer').innerHTML = '<p class="text-green-600 font-semibold">Correct!</p>';
            } else {
                document.getElementById('resultContainer').innerHTML = '<p class="text-red-600 font-semibold">Incorrect!</p>';
            }
            
            document.getElementById('resultContainer').classList.remove('hidden');
            document.getElementById('nextBtn').classList.remove('hidden');
        }
        
        function nextQuestion() {
            currentQuestion++;
            if (currentQuestion < quizData.length) {
                loadQuestion();
            } else {
                showResults();
            }
        }
        
        function showResults() {
            document.getElementById('quizContainer').classList.add('hidden');
            document.getElementById('scoreContainer').classList.remove('hidden');
            document.getElementById('finalScore').textContent = \`You scored \${score} out of \${quizData.length}!\`;
        }
        
        function restartQuiz() {
            currentQuestion = 0;
            score = 0;
            document.getElementById('quizContainer').classList.remove('hidden');
            document.getElementById('scoreContainer').classList.add('hidden');
            loadQuestion();
        }
        
        loadQuestion();
    </script>
</body>
</html>`,
    title: 'Interactive Quiz'
  }
};

export default function ArtifactsPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedArtifact, setSelectedArtifact] = useState<{html: string, title: string} | null>(null);
  const [showArtifactViewer, setShowArtifactViewer] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState("inspiration");
  
  const queryClient = useQueryClient();

  // Fetch artifacts
  const { data: artifacts = [], isLoading } = useQuery({
    queryKey: ["/api/artifacts", filterType !== "all" ? filterType : undefined],
    queryFn: () => apiRequest(`/api/artifacts${filterType !== "all" ? `?type=${filterType}` : ""}`)
  });

  // Delete artifact mutation
  const deleteArtifact = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/artifacts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artifacts"] });
    }
  });

  // Filter artifacts based on search term
  const filteredArtifacts = artifacts.filter((artifact: Artifact) =>
    artifact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artifact.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewArtifact = (artifact: Artifact) => {
    setSelectedArtifact({ 
      html: artifact.content, 
      title: artifact.title 
    });
    setShowArtifactViewer(true);
  };

  const handleDeleteArtifact = (id: number) => {
    if (confirm("Are you sure you want to delete this artifact?")) {
      deleteArtifact.mutate(id);
    }
  };

  const handleViewSampleArtifact = (type: string) => {
    const artifact = sampleArtifacts[type];
    if (artifact) {
      setSelectedArtifact(artifact);
      setShowArtifactViewer(true);
    }
  };

  const getTypeInfo = (type: string) => {
    return artifactTypes.find(t => t.value === type) || artifactTypes[0];
  };

  const renderArtifactCard = (artifact: Artifact) => {
    const typeInfo = getTypeInfo(artifact.type);
    const IconComponent = typeInfo.icon;

    return (
      <Card key={artifact.id} className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${typeInfo.color} text-white`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{artifact.title}</CardTitle>
                <CardDescription>{artifact.description}</CardDescription>
              </div>
            </div>
            <Badge variant="secondary">{typeInfo.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Created {new Date(artifact.createdAt).toLocaleDateString()}
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleViewArtifact(artifact)}
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteArtifact(artifact.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={snappyLearnLogo} alt="SnappyLearn" className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Artifacts</h1>
                <p className="text-sm text-gray-600">Interactive educational tools and content</p>
              </div>
            </div>
            <Button 
              onClick={() => setActiveTab("create")}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Artifact
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Artifacts</h1>
              <p className="text-gray-600">Create and manage your interactive educational tools</p>
            </div>
            <Button 
              onClick={() => setActiveTab("create")}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              + New artifact
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="inspiration">Inspiration</TabsTrigger>
              <TabsTrigger value="browse">My artifacts</TabsTrigger>
              <TabsTrigger value="create">Create</TabsTrigger>
            </TabsList>

            <TabsContent value="inspiration" className="mt-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Get inspired with these sample artifacts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Sample Artifacts */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleViewSampleArtifact('code_playground')}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 rounded-lg bg-blue-500 text-white group-hover:scale-110 transition-transform">
                          <Code className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Code Playground</CardTitle>
                          <CardDescription>Interactive coding environment</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        Create and run code snippets in a live environment with syntax highlighting.
                      </p>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab("create");
                        }}
                        className="w-full bg-blue-500 hover:bg-blue-600"
                      >
                        Create Code Playground
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleViewSampleArtifact('math_visualizer')}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 rounded-lg bg-green-500 text-white group-hover:scale-110 transition-transform">
                          <Calculator className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Math Visualizer</CardTitle>
                          <CardDescription>Mathematical calculations & graphs</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        Visualize mathematical functions and equations with interactive graphs.
                      </p>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab("create");
                        }}
                        className="w-full bg-green-500 hover:bg-green-600"
                      >
                        Create Math Visualizer
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleViewSampleArtifact('quiz_builder')}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 rounded-lg bg-orange-500 text-white group-hover:scale-110 transition-transform">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Quiz Builder</CardTitle>
                          <CardDescription>Create interactive quizzes</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        Build engaging quizzes with multiple question types and instant feedback.
                      </p>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab("create");
                        }}
                        className="w-full bg-orange-500 hover:bg-orange-600"
                      >
                        Create Quiz Builder
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="browse" className="mt-6">
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search artifacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {artifactTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Artifacts Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredArtifacts.length === 0 ? (
                <div className="text-center py-12">
                  <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No artifacts found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filterType !== "all" 
                      ? "Try adjusting your search or filter criteria"
                      : "Start by creating your first artifact or chatting with AI to generate interactive content"
                    }
                  </p>
                  <Button 
                    onClick={() => setActiveTab("create")}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Artifact
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArtifacts.map(renderArtifactCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="create" className="mt-6">
              <ArtifactCreationTools />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Artifact Viewer Modal */}
      {showArtifactViewer && selectedArtifact && (
        <ArtifactViewer 
          artifact={selectedArtifact}
          onClose={() => {
            setShowArtifactViewer(false);
            setSelectedArtifact(null);
          }}
          isOpen={showArtifactViewer}
        />
      )}
    </div>
  );
}

// Artifact Creation Tools Component
function ArtifactCreationTools() {
  const [, setLocation] = useLocation();

  const tools = [
    {
      type: "code_playground",
      title: "Code Playground",
      description: "Interactive code editor with syntax highlighting",
      icon: Code,
      color: "bg-blue-500",
      template: `<!-- Artifact Title: Interactive Code Playground -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Playground</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism.min.css" rel="stylesheet">
</head>
<body class="p-6 bg-gray-50">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-6 text-gray-800">Code Playground</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">HTML</label>
                <textarea id="htmlCode" class="w-full h-40 p-3 border rounded-lg font-mono text-sm" placeholder="Enter HTML code..."></textarea>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">CSS</label>
                <textarea id="cssCode" class="w-full h-40 p-3 border rounded-lg font-mono text-sm" placeholder="Enter CSS code..."></textarea>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">JavaScript</label>
                <textarea id="jsCode" class="w-full h-40 p-3 border rounded-lg font-mono text-sm" placeholder="Enter JavaScript code..."></textarea>
            </div>
            <div>
                <button onclick="runCode()" class="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 mb-4">Run Code</button>
                <div id="output" class="w-full h-40 border rounded-lg bg-white"></div>
            </div>
        </div>
    </div>
    
    <script>
        function runCode() {
            const html = document.getElementById('htmlCode').value;
            const css = document.getElementById('cssCode').value;
            const js = document.getElementById('jsCode').value;
            
            const output = document.getElementById('output');
            const fullCode = \`
                <style>\${css}</style>
                \${html}
                <script>\${js}<\/script>
            \`;
            
            output.innerHTML = '';
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            output.appendChild(iframe);
            
            iframe.contentDocument.write(fullCode);
            iframe.contentDocument.close();
        }
    </script>
</body>
</html>`
    },
    {
      type: "math_visualizer",
      title: "Math Visualizer",
      description: "Interactive graphing calculator and equation solver",
      icon: Calculator,
      color: "bg-green-500",
      template: `<!-- Artifact Title: Math Visualizer -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Math Visualizer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</head>
<body class="p-6 bg-gray-50">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-6 text-gray-800">Math Visualizer</h1>
        <div class="bg-white rounded-lg p-6 shadow-lg">
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Enter Function (e.g., x^2, sin(x), etc.)</label>
                <input type="text" id="functionInput" class="w-full p-3 border rounded-lg" placeholder="x^2" value="x^2">
                <button onclick="plotFunction()" class="mt-2 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600">Plot Function</button>
            </div>
            <div id="plot" class="w-full h-96 border rounded-lg"></div>
        </div>
    </div>
    
    <script>
        function plotFunction() {
            const funcStr = document.getElementById('functionInput').value;
            const x = [];
            const y = [];
            
            try {
                for (let i = -10; i <= 10; i += 0.1) {
                    x.push(i);
                    // Simple function evaluation (replace with proper math parser for production)
                    let result = eval(funcStr.replace(/x/g, i).replace(/sin/g, 'Math.sin').replace(/cos/g, 'Math.cos').replace(/tan/g, 'Math.tan').replace(/\\^/g, '**'));
                    y.push(result);
                }
                
                const trace = {
                    x: x,
                    y: y,
                    type: 'scatter',
                    mode: 'lines',
                    name: funcStr
                };
                
                const layout = {
                    title: \`Graph of \${funcStr}\`,
                    xaxis: { title: 'x' },
                    yaxis: { title: 'y' },
                    grid: true
                };
                
                Plotly.newPlot('plot', [trace], layout);
            } catch (error) {
                alert('Invalid function. Please check your input.');
            }
        }
        
        // Plot default function on load
        plotFunction();
    </script>
</body>
</html>`
    },
    {
      type: "quiz_builder",
      title: "Quiz Builder",
      description: "Create interactive quizzes and flashcards",
      icon: MessageSquare,
      color: "bg-orange-500",
      template: `<!-- Artifact Title: Interactive Quiz Builder -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quiz Builder</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="p-6 bg-gray-50">
    <div class="max-w-2xl mx-auto">
        <h1 class="text-3xl font-bold mb-6 text-gray-800">Interactive Quiz</h1>
        <div id="quizContainer" class="bg-white rounded-lg p-6 shadow-lg">
            <div id="questionContainer"></div>
            <div id="optionsContainer" class="mt-4"></div>
            <div id="resultContainer" class="mt-4 hidden"></div>
            <button id="nextBtn" onclick="nextQuestion()" class="mt-4 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 hidden">Next Question</button>
        </div>
    </div>
    
    <script>
        const quizData = [
            {
                question: "What is the capital of France?",
                options: ["London", "Berlin", "Paris", "Madrid"],
                correct: 2
            },
            {
                question: "Which planet is closest to the Sun?",
                options: ["Venus", "Mercury", "Earth", "Mars"],
                correct: 1
            },
            {
                question: "What is 2 + 2?",
                options: ["3", "4", "5", "6"],
                correct: 1
            }
        ];
        
        let currentQuestion = 0;
        let score = 0;
        
        function loadQuestion() {
            const question = quizData[currentQuestion];
            document.getElementById('questionContainer').innerHTML = \`
                <h2 class="text-xl font-semibold mb-4">Question \${currentQuestion + 1} of \${quizData.length}</h2>
                <p class="text-lg mb-4">\${question.question}</p>
            \`;
            
            const optionsHtml = question.options.map((option, index) => \`
                <button onclick="selectAnswer(\${index})" class="block w-full p-3 mb-2 border rounded-lg hover:bg-gray-50 text-left">
                    \${option}
                </button>
            \`).join('');
            
            document.getElementById('optionsContainer').innerHTML = optionsHtml;
            document.getElementById('resultContainer').classList.add('hidden');
            document.getElementById('nextBtn').classList.add('hidden');
        }
        
        function selectAnswer(selected) {
            const question = quizData[currentQuestion];
            const options = document.getElementById('optionsContainer').children;
            
            for (let i = 0; i < options.length; i++) {
                options[i].disabled = true;
                if (i === question.correct) {
                    options[i].classList.add('bg-green-200');
                } else if (i === selected && selected !== question.correct) {
                    options[i].classList.add('bg-red-200');
                }
            }
            
            if (selected === question.correct) {
                score++;
                document.getElementById('resultContainer').innerHTML = '<p class="text-green-600 font-semibold">Correct!</p>';
            } else {
                document.getElementById('resultContainer').innerHTML = '<p class="text-red-600 font-semibold">Incorrect!</p>';
            }
            
            document.getElementById('resultContainer').classList.remove('hidden');
            
            if (currentQuestion < quizData.length - 1) {
                document.getElementById('nextBtn').classList.remove('hidden');
            } else {
                document.getElementById('nextBtn').innerHTML = 'Show Results';
                document.getElementById('nextBtn').classList.remove('hidden');
            }
        }
        
        function nextQuestion() {
            currentQuestion++;
            
            if (currentQuestion < quizData.length) {
                loadQuestion();
            } else {
                showResults();
            }
        }
        
        function showResults() {
            document.getElementById('quizContainer').innerHTML = \`
                <h2 class="text-2xl font-bold mb-4">Quiz Complete!</h2>
                <p class="text-lg mb-4">Your score: \${score} out of \${quizData.length}</p>
                <p class="text-lg mb-4">Percentage: \${Math.round((score / quizData.length) * 100)}%</p>
                <button onclick="location.reload()" class="bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600">Take Quiz Again</button>
            \`;
        }
        
        // Load first question
        loadQuestion();
    </script>
</body>
</html>`
    }
  ];

  const handleToolClick = (tool: any) => {
    // Open the sample artifact in the viewer instead of navigating to a new chat
    const sampleArtifact = sampleArtifacts[tool.type];
    if (sampleArtifact) {
      setSelectedArtifact(sampleArtifact);
      setShowArtifactViewer(true);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tools.map((tool) => {
        const IconComponent = tool.icon;
        return (
          <Card key={tool.type} className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${tool.color} text-white group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                onClick={() => handleToolClick(tool)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create {tool.title}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}



function getArtifactTypeInfo(type: string) {
  const typeInfo = artifactTypes.find(t => t.value === type);
  return typeInfo || { icon: Code, color: "bg-gray-500" };
}