# Unofficial EMA MCP Server

A Model Context Protocol (MCP) server providing access to the European Medicines Agency (EMA) public JSON API for regulatory intelligence and pharmaceutical research.

## Overview

This MCP server complements FDA data sources by providing comprehensive access to EU drug approvals, EPARs (European Public Assessment Reports), orphan designations, supply shortages, safety reviews, and regulatory procedures. Together with FDA coverage, this provides ~70% global pharmaceutical market regulatory intelligence.

**Key Features**:
- ✅ Single unified `ema_info` tool with method parameter (MCP best practice)
- ✅ 14 comprehensive methods covering medicines, safety, documents, and pediatrics
- ✅ 2,641+ EU-approved medicines with 39 fields each
- ✅ Real-time orphan designations, supply shortages, and safety data
- ✅ Document search (EPAR, all EMA documents, non-EPAR documents)
- ✅ No authentication required (public API)
- ✅ Updated twice daily (06:00 and 18:00 CET)
- ✅ Comprehensive input validation and error handling
- ✅ 100% test coverage (68 tests passing)

## Usage

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

## API Reference

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

#### 7. `get_dhpcs`

Get Direct Healthcare Professional Communications (DHPCs) - safety communications sent to healthcare professionals.

**Parameters**:
- `medicine_name` (string, optional): Medicine name to filter
- `active_substance` (string, optional): Active substance name
- `dhpc_type` (string, optional): Type of DHPC
- `year` (number, optional): Dissemination year (1995-2026)
- `limit` (number, optional): Maximum results (default: 50, max: 10000)

**Example**:
```javascript
{
  "method": "get_dhpcs",
  "year": 2024
}
```

**Returns**: DHPCs from 2024 with safety information for healthcare professionals

---

#### 8. `get_psusas`

Get Periodic Safety Update Reports (PSUSAs) - ongoing safety monitoring outcomes.

**Parameters**:
- `active_substance` (string, optional): Active substance name (searches both `active_substance` and `active_substances_in_scope_of_procedure`)
- `regulatory_outcome` (string, optional): Regulatory outcome
- `limit` (number, optional): Maximum results (default: 100, max: 10000)

**Example**:
```javascript
{
  "method": "get_psusas",
  "active_substance": "metformin"
}
```

**Returns**: PSUSA records for metformin with safety monitoring results

---

#### 9. `get_pips`

Get Paediatric Investigation Plans (PIPs) - pediatric development requirements.

**Parameters**:
- `active_substance` (string, optional): Active substance name
- `therapeutic_area` (string, optional): Therapeutic area
- `decision_type` (string, optional): Type of decision
- `year` (number, optional): Decision year (1995-2026)
- `limit` (number, optional): Maximum results (default: 100, max: 10000)

**Example**:
```javascript
{
  "method": "get_pips",
  "therapeutic_area": "diabetes",
  "year": 2024
}
```

**Returns**: PIPs for diabetes approved in 2024

---

#### 10. `get_herbal_medicines`

Get herbal medicine assessments.

**Parameters**:
- `substance` (string, optional): Herbal substance or botanical name
- `therapeutic_area` (string, optional): Therapeutic area
- `limit` (number, optional): Maximum results (default: 50, max: 10000)

**Example**:
```javascript
{
  "method": "get_herbal_medicines",
  "substance": "valerian"
}
```

**Note**: EMA does not currently publish herbal medicine data as a JSON endpoint. This method returns empty results until a valid endpoint is identified.

---

#### 11. `get_article58_medicines`

Get medicines for use outside EU (Article 58) - positive scientific opinions for non-EU countries.

**Parameters**:
- `active_substance` (string, optional): Active substance name
- `medicine_name` (string, optional): Medicine name
- `limit` (number, optional): Maximum results (default: 50, max: 10000)

**Example**:
```javascript
{
  "method": "get_article58_medicines",
  "active_substance": "artemether"
}
```

**Note**: EMA does not currently publish Article 58 data as a JSON endpoint. This method returns empty results until a valid endpoint is identified.

---

#### 12. `search_epar_documents`

Search EPAR (European Public Assessment Report) documents with translations.

**Parameters**:
- `medicine_name` (string, optional): Medicine name to filter
- `document_type` (string, optional): Document type (e.g., "EPAR - Summary for the public")
- `language` (string, optional): Language code (e.g., "en", "fr", "de")
- `limit` (number, optional): Maximum results (default: 100, max: 10000)

**Example**:
```javascript
{
  "method": "search_epar_documents",
  "medicine_name": "Ozempic",
  "document_type": "Summary for the public"
}
```

**Returns**: EPAR documents for Ozempic with public summaries and translations

---

#### 13. `search_all_documents`

Search all EMA documents (complete repository).

**Parameters**:
- `search_term` (string, optional): Search in title or document_title
- `document_type` (string, optional): Document type
- `category` (string, optional): Document category
- `limit` (number, optional): Maximum results (default: 100, max: 10000)

**Example**:
```javascript
{
  "method": "search_all_documents",
  "search_term": "guideline"
}
```

**Returns**: All EMA documents matching "guideline"

---

#### 14. `search_non_epar_documents`

Search non-EPAR documents (guidelines, procedures, etc.).

**Parameters**:
- `search_term` (string, optional): Search in title or document_title
- `document_type` (string, optional): Document type
- `limit` (number, optional): Maximum results (default: 100, max: 10000)

**Example**:
```javascript
{
  "method": "search_non_epar_documents",
  "search_term": "procedure"
}
```

**Returns**: Non-EPAR documents matching "procedure"

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

The server accesses 14 EMA JSON endpoints organized into 4 categories:

### Medicines Data (6 endpoints)
1. **Medicines Database**: `medicines-output-medicines_json-report_en.json` (2,641+ medicines)
2. **Orphan Designations**: `medicines-output-orphan_designations-json-report_en.json`
3. **Supply Shortages**: `shortages-output-json-report_en.json`
4. **Referrals**: `referrals-output-json-report_en.json`
5. **Post-Authorization**: `medicines-output-post_authorisation_json-report_en.json`
6. **Herbal Medicines**: (placeholder - no JSON endpoint available)

### Safety Data (2 endpoints)
7. **DHPCs**: `dhpc-output-json-report_en.json` (160+ records)
8. **PSUSAs**: `medicines-output-periodic_safety_update_report_single_assessments-output-json-report_en.json` (2,508+ records)

### Pediatric Data (1 endpoint)
9. **PIPs**: `medicines-output-paediatric_investigation_plans-output-json-report_en.json` (3,229+ records)

### Document Access (3 endpoints)
10. **EPAR Documents**: `documents-output-epar_documents_json-report_en.json`
11. **All Documents**: `documents-output-json-report_en.json`
12. **Non-EPAR Documents**: `documents-output-non_epar_documents_json-report_en.json`

### Specialized (1 endpoint)
13. **Article 58**: (placeholder - no JSON endpoint available)

**Update Schedule**: Twice daily (06:00 and 18:00 CET)
**Document Format**: Document endpoints return `{data: [...]}` format, others return `[...]` array format

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