"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

interface FeedbackViewerProps {
    feedback: string;
}

export function FeedbackViewer({ feedback }: FeedbackViewerProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const mode = mounted ? (resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "light" : "auto") : "light";

    return (
        <div data-color-mode={mode} className="w-full max-w-full overflow-hidden [&_pre]:whitespace-pre-wrap! [&_pre]:wrap-break-word! [&_table]:w-full! [&_td]:wrap-break-word!">
            <MDEditor.Markdown source={feedback} style={{ background: 'transparent' }} />
            <style jsx global>{`
                /* Tables - responsive handling */
                .wmde-markdown table {
                    display: block;
                    width: 100%;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }
                .wmde-markdown table thead,
                .wmde-markdown table tbody,
                .wmde-markdown table tr {
                    display: table;
                    width: 100%;
                    table-layout: fixed;
                }
                
                /* Inline code - using primary color from theme */
                .wmde-markdown code {
                    background-color: oklch(from var(--primary) l c h / 0.15) !important;
                    color: var(--primary) !important;
                    border: 1px solid oklch(from var(--primary) l c h / 0.3) !important;
                    border-radius: 0.25rem !important;
                    padding: 0.1rem 0.4rem !important;
                    font-size: 0.875em !important;
                    font-weight: 500 !important;
                    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace !important;
                }
                
                /* Code blocks - using muted colors */
                .wmde-markdown pre {
                    background-color: hsl(var(--muted)) !important;
                    border: 1px solid hsl(var(--border)) !important;
                    border-radius: 0.5rem !important;
                    padding: 1rem !important;
                }
                
                .wmde-markdown pre code {
                    background-color: transparent !important;
                    color: hsl(var(--foreground)) !important;
                    border: none !important;
                    padding: 0 !important;
                    font-weight: 400 !important;
                }
            `}</style>
        </div>
    );
}
