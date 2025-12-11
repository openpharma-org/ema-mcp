#!/usr/bin/env node

/**
 * Comprehensive test suite for EMA MCP Server
 * Tests all 6 methods with various parameters and edge cases
 */

const api = require('./src/ema-api.js');

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    testsFailed++;
    console.log(`  ✗ FAILED: ${message}`);
  }
}

async function runTests() {
  console.log('=== EMA MCP Server - Comprehensive Test Suite ===\n');

  try {
    // ==========================================
    // Test Suite 1: search_medicines
    // ==========================================
    console.log('Test Suite 1: search_medicines');

    // Test 1.1: Search by active substance
    const semaglutide = await api.searchMedicines({
      active_substance: 'semaglutide',
      status: 'Authorised'
    });
    assert(semaglutide.total_count === 3, 'Found 3 semaglutide medicines');
    assert(semaglutide.results.some(m => m.name_of_medicine === 'Ozempic'), 'Found Ozempic');
    assert(semaglutide.results.some(m => m.name_of_medicine === 'Wegovy'), 'Found Wegovy');
    assert(semaglutide.results.some(m => m.name_of_medicine === 'Rybelsus'), 'Found Rybelsus');

    // Test 1.2: Search by therapeutic area
    const diabetes = await api.searchMedicines({
      therapeutic_area: 'diabetes',
      limit: 10
    });
    assert(diabetes.total_count > 0, 'Found diabetes medicines');
    assert(diabetes.total_count <= 10, 'Respects limit parameter');

    // Test 1.3: Search with status filter
    const authorised = await api.searchMedicines({ status: 'Authorised', limit: 5 });
    assert(authorised.results.every(m => m.medicine_status === 'Authorised'),
           'All results have Authorised status');

    // Test 1.4: Empty search returns all (with limit)
    const all = await api.searchMedicines({ limit: 100 });
    assert(all.total_count === 100, 'Returns 100 medicines with limit');
    assert(all.results.length === 100, 'Results array has 100 items');

    console.log('');

    // ==========================================
    // Test Suite 2: get_medicine_by_name
    // ==========================================
    console.log('Test Suite 2: get_medicine_by_name');

    // Test 2.1: Find existing medicine
    const ozempic = await api.getMedicineByName('Ozempic');
    assert(ozempic.found === true, 'Ozempic found');
    assert(ozempic.medicine.active_substance === 'semaglutide', 'Correct active substance');
    assert(ozempic.medicine.ema_product_number === 'EMEA/H/C/004174', 'Correct EMA number');

    // Test 2.2: Case-insensitive search
    const ozempicLower = await api.getMedicineByName('ozempic');
    assert(ozempicLower.found === true, 'Case-insensitive search works');

    // Test 2.3: Partial name match
    const partial = await api.getMedicineByName('Ozemp');
    assert(partial.found === true, 'Partial name match works');

    // Test 2.4: Non-existent medicine
    const fake = await api.getMedicineByName('NonExistentDrugXYZ123');
    assert(fake.found === false, 'Non-existent medicine returns found=false');
    assert(fake.message.includes('not found'), 'Error message present');

    console.log('');

    // ==========================================
    // Test Suite 3: get_orphan_designations
    // ==========================================
    console.log('Test Suite 3: get_orphan_designations');

    // Test 3.1: Filter by therapeutic area
    const cancerOrphans = await api.getOrphanDesignations({
      therapeutic_area: 'cancer',
      limit: 10
    });
    assert(cancerOrphans.total_count > 0, 'Found cancer orphan designations');
    assert(cancerOrphans.results.every(d =>
      d.intended_use && d.intended_use.toLowerCase().includes('cancer')
    ), 'All results relate to cancer');

    // Test 3.2: Filter by year
    const recent = await api.getOrphanDesignations({
      year: 2024,
      limit: 10
    });
    assert(recent.total_count > 0, 'Found 2024 designations');
    assert(recent.results.every(d =>
      d.date_of_designation_or_refusal && d.date_of_designation_or_refusal.includes('2024')
    ), 'All results from 2024');

    // Test 3.3: Filter by active substance
    const substanceOrphans = await api.getOrphanDesignations({
      active_substance: 'carfilzomib'
    });
    assert(substanceOrphans.total_count > 0, 'Found carfilzomib orphan designations');

    // Test 3.4: Filter by status
    const positive = await api.getOrphanDesignations({
      status: 'Positive',
      limit: 5
    });
    assert(positive.results.every(d => d.status === 'Positive'), 'All results have Positive status');

    console.log('');

    // ==========================================
    // Test Suite 4: get_supply_shortages
    // ==========================================
    console.log('Test Suite 4: get_supply_shortages');

    // Test 4.1: Get ongoing shortages
    const ongoing = await api.getSupplyShortages({
      status: 'Ongoing',
      limit: 10
    });
    assert(ongoing.total_count > 0, 'Found ongoing shortages');
    assert(ongoing.results.every(s =>
      s.supply_shortage_status === 'Ongoing'
    ), 'All results have Ongoing status');

    // Test 4.2: Filter by medicine name
    const insulinShortage = await api.getSupplyShortages({
      medicine_name: 'insulin'
    });
    assert(insulinShortage.total_count > 0, 'Found insulin shortages');
    assert(insulinShortage.results.some(s =>
      s.medicine_affected && s.medicine_affected.toLowerCase().includes('insulin')
    ), 'Results contain insulin');

    // Test 4.3: Filter by active substance
    const parecoxibShortage = await api.getSupplyShortages({
      active_substance: 'parecoxib'
    });
    assert(parecoxibShortage.total_count > 0, 'Found parecoxib shortages');

    console.log('');

    // ==========================================
    // Test Suite 5: get_referrals
    // ==========================================
    console.log('Test Suite 5: get_referrals');

    // Test 5.1: Safety referrals
    const safetyRefs = await api.getReferrals({
      safety: true,
      limit: 10
    });
    assert(safetyRefs.total_count > 0, 'Found safety referrals');
    assert(safetyRefs.results.every(r =>
      r.safety_referral === 'Sì' || r.safety_referral === 'Yes'
    ), 'All results are safety referrals');

    // Test 5.2: Non-safety referrals
    const nonSafety = await api.getReferrals({
      safety: false,
      limit: 10
    });
    assert(nonSafety.total_count > 0, 'Found non-safety referrals');
    assert(nonSafety.results.every(r => r.safety_referral === 'No'),
           'All results are non-safety referrals');

    // Test 5.3: Filter by status
    const underEval = await api.getReferrals({
      status: 'Under evaluation',
      limit: 5
    });
    if (underEval.total_count > 0) {
      assert(underEval.results.every(r =>
        r.current_status && r.current_status.includes('Under evaluation')
      ), 'All results under evaluation');
    }

    console.log('');

    // ==========================================
    // Test Suite 6: get_post_auth_procedures
    // ==========================================
    console.log('Test Suite 6: get_post_auth_procedures');

    // Test 6.1: All procedures
    const allProcedures = await api.getPostAuthProcedures({ limit: 10 });
    assert(allProcedures.total_count > 0, 'Found post-auth procedures');
    assert(allProcedures.results.length <= 10, 'Respects limit');

    // Test 6.2: Filter by medicine name
    const briliqueProcedures = await api.getPostAuthProcedures({
      medicine_name: 'Brilique'
    });
    if (briliqueProcedures.total_count > 0) {
      assert(briliqueProcedures.results.every(p =>
        p.name_of_medicine && p.name_of_medicine.includes('Brilique')
      ), 'All results for Brilique');
    }

    console.log('');

    // ==========================================
    // Test Suite 7: Response Format Validation
    // ==========================================
    console.log('Test Suite 7: Response Format Validation');

    const sample = await api.searchMedicines({ limit: 1 });

    assert(sample.hasOwnProperty('total_count'), 'Response has total_count');
    assert(sample.hasOwnProperty('results'), 'Response has results array');
    assert(sample.hasOwnProperty('source'), 'Response has source');
    assert(sample.hasOwnProperty('source_url'), 'Response has source_url');
    assert(sample.hasOwnProperty('last_updated'), 'Response has last_updated');

    assert(Array.isArray(sample.results), 'Results is an array');
    assert(typeof sample.total_count === 'number', 'total_count is a number');
    assert(typeof sample.source === 'string', 'source is a string');
    assert(sample.source_url.startsWith('https://'), 'source_url is a valid URL');

    console.log('');

    // ==========================================
    // Test Suite 8: Edge Cases
    // ==========================================
    console.log('Test Suite 8: Edge Cases');

    // Test 8.1: Empty result set
    const noResults = await api.searchMedicines({
      active_substance: 'xyznonexistentsubstance123'
    });
    assert(noResults.total_count === 0, 'Empty search returns 0 count');
    assert(noResults.results.length === 0, 'Empty results array');

    // Test 8.2: Large limit
    const large = await api.searchMedicines({ limit: 2000 });
    assert(large.total_count <= 2000, 'Limit caps results');

    // Test 8.3: Zero limit defaults
    const defaultLimit = await api.searchMedicines({ active_substance: 'metformin' });
    assert(defaultLimit.total_count <= 100, 'Default limit of 100 applied');

    console.log('');

    // ==========================================
    // Summary
    // ==========================================
    console.log('=== Test Summary ===');
    console.log(`Total tests: ${testsRun}`);
    console.log(`Passed: ${testsPassed} ✓`);
    console.log(`Failed: ${testsFailed} ✗`);
    console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

    if (testsFailed === 0) {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log(`\n⚠️  ${testsFailed} test(s) failed`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
