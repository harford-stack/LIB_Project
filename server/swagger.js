const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PageStudy Library API',
      version: '1.0.0',
      description: 'PageStudy 스터디카페 예약 시스템 API 문서',
      contact: {
        name: 'API Support',
        email: 'support@pagestudy.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}`,
        description: '개발 서버'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./server.js', './routes/*.js'] // API 문서를 생성할 파일 경로
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};

