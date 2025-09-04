export const formatTime = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return 'text-green-400 bg-green-900/30 border-green-500';
    case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500';
    case 'hard': return 'text-red-400 bg-red-900/30 border-red-500';
    default: return 'text-gray-400 bg-gray-700 border-gray-600';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'waiting': return 'text-yellow-400 bg-yellow-900/30';
    case 'starting': return 'text-orange-400 bg-orange-900/30';
    case 'in-progress': return 'text-green-400 bg-green-900/30';
    case 'finished': return 'text-gray-400 bg-gray-700';
    default: return 'text-gray-400 bg-gray-700';
  }
};

export const calculateWinRate = (gamesWon: number, gamesPlayed: number): number => {
  return gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
};

export const formatRating = (rating: number): { text: string; color: string } => {
  if (rating >= 2400) return { text: 'Grandmaster', color: 'text-red-400' };
  if (rating >= 2100) return { text: 'International Master', color: 'text-purple-400' };
  if (rating >= 1900) return { text: 'Master', color: 'text-blue-400' };
  if (rating >= 1600) return { text: 'Expert', color: 'text-green-400' };
  if (rating >= 1200) return { text: 'Specialist', color: 'text-yellow-400' };
  return { text: 'Newbie', color: 'text-gray-400' };
};

export const getLanguageConfig = (language: string) => {
  const configs = {
    javascript: { 
      name: 'JavaScript',
      monaco: 'javascript',
      extension: '.js',
      color: 'text-yellow-400'
    },
    python: { 
      name: 'Python',
      monaco: 'python', 
      extension: '.py',
      color: 'text-blue-400'
    },
    java: { 
      name: 'Java',
      monaco: 'java',
      extension: '.java',
      color: 'text-red-400'
    },
    cpp: { 
      name: 'C++',
      monaco: 'cpp',
      extension: '.cpp', 
      color: 'text-purple-400'
    },
    c: { 
      name: 'C',
      monaco: 'c',
      extension: '.c',
      color: 'text-green-400'
    }
  };
  
  return configs[language as keyof typeof configs] || configs.javascript;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};