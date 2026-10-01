import assert from 'node:assert/strict';import{test}from'node:test';import{authorizedCollections}from'../src/lib/collection-access.ts';
const orgs=[{id:'team',name:'AXXES CLUB',slug:'axxes'},{id:'client',name:'Reyes-Veray',slug:'coleccion-reyes-veray'}];
const get=(seats)=>authorizedCollections(orgs,seats,'coleccion-reyes-veray',['AXXES CLUB']);
test('entry-only membership opens pinned collection with inherited viewer permission',()=>assert.deepEqual(get([{tenantId:'team',role:'viewer'}]),[{...orgs[1],role:'viewer',viaOrg:'AXXES CLUB'}]));
test('direct-only membership opens pinned collection without billing exemption',()=>assert.deepEqual(get([{tenantId:'client',role:'member'}]),[{...orgs[1],role:'registrar',viaOrg:null}]));
test('dual membership retains strongest permission and entry provenance',()=>assert.deepEqual(get([{tenantId:'client',role:'viewer'},{tenantId:'team',role:'admin'}]),[{...orgs[1],role:'admin',viaOrg:'AXXES CLUB'}]));
test('unrelated or invalid seats grant no collection access',()=>{assert.deepEqual(get([{tenantId:'other',role:'admin'}]),[]);assert.deepEqual(get([{tenantId:'team',role:'invalid'}]),[])});
test('no seat yields no fabricated collection; superadmin uses explicit context fallback',()=>assert.deepEqual(get([]),[]));
test('missing pinned collection grants no entry-org desk',()=>assert.deepEqual(authorizedCollections([orgs[0]],[{tenantId:'team',role:'admin'}],'coleccion-reyes-veray',['AXXES CLUB']),[]));
test('a collector opens only their directly assigned private collection',()=>{
 const privateCollection={id:'private',name:'Private Collection',slug:'my-private-collection'};
 assert.deepEqual(authorizedCollections([...orgs,privateCollection],[{tenantId:'private',role:'owner'}],'coleccion-reyes-veray',['AXXES CLUB']),[{...privateCollection,role:'admin',viaOrg:null}]);
});
test('an entry organization does not grant another collector’s private collection',()=>{
 const other={id:'other',name:'Another Collector',slug:'other-collector'};
 assert.deepEqual(authorizedCollections([...orgs,other],[{tenantId:'team',role:'viewer'}],'coleccion-reyes-veray',['AXXES CLUB']),[{...orgs[1],role:'viewer',viaOrg:'AXXES CLUB'}]);
});
