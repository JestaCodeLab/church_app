import React, { useState, useEffect } from 'react';
import { Book, FileText, Search, Menu, X, ExternalLink, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Documentation: React.FC = () => {
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tocOpen, setTocOpen] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the markdown file
    fetch('/docs/app-specification.md')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load documentation');
        }
        return response.text();
      })
      .then((text) => {
        setMarkdownContent(text);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Extract table of contents from markdown headers
  const extractTOC = (markdown: string) => {
    const headers = markdown.match(/^#{1,3}\s+(.+)$/gm) || [];
    return headers.map((header) => {
      const level = header.match(/^#+/)?.[0].length || 1;
      const text = header.replace(/^#+\s+/, '').replace(/\{#.+\}$/, '').trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      return { level, text, id };
    });
  };

  const toc = extractTOC(markdownContent);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredContent = searchQuery
    ? markdownContent
        .split('\n')
        .filter((line) => line.toLowerCase().includes(searchQuery.toLowerCase()))
        .join('\n')
    : markdownContent;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md p-8">
          <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Failed to Load Documentation
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Back to Dashboard"
              >
                <Home className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <Book className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  App Documentation
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Complete Feature Specification
                </p>
              </div>
            </div>

            <button
              onClick={() => setTocOpen(!tocOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {tocOpen ? (
                <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-2 sm:px-6 lg:px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Table of Contents - Sidebar */}
          <div
            className={`lg:col-span-3 ${
              tocOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documentation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <nav className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Table of Contents
                </p>
                {toc.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToSection(item.id)}
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      item.level === 1
                        ? 'font-semibold text-gray-900 dark:text-white'
                        : item.level === 2
                        ? 'pl-6 text-gray-700 dark:text-gray-300'
                        : 'pl-9 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {item.text}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="prose prose-lg prose-slate dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-gray-900 dark:prose-code:text-gray-100">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1
                        id={props.children
                          ?.toString()
                          .toLowerCase()
                          .replace(/[^\w\s-]/g, '')
                          .replace(/\s+/g, '-')}
                        className="scroll-mt-24 text-4xl font-bold text-gray-900 dark:text-white mt-8 mb-4"
                        {...props}
                      />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2
                        id={props.children
                          ?.toString()
                          .toLowerCase()
                          .replace(/[^\w\s-]/g, '')
                          .replace(/\s+/g, '-')}
                        className="scroll-mt-24 text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4"
                        {...props}
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3
                        id={props.children
                          ?.toString()
                          .toLowerCase()
                          .replace(/[^\w\s-]/g, '')
                          .replace(/\s+/g, '-')}
                        className="scroll-mt-24 text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-3"
                        {...props}
                      />
                    ),
                    h4: ({ node, ...props }) => (
                      <h4
                        id={props.children
                          ?.toString()
                          .toLowerCase()
                          .replace(/[^\w\s-]/g, '')
                          .replace(/\s+/g, '-')}
                        className="scroll-mt-24 text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3"
                        {...props}
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="text-gray-700 dark:text-gray-300 my-4 leading-relaxed" {...props} />
                    ),
                    a: ({ node, ...props }) => (
                      <a
                        {...props}
                        className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                        target={props.href?.startsWith('http') ? '_blank' : undefined}
                        rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        {props.children}
                        {props.href?.startsWith('http') && (
                          <ExternalLink className="h-3 w-3" />
                        )}
                      </a>
                    ),
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-6">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-300 dark:border-gray-600" {...props} />
                      </div>
                    ),
                    thead: ({ node, ...props }) => (
                      <thead className="bg-gray-50 dark:bg-gray-900" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-600" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700" {...props} />
                    ),
                    tr: ({ node, ...props }) => (
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="border-l-4 border-primary-500 pl-4 italic text-gray-700 dark:text-gray-300 my-4" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 my-4" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 my-4" {...props} />
                    ),
                    code: ({ node, inline, ...props }: any) =>
                      inline ? (
                        <code
                          className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400 rounded text-sm font-mono"
                          {...props}
                        />
                      ) : (
                        <code
                          className="block p-4 bg-gray-900 dark:bg-gray-950 text-gray-100 rounded-lg overflow-x-auto text-sm"
                          {...props}
                        />
                      ),
                  }}
                >
                  {filteredContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
