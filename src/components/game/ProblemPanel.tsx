import React from 'react';
import { Clock, MemoryStick, Tag } from 'lucide-react';

interface ProblemPanelProps {
  problem: any;
}

const ProblemPanel: React.FC<ProblemPanelProps> = ({ problem }) => {
  if (!problem) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-900/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30';
      case 'hard': return 'text-red-400 bg-red-900/30';
      default: return 'text-gray-400 bg-gray-700';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Problem Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-white">{problem.title}</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Tag className="h-4 w-4" />
            {problem.category}
          </div>
          {problem.constraints && (
            <>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {problem.constraints.timeLimit}ms
              </div>
              <div className="flex items-center gap-1">
                <MemoryStick className="h-4 w-4" />
                {problem.constraints.memoryLimit}MB
              </div>
            </>
          )}
        </div>
      </div>

      {/* Problem Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Description */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
          <div className="text-gray-300 leading-relaxed prose prose-invert max-w-none">
            <p>{problem.description}</p>
          </div>
        </div>

        {/* Examples */}
        {problem.examples && problem.examples.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Examples</h3>
            {problem.examples.map((example: any, index: number) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4 mb-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-1">Input:</h4>
                    <pre className="text-sm text-green-400 bg-gray-800 p-2 rounded font-mono overflow-x-auto">
                      {example.input}
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-1">Output:</h4>
                    <pre className="text-sm text-blue-400 bg-gray-800 p-2 rounded font-mono overflow-x-auto">
                      {example.output}
                    </pre>
                  </div>
                  {example.explanation && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-1">Explanation:</h4>
                      <p className="text-sm text-gray-400">{example.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Constraints */}
        {problem.constraints && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Constraints</h3>
            <div className="bg-gray-700 rounded-lg p-4">
              <ul className="text-sm text-gray-300 space-y-1">
                <li>Time Limit: {problem.constraints.timeLimit}ms</li>
                <li>Memory Limit: {problem.constraints.memoryLimit}MB</li>
                {problem.constraints.inputSize && (
                  <li>Input Size: {problem.constraints.inputSize}</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Tags */}
        {problem.tags && problem.tags.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {problem.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemPanel;