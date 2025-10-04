// Utility to export the frontend capability taxonomy for backend docs sync.
// Consumes CAPABILITIES from RBACContext to avoid manual duplication.
import { CAPABILITIES } from './RBACContext';

export function getCapabilitiesList(){
  return [...CAPABILITIES].sort();
}

export function toJSON(){
  return JSON.stringify({ generatedAt: new Date().toISOString(), count: CAPABILITIES.length, capabilities: getCapabilitiesList() }, null, 2);
}

export function toMarkdown(){
  const lines = ['# Frontend Capability Catalog','',`Generated: ${new Date().toISOString()}`,'',`Total: ${CAPABILITIES.length}`,'','| Capability |','|-----------|'];
  getCapabilitiesList().forEach(c=> lines.push(`| ${c} |`));
  return lines.join('\n');
}

// Optional: expose a global in dev for quick copy (safe no-op in prod builds if tree-shaken)
if(typeof window !== 'undefined'){
  window.__CAPS_JSON__ = toJSON;
  window.__CAPS_MD__ = toMarkdown;
}
