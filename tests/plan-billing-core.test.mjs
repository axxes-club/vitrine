import assert from 'node:assert/strict';import{test}from'node:test';import{mayWrite,effectiveSnapshot,planKeyFor}from'../src/lib/plan-billing-core.ts';import{VITRINE_CATALOG as C}from'../src/lib/vitrine-billing.ts';
const now=Date.parse('2026-10-08');const future=new Date('2026-12-01'),past=new Date('2026-09-01');
test('never replaces another product\'s live plan',()=>{
  assert.equal(mayWrite({planKey:'build',status:'active',currentPeriodEnd:future},C,now),false);
  assert.equal(mayWrite({planKey:'build',status:'canceled',currentPeriodEnd:future},C,now),true);
  assert.equal(mayWrite({planKey:'build',status:'active',currentPeriodEnd:past},C,now),true);
  assert.equal(mayWrite({planKey:'free',status:'active',currentPeriodEnd:null},C,now),true);
  assert.equal(mayWrite({planKey:'collector',status:'active',currentPeriodEnd:future},C,now),true);
  assert.equal(mayWrite(undefined,C,now),true);
});
test('an ended subscription defers to another live one',()=>{
  const ended={id:'sub_1',status:'canceled',lookup_key:'vitrine_collector_monthly'},live={id:'sub_2',status:'active',lookup_key:'vitrine_collector-pro_annual'};
  assert.equal(effectiveSnapshot(ended,[ended,live]).id,'sub_2');
  assert.equal(effectiveSnapshot(ended,[ended]).id,'sub_1');
  assert.equal(planKeyFor(C,live),'collector-pro');
  assert.equal(planKeyFor(C,{id:'x',status:'active',lookup_key:'afters_signature_30d'}),null);
});
