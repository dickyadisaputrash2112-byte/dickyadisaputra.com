import type{Block,Reading}from'../model.ts';
export const CATALOG_VERSION=7;
export type CuratedDocument={version:1;id:string;revision:string;reading:Reading;blocks:Block[];metadata:string;license:{name:string;url:string;attribution:string};source:{provider:'europe-pmc';url:string;pmcid:string;doi:string};fetchedAt:string;bodyWords:number;sections:string[]};
export type CatalogStore={get:<T>(key:string)=>Promise<T|null>;put:(key:string,value:unknown)=>Promise<void>;list:<T>(prefix:string)=>Promise<T[]>};
export type Candidate={pmcid:string;doi:string;title:string;journal:string;issns:string[];year:number;published:string;authors:string[];types:string[];license:string;abstract:string;retracted:boolean;authorAffiliations:string;topic:string};
export type CatalogIndex={items:Reading[];updatedAt:string;policyVersion:number;notice?:string;errors?:string[];rejected?:number};
export type EditorialNote={topic:string;reason:string;method:string;limitations:string};
