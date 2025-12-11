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

    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  } catch (error) {
    throw new Error(`EMA API request failed: ${error.message}`);
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
  const url = generateEmaUrl('medicines-output-medicines_json-report_en.json');
  const allMedicines = await makeEmaRequest(url);

  const searchTerm = name.toLowerCase();
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
  const url = generateEmaUrl('medicines-output-orphan_designations-json-report_en.json');
  const allDesignations = await makeEmaRequest(url);

  let results = allDesignations;

  // Filter by therapeutic area if provided
  if (params.therapeutic_area) {
    const searchTerm = params.therapeutic_area.toLowerCase();
    results = results.filter(d =>
      (d.therapeutic_area && d.therapeutic_area.toLowerCase().includes(searchTerm)) ||
      (d.orphan_condition && d.orphan_condition.toLowerCase().includes(searchTerm))
    );
  }

  // Filter by year if provided
  if (params.year) {
    results = results.filter(d => {
      const date = d.date_of_designation;
      return date && date.includes(params.year.toString());
    });
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
  const url = generateEmaUrl('shortages-output-json-report_en.json');
  const allShortages = await makeEmaRequest(url);

  let results = allShortages;

  // Filter by active substance if provided
  if (params.active_substance) {
    const searchTerm = params.active_substance.toLowerCase();
    results = results.filter(s =>
      s.active_substance && s.active_substance.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by status (ongoing/resolved)
  if (params.status) {
    const isOngoing = params.status === 'ongoing';
    results = results.filter(s => {
      // If has end date, it's resolved; otherwise ongoing
      const hasEndDate = s.end_date && s.end_date !== '';
      return isOngoing ? !hasEndDate : hasEndDate;
    });
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
  const url = generateEmaUrl('referrals-output-json-report_en.json');
  const allReferrals = await makeEmaRequest(url);

  let results = allReferrals;

  // Filter by safety-related if specified
  if (params.safety === true) {
    results = results.filter(r =>
      (r.referral_type && r.referral_type.toLowerCase().includes('safety')) ||
      (r.grounds && r.grounds.toLowerCase().includes('safety'))
    );
  }

  // Filter by year if provided
  if (params.year) {
    results = results.filter(r => {
      const startDate = r.start_date;
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
