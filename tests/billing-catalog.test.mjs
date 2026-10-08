import assert from 'node:assert/strict';import{test}from'node:test';import{lookupKeyFor,VITRINE_CATALOG}from'../src/lib/vitrine-billing.ts';
test('only Vitrine collector plans are sold, by stable lookup key',()=>{
  assert.equal(lookupKeyFor('collector','monthly'),'vitrine_collector_monthly');
  assert.equal(lookupKeyFor('collector-pro','annual'),'vitrine_collector-pro_annual');
  assert.equal(lookupKeyFor('scale','monthly'),null);
  assert.equal(lookupKeyFor('collector','weekly'),'vitrine_collector_monthly');
});
test('every lookup key belongs to the vitrine product and maps to a shared plan key',()=>{
  for(const[key,plan]of Object.entries(VITRINE_CATALOG.planByLookupKey)){assert.ok(key.startsWith('vitrine_'));assert.ok(['collector','collector-pro'].includes(plan))}
});
