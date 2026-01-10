'use client';

import { useState, useMemo } from 'react';
import { openApiSpec } from '@/lib/openapi';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

// Simplified types to avoid OpenAPI type complexity
interface SimplePathOperation {
  path: string;
  method: HttpMethod;
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    description?: string;
    schema?: {
      type?: string;
      enum?: string[];
      default?: unknown;
      format?: string;
    };
  }>;
  requestBody?: {
    required?: boolean;
    schemaRef?: string;
  };
  responses?: Array<{
    code: string;
    description: string;
  }>;
  requiresAuth?: boolean;
}

const methodColors: Record<HttpMethod, string> = {
  get: 'bg-blue-500',
  post: 'bg-green-500',
  put: 'bg-orange-500',
  patch: 'bg-yellow-500',
  delete: 'bg-red-500',
};

const methodBgColors: Record<HttpMethod, string> = {
  get: 'bg-blue-50 border-blue-200',
  post: 'bg-green-50 border-green-200',
  put: 'bg-orange-50 border-orange-200',
  patch: 'bg-yellow-50 border-yellow-200',
  delete: 'bg-red-50 border-red-200',
};

function EndpointCard({ pathOp }: { pathOp: SimplePathOperation }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-lg overflow-hidden ${methodBgColors[pathOp.method]}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/50 transition-colors"
      >
        <span
          className={`${methodColors[pathOp.method]} text-white text-xs font-bold px-2 py-1 rounded uppercase min-w-[60px] text-center`}
        >
          {pathOp.method}
        </span>
        <code className="font-mono text-sm text-gray-800 flex-1">{pathOp.path}</code>
        {pathOp.requiresAuth && (
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
            🔒 Auth
          </span>
        )}
        <span className="text-gray-500 text-sm">{pathOp.summary}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="p-4 border-t border-gray-200 bg-white">
          {pathOp.description && (
            <p className="text-gray-600 mb-4">{pathOp.description}</p>
          )}

          {/* Parameters */}
          {pathOp.parameters && pathOp.parameters.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Parameters</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-2 font-medium">Name</th>
                      <th className="text-left p-2 font-medium">In</th>
                      <th className="text-left p-2 font-medium">Type</th>
                      <th className="text-left p-2 font-medium">Required</th>
                      <th className="text-left p-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pathOp.parameters.map((param, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2 font-mono text-xs">{param.name}</td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                            {param.in}
                          </span>
                        </td>
                        <td className="p-2 font-mono text-xs">
                          {param.schema?.type || 'string'}
                          {param.schema?.enum && (
                            <span className="text-gray-500 ml-1">
                              [{param.schema.enum.join(', ')}]
                            </span>
                          )}
                        </td>
                        <td className="p-2">
                          {param.required ? (
                            <span className="text-red-600">Yes</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="p-2 text-gray-600">{param.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Request Body */}
          {pathOp.requestBody && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                Request Body
                {pathOp.requestBody.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </h4>
              {pathOp.requestBody.schemaRef && (
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {pathOp.requestBody.schemaRef}
                </code>
              )}
            </div>
          )}

          {/* Responses */}
          {pathOp.responses && pathOp.responses.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Responses</h4>
              <div className="space-y-2">
                {pathOp.responses.map((response, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-2 bg-gray-50 rounded"
                  >
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        response.code.startsWith('2')
                          ? 'bg-green-100 text-green-800'
                          : response.code.startsWith('4')
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {response.code}
                    </span>
                    <span className="text-gray-600 text-sm">
                      {response.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SchemaCard({ name, schema }: { name: string; schema: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-mono text-sm font-medium text-gray-900">{name}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && properties && (
        <div className="p-3 border-t bg-gray-50">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 font-medium text-gray-600">Property</th>
                <th className="text-left p-2 font-medium text-gray-600">Type</th>
                <th className="text-left p-2 font-medium text-gray-600">Description</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(properties).map(([propName, propSchema]) => (
                <tr key={propName} className="border-t border-gray-200">
                  <td className="p-2 font-mono text-xs">{propName}</td>
                  <td className="p-2 font-mono text-xs text-blue-600">
                    {(propSchema.type as string) || 
                     (propSchema.$ref as string)?.replace('#/components/schemas/', '') ||
                     'object'}
                  </td>
                  <td className="p-2 text-gray-600 text-xs">
                    {(propSchema.description as string) || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ApiDocsClient() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to safely get response descriptions
  const getResponseDescription = (responses: Record<string, unknown>, code: string): string => {
    const response = responses[code] as Record<string, unknown> | undefined;
    if (!response) return 'No description';
    
    // Check if it's a $ref
    if (response.$ref) {
      const refName = (response.$ref as string).replace('#/components/responses/', '');
      const resolved = openApiSpec.components?.responses?.[refName] as unknown as Record<string, unknown> | undefined;
      return (resolved?.description as string) || 'No description';
    }
    
    return (response.description as string) || 'No description';
  };

  // Extract all path operations and transform to simplified format
  const pathOperations = useMemo(() => {
    const ops: SimplePathOperation[] = [];
    const paths = openApiSpec.paths || {};

    for (const [path, methods] of Object.entries(paths)) {
      if (!methods) continue;
      for (const method of ['get', 'post', 'put', 'patch', 'delete'] as HttpMethod[]) {
        const operation = methods[method] as Record<string, unknown> | undefined;
        if (operation) {
          // Transform parameters
          const rawParams = operation.parameters as Array<Record<string, unknown>> | undefined;
          const parameters = rawParams?.map(p => ({
            name: p.name as string,
            in: p.in as string,
            required: p.required as boolean | undefined,
            description: p.description as string | undefined,
            schema: p.schema as { type?: string; enum?: string[]; default?: unknown; format?: string } | undefined,
          }));

          // Transform request body
          const rawBody = operation.requestBody as Record<string, unknown> | undefined;
          let requestBody: { required?: boolean; schemaRef?: string } | undefined;
          if (rawBody) {
            const content = rawBody.content as Record<string, Record<string, unknown>> | undefined;
            const jsonContent = content?.['application/json'];
            const schema = jsonContent?.schema as Record<string, unknown> | undefined;
            requestBody = {
              required: rawBody.required as boolean,
              schemaRef: schema?.$ref 
                ? (schema.$ref as string).replace('#/components/schemas/', '') 
                : undefined,
            };
          }

          // Transform responses
          const rawResponses = operation.responses as Record<string, unknown> | undefined;
          const responses = rawResponses 
            ? Object.keys(rawResponses).map(code => ({
                code,
                description: getResponseDescription(rawResponses, code),
              }))
            : [];

          // Check for auth
          const security = operation.security as Array<unknown> | undefined;
          const requiresAuth = security && security.length > 0;

          ops.push({
            path,
            method,
            tags: operation.tags as string[] | undefined,
            summary: operation.summary as string | undefined,
            description: operation.description as string | undefined,
            operationId: operation.operationId as string | undefined,
            parameters,
            requestBody,
            responses,
            requiresAuth,
          });
        }
      }
    }

    return ops;
  }, []);

  // Filter operations based on tag and search
  const filteredOperations = useMemo(() => {
    return pathOperations.filter((op) => {
      const matchesTag = !activeTag || op.tags?.includes(activeTag);
      const matchesSearch =
        !searchQuery ||
        op.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTag && matchesSearch;
    });
  }, [pathOperations, activeTag, searchQuery]);

  // Get all tags
  const tags = openApiSpec.tags || [];

  // Get all schemas
  const schemas = openApiSpec.components?.schemas || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {openApiSpec.info.title}
              </h1>
              <p className="text-sm text-gray-500">
                Version {openApiSpec.info.version}
              </p>
            </div>
            <a
              href="/dashboard"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Search */}
              <div>
                <input
                  type="text"
                  placeholder="Search endpoints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Tags */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Categories</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveTag(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTag === null
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    All Endpoints ({pathOperations.length})
                  </button>
                  {tags.map((tag) => {
                    const count = pathOperations.filter((op) =>
                      op.tags?.includes(tag.name)
                    ).length;
                    return (
                      <button
                        key={tag.name}
                        onClick={() => setActiveTag(tag.name)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeTag === tag.name
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {tag.name} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Server Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Servers</h3>
                <div className="space-y-2">
                  {openApiSpec.servers?.map((server, idx) => (
                    <div key={idx} className="text-sm">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block truncate">
                        {server.url}
                      </code>
                      <p className="text-gray-500 text-xs mt-1">{server.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-8">
            {/* Description */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Overview</h2>
              <div className="prose prose-sm max-w-none text-gray-600">
                <p>
                  The Inner Circle Partners Portal API provides endpoints for managing a partner
                  referral program. Use this API to integrate partner management, track referrals,
                  process payouts, and access analytics.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">Authentication</h3>
                <p>
                  All API endpoints (except health check) require authentication using a Clerk
                  session token. Include the token in the Authorization header:
                </p>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto">
                  <code>Authorization: Bearer {'<session_token>'}</code>
                </pre>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">Rate Limiting</h3>
                <ul>
                  <li>Standard endpoints: 100 requests/minute</li>
                  <li>Auth endpoints: 10 requests/minute</li>
                  <li>Admin endpoints: 50 requests/minute</li>
                </ul>
              </div>
            </section>

            {/* Endpoints */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Endpoints
                {activeTag && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    Filtered by: {activeTag}
                  </span>
                )}
              </h2>
              <div className="space-y-3">
                {filteredOperations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No endpoints found matching your criteria
                  </div>
                ) : (
                  filteredOperations.map((op, idx) => (
                    <EndpointCard key={`${op.path}-${op.method}-${idx}`} pathOp={op} />
                  ))
                )}
              </div>
            </section>

            {/* Schemas */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Schemas</h2>
              <div className="space-y-2">
                {Object.entries(schemas).map(([name, schema]) => (
                  <SchemaCard key={name} name={name} schema={schema as Record<string, unknown>} />
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
