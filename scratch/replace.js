const fs = require('fs');
let content = fs.readFileSync('src/db/schema.ts', 'utf-8');

// Update imports
content = content.replace('import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";', 'import { pgTable, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";');

// Update table creation
content = content.replaceAll('sqliteTable', 'pgTable');

// Replace boolean
content = content.replace(/integer\("([^"]+)",\s*\{\s*mode:\s*"boolean"\s*\}\)/g, 'boolean("$1")');

// Replace timestamp
content = content.replace(/integer\("([^"]+)",\s*\{\s*mode:\s*"timestamp"\s*\}\)/g, 'timestamp("$1", { mode: "date" })');

fs.writeFileSync('src/db/schema.ts', content);
console.log('Schema updated successfully!');
