import assert from 'node:assert/strict';
import { uploadPhotoBatch } from '../../studio/photo-queue.js';
import { saveWritingPost } from '../../studio/writing-store.js';
const entries=[1,2,3].map(id=>({id,file:`file-${id}`}));let fail=true;const uploads=[],saved=[];
const handlers={async upload(file){uploads.push(file);return 'https://example.invalid/'+file},async persist(entry){if(entry.id===2&&fail)throw Error('Temporary save failure');saved.push(entry.id)}};
assert.deepEqual(await uploadPhotoBatch(entries,handlers),{saved:2,failed:1});
assert.deepEqual(saved,[1,3]);assert.equal(entries[1].error,'Temporary save failure');
fail=false;assert.deepEqual(await uploadPhotoBatch(entries,handlers),{saved:3,failed:0});
assert.deepEqual(saved,[1,3,2]);assert.equal(uploads.length,3,'Retry reuses upload and does not duplicate successful photos');
function fakeClient(rpcFails=false){const writes=[],calls=[];let row={id:'new-post'};return {writes,calls,
 from(){let payload;const q={insert(p){payload=p;writes.push(structuredClone(p));return q},update(p){payload=p;writes.push(structuredClone(p));return q},eq(){return q},select(){return q},async single(){row={...row,...payload};return {data:row,error:null}}};return q},async rpc(){calls.push('password');return {error:rpcFails?{message:'RPC failed'}:null}}};}
const payload={title:'A private note',content:'Private body',status:'published',access_level:'password'};
const good=fakeClient();const post=await saveWritingPost(good,{id:null,payload,password:'test-only-password',existing:null});
assert.equal(good.writes[0].status,'draft');assert.equal(good.writes.at(-1).access_level,'password');assert.equal(post.status,'published');assert.equal(good.calls.length,1);
const bad=fakeClient(true);await assert.rejects(()=>saveWritingPost(bad,{id:null,payload,password:'test-only-password',existing:null}),/Draf tersimpan/);assert.equal(bad.writes.length,1);assert.equal(bad.writes[0].status,'draft','Password error never publishes unlocked content');
const existing=fakeClient();await saveWritingPost(existing,{id:'existing',payload,password:'',existing:{password_hash:'exists'}});assert.equal(existing.writes[0].access_level,'password');assert.equal(existing.calls.length,0);
console.log('PASS: multi-photo upload, partial failure/retry without duplicates, locked-post staged publish, failure remains draft, existing password preserved.');
