'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

const TOOLBAR_BUTTONS = [
  { command: 'bold', label: 'Bold', icon: 'B', className: 'font-bold' },
  { command: 'italic', label: 'Italic', icon: 'I', className: 'italic' },
  { command: 'underline', label: 'Underline', icon: 'U', className: 'underline' },
  { command: 'insertUnorderedList', label: 'Bullet List', icon: '•' },
  { command: 'insertOrderedList', label: 'Numbered List', icon: '1.' },
];

export function RichTextEditor({ value, onChange, placeholder, className, id }) {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [activeFormats, setActiveFormats] = useState(new Set());
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current && editorRef.current && value) {
      editorRef.current.innerHTML = value;
      isInitialMount.current = false;
    }
  }, []);

  const updateActiveFormats = useCallback(() => {
    const formats = new Set();
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    setActiveFormats(formats);
  }, []);

  const execCommand = useCallback((command) => {
    document.execCommand(command, false, null);
    editorRef.current?.focus();
    updateActiveFormats();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange, updateActiveFormats]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div className={cn('border border-slate-800 rounded-lg overflow-hidden', isFocused && 'border-blue-500/50', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-slate-800/30 border-b border-slate-800">
        {TOOLBAR_BUTTONS.map((btn) => (
          <button
            key={btn.command}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand(btn.command);
            }}
            aria-label={btn.label}
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded text-sm transition-colors text-slate-400 hover:bg-slate-700 hover:text-slate-200',
              btn.className,
              activeFormats.has(btn.command) && 'bg-blue-600/20 text-blue-400'
            )}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        id={id}
        contentEditable
        suppressContentEditableWarning
        className={cn(
          'w-full min-h-[120px] p-4 bg-transparent text-slate-100 outline-none prose prose-invert prose-sm max-w-none',
          'prose-headings:text-slate-100 prose-p:text-slate-200 prose-strong:text-slate-100',
          'prose-ul:text-slate-200 prose-ol:text-slate-200 prose-li:text-slate-200',
          'focus:ring-0 placeholder:text-slate-500'
        )}
        onInput={handleInput}
        onFocus={() => {
          setIsFocused(true);
          updateActiveFormats();
        }}
        onBlur={() => {
          setIsFocused(false);
        }}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        data-placeholder={placeholder}
        style={{ '--tw-content': placeholder }}
      />

      <style jsx>{`
        [contentEditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #64748b;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
