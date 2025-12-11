#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const {
  searchMedicines,
  getMedicineByName,
  getOrphanDesignations,
  getSupplyShortages,
  getReferrals,
  getPostAuthProcedures,
  getDhpcs,
  getPsusas,
  getPips,
  getHerbalMedicines,
  getArticle58Medicines,
  searchEparDocuments,
  searchAllDocuments,
  searchNonEparDocuments
} = require('./ema-api.js');

const server = new Server(
  {
    name: 'ema-mcp-server',
    version: '0.0.1',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'ema_info',
        description: 'Unified tool for EMA (European Medicines Agency) drug information lookup. Provides access to EU drug approvals, EPARs, orphan designations, supply shortages, and regulatory information through EMA\'s public JSON API.',
        inputSchema: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              enum: ['search_medicines', 'get_medicine_by_name', 'get_orphan_designations', 'get_supply_shortages', 'get_referrals', 'get_post_auth_procedures', 'get_dhpcs', 'get_psusas', 'get_pips', 'get_herbal_medicines', 'get_article58_medicines', 'search_epar_documents', 'search_all_documents', 'search_non_epar_documents'],
              description: 'The operation to perform: search_medicines (search EU approved drugs), get_medicine_by_name (get specific medicine), get_orphan_designations (EU orphan drugs), get_supply_shortages (medicine shortages), get_referrals (EU safety reviews), get_post_auth_procedures (label updates), get_dhpcs (safety communications), get_psusas (periodic safety reports), get_pips (paediatric plans), get_herbal_medicines (herbal assessments), get_article58_medicines (non-EU use), search_epar_documents (EPAR docs), search_all_documents (all EMA docs), search_non_epar_documents (non-EPAR docs)',
              examples: ['search_medicines', 'get_dhpcs', 'search_epar_documents']
            },
            // Parameters for search_medicines
            active_substance: {
              type: 'string',
              description: 'For search_medicines, get_supply_shortages: Active substance name (e.g., "semaglutide", "adalimumab")',
              examples: ['semaglutide', 'adalimumab', 'pembrolizumab']
            },
            therapeutic_area: {
              type: 'string',
              description: 'For search_medicines, get_orphan_designations: Therapeutic area or disease (e.g., "diabetes", "cancer", "multiple sclerosis")',
              examples: ['diabetes', 'cancer', 'multiple sclerosis', 'obesity']
            },
            status: {
              type: 'string',
              description: 'For search_medicines: Medicine status filter. For get_supply_shortages: "ongoing" or "resolved"',
              examples: ['Authorised', 'Withdrawn', 'Refused', 'ongoing', 'resolved']
            },
            orphan: {
              type: 'boolean',
              description: 'For search_medicines: Filter for orphan medicines only',
              examples: [true, false]
            },
            prime: {
              type: 'boolean',
              description: 'For search_medicines: Filter for PRIME (priority) medicines only',
              examples: [true, false]
            },
            biosimilar: {
              type: 'boolean',
              description: 'For search_medicines: Filter for biosimilar medicines only',
              examples: [true, false]
            },
            conditional_approval: {
              type: 'boolean',
              description: 'For search_medicines: Filter for conditionally approved medicines',
              examples: [true, false]
            },
            limit: {
              type: 'integer',
              description: 'Maximum number of results to return (default: 100 for medicines, 50 for other methods)',
              examples: [10, 50, 100]
            },
            // Parameter for get_medicine_by_name
            name: {
              type: 'string',
              description: 'For get_medicine_by_name: Medicine trade name to search (e.g., "Ozempic", "Wegovy", "Humira")',
              examples: ['Ozempic', 'Wegovy', 'Humira', 'Keytruda']
            },
            // Parameters for get_orphan_designations
            year: {
              type: 'integer',
              description: 'For get_orphan_designations, get_referrals: Filter by year (e.g., 2024, 2023)',
              examples: [2024, 2023, 2022]
            },
            // Parameters for get_referrals
            safety: {
              type: 'boolean',
              description: 'For get_referrals: Filter for safety-related referrals (true=Yes, false=No)',
              examples: [true, false]
            },
            // Parameters for get_supply_shortages and get_post_auth_procedures
            medicine_name: {
              type: 'string',
              description: 'For get_supply_shortages, get_post_auth_procedures: Medicine name to filter',
              examples: ['Ozempic', 'Keytruda', 'Insulin lispro']
            }
          },
          required: ['method'],
          additionalProperties: false
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name !== 'ema_info') {
    throw new Error(`Unknown tool: ${name}`);
  }

  try {
    const { method, ...params } = args;

    switch (method) {
      case 'search_medicines': {
        const results = await searchMedicines(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'get_medicine_by_name': {
        const { name } = params;
        if (!name) {
          throw new Error('name parameter is required for get_medicine_by_name');
        }

        const results = await getMedicineByName(name);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'get_orphan_designations': {
        const results = await getOrphanDesignations(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'get_supply_shortages': {
        const results = await getSupplyShortages(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'get_referrals': {
        const results = await getReferrals(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'get_post_auth_procedures': {
        const results = await getPostAuthProcedures(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'get_dhpcs': {
        const results = await getDhpcs(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'get_psusas': {
        const results = await getPsusas(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'get_pips': {
        const results = await getPips(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'get_herbal_medicines': {
        const results = await getHerbalMedicines(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'get_article58_medicines': {
        const results = await getArticle58Medicines(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'search_epar_documents': {
        const results = await searchEparDocuments(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'search_all_documents': {
        const results = await searchAllDocuments(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      case 'search_non_epar_documents': {
        const results = await searchNonEparDocuments(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.message,
            source: 'EMA MCP Server'
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('EMA MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
