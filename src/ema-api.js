const axios = require('axios');

const EMA_BASE_URL = 'https://www.ema.europa.eu/en/documents/report';

/**
 * Generate EMA API URL for different JSON endpoints
 * @param {string} endpoint - The specific endpoint (e.g., 'medicines-output-medicines_json-report_en.json')
 * @returns {string} Complete API URL
 */
function generateEmaUrl(endpoint) {
  return `${EMA_BASE_URL}/${endpoint}`;
}

/**
 * Make HTTP request to EMA JSON API with proper error handling
 * @param {string} url - API URL to request
 * @returns {Promise<Array|Object>} Response data
 */
async function makeEmaRequest(url) {
  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'EMA-MCP-Server/0.0.1',
        'Accept': 'application/json'
      }
    });

    const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

    // Validate response is an array
    if (!Array.isArray(data)) {
      throw new Error('EMA API returned non-array response');
    }

    return data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('EMA API request timeout (30s exceeded)');
    } else if (error.response) {
      throw new Error(`EMA API HTTP error ${error.response.status}: ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error('EMA API network error: No response received');
    } else {
      throw new Error(`EMA API request failed: ${error.message}`);
    }
  }
}

/**
 * Parse EMA date format (DD Month YYYY) to ISO format (YYYY-MM-DD)
 * @param {string} emaDate - Date in EMA format
 * @returns {string|null} ISO formatted date or null
 */
function parseEmaDate(emaDate) {
  if (!emaDate) return null;

  try {
    const months = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };

    const parts = emaDate.trim().split(' ');
    if (parts.length !== 3) return null;

    const day = parts[0].padStart(2, '0');
    const month = months[parts[1]];
    const year = parts[2];

    return month ? `${year}-${month}-${day}` : null;
  } catch {
    return null;
  }
}

/**
 * Search medicines in EMA database
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} Search results with medicines data
 */
async function searchMedicines(params = {}) {
  // Validate input parameters
  if (params.limit && (typeof params.limit !== 'number' || params.limit < 1 || params.limit > 10000)) {
    throw new Error('limit must be a number between 1 and 10000');
  }

  if (params.status && !['Authorised', 'Withdrawn', 'Refused', 'Suspended'].includes(params.status)) {
    throw new Error('status must be one of: Authorised, Withdrawn, Refused, Suspended');
  }

  const url = generateEmaUrl('medicines-output-medicines_json-report_en.json');
  const allMedicines = await makeEmaRequest(url);

  let results = allMedicines;

  // Filter by active substance
  if (params.active_substance) {
    const searchTerm = params.active_substance.toLowerCase();
    results = results.filter(m =>
      m.active_substance && m.active_substance.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by therapeutic area
  if (params.therapeutic_area) {
    const searchTerm = params.therapeutic_area.toLowerCase();
    results = results.filter(m =>
      (m.therapeutic_area_mesh && m.therapeutic_area_mesh.toLowerCase().includes(searchTerm)) ||
      (m.therapeutic_indication && m.therapeutic_indication.toLowerCase().includes(searchTerm))
    );
  }

  // Filter by medicine status
  if (params.status) {
    results = results.filter(m => m.medicine_status === params.status);
  }

  // Filter by regulatory flags
  if (params.orphan === true) {
    results = results.filter(m => m.orphan_medicine === 'Yes');
  }

  if (params.prime === true) {
    results = results.filter(m => m.prime_priority_medicine === 'Yes');
  }

  if (params.biosimilar === true) {
    results = results.filter(m => m.biosimilar === 'Yes');
  }

  if (params.conditional_approval === true) {
    results = results.filter(m => m.conditional_approval === 'Yes');
  }

  // Apply limit
  const limit = params.limit || 100;
  results = results.slice(0, limit);

  return {
    total_count: results.length,
    results: results,
    source: 'EMA Medicines Database',
    source_url: url,
    last_updated: new Date().toISOString()
  };
}

/**
 * Get specific medicine by name
 * @param {string} name - Medicine name to search
 * @returns {Promise<Object>} Medicine data or null
 */
async function getMedicineByName(name) {
  // Validate input
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('name parameter is required and must be a non-empty string');
  }

  const url = generateEmaUrl('medicines-output-medicines_json-report_en.json');
  const allMedicines = await makeEmaRequest(url);

  const searchTerm = name.trim().toLowerCase();
  const medicine = allMedicines.find(m =>
    m.name_of_medicine && m.name_of_medicine.toLowerCase().includes(searchTerm)
  );

  if (!medicine) {
    return {
      found: false,
      message: `Medicine "${name}" not found in EMA database`,
      source: 'EMA Medicines Database',
      source_url: url
    };
  }

  return {
    found: true,
    medicine: medicine,
    source: 'EMA Medicines Database',
    source_url: url,
    last_updated: new Date().toISOString()
  };
}

/**
 * Get orphan drug designations
 * @param {Object} params - Filter parameters
 * @returns {Promise<Object>} Orphan designations data
 */
async function getOrphanDesignations(params = {}) {
  // Validate input parameters
  if (params.limit && (typeof params.limit !== 'number' || params.limit < 1 || params.limit > 10000)) {
    throw new Error('limit must be a number between 1 and 10000');
  }

  if (params.year && (typeof params.year !== 'number' || params.year < 1995 || params.year > new Date().getFullYear() + 1)) {
    throw new Error(`year must be a number between 1995 and ${new Date().getFullYear() + 1}`);
  }

  if (params.status && !['Positive', 'Negative', 'Withdrawn'].includes(params.status)) {
    throw new Error('status must be one of: Positive, Negative, Withdrawn');
  }

  const url = generateEmaUrl('medicines-output-orphan_designations-json-report_en.json');
  const allDesignations = await makeEmaRequest(url);

  let results = allDesignations;

  // Filter by therapeutic area (searches in intended_use field)
  if (params.therapeutic_area) {
    const searchTerm = params.therapeutic_area.toLowerCase();
    results = results.filter(d =>
      d.intended_use && d.intended_use.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by active substance if provided
  if (params.active_substance) {
    const searchTerm = params.active_substance.toLowerCase();
    results = results.filter(d =>
      d.active_substance && d.active_substance.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by year if provided (searches in date_of_designation_or_refusal)
  if (params.year) {
    results = results.filter(d => {
      const date = d.date_of_designation_or_refusal;
      return date && date.includes(params.year.toString());
    });
  }

  // Filter by status if provided
  if (params.status) {
    results = results.filter(d =>
      d.status && d.status.toLowerCase() === params.status.toLowerCase()
    );
  }

  // Apply limit
  const limit = params.limit || 100;
  results = results.slice(0, limit);

  return {
    total_count: results.length,
    results: results,
    source: 'EMA Orphan Designations',
    source_url: url,
    last_updated: new Date().toISOString()
  };
}

/**
 * Get medicine supply shortages
 * @param {Object} params - Filter parameters
 * @returns {Promise<Object>} Shortage data
 */
async function getSupplyShortages(params = {}) {
  // Validate input parameters
  if (params.limit && (typeof params.limit !== 'number' || params.limit < 1 || params.limit > 10000)) {
    throw new Error('limit must be a number between 1 and 10000');
  }

  if (params.status && !['Ongoing', 'Resolved', 'ongoing', 'resolved'].includes(params.status)) {
    throw new Error('status must be one of: Ongoing, Resolved (case-insensitive)');
  }

  const url = generateEmaUrl('shortages-output-json-report_en.json');
  const allShortages = await makeEmaRequest(url);

  let results = allShortages;

  // Filter by active substance (uses international_non_proprietary_name_inn_or_common_name field)
  if (params.active_substance) {
    const searchTerm = params.active_substance.toLowerCase();
    results = results.filter(s =>
      (s.international_non_proprietary_name_inn_or_common_name &&
       s.international_non_proprietary_name_inn_or_common_name.toLowerCase().includes(searchTerm)) ||
      (s.medicine_affected && s.medicine_affected.toLowerCase().includes(searchTerm))
    );
  }

  // Filter by medicine name if provided
  if (params.medicine_name) {
    const searchTerm = params.medicine_name.toLowerCase();
    results = results.filter(s =>
      s.medicine_affected && s.medicine_affected.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by therapeutic area if provided
  if (params.therapeutic_area) {
    const searchTerm = params.therapeutic_area.toLowerCase();
    results = results.filter(s =>
      s.therapeutic_area_mesh && s.therapeutic_area_mesh.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by status (uses supply_shortage_status field: "Ongoing" or "Resolved")
  if (params.status) {
    results = results.filter(s =>
      s.supply_shortage_status &&
      s.supply_shortage_status.toLowerCase() === params.status.toLowerCase()
    );
  }

  // Apply limit
  const limit = params.limit || 50;
  results = results.slice(0, limit);

  return {
    total_count: results.length,
    results: results,
    source: 'EMA Medicine Supply Shortages',
    source_url: url,
    last_updated: new Date().toISOString()
  };
}

/**
 * Get referrals (EU-wide safety reviews)
 * @param {Object} params - Filter parameters
 * @returns {Promise<Object>} Referrals data
 */
async function getReferrals(params = {}) {
  // Validate input parameters
  if (params.limit && (typeof params.limit !== 'number' || params.limit < 1 || params.limit > 10000)) {
    throw new Error('limit must be a number between 1 and 10000');
  }

  if (params.safety !== undefined && typeof params.safety !== 'boolean') {
    throw new Error('safety parameter must be a boolean (true or false)');
  }

  if (params.year && (typeof params.year !== 'number' || params.year < 1995 || params.year > new Date().getFullYear() + 1)) {
    throw new Error(`year must be a number between 1995 and ${new Date().getFullYear() + 1}`);
  }

  const url = generateEmaUrl('referrals-output-json-report_en.json');
  const allReferrals = await makeEmaRequest(url);

  let results = allReferrals;

  // Filter by safety-related if specified (uses safety_referral field: "Sì" or "No")
  if (params.safety === true) {
    results = results.filter(r =>
      r.safety_referral === 'Sì' || r.safety_referral === 'Yes'
    );
  } else if (params.safety === false) {
    results = results.filter(r =>
      r.safety_referral === 'No'
    );
  }

  // Filter by active substance if provided
  if (params.active_substance) {
    const searchTerm = params.active_substance.toLowerCase();
    results = results.filter(r =>
      r.international_non_proprietary_name_inn_common_name &&
      r.international_non_proprietary_name_inn_common_name.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by status if provided
  if (params.status) {
    const searchTerm = params.status.toLowerCase();
    results = results.filter(r =>
      r.current_status && r.current_status.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by year if provided (uses procedure_start_date field)
  if (params.year) {
    results = results.filter(r => {
      const startDate = r.procedure_start_date;
      return startDate && startDate.includes(params.year.toString());
    });
  }

  // Apply limit
  const limit = params.limit || 50;
  results = results.slice(0, limit);

  return {
    total_count: results.length,
    results: results,
    source: 'EMA Referrals',
    source_url: url,
    last_updated: new Date().toISOString()
  };
}

/**
 * Get post-authorization procedures
 * @param {Object} params - Filter parameters
 * @returns {Promise<Object>} Post-auth procedures data
 */
async function getPostAuthProcedures(params = {}) {
  // Validate input parameters
  if (params.limit && (typeof params.limit !== 'number' || params.limit < 1 || params.limit > 10000)) {
    throw new Error('limit must be a number between 1 and 10000');
  }

  const url = generateEmaUrl('medicines-output-post_authorisation_json-report_en.json');
  const allProcedures = await makeEmaRequest(url);

  let results = allProcedures;

  // Filter by medicine name if provided
  if (params.medicine_name) {
    const searchTerm = params.medicine_name.toLowerCase();
    results = results.filter(p =>
      p.medicine_name && p.medicine_name.toLowerCase().includes(searchTerm)
    );
  }

  // Apply limit
  const limit = params.limit || 50;
  results = results.slice(0, limit);

  return {
    total_count: results.length,
    results: results,
    source: 'EMA Post-Authorization Procedures',
    source_url: url,
    last_updated: new Date().toISOString()
  };
}

module.exports = {
  searchMedicines,
  getMedicineByName,
  getOrphanDesignations,
  getSupplyShortages,
  getReferrals,
  getPostAuthProcedures,
  parseEmaDate
};
