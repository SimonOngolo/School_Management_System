# School Management System

This repository contains multiple services for a school management system. The main folders of interest are:

- api/ - primary backend APIs
- frontend/ - main frontend
- Bulletin_backend/ - bulletin microservice backend
- Bulletin_frontend/ - bulletin microservice frontend
- FrontendFees/ - fees frontend microservice
- ServerFees/ - fees backend microservice
- ahey-master/ - additional microservice
- bff/ - API Gateway / BFF (added in this PR)

Quickstart (development)

1. Install node dependencies for all projects:

   npm run install-all

2. Start local infra (MySQL + RabbitMQ) using Docker Compose:

   docker-compose up -d

   - MySQL: port 3306 (user: user / password: password)
   - RabbitMQ management UI: http://localhost:15672 (guest/guest)
   - Adminer: http://localhost:8080

3. Start development servers (examples):

   # Start services in separate terminals or use the root dev script
   npm run dev-bff
   npm run start-api
   npm run dev-frontend

4. Testing

- Use the BFF health endpoint: http://localhost:4000/health
- Example aggregated endpoint: GET http://localhost:4000/student/1 (proxies to api and bulletin microservice)

What I changed in this PR

- Added docker-compose.yml with MySQL + RabbitMQ + Adminer
- Added a basic BFF (bff/) with JWT skeleton and RabbitMQ helper
- Fixed root package.json scripts so install-all and dev target the right subfolders
- Added .env.example for the BFF and improved README with quickstart steps

Next steps

- Wire each microservice to publish/subscribe to RabbitMQ events
- Add per-service .env.example files and normalize DB connections
- Add CI checks and small integration tests

