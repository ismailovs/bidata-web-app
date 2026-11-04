import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server.mjs';

async function fixture(t, extra = {}, stripeFetch) {
 const server=await createApp({DATABASE_PATH:':memory:',PUBLIC_ORIGIN:'http://localhost:8080',...extra},stripeFetch);
 server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const base='http://127.0.0.1:'+server.address().port;
 const call=async(path,{method='GET',data,cookie,origin='http://localhost:8080'}={})=>fetch(base+path,{method,headers:{Origin:origin,...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(data?{body:JSON.stringify(data)}:{})});
 const register=async(email='one@example.test')=>{const r=await call('/api/register',{method:'POST',data:{email,password:'test-password-12345'}});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];};
 return {call,register};
}
test('PWA assets are served, all precache assets exist, private APIs are not in cache list',async t=>{
 const {call}=await fixture(t);
 const manifest=await (await call('/manifest.webmanifest')).json();assert.equal(manifest.display,'standalone');
 for(const icon of manifest.icons)assert.equal((await call(icon.src)).status,200);
 assert.equal((await call('/icons/apple-touch-icon.png')).status,200);
 const html=await (await call('/')).text();assert.match(html,/apple-touch-icon/);
 const sw=await (await call('/sw.js')).text();assert.match(sw,/url.pathname.startsWith\('\/api\/'\)/);
 assert.equal((await call('/server.mjs')).status,404);
});
test('account registration, login, logout and session invalidation',async t=>{
 const {call,register}=await fixture(t);const cookie=await register();
 assert.equal((await (await call('/api/me',{cookie})).json()).email,'one@example.test');
 const wrong=await call('/api/login',{method:'POST',data:{email:'one@example.test',password:'wrong-password-long'}});assert.equal(wrong.status,401);
 const login=await call('/api/login',{method:'POST',data:{email:'one@example.test',password:'test-password-12345'}});assert.equal(login.status,200);assert.match(login.headers.get('set-cookie'),/HttpOnly; SameSite=Lax/);
 await call('/api/logout',{method:'POST',data:{},cookie});assert.equal(await (await call('/api/me',{cookie})).json(),null);
});
test('bookmarks, company profiles and workflow are isolated by account',async t=>{
 const {call,register}=await fixture(t);const a=await register(),b=await register('two@example.test');
 assert.equal((await call('/api/bookmarks',{method:'POST',data:{id:'demo-001'},cookie:a})).status,200);
 assert.deepEqual(await (await call('/api/bookmarks',{cookie:b})).json(),[]);
 await call('/api/profile',{method:'PUT',data:{keywords:'кабель',region:'Тошкент'},cookie:a});
 assert.equal((await (await call('/api/profile',{cookie:b})).json()).keywords,'');
 assert.equal((await call('/api/workflow',{method:'PUT',data:{id:'demo-001',stage:'submitted'},cookie:b})).status,400);
 assert.equal((await call('/api/workflow',{method:'PUT',data:{id:'demo-001',stage:'preparing'},cookie:a})).status,200);
 assert.equal((await (await call('/api/workflow',{cookie:a})).json())[0].stage,'preparing');
});
test('mutation CSRF, password validation, anonymous access and authentication rate limits',async t=>{
 const {call}=await fixture(t);
 assert.equal((await call('/api/register',{method:'POST',data:{},origin:'https://evil.example'})).status,403);
 assert.equal((await call('/api/bookmarks')).status,401);
 assert.equal((await call('/api/register',{method:'POST',data:{email:'x@example.test',password:'short'}})).status,400);
 let status;for(let i=0;i<22;i++)status=(await call('/api/login',{method:'POST',data:{email:'x@example.test',password:'incorrect-long-password'}})).status;
 assert.equal(status,429);
});
test('sample data cannot activate real checkout; success query never grants Pro',async t=>{
 const {call,register}=await fixture(t,{PAYMENTS_ENABLED:'true',BILLING_MODE:'live',STRIPE_SECRET_KEY:'sk_live_fake',STRIPE_PRICE_MONTHLY:'price_month',STRIPE_PRICE_YEARLY:'price_year',PRIVACY_URL:'https://example.test/privacy',TERMS_URL:'https://example.test/terms',SUPPORT_EMAIL:'help@example.test'});
 const cookie=await register();assert.equal((await (await call('/api/config')).json()).paymentsEnabled,false);
 assert.equal((await call('/api/checkout',{method:'POST',data:{plan:'monthly'},cookie})).status,503);
 await call('/?checkout=returned');assert.equal((await (await call('/api/me',{cookie})).json()).pro,false);
 assert.equal((await call('/api/export',{cookie})).status,403);
});
test('live feed rejects absent, stale, duplicate or invalid sources and never substitutes sample data',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'bidata-'));t.after(()=>rm(dir,{recursive:true,force:true}));const file=join(dir,'tenders.json');
 const {call}=await fixture(t,{DATA_MODE:'live',TENDERS_FILE:file});assert.equal((await call('/api/tenders')).status,503);
 const items=JSON.parse(await readFile(new URL('../data/sample-tenders.json',import.meta.url)));const tender={...items[0],id:'live-1',sourceUrl:'https://example.test/lot/1'};
 await writeFile(file,JSON.stringify({updatedAt:new Date().toISOString(),tenders:[tender]}));assert.equal((await (await call('/api/tenders')).json()).mode,'live');
 await writeFile(file,JSON.stringify({updatedAt:'2020-01-01',tenders:[tender]}));assert.equal((await call('/api/tenders')).status,503);
 await writeFile(file,JSON.stringify({updatedAt:new Date().toISOString(),tenders:[tender,tender]}));assert.equal((await call('/api/tenders')).status,503);
 await writeFile(file,JSON.stringify({updatedAt:new Date().toISOString(),tenders:[{...tender,sourceUrl:'javascript:alert(1)'}]}));assert.equal((await call('/api/tenders')).status,503);
});
test('subscription checkout binds customer server-side and only verified allowed active subscriptions grant export',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'bidata-'));t.after(()=>rm(dir,{recursive:true,force:true}));const file=join(dir,'tenders.json');
 const tender={id:'live-1',title:'=CMD()',buyer:'Buyer',region:'Toshkent',category:'IT',amount:1000,currency:'UZS',deadline:'2027-01-01',source:'UZEX',sourceUrl:'https://example.test/1'};
 await writeFile(file,JSON.stringify({updatedAt:new Date().toISOString(),tenders:[tender]}));
 let active=false,allowed=true,paused=false;const calls=[];
 const stripeFetch=async(url,options)=>{calls.push({url,options});const path=new URL(url).pathname;let data;
 if(path==='/v1/customers')data={id:'cus_test'};
 else if(path==='/v1/subscriptions')data={data:active?[{status:'active',livemode:false,pause_collection:paused?{}:null,items:{data:[{price:{id:allowed?'price_month':'price_other'}}]}}]:[],has_more:false};
 else if(path==='/v1/checkout/sessions')data=options.method==='POST'?{url:'https://checkout.stripe.com/test',livemode:false}:{data:[]};
 else if(path==='/v1/billing_portal/sessions')data={url:'https://billing.stripe.com/test'};
 else if(path.startsWith('/v1/prices/'))data={livemode:false,active:true,type:'recurring',unit_amount:2000,currency:'usd',recurring:{interval:path.endsWith('month')?'month':'year',interval_count:1}};
 else throw Error('Unexpected mock API path');return new Response(JSON.stringify(data));};
 const {call,register}=await fixture(t,{DATA_MODE:'live',TENDERS_FILE:file,PAYMENTS_ENABLED:'true',BILLING_MODE:'test',STRIPE_SECRET_KEY:'sk_test_fake',STRIPE_PRICE_MONTHLY:'price_month',STRIPE_PRICE_YEARLY:'price_year',PRIVACY_URL:'https://example.test/privacy',TERMS_URL:'https://example.test/terms',SUPPORT_EMAIL:'help@example.test'},stripeFetch);
 const cookie=await register();const checkout=await call('/api/checkout',{method:'POST',data:{plan:'monthly',customer:'cus_attacker',price:'price_other'},cookie});assert.equal(checkout.status,200);
 const params=calls.find(c=>c.url.includes('/checkout/sessions')&&c.options.method==='POST').options.body;
 assert.equal(params.get('customer'),'cus_test');assert.equal(params.get('line_items[0][price]'),'price_month');
 active=true;assert.equal((await (await call('/api/me',{cookie})).json()).pro,true);
 const csv=await call('/api/export',{cookie});assert.equal(csv.status,200);assert.match(await csv.text(),/'=CMD/);
 assert.equal((await call('/api/checkout',{method:'POST',data:{plan:'yearly'},cookie})).status,409);
 allowed=false;assert.equal((await call('/api/export',{cookie})).status,403);
 allowed=true;paused=true;assert.equal((await call('/api/export',{cookie})).status,403);
 paused=false;active=false;assert.equal((await (await call('/api/me',{cookie})).json()).pro,false);
});
test('sample tenders allow test checkout only, with matching Stripe environment',async t=>{
 const calls=[];
 const stripeFetch=async(url,options)=>{calls.push(url);const path=new URL(url).pathname;
 if(path==='/v1/customers')return new Response(JSON.stringify({id:'cus_test'}));
 if(path==='/v1/subscriptions')return new Response(JSON.stringify({data:[],has_more:false}));
 if(path==='/v1/checkout/sessions')return new Response(JSON.stringify(options.method==='POST'?{url:'https://checkout.stripe.com/test',livemode:false}:{data:[]}));
 throw Error('Unexpected request');};
 const settings={PAYMENTS_ENABLED:'true',BILLING_MODE:'test',STRIPE_SECRET_KEY:'sk_test_fake',STRIPE_PRICE_MONTHLY:'price_month',STRIPE_PRICE_YEARLY:'price_year'};
 const {call,register}=await fixture(t,settings,stripeFetch);const cookie=await register();
 const config=await(await call('/api/config')).json();assert.equal(config.paymentsEnabled,true);assert.equal(config.billingMode,'test');assert.equal(config.dataMode,'sample');assert.equal(JSON.stringify(config).includes('sk_test'),false);
 assert.equal((await call('/api/checkout',{method:'POST',data:{plan:'monthly'},cookie})).status,200);
 assert.ok(calls.length>0);
 const mismatch=await fixture(t,{...settings,STRIPE_SECRET_KEY:'sk_live_fake'},()=>{throw Error('Must never call provider with mismatched key');});
 assert.equal((await(await mismatch.call('/api/config')).json()).paymentsEnabled,false);
 const live=await fixture(t,{...settings,BILLING_MODE:'live',STRIPE_SECRET_KEY:'sk_live_fake',PRIVACY_URL:'https://example.test/privacy',TERMS_URL:'https://example.test/terms',SUPPORT_EMAIL:'help@example.test'});
 assert.equal((await(await live.call('/api/config')).json()).paymentsEnabled,false);
});
