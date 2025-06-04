const fs = require('fs');

// Read the storage file
let content = fs.readFileSync('server/storage.ts', 'utf8');

// Find all method signatures and add database initialization
const methodPattern = /async (\w+)\([^)]*\): Promise[^{]*{/g;
let matches = [...content.matchAll(methodPattern)];

// For each method that doesn't already have initializeDatabase, add it
for (let match of matches) {
  const methodStart = match.index;
  const methodName = match[1];
  
  // Skip if method already has initializeDatabase
  const methodBody = content.slice(methodStart);
  const nextMethodStart = methodBody.indexOf('async ', 1);
  const methodContent = nextMethodStart > 0 ? methodBody.slice(0, nextMethodStart) : methodBody;
  
  if (!methodContent.includes('const database = initializeDatabase()') && 
      methodContent.includes('await database.')) {
    
    // Find where to insert the database initialization
    const openBrace = content.indexOf('{', methodStart);
    const insertPoint = openBrace + 1;
    
    // Insert the database initialization
    const beforeInsert = content.slice(0, insertPoint);
    const afterInsert = content.slice(insertPoint);
    
    content = beforeInsert + '\n    const database = initializeDatabase();' + afterInsert;
  }
}

// Write the fixed content back
fs.writeFileSync('server/storage.ts', content);
console.log('Fixed storage.ts database initializations');