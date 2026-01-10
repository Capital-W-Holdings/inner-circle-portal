/**
 * OpenAPI 3.0 Specification for Inner Circle Partners Portal
 * 
 * This specification documents all API endpoints available in the portal.
 */

import type { OpenAPIV3 } from 'openapi-types';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Inner Circle Partners Portal API',
    version: '1.0.0',
    description: `
# Inner Circle Partners Portal API

This API provides endpoints for managing a partner referral program, including:

- **Partner Management**: Create, update, and manage partner accounts
- **Campaign Tracking**: Track referral campaigns and their performance
- **Payout Processing**: Handle partner payouts and commissions
- **Analytics**: Access detailed analytics and reporting
- **Admin Operations**: Administrative functions for program management

## Authentication

All API endpoints require authentication using Clerk. Include the session token in the Authorization header:

\`\`\`
Authorization: Bearer <session_token>
\`\`\`

## Rate Limiting

API requests are rate-limited to prevent abuse:
- Standard endpoints: 100 requests per minute
- Auth endpoints: 10 requests per minute
- Admin endpoints: 50 requests per minute

## Error Handling

All endpoints return consistent error responses:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
\`\`\`
    `,
    contact: {
      name: 'API Support',
      email: 'api@innercircle.co',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: 'https://api.innercircle.co',
      description: 'Production server',
    },
    {
      url: 'http://localhost:3000',
      description: 'Local development',
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'System health and status endpoints',
    },
    {
      name: 'Partners',
      description: 'Partner account management',
    },
    {
      name: 'Campaigns',
      description: 'Campaign management and tracking',
    },
    {
      name: 'Payouts',
      description: 'Payout requests and processing',
    },
    {
      name: 'Analytics',
      description: 'Partner analytics and statistics',
    },
    {
      name: 'Payments',
      description: 'Stripe Connect integration',
    },
    {
      name: 'Notifications',
      description: 'Notification management',
    },
    {
      name: 'Admin',
      description: 'Administrative operations (admin only)',
    },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns the current health status of the API and its dependencies.',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'System is healthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse',
                },
                example: {
                  success: true,
                  data: {
                    status: 'healthy',
                    timestamp: '2025-01-10T12:00:00.000Z',
                    version: '1.0.0',
                    services: {
                      database: 'connected',
                      cache: 'connected',
                      email: 'configured',
                    },
                  },
                },
              },
            },
          },
          '503': {
            description: 'System is unhealthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/partners/{id}/stats': {
      get: {
        tags: ['Partners', 'Analytics'],
        summary: 'Get partner statistics',
        description: 'Returns comprehensive statistics for a specific partner including earnings, referrals, and conversion rates.',
        operationId: 'getPartnerStats',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Partner ID',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Partner statistics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PartnerStatsResponse',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
          '404': {
            $ref: '#/components/responses/NotFound',
          },
        },
      },
    },
    '/api/partners/{id}/campaigns': {
      get: {
        tags: ['Partners', 'Campaigns'],
        summary: 'List partner campaigns',
        description: 'Returns all campaigns for a specific partner with performance metrics.',
        operationId: 'getPartnerCampaigns',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Partner ID',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by campaign status',
            schema: {
              type: 'string',
              enum: ['ACTIVE', 'PAUSED', 'COMPLETED'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'Campaigns retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CampaignsResponse',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
        },
      },
      post: {
        tags: ['Partners', 'Campaigns'],
        summary: 'Create a new campaign',
        description: 'Creates a new referral campaign for the partner.',
        operationId: 'createCampaign',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Partner ID',
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateCampaignRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Campaign created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CampaignResponse',
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/BadRequest',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/partners/{id}/payouts': {
      get: {
        tags: ['Partners', 'Payouts'],
        summary: 'List partner payouts',
        description: 'Returns payout history for a specific partner.',
        operationId: 'getPartnerPayouts',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Partner ID',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by payout status',
            schema: {
              type: 'string',
              enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of results',
            schema: {
              type: 'integer',
              default: 10,
              maximum: 100,
            },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of results to skip',
            schema: {
              type: 'integer',
              default: 0,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Payouts retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PayoutsResponse',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/partners/{id}/analytics': {
      get: {
        tags: ['Partners', 'Analytics'],
        summary: 'Get detailed analytics',
        description: 'Returns detailed analytics including time-series data for charts.',
        operationId: 'getPartnerAnalytics',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Partner ID',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'period',
            in: 'query',
            description: 'Time period for analytics',
            schema: {
              type: 'string',
              enum: ['7d', '30d', '90d', '365d'],
              default: '30d',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Analytics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AnalyticsResponse',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/partners/{id}/milestones': {
      get: {
        tags: ['Partners'],
        summary: 'Get partner milestones',
        description: 'Returns milestone progress and achievements for a partner.',
        operationId: 'getPartnerMilestones',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Partner ID',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Milestones retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MilestonesResponse',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/payments/connect': {
      post: {
        tags: ['Payments'],
        summary: 'Create Stripe Connect account',
        description: 'Creates a new Stripe Connect Express account for the partner.',
        operationId: 'createConnectAccount',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateConnectRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Connect account created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ConnectResponse',
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/BadRequest',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/payments/dashboard': {
      get: {
        tags: ['Payments'],
        summary: 'Get Stripe dashboard link',
        description: 'Returns a login link to the Stripe Express dashboard.',
        operationId: 'getDashboardLink',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'partnerId',
            in: 'query',
            required: true,
            description: 'Partner ID',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Dashboard link generated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        url: { type: 'string', format: 'uri' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/payments/payout': {
      post: {
        tags: ['Payments', 'Payouts'],
        summary: 'Request a payout',
        description: 'Initiates a payout request for earned commissions.',
        operationId: 'requestPayout',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PayoutRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Payout request created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PayoutResponse',
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/BadRequest',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/payments/webhook': {
      post: {
        tags: ['Payments'],
        summary: 'Stripe webhook handler',
        description: 'Handles incoming Stripe webhook events. This endpoint is called by Stripe.',
        operationId: 'handleStripeWebhook',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Webhook processed successfully',
          },
          '400': {
            description: 'Invalid webhook payload',
          },
        },
      },
    },
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get notifications',
        description: 'Returns notifications for the authenticated user.',
        operationId: 'getNotifications',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'unreadOnly',
            in: 'query',
            description: 'Only return unread notifications',
            schema: {
              type: 'boolean',
              default: false,
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of results',
            schema: {
              type: 'integer',
              default: 20,
              maximum: 100,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Notifications retrieved',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/NotificationsResponse',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/leaderboard': {
      get: {
        tags: ['Analytics'],
        summary: 'Get leaderboard',
        description: 'Returns the partner leaderboard rankings.',
        operationId: 'getLeaderboard',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'period',
            in: 'query',
            description: 'Time period for rankings',
            schema: {
              type: 'string',
              enum: ['week', 'month', 'quarter', 'year', 'all'],
              default: 'month',
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of top partners to return',
            schema: {
              type: 'integer',
              default: 10,
              maximum: 100,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Leaderboard retrieved',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LeaderboardResponse',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Get admin dashboard stats',
        description: 'Returns aggregate statistics for the admin dashboard. Requires admin role.',
        operationId: 'getAdminStats',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Admin stats retrieved',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AdminStatsResponse',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
        },
      },
    },
    '/api/admin/partners': {
      get: {
        tags: ['Admin'],
        summary: 'List all partners',
        description: 'Returns a list of all partners with filtering options. Requires admin role.',
        operationId: 'listPartners',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Filter by partner status',
            schema: {
              type: 'string',
              enum: ['ACTIVE', 'PENDING', 'INACTIVE', 'SUSPENDED'],
            },
          },
          {
            name: 'tier',
            in: 'query',
            description: 'Filter by partner tier',
            schema: {
              type: 'string',
              enum: ['STANDARD', 'SILVER', 'GOLD', 'PLATINUM'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'Partners list retrieved',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AdminPartnersResponse',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
        },
      },
    },
    '/api/admin/partners/{id}/action': {
      post: {
        tags: ['Admin'],
        summary: 'Perform partner action',
        description: 'Performs an action on a partner (approve, suspend, activate, upgrade, downgrade). Requires admin role.',
        operationId: 'partnerAction',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Partner ID',
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PartnerActionRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Action completed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        newStatus: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/BadRequest',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
          '404': {
            $ref: '#/components/responses/NotFound',
          },
        },
      },
    },
    '/api/admin/payouts': {
      get: {
        tags: ['Admin'],
        summary: 'List all payouts',
        description: 'Returns a list of all payouts with filtering options. Requires admin role.',
        operationId: 'listPayouts',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Filter by payout status',
            schema: {
              type: 'string',
              enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'Payouts list retrieved',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AdminPayoutsResponse',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
        },
      },
    },
    '/api/admin/payouts/{id}/action': {
      post: {
        tags: ['Admin'],
        summary: 'Perform payout action',
        description: 'Performs an action on a payout (approve, process, reject). Requires admin role.',
        operationId: 'payoutAction',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Payout ID',
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PayoutActionRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Action completed successfully',
          },
          '400': {
            $ref: '#/components/responses/BadRequest',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
          '404': {
            $ref: '#/components/responses/NotFound',
          },
        },
      },
    },
    '/api/admin/bulk': {
      post: {
        tags: ['Admin'],
        summary: 'Bulk operations',
        description: 'Performs bulk operations on multiple partners or payouts. Requires admin role.',
        operationId: 'bulkAction',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BulkActionRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Bulk action completed',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/BulkActionResponse',
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/BadRequest',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
        },
      },
    },
    '/api/admin/export': {
      get: {
        tags: ['Admin'],
        summary: 'Export data as CSV',
        description: 'Exports partners, payouts, or referrals as a CSV file. Requires admin role.',
        operationId: 'exportData',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'type',
            in: 'query',
            required: true,
            description: 'Type of data to export',
            schema: {
              type: 'string',
              enum: ['partners', 'payouts', 'referrals'],
            },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by status',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'startDate',
            in: 'query',
            description: 'Start date filter (ISO format)',
            schema: {
              type: 'string',
              format: 'date',
            },
          },
          {
            name: 'endDate',
            in: 'query',
            description: 'End date filter (ISO format)',
            schema: {
              type: 'string',
              format: 'date',
            },
          },
        ],
        responses: {
          '200': {
            description: 'CSV file',
            content: {
              'text/csv': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/BadRequest',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Clerk session token',
      },
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['healthy', 'degraded', 'unhealthy'],
              },
              timestamp: { type: 'string', format: 'date-time' },
              version: { type: 'string' },
              services: {
                type: 'object',
                additionalProperties: { type: 'string' },
              },
            },
          },
        },
      },
      PartnerStatsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              totalEarnings: { type: 'number', description: 'Total earnings in cents' },
              pendingEarnings: { type: 'number' },
              totalReferrals: { type: 'integer' },
              conversionRate: { type: 'number' },
              tier: { type: 'string', enum: ['STANDARD', 'SILVER', 'GOLD', 'PLATINUM'] },
              rank: { type: 'integer' },
            },
          },
        },
      },
      CampaignsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              campaigns: {
                type: 'array',
                items: { $ref: '#/components/schemas/Campaign' },
              },
            },
          },
        },
      },
      Campaign: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'COMPLETED'] },
          referralCode: { type: 'string' },
          clicks: { type: 'integer' },
          conversions: { type: 'integer' },
          earnings: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateCampaignRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          source: { type: 'string' },
        },
      },
      CampaignResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              campaign: { $ref: '#/components/schemas/Campaign' },
            },
          },
        },
      },
      PayoutsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              payouts: {
                type: 'array',
                items: { $ref: '#/components/schemas/Payout' },
              },
              total: { type: 'integer' },
            },
          },
        },
      },
      Payout: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          amount: { type: 'number', description: 'Amount in cents' },
          fee: { type: 'number', description: 'Fee in cents' },
          netAmount: { type: 'number', description: 'Net amount in cents' },
          status: {
            type: 'string',
            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
          },
          requestedAt: { type: 'string', format: 'date-time' },
          processedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      AnalyticsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              chartData: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string', format: 'date' },
                    earnings: { type: 'number' },
                    clicks: { type: 'integer' },
                    conversions: { type: 'integer' },
                  },
                },
              },
              sourceData: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    source: { type: 'string' },
                    clicks: { type: 'integer' },
                    conversions: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      MilestonesResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              milestones: {
                type: 'array',
                items: { $ref: '#/components/schemas/Milestone' },
              },
              nextMilestone: { $ref: '#/components/schemas/Milestone' },
            },
          },
        },
      },
      Milestone: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          target: { type: 'integer' },
          progress: { type: 'integer' },
          reward: { type: 'number' },
          achieved: { type: 'boolean' },
          achievedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      CreateConnectRequest: {
        type: 'object',
        required: ['partnerId', 'email'],
        properties: {
          partnerId: { type: 'string' },
          email: { type: 'string', format: 'email' },
          returnUrl: { type: 'string', format: 'uri' },
          refreshUrl: { type: 'string', format: 'uri' },
        },
      },
      ConnectResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              accountId: { type: 'string' },
              onboardingUrl: { type: 'string', format: 'uri' },
            },
          },
        },
      },
      PayoutRequest: {
        type: 'object',
        required: ['partnerId', 'amount'],
        properties: {
          partnerId: { type: 'string' },
          amount: {
            type: 'integer',
            description: 'Amount in cents',
            minimum: 1000,
          },
        },
      },
      PayoutResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              payout: { $ref: '#/components/schemas/Payout' },
            },
          },
        },
      },
      NotificationsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              notifications: {
                type: 'array',
                items: { $ref: '#/components/schemas/Notification' },
              },
              unreadCount: { type: 'integer' },
            },
          },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: {
            type: 'string',
            enum: ['REFERRAL', 'PAYOUT', 'MILESTONE', 'SYSTEM', 'PROMOTION'],
          },
          title: { type: 'string' },
          message: { type: 'string' },
          read: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      LeaderboardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              rankings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    rank: { type: 'integer' },
                    partnerId: { type: 'string' },
                    name: { type: 'string' },
                    tier: { type: 'string' },
                    referrals: { type: 'integer' },
                    earnings: { type: 'number' },
                  },
                },
              },
              currentUserRank: { type: 'integer', nullable: true },
            },
          },
        },
      },
      AdminStatsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              stats: {
                type: 'object',
                properties: {
                  totalPartners: { type: 'integer' },
                  activePartners: { type: 'integer' },
                  pendingApprovals: { type: 'integer' },
                  totalRevenue: { type: 'number' },
                  monthlyRevenue: { type: 'number' },
                  totalPayouts: { type: 'number' },
                  pendingPayouts: { type: 'number' },
                  conversionRate: { type: 'number' },
                },
              },
              recentPartners: { type: 'array', items: { type: 'object' } },
              recentPayouts: { type: 'array', items: { type: 'object' } },
              chartData: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      AdminPartnersResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              partners: {
                type: 'array',
                items: { $ref: '#/components/schemas/AdminPartner' },
              },
            },
          },
        },
      },
      AdminPartner: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          referralCode: { type: 'string' },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'PENDING', 'INACTIVE', 'SUSPENDED'],
          },
          tier: {
            type: 'string',
            enum: ['STANDARD', 'SILVER', 'GOLD', 'PLATINUM'],
          },
          company: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          totalEarnings: { type: 'number' },
          totalReferrals: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      PartnerActionRequest: {
        type: 'object',
        required: ['action'],
        properties: {
          action: {
            type: 'string',
            enum: ['approve', 'suspend', 'activate', 'upgrade', 'downgrade'],
          },
          tier: {
            type: 'string',
            enum: ['STANDARD', 'SILVER', 'GOLD', 'PLATINUM'],
            description: 'Required for upgrade/downgrade actions',
          },
        },
      },
      AdminPayoutsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              payouts: {
                type: 'array',
                items: { $ref: '#/components/schemas/AdminPayout' },
              },
            },
          },
        },
      },
      AdminPayout: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          partnerId: { type: 'string' },
          partnerName: { type: 'string' },
          partnerEmail: { type: 'string', format: 'email' },
          amount: { type: 'number' },
          fee: { type: 'number' },
          netAmount: { type: 'number' },
          status: {
            type: 'string',
            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
          },
          requestedAt: { type: 'string', format: 'date-time' },
          processedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      PayoutActionRequest: {
        type: 'object',
        required: ['action'],
        properties: {
          action: {
            type: 'string',
            enum: ['approve', 'process', 'reject'],
          },
        },
      },
      BulkActionRequest: {
        type: 'object',
        required: ['action', 'ids'],
        properties: {
          action: {
            type: 'string',
            enum: [
              'approve_partners',
              'suspend_partners',
              'activate_partners',
              'upgrade_partners',
              'downgrade_partners',
              'approve_payouts',
              'reject_payouts',
            ],
          },
          ids: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
          },
          tier: {
            type: 'string',
            enum: ['STANDARD', 'SILVER', 'GOLD', 'PLATINUM'],
            description: 'Required for tier change actions',
          },
        },
      },
      BulkActionResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              successful: { type: 'integer' },
              failed: { type: 'integer' },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', enum: [false] },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Invalid request parameters',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request parameters',
                details: { field: 'Validation error message' },
              },
            },
          },
        },
      },
      Unauthorized: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
              },
            },
          },
        },
      },
      Forbidden: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions',
              },
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'Resource not found',
              },
            },
          },
        },
      },
    },
  },
};

export default openApiSpec;
