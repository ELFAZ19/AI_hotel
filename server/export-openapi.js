const fs = require('fs');
const swaggerSpec = require('./src/swagger');

fs.writeFileSync(
  'openapi.json',
  JSON.stringify(swaggerSpec, null, 2)
);

console.log('OpenAPI spec exported');