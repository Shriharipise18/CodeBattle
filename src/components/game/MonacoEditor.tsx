import React, { useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  theme?: string;
  readonly?: boolean;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language,
  theme = 'vs-dark',
  readonly = false
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 22,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      readOnly: readonly
    });

    // Set up custom themes
    monaco.editor.defineTheme('coding-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
      ],
      colors: {
        'editor.background': '#1F2937',
        'editor.foreground': '#F9FAFB',
        'editorCursor.foreground': '#3B82F6',
        'editor.lineHighlightBackground': '#374151',
        'editorLineNumber.foreground': '#6B7280',
        'editor.selectionBackground': '#3B82F6AA',
        'editor.inactiveSelectionBackground': '#374151AA',
      }
    });

    monaco.editor.setTheme('coding-dark');
  };

  const starterTemplates = {
    javascript: `function solution(input) {
    // Your code here
    return "";
}

// Example usage:
console.log(solution("test input"));`,
    
    python: `def solution(input_str):
    # Your code here
    return ""

# Example usage:
print(solution("test input"))`,
    
    java: `import java.util.*;

public class Solution {
    public static String solution(String input) {
        // Your code here
        return "";
    }
    
    public static void main(String[] args) {
        System.out.println(solution("test input"));
    }
}`,
    
    cpp: `#include <iostream>
#include <string>
#include <vector>

using namespace std;

string solution(string input) {
    // Your code here
    return "";
}

int main() {
    cout << solution("test input") << endl;
    return 0;
}`,
    
    c: `#include <stdio.h>
#include <string.h>

char* solution(char* input) {
    // Your code here
    return "";
}

int main() {
    printf("%s\\n", solution("test input"));
    return 0;
}`
  };

  // Set starter template if value is empty
  useEffect(() => {
    if (!value && !readonly && starterTemplates[language as keyof typeof starterTemplates]) {
      onChange(starterTemplates[language as keyof typeof starterTemplates]);
    }
  }, [language, value, readonly, onChange]);

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={(newValue) => onChange(newValue || '')}
      onMount={handleEditorDidMount}
      theme={theme}
      options={{
        selectOnLineNumbers: true,
        automaticLayout: true,
      }}
      loading={
        <div className="h-full bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      }
    />
  );
};

export default MonacoEditor;