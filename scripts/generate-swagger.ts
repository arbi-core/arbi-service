import { fastify } from 'fastify';
import fs from 'fs';
import { buildApp } from '../app';

async function generateSwagger() {
  try {
    const app = await buildApp();

    // Get the Swagger JSON
    const swaggerJson = await app.inject({
      method: 'GET',
      url: '/documentation/json',
    });

    // Write the Swagger JSON to a file
    fs.writeFileSync('./swagger-spec.json', swaggerJson.payload);

    console.log('Swagger JSON has been generated successfully!');
    await app.close();
  } catch (err) {
    console.error('Error generating Swagger documentation:', err);
    process.exit(1);
  }
}

generateSwagger();