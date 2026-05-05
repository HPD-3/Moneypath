import React, { useRef, useState, useEffect } from 'react';

export default function RichTextEditor({ value, onChange, placeholder = "Tulis materi pembelajaran di sini..." }) {
    const editorRef = useRef(null);
    const [isEmpty, setIsEmpty] = useState(!value || value.trim() === '' || value === '<br>');
    const isUserTyping = useRef(false);

    // Only update innerHTML when value changes from outside (not user typing)
    useEffect(() => {
        if (editorRef.current && !isUserTyping.current) {
            const currentContent = editorRef.current.innerHTML;
            const newContent = value || '';
            
            if (currentContent !== newContent) {
                editorRef.current.innerHTML = newContent;
                setIsEmpty(!newContent || newContent.trim() === '' || newContent === '<br>');
            }
        }
    }, [value]);

    const applyStyle = (command, styleValue = null) => {
        document.execCommand(command, false, styleValue);
        editorRef.current?.focus();
    };

    const handleContentChange = (e) => {
        isUserTyping.current = true;
        const html = e.currentTarget.innerHTML;
        onChange(html);
        setIsEmpty(!html || html.trim() === '' || html === '<br>');
        isUserTyping.current = false;
    };

    const handleClearFormatting = () => {
        document.execCommand('removeFormat', false);
        document.execCommand('formatBlock', false, '<p>');
    };

    const ToolbarButton = ({ icon, title, onClick, isActive = false }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-2 rounded-lg transition-all ${
                isActive
                    ? 'bg-[#9FF782]/20 text-[#166534] border border-[#9FF782]'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-transparent'
            }`}
        >
            {icon}
        </button>
    );

    return (
        <div className="border border-gray-300 rounded-xl overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1">
                {/* Text Formatting */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton
                        icon="B"
                        title="Bold (Ctrl+B)"
                        onClick={() => applyStyle('bold')}
                    />
                    <ToolbarButton
                        icon="I"
                        title="Italic (Ctrl+I)"
                        onClick={() => applyStyle('italic')}
                    />
                    <ToolbarButton
                        icon="U"
                        title="Underline (Ctrl+U)"
                        onClick={() => applyStyle('underline')}
                    />
                </div>

                {/* Lists */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton
                        icon="• "
                        title="Bullet List"
                        onClick={() => applyStyle('insertUnorderedList')}
                    />
                    <ToolbarButton
                        icon="1."
                        title="Numbered List"
                        onClick={() => applyStyle('insertOrderedList')}
                    />
                </div>

                {/* Indentation */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton
                        icon="→"
                        title="Indent"
                        onClick={() => applyStyle('indent')}
                    />
                    <ToolbarButton
                        icon="←"
                        title="Outdent"
                        onClick={() => applyStyle('outdent')}
                    />
                </div>

                {/* Alignment */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton
                        icon="⬅"
                        title="Align Left"
                        onClick={() => applyStyle('justifyLeft')}
                    />
                    <ToolbarButton
                        icon="↔"
                        title="Align Center"
                        onClick={() => applyStyle('justifyCenter')}
                    />
                    <ToolbarButton
                        icon="➡"
                        title="Align Right"
                        onClick={() => applyStyle('justifyRight')}
                    />
                </div>

                {/* Font Size */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <select
                        onChange={(e) => {
                            if (e.target.value) applyStyle('fontSize', e.target.value);
                            e.target.value = '';
                        }}
                        className="px-2 py-1 rounded border border-gray-300 text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                        defaultValue=""
                    >
                        <option value="">Font Size</option>
                        <option value="1">10px</option>
                        <option value="2">13px</option>
                        <option value="3">16px</option>
                        <option value="4">18px</option>
                        <option value="5">24px</option>
                        <option value="6">32px</option>
                        <option value="7">48px</option>
                    </select>
                </div>

                {/* Text Color */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <div className="relative">
                        <input
                            type="color"
                            onChange={(e) => applyStyle('foreColor', e.target.value)}
                            title="Text Color"
                            className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                            defaultValue="#000000"
                        />
                        <span className="absolute -bottom-6 left-0 text-xs text-gray-500 whitespace-nowrap">Color</span>
                    </div>
                </div>

                {/* Highlight */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <div className="relative">
                        <input
                            type="color"
                            onChange={(e) => applyStyle('backColor', e.target.value)}
                            title="Highlight Color"
                            className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                            defaultValue="#FFFF00"
                        />
                        <span className="absolute -bottom-6 left-0 text-xs text-gray-500 whitespace-nowrap">Highlight</span>
                    </div>
                </div>

                {/* Clear Formatting */}
                <div className="flex gap-1">
                    <ToolbarButton
                        icon="✕"
                        title="Clear Formatting"
                        onClick={handleClearFormatting}
                    />
                </div>
            </div>

            {/* Editor Area */}
            <div className="relative">
                {isEmpty && (
                    <div className="absolute top-3 left-4 text-gray-400 text-sm pointer-events-none">
                        {placeholder}
                    </div>
                )}
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleContentChange}
                    onBlur={() => setIsEmpty(!editorRef.current?.innerText)}
                    className="w-full px-4 py-3 text-gray-900 text-sm outline-none min-h-64 max-h-96 overflow-y-auto bg-white"
                    style={{
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        color: '#111827',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        caretColor: '#9FF782',
                    }}
                />
            </div>

            {/* Character Count */}
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs text-gray-500 text-right">
                {editorRef.current?.innerText.length || 0} characters
            </div>
        </div>
    );
}
