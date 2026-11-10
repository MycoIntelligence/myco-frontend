import {cp,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await copyFile(new URL('./out/index.html',import.meta.url),root+'index.html');
for(const name of ['_next','brands']) await cp(new URL('./out/'+name,import.meta.url),root+name,{recursive:true});
console.log('Updated homepage HTML and assets. Existing pages and API are unchanged.');
