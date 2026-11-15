import React from 'react';
import { isHtmlContent } from '../utils/richText';

interface RichTextRendererProps {
  content: string;
  className?: string;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // If it's pure legacy plain text (no HTML tags), render with whitespace preservation
  if (!isHtmlContent(content)) {
    return (
      <div className={`text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={`rich-announcement-content text-sm text-slate-700 dark:text-slate-200 leading-relaxed space-y-2.5 
        [&_p]:my-1.5 [&_p]:leading-relaxed
        [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_h2]:mt-3 [&_h2]:mb-1
        [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 dark:[&_h3]:text-white [&_h3]:mt-2.5 [&_h3]:mb-1
        [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-slate-800 dark:[&_h4]:text-slate-100 [&_h4]:mt-2 [&_h4]:mb-0.5
        [&_b]:font-bold [&_strong]:font-bold
        [&_i]:italic [&_em]:italic
        [&_u]:underline [&_u]:decoration-current [&_u]:underline-offset-2
        [&_strike]:line-through [&_s]:line-through
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:space-y-1
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol]:space-y-1
        [&_li]:leading-normal
        [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:bg-emerald-50/50 dark:[&_blockquote]:bg-emerald-950/30 [&_blockquote]:pl-3.5 [&_blockquote]:py-1.5 [&_blockquote]:rounded-r-lg [&_blockquote]:italic [&_blockquote]:my-2.5
        [&_[style*="text-align: center"]]:text-center [&_[style*="text-align:center"]]:text-center [&_[align="center"]]:text-center
        [&_[style*="text-align: right"]]:text-right [&_[style*="text-align:right"]]:text-right [&_[align="right"]]:text-right
        [&_[style*="text-align: justify"]]:text-justify [&_[style*="text-align:justify"]]:text-justify [&_[align="justify"]]:text-justify
        [&_[style*="text-align: left"]]:text-left [&_[style*="text-align:left"]]:text-left [&_[align="left"]]:text-left
        ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
