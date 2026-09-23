/**
 * Shared Markdown renderer for guides and course modules.
 *
 * - A markdown `# heading` renders as <h2>, so the page keeps a single <h1>
 *   (the page title rendered by the route component).
 * - h2/h3 get slug ids so sections can be deep-linked (#section-name).
 * - Fenced code blocks are styled as blocks; inline code as pills. react-markdown
 *   10 gives a fenced block without a language no className, so the block style
 *   is applied through the <pre> wrapper rather than guessed from className.
 * - Internal links (starting with "/") use react-router <Link> so they do not
 *   reload the SPA; external links open in a new tab with noopener.
 *
 * Render-safe: no window/document access, so it can be prerendered.
 */

import { Children, isValidElement, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Plain text of a React node tree (used to build heading ids). */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement(node)) {
    return textOf((node.props as { children?: ReactNode }).children);
  }
  return Children.toArray(node).map(textOf).join('');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Demote markdown H1 so the page has exactly one <h1>.
        h1: ({ children }) => (
          <h2 id={slugify(textOf(children))} className="text-3xl font-bold text-white mb-6 mt-8 scroll-mt-24">
            {children}
          </h2>
        ),
        h2: ({ children }) => (
          <h2
            id={slugify(textOf(children))}
            className="text-2xl font-bold text-white mb-4 mt-8 border-b border-gray-800 pb-2 scroll-mt-24"
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 id={slugify(textOf(children))} className="text-xl font-semibold text-white mb-3 mt-6 scroll-mt-24">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-lg font-semibold text-gray-200 mb-2 mt-4">{children}</h4>
        ),
        p: ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
        a: ({ href, children }) => {
          const cls = 'text-orange-500 hover:text-orange-400 underline';
          if (href && href.startsWith('/')) {
            return (
              <Link to={href} className={cls}>
                {children}
              </Link>
            );
          }
          const external = !!href && /^https?:\/\//.test(href);
          return (
            <a
              href={href}
              className={cls}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          );
        },
        ul: ({ children }) => (
          <ul className="list-disc list-outside pl-6 text-gray-300 mb-4 space-y-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside pl-6 text-gray-300 mb-4 space-y-2">{children}</ol>
        ),
        li: ({ children }) => <li className="text-gray-300 pl-1">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-orange-500 pl-4 my-4 italic text-gray-400">
            {children}
          </blockquote>
        ),
        pre: ({ children }) => (
          <pre className="bg-gray-800 text-gray-200 p-4 rounded-lg overflow-x-auto font-mono text-sm my-4 leading-relaxed">
            {children}
          </pre>
        ),
        // Inline pill style; inside <pre> the arbitrary variant resets it.
        code: ({ children }) => (
          <code className="px-1.5 py-0.5 bg-gray-800 text-orange-400 rounded text-sm font-mono [pre_&]:p-0 [pre_&]:bg-transparent [pre_&]:text-gray-200 [pre_&]:rounded-none">
            {children}
          </code>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-6">
            <table className="w-full border-collapse border border-gray-700">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-gray-800">{children}</thead>,
        th: ({ children }) => (
          <th className="border border-gray-700 px-4 py-2 text-left text-white font-semibold">{children}</th>
        ),
        td: ({ children }) => <td className="border border-gray-700 px-4 py-2 text-gray-300">{children}</td>,
        hr: () => <hr className="border-t border-gray-800 my-8" />,
        strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
