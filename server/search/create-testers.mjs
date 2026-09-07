import {randomBytes,createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
const dest=resolve(process.argv[2] || './private');
mkdirSync(dest,{recursive:true,mode:0o700});
const testers=Array.from({length:14},(_,i)=>({tester:`tester-${String(i+1).padStart(2,'0')}`,code:randomBytes(32).toString('base64url')}));
// Exclusive writes prevent accidental rotation or loss of existing tester credentials.
writeFileSync(join(dest,'tester-codes.json'),JSON.stringify(testers,null,2),{flag:'wx',mode:0o600});
writeFileSync(join(dest,'token-hashes.json'),JSON.stringify(testers.map(t=>createHash('sha256').update(t.code).digest('hex')),null,2),{flag:'wx',mode:0o600});
console.log('Created 14 tester codes and server hashes in '+dest+'. Share each tester only their own code privately.');
