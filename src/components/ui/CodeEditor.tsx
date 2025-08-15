import React, { useRef, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { PlayCircle, RotateCcw, Copy, Scissors, ClipboardPaste, MoreHorizontal, Type, Undo2, Redo2 } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onRun?: () => void;
  onReset?: () => void;
  isRunning?: boolean;
  isDisabled?: boolean;
  height?: string;
  theme?: 'vs-dark' | 'light' | 'vs';
  hideButtons?: boolean;
  hideHeader?: boolean;
  hideStats?: boolean;
  hideTips?: boolean;
  minimal?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  onRun,
  onReset,
  isRunning = false,
  isDisabled = false,
  height = '400px',
  theme = 'vs-dark',
  hideButtons = false,
  hideHeader = false,
  hideStats = false,
  hideTips = false,
  minimal = false
}) => {
  const editorRef = useRef<any>(null);
  const [showMobileToolbar, setShowMobileToolbar] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Mobile touch handlers
  const handleTouchStart = useCallback((_e: TouchEvent) => {
    if (!isMobile || !editorRef.current) return;
    
    const timer = setTimeout(() => {
      setShowMobileToolbar(true);
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press
    
    setLongPressTimer(timer);
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  // Mobile editor actions
  const mobileActions = {
    selectAll: () => {
      if (editorRef.current) {
        editorRef.current.getAction('editor.action.selectAll')?.run();
      }
    },
    copy: () => {
      if (editorRef.current) {
        editorRef.current.getAction('editor.action.clipboardCopyAction')?.run();
      }
    },
    cut: () => {
      if (editorRef.current) {
        editorRef.current.getAction('editor.action.clipboardCutAction')?.run();
      }
    },
    paste: () => {
      if (editorRef.current) {
        editorRef.current.getAction('editor.action.clipboardPasteAction')?.run();
      }
    },
    undo: () => {
      if (editorRef.current) {
        editorRef.current.getAction('undo')?.run();
      }
    },
    redo: () => {
      if (editorRef.current) {
        editorRef.current.getAction('redo')?.run();
      }
    },
    format: () => {
      if (editorRef.current) {
        editorRef.current.getAction('editor.action.formatDocument')?.run();
      }
    },
    find: () => {
      if (editorRef.current) {
        editorRef.current.getAction('actions.find')?.run();
      }
    }
  };

  // Language mapping for Monaco Editor
  const getMonacoLanguage = (lang: string): string => {
    const languageMap: { [key: string]: string } = {
      'javascript': 'javascript',
      'python': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'csharp': 'csharp',
      'go': 'go',
      'typescript': 'typescript'
    };
    return languageMap[lang] || 'javascript';
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Mobile-specific initialization
    const isMobileDevice = window.innerWidth < 768;
    setIsMobile(isMobileDevice);
    
    // Force immediate layout for mobile
    if (isMobileDevice) {
      editor.layout();
      setTimeout(() => editor.layout(), 0);
    }
    
    // Multiple layout calls for mobile compatibility
    const layoutDelays = isMobileDevice ? [50, 150, 300, 600, 1200] : [100, 300, 1000];
    
    layoutDelays.forEach(delay => {
      setTimeout(() => {
        if (editor && typeof editor.layout === 'function') {
          try {
            editor.layout();
            if (delay === layoutDelays[0] && typeof editor.focus === 'function') {
              editor.focus();
            }
          } catch (error) {
            console.warn('Editor layout error:', error);
          }
        }
      }, delay);
    });
    
    // Mobile-optimized configuration
    editor.updateOptions({
      fontSize: isMobileDevice ? 12 : 14,
      fontFamily: 'Consolas, Monaco, monospace',
      lineNumbers: 'on',
      lineNumbersMinChars: isMobileDevice ? 2 : 3,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      wordWrapColumn: isMobileDevice ? 60 : 80,
      wrappingIndent: 'indent',
      padding: { top: isMobileDevice ? 8 : 16, bottom: isMobileDevice ? 8 : 16 },
      folding: !isMobileDevice,
      showFoldingControls: isMobileDevice ? 'never' : 'always',
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        verticalScrollbarSize: isMobileDevice ? 6 : 12,
        horizontalScrollbarSize: isMobileDevice ? 6 : 12,
        useShadows: false
      }
    });

    // Add mobile touch event listeners
    if (isMobileDevice) {
      const domNode = editor.getDomNode();
      if (domNode) {
        domNode.addEventListener('touchstart', handleTouchStart, { passive: true });
        domNode.addEventListener('touchend', handleTouchEnd, { passive: true });
        domNode.addEventListener('touchcancel', handleTouchEnd, { passive: true });
        
        // Add double-tap to select all
        let lastTap = 0;
        domNode.addEventListener('touchend', (e: TouchEvent) => {
          const currentTime = new Date().getTime();
          const tapLength = currentTime - lastTap;
          if (tapLength < 500 && tapLength > 0) {
            // Double tap detected - select all
            mobileActions.selectAll();
            e.preventDefault();
          }
          lastTap = currentTime;
        });
      }
    }
    
    // Enhanced resize observer for mobile
    let resizeTimeout: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (editor && typeof editor.layout === 'function') {
          try {
            editor.layout();
          } catch (error) {
            console.warn('Resize layout error:', error);
          }
        }
      }, isMobile ? 100 : 50);
    });
    
    const container = editor.getContainerDomNode && editor.getContainerDomNode();
    if (container) {
      resizeObserver.observe(container);
      
      // Also observe parent containers for mobile
      if (isMobile && container.parentElement) {
        resizeObserver.observe(container.parentElement);
      }
    }
    
    // Cleanup
    if (typeof editor.onDidDispose === 'function') {
      editor.onDidDispose(() => {
        resizeObserver.disconnect();
        clearTimeout(resizeTimeout);
      });
    }

    // Add custom key bindings
    
    // Ctrl+Enter / Cmd+Enter: Run code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRun && !isRunning) {
        onRun();
      }
    });

    // Ctrl+R / Cmd+R: Reset code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
      if (onReset) {
        onReset();
      }
    });

    // Ctrl+S / Cmd+S: Save (prevent browser default)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Trigger save functionality if available
      const saveEvent = new CustomEvent('editorSave', { detail: { value: editor.getValue() } });
      window.dispatchEvent(saveEvent);
    });

    // F5: Run code (alternative)
    editor.addCommand(monaco.KeyCode.F5, () => {
      if (onRun && !isRunning) {
        onRun();
      }
    });

    // Ctrl+Shift+F / Cmd+Shift+F: Format document
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      editor.getAction('editor.action.formatDocument')?.run();
    });

    // Ctrl+/ / Cmd+/: Toggle line comment
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
      editor.getAction('editor.action.commentLine')?.run();
    });

    // Ctrl+Shift+/ / Cmd+Shift+/: Toggle block comment
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Slash, () => {
      editor.getAction('editor.action.blockComment')?.run();
    });

    // Ctrl+D / Cmd+D: Duplicate line
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      editor.getAction('editor.action.copyLinesDownAction')?.run();
    });

    // Alt+Up / Alt+Down: Move line up/down
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
      editor.getAction('editor.action.moveLinesUpAction')?.run();
    });
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
      editor.getAction('editor.action.moveLinesDownAction')?.run();
    });

    // Ctrl+Shift+K / Cmd+Shift+K: Delete line
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK, () => {
      editor.getAction('editor.action.deleteLines')?.run();
    });

    // Ctrl+G / Cmd+G: Go to line
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, () => {
      editor.getAction('editor.action.gotoLine')?.run();
    });

    // Ctrl+F / Cmd+F: Find (already built-in, but ensuring it works)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      editor.getAction('actions.find')?.run();
    });

    // Ctrl+H / Cmd+H: Find and replace
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
      editor.getAction('editor.action.startFindReplaceAction')?.run();
    });

    // Ctrl+Shift+L / Cmd+Shift+L: Select all occurrences
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL, () => {
      editor.getAction('editor.action.selectHighlights')?.run();
    });

    // F11: Toggle fullscreen
    editor.addCommand(monaco.KeyCode.F11, () => {
      const fullscreenEvent = new CustomEvent('editorFullscreen');
      window.dispatchEvent(fullscreenEvent);
    });

    // Focus the editor
    editor.focus();
  };

  const handleEditorChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      onChange(newValue);
    }
  };



  // If minimal mode is enabled, render just the Monaco editor
  if (minimal) {
    return (
      <div 
        className="w-full h-full bg-gray-900" 
        style={{ 
          minHeight: '350px',
          height: height === '100%' ? '100%' : height,
          position: 'relative',
          display: 'block'
        }}
      >
        <Editor
          height={height === '100%' ? '100%' : height}
          width="100%"
          language={getMonacoLanguage(language)}
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme={theme}
          options={{
            readOnly: isDisabled,
            contextmenu: true,
            selectOnLineNumbers: true,
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            renderLineHighlight: 'all',
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: 13,
            minimap: { enabled: false },
            wordWrap: 'on',
            wordWrapColumn: 80,
            wrappingIndent: 'indent',
            padding: { top: 12, bottom: 12 },
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              useShadows: false
            }
          }}
          loading={
            <div className="flex items-center justify-center w-full h-full bg-gray-900 text-white min-h-[350px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                <div className="text-xs">Loading Editor...</div>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-700">
        {/* Editor Header */}
        {!hideHeader && (
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-sm text-gray-300 font-medium">
                <span className="text-blue-400">&lt;/&gt;</span> Code Editor
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 capitalize">
                {language}
              </span>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
          </div>
        )}

        {/* Mobile Toolbar */}
        {isMobile && showMobileToolbar && (
          <div className="absolute top-0 left-0 right-0 z-50 bg-gray-800 border-b border-gray-600 p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 overflow-x-auto">
                <button
                  onClick={mobileActions.selectAll}
                  className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors min-w-0 flex-shrink-0"
                  title="Select All"
                >
                  <Type className="w-3 h-3" />
                  <span>All</span>
                </button>
                <button
                  onClick={mobileActions.copy}
                  className="flex items-center space-x-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors min-w-0 flex-shrink-0"
                  title="Copy"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={mobileActions.cut}
                  className="flex items-center space-x-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors min-w-0 flex-shrink-0"
                  title="Cut"
                >
                  <Scissors className="w-3 h-3" />
                  <span>Cut</span>
                </button>
                <button
                  onClick={mobileActions.paste}
                  className="flex items-center space-x-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors min-w-0 flex-shrink-0"
                  title="Paste"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>Paste</span>
                </button>
                <button
                  onClick={mobileActions.undo}
                  className="flex items-center space-x-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors min-w-0 flex-shrink-0"
                  title="Undo"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>Undo</span>
                </button>
                <button
                  onClick={mobileActions.redo}
                  className="flex items-center space-x-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors min-w-0 flex-shrink-0"
                  title="Redo"
                >
                  <Redo2 className="w-3 h-3" />
                  <span>Redo</span>
                </button>
                <button
                  onClick={mobileActions.format}
                  className="flex items-center space-x-1 px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors min-w-0 flex-shrink-0"
                  title="Format Code"
                >
                  <span>Format</span>
                </button>
              </div>
              <button
                onClick={() => setShowMobileToolbar(false)}
                className="flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex-shrink-0 ml-2"
                title="Close Toolbar"
              >
                <MoreHorizontal className="w-3 h-3 rotate-45" />
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-400 text-center">
              💡 Double-tap to select all • Long press for toolbar
            </div>
          </div>
        )}

        {/* Monaco Editor */}
        <div className="relative" style={{ height }}>
          <Editor
            height={height}
            language={getMonacoLanguage(language)}
            value={value}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme={theme}
            options={{
              readOnly: isDisabled,
              contextmenu: true,
              selectOnLineNumbers: true,
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
              renderLineHighlight: 'all',
              lineNumbers: 'on',
              glyphMargin: true,
              folding: true,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 3,
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
              }
            }}
            loading={
              <div className="flex items-center justify-center h-full bg-gray-900">
                <div className="text-gray-400">Loading editor...</div>
              </div>
            }
          />
        </div>

        {/* Editor Footer */}
        {!hideStats && (
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-t border-gray-700">
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span>Lines: {value.split('\n').length}</span>
              <span>Characters: {value.length}</span>
            </div>
            {!hideButtons && (
              <div className="flex items-center space-x-2">
                {onRun && (
                  <button
                    onClick={onRun}
                    disabled={isRunning || isDisabled}
                    className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1 text-xs font-medium"
                  >
                    <PlayCircle className="w-3 h-3" />
                    <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                  </button>
                )}
                {onReset && (
                  <button
                    onClick={() => onReset()}
                    disabled={isDisabled}
                    className="px-3 py-1.5 bg-gray-600 text-gray-200 rounded hover:bg-gray-500 disabled:opacity-50 transition-colors text-xs font-medium flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Keyboard Shortcuts Info */}
      {!hideTips && (
        <div className="mt-2 text-xs text-gray-500 flex items-center space-x-4">
          <span>💡 Tip: Press Ctrl+Enter to run code</span>
          <span>•</span>
          <span>Ctrl+/ to toggle comments</span>
          <span>•</span>
          <span>Ctrl+D to select next occurrence</span>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
