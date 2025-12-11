# EMA MCP Server

A Model Context Protocol (MCP) server providing access to the European Medicines Agency (EMA) public JSON API for regulatory intelligence and pharmaceutical research.

## Overview

This MCP server complements FDA data sources by providing comprehensive access to EU drug approvals, EPARs (European Public Assessment Reports), orphan designations, supply shortages, safety reviews, and regulatory procedures. Together with FDA coverage, this provides ~70% global pharmaceutical market regulatory intelligence.

**Key Features**:
- ✅ Single unified `ema_info` tool with method parameter (MCP best practice)
- ✅ 2,641+ EU-approved medicines with 39 fields each
- ✅ Real-time orphan designations, supply shortages, and safety referrals
- ✅ No authentication required (public API)
- ✅ Updated twice daily (06:00 and 18:00 CET)
- ✅ Comprehensive input validation and error handling
- ✅ 100% test coverage (47 tests passing)

## Installation

```bash
npm install
```

## Usage

### As MCP Server

Add to your MCP configuration (e.g., `.mcp.json`):

```json
{
  "mcpServers": {
    "ema-mcp-server": {
      "command": "node",
      "args": ["/path/to/ema-mcp-server/src/index.js"],
      "env": {}
    }
  }
}
```

### Direct API Usage

```javascript
const api = require('./src/ema-api.js');

// Search medicines
const semaglutide = await api.searchMedicines({
  active_substance: 'semaglutide',
  status: 'Authorised'
});

// Get specific medicine
const ozempic = await api.getMedicineByName('Ozempic');

// Get orphan designations
const cancerOrphans = await api.getOrphanDesignations({
  therapeutic_area: 'cancer',
  year: 2024
});

// Get supply shortages
const ongoingShortages = await api.getSupplyShortages({
  status: 'Ongoing'
});

// Get safety referrals
const safetyReviews = await api.getReferrals({
  safety: true
});
```

## API Reference

### Single Tool: `ema_info`

All functionality is accessed through one unified tool with a `method` parameter:

```json
{
  "name": "ema_info",
  "arguments": {
    "method": "search_medicines",
    "active_substance": "semaglutide",
    "status": "Authorised"
  }
}
```

### Methods

#### 1. `search_medicines`

Search EU-approved medicines database.

**Parameters**:
- `active_substance` (string, optional): Active substance name (e.g., "semaglutide", "adalimumab")
- `therapeutic_area` (string, optional): Disease or therapeutic area (e.g., "diabetes", "cancer")
- `status` (string, optional): Medicine status - "Authorised", "Withdrawn", "Refused", "Suspended"
- `orphan` (boolean, optional): Filter for orphan medicines only
- `prime` (boolean, optional): Filter for PRIME (priority) medicines only
- `biosimilar` (boolean, optional): Filter for biosimilar medicines only
- `conditional_approval` (boolean, optional): Filter for conditionally approved medicines
- `limit` (number, optional): Maximum results (default: 100, max: 10000)

**Example**:
```javascript
{
  "method": "search_medicines",
  "active_substance": "semaglutide",
  "status": "Authorised",
  "limit": 10
}
```

**Returns**: 3 semaglutide medicines (Ozempic, Wegovy, Rybelsus)

---

#### 2. `get_medicine_by_name`

Get specific medicine by trade name.

**Parameters**:
- `name` (string, **required**): Medicine trade name (case-insensitive, supports partial matching)

**Example**:
```javascript
{
  "method": "get_medicine_by_name",
  "name": "Ozempic"
}
```

**Returns**: Complete medicine record with EMA product number, active substance, approval details, etc.

---

#### 3. `get_orphan_designations`

Get EU orphan drug designations for rare diseases.

**Parameters**:
- `therapeutic_area` (string, optional): Disease/condition (searches in intended_use field)
- `active_substance` (string, optional): Active substance name
- `year` (number, optional): Designation year (1995-2026)
- `status` (string, optional): "Positive", "Negative", "Withdrawn"
- `limit` (number, optional): Maximum results (default: 100, max: 10000)

**Example**:
```javascript
{
  "method": "get_orphan_designations",
  "therapeutic_area": "cancer",
  "year": 2024,
  "status": "Positive"
}
```

**Returns**: Cancer orphan designations from 2024 with positive status

---

#### 4. `get_supply_shortages`

Get medicine supply shortage information.

**Parameters**:
- `active_substance` (string, optional): Active substance or INN
- `medicine_name` (string, optional): Medicine trade name
- `therapeutic_area` (string, optional): Therapeutic area
- `status` (string, optional): "Ongoing" or "Resolved" (case-insensitive)
- `limit` (number, optional): Maximum results (default: 50, max: 10000)

**Example**:
```javascript
{
  "method": "get_supply_shortages",
  "status": "Ongoing",
  "medicine_name": "insulin"
}
```

**Returns**: Ongoing insulin shortages with affected products and reasons

---

#### 5. `get_referrals`

Get EU-wide safety reviews and referrals.

**Parameters**:
- `safety` (boolean, optional): Filter for safety-related referrals (true=Yes, false=No)
- `active_substance` (string, optional): Active substance name
- `status` (string, optional): Current status (e.g., "Under evaluation", "Completed")
- `year` (number, optional): Procedure start year (1995-2026)
- `limit` (number, optional): Maximum results (default: 50, max: 10000)

**Example**:
```javascript
{
  "method": "get_referrals",
  "safety": true,
  "year": 2024
}
```

**Returns**: Safety-related referrals started in 2024

**Note**: The `safety_referral` field uses "Sì" (Italian) for Yes and "No" for No.

---

#### 6. `get_post_auth_procedures`

Get post-authorization procedures (label updates, extensions, etc.).

**Parameters**:
- `medicine_name` (string, optional): Medicine name to filter
- `limit` (number, optional): Maximum results (default: 50, max: 10000)

**Example**:
```javascript
{
  "method": "get_post_auth_procedures",
  "medicine_name": "Brilique"
}
```

**Returns**: Post-authorization procedures for Brilique

---

## Response Format

All methods return a consistent format:

```json
{
  "total_count": 3,
  "results": [...],
  "source": "EMA Medicines Database",
  "source_url": "https://www.ema.europa.eu/...",
  "last_updated": "2025-12-11T10:30:00.000Z"
}
```

## Data Sources

The server accesses 6 EMA JSON endpoints:

1. **Medicines Database**: `medicines-output-medicines_json-report_en.json` (2,641+ medicines)
2. **Orphan Designations**: `medicines-output-orphan_designations-json-report_en.json`
3. **Supply Shortages**: `shortages-output-json-report_en.json`
4. **Referrals**: `referrals-output-json-report_en.json`
5. **Post-Authorization**: `medicines-output-post_authorisation_json-report_en.json`

**Update Schedule**: Twice daily (06:00 and 18:00 CET)

## Medicine Record Schema

Each medicine record contains 39 fields including:

- `name_of_medicine`: Trade name
- `active_substance`: INN/common name
- `ema_product_number`: Unique identifier (e.g., "EMEA/H/C/004174")
- `therapeutic_area_mesh`: MeSH therapeutic areas
- `therapeutic_indication`: Approved indications
- `medicine_status`: Authorised, Withdrawn, Refused, Suspended
- `authorisation_date`: DD Month YYYY format
- `orphan_medicine`: Yes/No
- `biosimilar`: Yes/No
- `conditional_approval`: Yes/No
- `prime_priority_medicine`: Yes/No
- `marketing_authorisation_holder`: Company name
- And 27 more fields...

## EMA ↔ FDA Terminology Mapping

| EMA Term | FDA Equivalent |
|----------|----------------|
| EPAR (European Public Assessment Report) | Drug Label / Approval Package |
| Active Substance | Active Ingredient |
| Orphan Designation | Orphan Drug Designation |
| PRIME (Priority Medicines) | Breakthrough Therapy |
| Conditional Approval | Accelerated Approval |
| Referral | Safety Review |
| Marketing Authorisation Holder | Sponsor/Applicant |
| Medicinal Product | Drug Product |

## Error Handling

The server includes comprehensive error handling:

- **Input Validation**: All parameters validated before API calls
- **Network Errors**: Timeout (30s), connection failures, HTTP errors
- **Data Validation**: Response format validation
- **Informative Errors**: Clear error messages with context

**Example Error**:
```json
{
  "error": "limit must be a number between 1 and 10000",
  "source": "EMA MCP Server"
}
```

## Testing

Run the comprehensive test suite:

```bash
node test.js
```

**Coverage**:
- 8 test suites
- 47 individual assertions
- 100% success rate
- Tests all 6 methods, edge cases, validation, and response formats

## Implementation Notes

### Field Mapping Corrections

Based on actual EMA JSON inspection, the following field mappings were corrected:

1. **Orphan Designations**: Uses `intended_use` (not `therapeutic_area`) for condition description
2. **Supply Shortages**: Uses `international_non_proprietary_name_inn_or_common_name` and `medicine_affected` (not `active_substance`)
3. **Referrals**: `safety_referral` field uses "Sì" (Italian) instead of "Yes"
4. **Medicines**: `orphan_medicine` and `biosimilar` flags not consistently set in main database (use separate endpoints)

### Design Decisions

1. **Single Tool Pattern**: Following MCP best practices, all functionality exposed through one `ema_info` tool with `method` parameter
2. **CommonJS**: Uses `require()` syntax (like WHO MCP) instead of TypeScript (simpler, fewer dependencies)
3. **No Authentication**: EMA API is fully public, no API keys needed
4. **Conservative Defaults**: Reasonable limits (100 medicines, 50 other endpoints) to avoid overwhelming responses
5. **Case-Insensitive Filtering**: All text searches are case-insensitive for better UX

## License

MIT License - Copyright (c) 2025 OpenPharma Contributors

## Contributing

This server is part of the OpenPharma organization's pharmaceutical intelligence platform.

## Related Projects

- **fda-mcp-server**: FDA drug labels, adverse events, recalls
- **ct-gov-mcp-server**: ClinicalTrials.gov data
- **pubmed-mcp-server**: PubMed biomedical literature
- **who-mcp-server**: WHO global health statistics

Together these servers provide comprehensive pharmaceutical research intelligence covering regulatory, clinical, safety, and scientific data sources.
