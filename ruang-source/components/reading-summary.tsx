import type{Reading}from'../lib/model.ts';
import{cardSummary}from'../lib/summary.ts';
export function ReadingSummary({item}:{item:Reading}){const summary=cardSummary(item);return<div className="card-summary">{summary.label&&<span className="summary-label">{summary.label}</span>}<p lang={summary.language}>{summary.text}</p></div>;}
