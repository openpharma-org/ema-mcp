# EMA MCP Server

A Model Context Protocol (MCP) server for accessing European Medicines Agency (EMA) drug information and regulatory data.

## Features

- **Single Unified Tool**: `ema_info` with method parameter (following MCP best practices)
- **No Authentication Required**: Uses EMA's public JSON API
- **6 Methods Available**:
  - `search_medicines` - Search EU approved medicines by active substance, therapeutic area, or regulatory flags
  - `get_medicine_by_name` - Get specific medicine by trade name
  - `get_orphan_designations` - EU orphan drug designations
  - `get_supply_shortages` - Medicine supply shortage tracking
  - `get_referrals` - EU-wide safety reviews and regulatory actions
  - `get_post_auth_procedures` - Post-authorization procedures (label updates, indication expansions)

## Installation

```bash
npm install
```

## Usage

### As MCP Server

Add to your `.mcp.json`:

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

### Standalone Testing

```bash
node src/index.js
```

## Example Queries

### Search GLP-1 Medicines

```json
{
  "method": "search_medicines",
  "active_substance": "semaglutide",
  "status": "Authorised"
}
```

### Get Specific Medicine

```json
{
  "method": "get_medicine_by_name",
  "name": "Ozempic"
}
```

### Get Orphan Designations

```json
{
  "method": "get_orphan_designations",
  "therapeutic_area": "cancer",
  "year": 2024
}
```

### Get Medicine Shortages

```json
{
  "method": "get_supply_shortages",
  "status": "ongoing"
}
```

## Data Source

All data comes from EMA's public JSON API:
- **Base URL**: `https://www.ema.europa.eu/en/documents/report/`
- **Update Frequency**: Twice daily (06:00 and 18:00 CET)
- **Coverage**: 2,641+ medicines (as of Dec 2025)

## EMA vs FDA

Complements FDA MCP server for global regulatory intelligence:
- **EMA**: 27 EU countries (~25% global pharma market)
- **FDA**: US (~45% global pharma market)
- **Together**: ~70% global coverage

## License

MIT

## Author

OpenPharma Contributors
