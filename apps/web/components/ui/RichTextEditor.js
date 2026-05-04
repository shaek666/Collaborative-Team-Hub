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
  const isComposing = useRef(false);

  // Set content only when value changes externally
  useEffect(() => {
    if (editorRef.current && !isComposing.current) {
      const el = editorRef.current;
      if (value !== el.innerHTML) {
        const sel = window.getSelection();
        const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
        const savedStart = range && el.contains(range.startContainer) 
          ? getTextOffset(el, range.startContainer, range.startOffset) 
          : null;
        
        el.innerHTML = value || '';
        
        if (savedStart !== null && savedStart <= (el.innerText || '').length) {
          restoreCursor(el, savedStart);
        }
      }
    }
  }, [value]);

  const getTextOffset = (root, container, offset) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let charOffset = 0;
    let node;
    while ((node = walker.nextNode())) {
      if (node === container) return charOffset + offset;
      charOffset += node.textContent.length;
    }
    return charOffset;
  };

  const restoreCursor = (root, offset) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let charOffset = 0;
    let node;
    while ((node = walker.nextNode())) {
      if (charOffset + node.textContent.length >= offset) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(node, offset - charOffset);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
      charOffset += node.textContent.length;
    }
  };

  const updateActiveFormats = useCallback(() => {
    if (!editorRef.current) return;
    const el = editorRef.current;
    
    // Only update if editor has focus or has content
    if (!el.innerText?.trim()) {
      setActiveFormats(new Set());
      return;
    }
    
    const formats = new Set();
    try {
      if (document.queryCommandState('bold')) formats.add('bold');
      if (document.queryCommandState('italic')) formats.add('italic');
      if (document.queryCommandState('underline')) formats.add('underline');
    } catch (e) {}
    setActiveFormats(formats);
  }, []);

  const execCommand = useCallback((command) => {
    const el = editorRef.current;
    if (!el) return;

    el.focus();

    // Handle list commands
    if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
      const listTag = command === 'insertUnorderedList' ? 'ul' : 'ol';
      
      // Get current text content (strip HTML)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = el.innerHTML;
      const text = tempDiv.innerText || '';
      
      if (!text.trim() || text.trim() === 'Type here...') {
        el.innerHTML = `<${listTag}><li>Type here...</li></${listTag}>`;
      } else {
        // Get all text nodes
        const lines = [];
        const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (node.textContent.trim()) {
            lines.push(node.textContent.trim());
          }
        }
        
        if (lines.length === 0) {
          el.innerHTML = `<${listTag}><li>Type here...</li></${listTag}>`;
        } else {
          const items = lines.map(l => `<li>${l}</li>`).join('');
          el.innerHTML = `<${listTag}>${items}</${listTag}>`;
        }
      }
      
      // Place cursor in first li
      const firstLi = el.querySelector('li');
      if (firstLi) {
        const range = document.createRange();
        range.selectNodeContents(firstLi);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
      
      onChange(el.innerHTML);
      return;
    }

    // Handle text formatting
    const sel = window.getSelection();
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    const savedStart = range && el.contains(range.startContainer) 
      ? getTextOffset(el, range.startContainer, range.startOffset) 
      : null;

    document.execCommand(command, false, null);

    // Restore cursor position
    if (savedStart !== null && savedStart <= (el.innerText || '').length) {
      restoreCursor(el, savedStart);
    }

    // Update active formats after command
    setTimeout(() => {
      el.focus();
      updateActiveFormats();
    }, 0);

    onChange(el.innerHTML);
  }, [onChange, updateActiveFormats]);

  const handleInput = useCallback(() => {
    if (editorRef.current && !isComposing.current) {
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
            }}
            onClick={() => execCommand(btn.command)}
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
          setTimeout(() => updateActiveFormats(), 0);
        }}
        onBlur={() => {
          setIsFocused(false);
        }}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => {
          isComposing.current = false;
          handleInput();
        }}
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
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
