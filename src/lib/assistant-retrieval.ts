import { knowledge, type KnowledgeEntry } from './assistant-knowledge';

export type AssistantSource = { title: string; href: string };
export type AssistantAnswer = { answer: string; status: 'ANSWERED' | 'UNKNOWN' | 'CLARIFICATION_NEEDED'; sources: AssistantSource[] };
const unknown: AssistantAnswer = { status:'UNKNOWN', answer:'I don’t have enough verified information to answer that accurately. Please contact the Myco team to confirm.', sources:[] };
const stop = new Set('a an the and or is are was to for in on of with what how does do did can could should my your you i we me please tell about does have has it this that'.split(' '));
const tokens = (s:string) => (s.toLowerCase().match(/[a-z0-9+#]+/g) || []).filter(t => t.length > 1 && !stop.has(t));
/** Deterministic subword-hash cosine + BM25 lexical score, adapted from the original assistant retriever. */
function vector(text:string): Float64Array {
  const v = new Float64Array(256); const ts=tokens(text);
  const add=(s:string,w:number)=>{let h=2166136261; for(const c of s) h=Math.imul(h^c.charCodeAt(0),16777619); v[(h>>>0)%256]+=w;};
  ts.forEach((t,i)=>{add(t,1); if(t.length>4) for(let j=0;j<t.length-3;j++) add(t.slice(j,j+4),.35); if(i+1<ts.length)add(t+'_'+ts[i+1],.75);});
  const norm=Math.sqrt(v.reduce((a,n)=>a+n*n,0)); if(norm) for(let i=0;i<v.length;i++)v[i]/=norm; return v;
}
const index = knowledge.map(entry=>({entry, terms:tokens(entry.searchText+' '+entry.answer), vec:vector(entry.searchText+' '+entry.answer)}));
const avgLength=index.reduce((a,d)=>a+d.terms.length,0)/index.length;
function score(query:string, doc:typeof index[number]):number {
  const qt=[...new Set(tokens(query))]; const qv=vector(query); let cosine=0; for(let i=0;i<256;i++)cosine+=qv[i]*doc.vec[i];
  let bm=0; for(const term of qt){const df=index.filter(d=>d.terms.includes(term)).length;const tf=doc.terms.filter(t=>t===term).length;if(tf)bm+=Math.log(1+(index.length-df+.5)/(df+.5))*tf*2.2/(tf+1.2*(.25+.75*doc.terms.length/avgLength));}
  return .65*cosine+.35*(1-Math.exp(-bm));
}
/** Conservative intent whitelist ensures a loosely relevant retrieval cannot invent an answer. */
export function answerQuestion(question:string):AssistantAnswer {
  const q=typeof question==='string'?question.trim().slice(0,1000):'';
  if(q.length<2)return {status:'CLARIFICATION_NEEDED',answer:'Please enter a question about Myco, its workflow, pricing or availability.',sources:[]};
  if(/\b(ignore|disregard|reveal|system prompt|password|credential|api key|secret)\b/i.test(q) && !/\b(model|llm|usage|billing|cost|pay|provider)\b/i.test(q)) return unknown;
  if(/\b(compare|comparison|competitor|coderabbit|greptile|codeant|vs\.?|versus)\b/i.test(q))return unknown;
  if (/\b(?:what (?:is|does) myco(?: do)?|how does myco work)\s+(?:and|also|plus)\b/i.test(q)) return unknown;
  // Unknown product/tool/financial requests must not be answered merely because they mention Myco.
  if(/\b(refund|cancel|cancellation|tax|invoice|discount|hipaa|iso\s?27001|uptime|sla|aws|gcp|bitbucket|azure|jenkins|webhook|stripe|jira cloud|sharepoint)\b/i.test(q)) return unknown;
  if (/\b(prd|prds|requirements?|specs?|specification|acceptance criteria)\b/i.test(q) && /\b(linear|sharepoint|asana|monday|clickup|trello|basecamp|coda|box|dropbox)\b/i.test(q)) return unknown;
  const matches=index.filter(({entry})=>entry.questions.some(re=>re.test(q))).map(d=>({...d,score:score(q,d)}));
  if(!matches.length)return unknown;
  // Do not answer a multi-topic request with an excerpt covering only one part.
  // Treat broad overview / availability matches as contextual unless explicitly joined.
  const concrete = matches.filter(m=>!['overview','live','contact','prd'].includes(m.entry.id));
  if (concrete.length > 1 && /\b(and|or|also|plus|with|versus|vs)\b|[?;,]/i.test(q.replace(/\?\s*$/, ''))) return unknown;
  if (matches.some(m=>['overview','prd'].includes(m.entry.id)) && concrete.filter(c=>!['prd-sources','prd-tickets'].includes(c.entry.id)).length && /\b(and|also|plus)\b/i.test(q)) return unknown;
  // A genuine lexical/subword relevance threshold remains necessary even for a recognized intent.
  const supported = matches.filter(m=>m.score >= 0.12);
  if (!supported.length) return unknown;
  // Prefer specific topics to general overview, while score selects between candidate sources.
  const ordered=['prd-tickets','prd-sources','prd','seats','trial','billing','security','testing','autonomy','integrations','languages','roadmap','workflow','live','overview','contact'];
  supported.sort((a,b)=> {
    const broad=(id:string)=>['overview','live','contact','prd'].includes(id);
    if(broad(a.entry.id)!==broad(b.entry.id)) return broad(a.entry.id)?1:-1;
    return (b.score-a.score) || (ordered.indexOf(a.entry.id)-ordered.indexOf(b.entry.id));
  });
  const chosen:KnowledgeEntry=supported[0].entry;
  return {status:'ANSWERED',answer:chosen.answer,sources:[{title:chosen.title,href:chosen.href}]};
}
