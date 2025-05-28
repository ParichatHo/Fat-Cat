require('dotenv').config({ path: '.env.local' });
const Hapi = require('@hapi/hapi');
const { prismaPlugin } = require('./src/plugins/prisma');
const routes = require('./src/routes');
const { swaggerPlugin } = require('./src/plugins/swagger');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: 'localhost',
    routes: {
      validate: {
        failAction: async (request, h, err) => {
          throw err; // Show detailed validation errors during development
        }
      }
    }
  });

  await server.register(prismaPlugin);
  // Register the Prisma plugin to make it available in the server context
  await server.register(swaggerPlugin);
  // Register the Swagger plugin for API documentation
  // url: '/documentation',
  server.route(routes);

  await server.start();
  console.log(`🚀 Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();