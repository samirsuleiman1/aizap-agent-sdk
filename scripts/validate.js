#!/usr/bin/env node
/**
 * Validates all agent.json files in /agents against the schema.
 * Run: node scripts/validate.js
 * CI: runs automatically on every PR.
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../schema/agent.schema.json');
const agentsDir = path.join(__dirname, '../agents');

// Minimal JSON Schema validator (no external deps)
function validate(data, schema) {
  const errors = [];

  // Required fields
  for (const key of schema.required ?? []) {
    if (data[key] === undefined) errors.push(`Missing required field: "${key}"`);
  }

  // additionalProperties
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(data)) {
      if (!schema.properties[key]) errors.push(`Unknown field: "${key}"`);
    }
  }

  // Property-level checks
  for (const [key, def] of Object.entries(schema.properties ?? {})) {
    const val = data[key];
    if (val === undefined) continue;

    if (def.type === 'string') {
      if (typeof val !== 'string') { errors.push(`"${key}" must be a string`); continue; }
      if (def.minLength && val.length < def.minLength) errors.push(`"${key}" is too short (min ${def.minLength})`);
      if (def.maxLength && val.length > def.maxLength) errors.push(`"${key}" is too long (max ${def.maxLength})`);
      if (def.pattern && !new RegExp(def.pattern).test(val)) errors.push(`"${key}" doesn't match pattern ${def.pattern}`);
      if (def.enum && !def.enum.includes(val)) errors.push(`"${key}" must be one of: ${def.enum.join(', ')}`);
    }

    if (def.type === 'array') {
      if (!Array.isArray(val)) { errors.push(`"${key}" must be an array`); continue; }
      if (def.maxItems && val.length > def.maxItems) errors.push(`"${key}" has too many items (max ${def.maxItems})`);
      if (def.uniqueItems && new Set(val).size !== val.length) errors.push(`"${key}" must have unique items`);
      if (def.items?.enum) {
        for (const item of val) {
          if (!def.items.enum.includes(item)) errors.push(`"${key}" contains invalid value "${item}". Allowed: ${def.items.enum.join(', ')}`);
        }
      }
    }

    if (def.type === 'boolean' && typeof val !== 'boolean') {
      errors.push(`"${key}" must be a boolean`);
    }
  }

  return errors;
}

// Collect all agent folders
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const agentFolders = fs.readdirSync(agentsDir).filter((f) =>
  fs.statSync(path.join(agentsDir, f)).isDirectory()
);

let totalErrors = 0;
const seenIds = new Set();

for (const folder of agentFolders) {
  const agentFile = path.join(agentsDir, folder, 'agent.json');

  if (!fs.existsSync(agentFile)) {
    console.error(`❌ ${folder}: missing agent.json`);
    totalErrors++;
    continue;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(agentFile, 'utf8'));
  } catch {
    console.error(`❌ ${folder}/agent.json: invalid JSON`);
    totalErrors++;
    continue;
  }

  const errors = validate(data, schema);

  // Extra: folder name must match agent id
  if (data.id && folder !== data.id) {
    errors.push(`Folder name "${folder}" must match agent id "${data.id}"`);
  }

  // Extra: monetization rules
  if (data.monetization) {
    const m = data.monetization;
    if (!m.model) {
      errors.push('monetization.model is required');
    }
    if (!m.aizap_publisher_id) {
      errors.push('monetization.aizap_publisher_id is required');
    } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(m.aizap_publisher_id)) {
      errors.push('monetization.aizap_publisher_id must be a valid UUID');
    } else if (m.aizap_publisher_id === '00000000-0000-0000-0000-000000000000') {
      errors.push('monetization.aizap_publisher_id is a placeholder — replace it with your real UUID from AiZap → Profile → Creator Settings');
    }
    if ((m.model === 'paid' || m.model === 'freemium') && !m.price_brl) {
      errors.push(`monetization.price_brl is required when model is "${m.model}"`);
    }
    if (m.price_brl !== undefined) {
      if (typeof m.price_brl !== 'number') errors.push('monetization.price_brl must be a number');
      else if (m.price_brl < 0.99) errors.push('monetization.price_brl must be at least 0.99');
      else if (m.price_brl > 999.99) errors.push('monetization.price_brl must be at most 999.99');
    }
  }

  // Extra: duplicate id check
  if (data.id) {
    if (seenIds.has(data.id)) {
      errors.push(`Duplicate agent id "${data.id}"`);
    } else {
      seenIds.add(data.id);
    }
  }

  if (errors.length) {
    console.error(`❌ ${folder}:`);
    errors.forEach((e) => console.error(`   - ${e}`));
    totalErrors += errors.length;
  } else {
    console.log(`✅ ${folder} (v${data.version}) by @${data.author}`);
  }
}

console.log('');
if (totalErrors > 0) {
  console.error(`Found ${totalErrors} error(s). Fix them before submitting.`);
  process.exit(1);
} else {
  console.log(`All ${agentFolders.length} agent(s) valid.`);
}
