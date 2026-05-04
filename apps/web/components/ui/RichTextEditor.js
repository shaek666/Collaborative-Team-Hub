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
  const skipNextInput = useRef(false);

  // Set content only when value changes externally (not from user input)
  useEffect(() => {
    if (editorRef.current && !isComposing.current) {
      const el = editorRef.current;
      if (value !== el.innerHTML) {
        // Save cursor position
        const sel = window.getSelection();
        const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
        const savedStart = range && el.contains(range.startContainer) ? getTextOffset(el, range.startContainer, range.startOffset) : null;

        el.innerHTML = value || '';

        // Restore cursor position
        if (savedStart !== null && savedStart <= (el.innerText || '').length) {
          restoreCursor(el, savedStart);
        }
      }
    }
  }, [value]);

  // Get character offset within an element
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

  // Restore cursor to a character offset
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
    const formats = new Set();
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    setActiveFormats(formats);
  }, []);

  const insertList = useCallback((type) => {
    const el = editorRef.current;
    if (!el) return;
    
    el.focus();
    
    const sel = window.getSelection();
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    
    // Ensure we have a valid cursor position in the editor
    if (!range || !el.contains(range.startContainer)) {
      const newRange = document.createRange();
      newRange.selectNodeContents(el);
      newRange.collapse(false);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
    
    // Try execCommand
    const command = type === 'bullet' ? 'insertUnorderedList' : 'insertOrderedList';
    document.execCommand(command, false, null);
    
    // Check if list was created; if not, manually create it
    setTimeout(() => {
      const hasList = el.querySelector('ul, ol');
      if (!hasList) {
        // Manually create list
        const content = el.innerHTML || '';
        if (content.trim()) {
          const isBullet = type === 'bullet';
          const listTag = isBullet ? 'ul' : 'ol';
          const itemTag = 'li';
          // Wrap existing content in list items
          const lines = content.split('<br>').filter(l => l.trim());
          if (lines.length === 0) {
            el.innerHTML = `<${listTag}><${itemTag}>Type here...</${itemTag}></${listTag}>`;
          } else {
            const listItems = lines.map(line => `<${itemTag}>${line}</${itemTag}>`).join('');
            el.innerHTML = `<${listTag}>${listItems}</${listTag}>`;
          }
        } else {
          const isBullet = type === 'bullet';
          const listTag = isBullet ? 'ul' : 'ol';
          el.innerHTML = `<${listTag}><li>Type here...</li></${listTag}>`;
        }
        onChange(el.innerHTML);
      }
      updateActiveFormats();
    }, 50);
  }, [onChange, updateActiveFormats]);

  const execCommand = useCallback((command) => {
    const el = editorRef.current;
    if (!el) return;
    
    // Ensure editor is focused before executing command
    if (document.activeElement !== el) {
      el.focus();
    }
    
    // For list commands, use insertList handler
    if (command === 'insertUnorderedList') {
      insertList('bullet');
      return;
    }
    if (command === 'insertOrderedList') {
      insertList('numbered');
      return;
    }
    
    // Save cursor position for text formatting commands
    const sel = window.getSelection();
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    const savedStart = range && el.contains(range.startContainer) ? getTextOffset(el, range.startContainer, range.startOffset) : null;
    
    document.execCommand(command, false, null);
    
    // Restore cursor position
    if (savedStart !== null && savedStart <= (el.innerText || '').length) {
      restoreCursor(el, savedStart);
    }
    
    updateActiveFormats();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange, updateActiveFormats, insertList]);

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
             onClick={() => execCommand(btn.command)}
             onMouseDown={(e) => {
               // Prevent default to avoid stealing focus from editor (except for list commands)
               if (btn.command !== 'insertUnorderedList' && btn.command !== 'insertOrderedList') {
                 e.preventDefault();
               }
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
