import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import MonacoEditor from './MonacoEditor';
import ProblemPanel from './ProblemPanel';
import GameStatus from './GameStatus';
import ChatPanel from './ChatPanel';
import { Clock, Send, Play } from 'lucide-react';

const GameInterface: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { currentGame, gameStatus, submitCode, socket } = useGame();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [timeLeft, setTimeLeft] = useState(0);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (gameId) {
      socket?.emit('joinGame', gameId);
    }
  }, [gameId, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleSubmissionResult = (result: any) => {
      setSubmissions(prev => [...prev, result]);
      setIsSubmitting(false);
    };

    const handleGameTimer = (data: any) => {
      setTimeLeft(data.timeLeft);
    };

    socket.on('submissionResult', handleSubmissionResult);
    socket.on('gameTimer', handleGameTimer);

    return () => {
      socket.off('submissionResult', handleSubmissionResult);
      socket.off('gameTimer', handleGameTimer);
    };
  }, [socket]);

  const handleSubmitCode = () => {
    if (code.trim() && !isSubmitting) {
      setIsSubmitting(true);
      submitCode(code, language);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentGame) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Game Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-white">
            {currentGame.problem?.title || 'Coding Challenge'}
          </h1>
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <GameStatus game={currentGame} status={gameStatus} />
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Problem Panel */}
        <div className="w-1/3 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <ProblemPanel problem={currentGame.problem} />
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
              </select>
            </div>

            <button
              onClick={handleSubmitCode}
              disabled={isSubmitting || !code.trim() || gameStatus !== 'in-progress'}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit
            </button>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1">
            <MonacoEditor
              value={code}
              onChange={setCode}
              language={language}
              theme="vs-dark"
            />
          </div>

          {/* Submissions History */}
          <div className="h-32 bg-gray-800 border-t border-gray-700 overflow-y-auto">
            <div className="px-4 py-2 border-b border-gray-700">
              <h3 className="text-sm font-medium text-gray-300">Submissions</h3>
            </div>
            <div className="px-4 py-2 space-y-1">
              {submissions.length > 0 ? (
                submissions.map((submission, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">
                      #{index + 1} - {new Date().toLocaleTimeString()}
                    </span>
                    <span className={`font-medium ${
                      submission.status === 'accepted' ? 'text-green-400' :
                      submission.status === 'wrong-answer' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {submission.score}% ({submission.testsPassed}/{submission.totalTests})
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No submissions yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Chat/Players Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <ChatPanel gameId={gameId || ''} />
        </div>
      </div>
    </div>
  );
};

export default GameInterface;