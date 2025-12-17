# DevOps Technical Report: Gharsa Application Deployment Architecture

## Executive Summary

This document provides a comprehensive technical analysis of the Gharsa application's deployment architecture. The system is containerized using Docker and orchestrated via Docker Compose, with Nginx serving as a reverse proxy gateway. The architecture consists of one backend service (Strapi v5), two frontend services (React/Vite applications), and a centralized Nginx gateway that routes traffic based on subdomain.

---

## 1. Overall Architecture

### 1.1 High-Level System Architecture

The application follows a **microservices-oriented architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    External Load Balancer                │
│                    (JPAAS Infrastructure)                 │
└──────────────────────┬────────────────────────────────────┘
                       │ Port 80
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Nginx Gateway (main-gateway)                │
│         Routes based on server_name (subdomain)          │
└──────┬──────────────────┬──────────────────┬────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ frontend-   │  │ frontend-   │  │  backend    │
│ view        │  │ admin       │  │  (Strapi)   │
│ (gharsa.ly) │  │(admin.gharsa│  │(strapi.gharsa│
│             │  │    .ly)     │  │    .ly)     │
│ Port: 80    │  │ Port: 80    │  │ Port: 1337 │
└─────────────┘  └─────────────┘  └──────┬─────┘
                                          │
                                          ▼
                              ┌─────────────────────┐
                              │ External PostgreSQL │
                              │    (Database)        │
                              └─────────────────────┘
```

### 1.2 Component Interaction

**Backend Service (Strapi v5)**
- Node.js-based headless CMS running on port 1337
- Serves REST API endpoints at `/api/*`
- Handles authentication, content management, and file uploads
- Connects to external PostgreSQL database
- Stores uploaded files in persistent volume (`backend-uploads`)

**Frontend Services**
- **frontend-view**: Public-facing React SPA served via Nginx (port 80)
- **frontend-admin**: Admin interface React SPA served via Nginx (port 80)
- Both are statically built applications with client-side routing
- API calls are made to `strapi.gharsa.ly` subdomain

**Nginx Gateway**
- Single entry point exposed on port 80
- Acts as reverse proxy using `server_name` directive for subdomain-based routing
- No direct external access to backend or frontend containers
- Handles SSL termination (via Load Balancer) and forwards appropriate headers

### 1.3 Container-to-Container Communication

All services communicate through a **Docker bridge network** named `gharsa-network`:

- **Network Type**: Bridge network (default Docker network driver)
- **Service Discovery**: Docker Compose provides DNS resolution using service names
- **Internal Communication**: Services reference each other by service name (e.g., `backend:1337`, `frontend-view:80`)
- **Isolation**: No services expose ports directly to host except the gateway (port 80)

**Communication Flow:**
1. External traffic → `main-gateway:80` (only exposed port)
2. Gateway → Routes to appropriate service based on `Host` header
3. Frontend containers → Make API calls to `strapi.gharsa.ly` (routed back through gateway)
4. Backend → Connects to external PostgreSQL (outside Docker network)

---

## 2. Dockerfiles Explanation

### 2.1 Backend Dockerfile (Strapi v5)

**Purpose**: Builds and runs the Strapi CMS backend service.

**Base Images**:
- **Builder Stage**: `node:18-alpine` - Lightweight Node.js runtime with Alpine Linux
- **Production Stage**: `node:18-alpine` - Same base for consistency

**Why Alpine?**
- Minimal image size (~5MB base vs ~150MB for standard Node)
- Reduced attack surface
- Faster image pulls and deployments

**Build Stages**:

**Stage 1: Builder**
```dockerfile
FROM node:18-alpine AS builder
```
- Installs build dependencies (python3, make, g++) for native module compilation
- Copies `package*.json` and runs `npm ci` (clean install with lockfile)
- Copies source code
- Executes `npm run build` to compile Strapi admin panel (React-based admin UI)

**Stage 2: Production**
```dockerfile
FROM node:18-alpine
```
- Installs only production dependencies (`npm ci --only=production`)
- Copies built artifacts from builder stage (including compiled admin panel)
- Creates `public/uploads` directory for file storage
- Cleans npm cache to reduce image size

**Exposed Port**: `1337` (Strapi default)

**Runtime Command**: `npm run start` - Starts Strapi in production mode (no auto-reload)

**Key Design Decisions**:
- Multi-stage build reduces final image size by excluding dev dependencies
- Build tools (python3, make, g++) retained in production for potential native module runtime needs
- Source code copied from builder ensures built admin panel is included

### 2.2 Frontend-View Dockerfile

**Purpose**: Builds React SPA and serves it via Nginx.

**Base Images**:
- **Builder Stage**: `node:18-alpine` - For building React application
- **Production Stage**: `nginx:alpine` - Lightweight web server

**Build Stages**:

**Stage 1: Builder**
```dockerfile
FROM node:18-alpine AS builder
```
- Installs dependencies via `npm ci`
- Accepts `VITE_API_URL` as build argument (injected at build time)
- Sets environment variable for Vite build process
- Executes `npm run build` to create production bundle in `/app/dist`

**Stage 2: Production**
```dockerfile
FROM nginx:alpine
```
- Copies static files from builder's `/app/dist` to `/usr/share/nginx/html`
- Generates Nginx configuration inline for SPA routing:
  - `try_files $uri $uri/ /index.html` - Handles client-side routing
  - Gzip compression enabled
  - Long-term caching for static assets (1 year)

**Exposed Port**: `80` (HTTP)

**Runtime Command**: `nginx -g "daemon off;"` - Runs Nginx in foreground

**Key Design Decisions**:
- Build-time API URL injection ensures frontend knows backend endpoint
- Nginx serves static files efficiently (better than Node.js for static content)
- SPA routing configuration prevents 404 errors on direct URL access
- Asset caching reduces bandwidth and improves performance

### 2.3 Frontend-Admin Dockerfile

**Purpose**: Identical structure to frontend-view, but for admin interface.

**Architecture**: Same multi-stage build pattern as frontend-view
- Builder stage compiles React app with `VITE_API_URL`
- Production stage serves via Nginx with SPA routing

**Differences**: None structurally - only application code differs

### 2.4 Nginx Gateway

**No Dockerfile**: Uses official `nginx:alpine` image directly in docker-compose.yml

**Configuration**: Mounted via volume from `./nginx.conf`

---

## 3. Docker Compose Analysis

### 3.1 Structure Overview

**Compose Version**: `3.8` (supports modern Docker features)

**Services Defined**: 4 services
1. `backend` - Strapi CMS
2. `frontend-view` - Public frontend
3. `frontend-admin` - Admin frontend
4. `main-gateway` - Nginx reverse proxy

### 3.2 Service Configuration Details

#### Backend Service

**Build Configuration**:
```yaml
build:
  context: ./backend
  dockerfile: Dockerfile
```
- Builds from `./backend` directory
- Uses Dockerfile in that directory

**Container Name**: `gharsa-backend` (explicit naming for easier management)

**Restart Policy**: `unless-stopped` (auto-restart on failure, manual stop respected)

**Environment Variables**:
- **Runtime Config**: `NODE_ENV=production`, `HOST=0.0.0.0`, `PORT=1337`
- **Security Keys**: All Strapi keys from `.env` file (APP_KEYS, JWT_SECRET, etc.)
- **Database Config**: PostgreSQL connection parameters (host, port, name, credentials, SSL)

**Volumes**:
```yaml
- backend-uploads:/app/public/uploads
```
- Named volume for persistent file storage
- Survives container recreation
- Data persists across deployments

**Networks**: `gharsa-network` (bridge network)

**Health Check**:
- Uses Node.js HTTP module to check `/api` endpoint
- Accepts 200 (OK) or 401 (Unauthorized) as healthy
- Interval: 30s, Timeout: 10s, Retries: 3
- Start period: 40s (allows Strapi initialization time)

#### Frontend-View Service

**Build Configuration**:
```yaml
build:
  context: ./frontend-view
  dockerfile: Dockerfile
  args:
    - VITE_API_URL=${VITE_API_URL:-https://strapi.gharsa.ly}
```
- Build argument injected at build time
- Default fallback if env var not set

**Container Name**: `gharsa-frontend-view`

**Restart Policy**: `unless-stopped`

**Networks**: `gharsa-network`

**Health Check**:
- Uses `wget` to verify Nginx is serving content
- Checks root path availability

**No Volumes**: Stateless service (static files baked into image)

#### Frontend-Admin Service

**Configuration**: Identical to frontend-view except:
- Different build context (`./frontend-admin`)
- Different container name (`gharsa-frontend-admin`)
- Same `VITE_API_URL` build argument

#### Main-Gateway Service

**Image**: `nginx:alpine` (no build required)

**Ports**:
```yaml
ports:
  - "80:80"
```
- Only service with host port mapping
- Maps host port 80 to container port 80

**Volumes**:
```yaml
- ./nginx.conf:/etc/nginx/nginx.conf:ro
```
- Mounts custom Nginx configuration
- Read-only mount (`:ro`) prevents accidental modification

**Depends On**:
```yaml
depends_on:
  - backend
  - frontend-view
  - frontend-admin
```
- Ensures other services start first
- Note: Only controls startup order, not health

**Health Check**: Verifies Nginx is responding

### 3.3 Volumes

**Named Volume**: `backend-uploads`
- **Driver**: `local` (default Docker volume driver)
- **Purpose**: Persistent storage for uploaded files
- **Location**: Managed by Docker (typically `/var/lib/docker/volumes/`)
- **Lifecycle**: Survives container removal, requires explicit deletion

### 3.4 Networks

**Network**: `gharsa-network`
- **Driver**: `bridge` (default Docker network driver)
- **Purpose**: Isolated network for service communication
- **DNS Resolution**: Automatic service name resolution
- **Isolation**: Services not on this network cannot communicate

### 3.5 Service Startup and Connection

**Startup Sequence**:
1. Docker Compose creates `gharsa-network` bridge network
2. Creates `backend-uploads` named volume
3. Starts `backend` service (waits for health check)
4. Starts `frontend-view` and `frontend-admin` (parallel, no dependencies)
5. Starts `main-gateway` (waits for `depends_on` services)

**Service Discovery**:
- Services resolve each other by service name (e.g., `backend`, `frontend-view`)
- Docker's embedded DNS server handles resolution
- No manual IP configuration required

**Connection Flow Example**:
```
User Request → main-gateway:80 → (routing logic) → frontend-view:80
Frontend JS → API call to strapi.gharsa.ly → main-gateway:80 → backend:1337
```

---

## 4. Nginx (EngineX) Configuration

### 4.1 Role in Architecture

Nginx serves as a **reverse proxy gateway** with the following responsibilities:

1. **Single Entry Point**: Only service exposed to external traffic
2. **Subdomain-Based Routing**: Routes requests based on `Host` header
3. **SSL Termination**: Receives HTTPS from Load Balancer, forwards HTTP internally
4. **Header Management**: Adds proxy headers for backend services
5. **Request Forwarding**: Proxies requests to appropriate backend containers

### 4.2 Reverse Proxy Configuration

**Upstream Definitions**:
```nginx
upstream backend {
    server backend:1337;
}

upstream frontend-view {
    server frontend-view:80;
}

upstream frontend-admin {
    server frontend-admin:80;
}
```
- Defines backend services for load balancing (single server per upstream currently)
- Uses Docker service names for resolution
- Enables future horizontal scaling (add more servers to upstream block)

### 4.3 Routing Rules

**Subdomain-Based Routing**:

1. **gharsa.ly** → `frontend-view` service
   - Public-facing website
   - Proxies all requests to frontend-view container
   - WebSocket support enabled for potential real-time features

2. **admin.gharsa.ly** → `frontend-admin` service
   - Admin interface
   - Same proxying pattern as frontend-view

3. **strapi.gharsa.ly** → `backend` service
   - API endpoint
   - Special configuration for Strapi requirements

### 4.4 SSL Handling

**Current Configuration**: HTTP only (port 80)

**SSL Termination**: Handled by external Load Balancer (JPAAS infrastructure)

**Proxy Headers for SSL**:
```nginx
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Forwarded-Host $host;
```
- Informs backend that original request was HTTPS
- Critical for secure cookie generation
- Backend configured with `proxy: true` to trust these headers

**Why This Approach**:
- Load Balancer terminates SSL/TLS
- Internal communication uses HTTP (simpler, no cert management)
- Headers preserve original protocol information

### 4.5 Static File Serving vs Proxying

**Frontend Services**:
- Nginx gateway **proxies** to frontend containers
- Frontend containers serve static files via their internal Nginx
- Gateway acts as pass-through

**Backend Service**:
- Gateway **proxies** API requests to Strapi
- Strapi serves dynamic content
- Special handling for `/uploads/` path (same proxy, optimized headers)

**Static Asset Optimization**:
- Frontend containers handle static asset caching (1 year expiry)
- Gateway could add additional caching layers if needed

### 4.6 Special Backend Configuration

**File Upload Support**:
```nginx
client_max_body_size 100M;
```
- Allows large file uploads (images, documents)
- Prevents 413 Request Entity Too Large errors

**Timeout Configuration**:
```nginx
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```
- Extended timeouts for long-running operations
- Prevents premature connection termination

**WebSocket Support**:
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```
- Enables WebSocket connections for Strapi admin panel
- Required for real-time admin interface features

---

## 5. Deployment Flow

### 5.1 Build Process

**Step 1: Image Building**
```bash
docker-compose build
```

**Backend Build**:
1. Docker builds `backend` image using multi-stage Dockerfile
2. Builder stage: Installs dependencies, builds admin panel
3. Production stage: Copies artifacts, installs production deps
4. Final image contains compiled Strapi with built admin panel

**Frontend Builds**:
1. Docker builds `frontend-view` and `frontend-admin` images
2. Builder stage: Installs npm dependencies, builds React apps with `VITE_API_URL`
3. Production stage: Copies static files to Nginx image
4. Final images contain compiled SPAs ready to serve

**Gateway**: No build needed (uses official image)

### 5.2 Container Launch Sequence

**Step 2: Service Startup**
```bash
docker-compose up -d
```

**Orchestration Process**:
1. **Network Creation**: Docker creates `gharsa-network` bridge network
2. **Volume Creation**: Creates `backend-uploads` named volume (if not exists)
3. **Backend Startup**:
   - Starts `gharsa-backend` container
   - Connects to external PostgreSQL
   - Runs health check (waits up to 40s for startup)
   - Health check passes when `/api` responds
4. **Frontend Startup** (parallel):
   - Starts `gharsa-frontend-view` container
   - Starts `gharsa-frontend-admin` container
   - Both serve static files immediately
5. **Gateway Startup**:
   - Waits for `depends_on` services (startup order only)
   - Starts `gharsa-gateway` container
   - Mounts `nginx.conf` configuration
   - Listens on port 80

### 5.3 Traffic Flow

**Request Flow Example: User accessing public website**

```
1. User → https://gharsa.ly (DNS resolves to Load Balancer)
2. Load Balancer → Terminates SSL, forwards HTTP to main-gateway:80
3. Nginx Gateway → Reads Host header "gharsa.ly"
4. Nginx Gateway → Matches server_name block for gharsa.ly
5. Nginx Gateway → Proxies to upstream "frontend-view" (resolves to frontend-view:80)
6. Frontend Container → Serves index.html and static assets
7. Browser → Executes JavaScript, makes API call to strapi.gharsa.ly
8. Nginx Gateway → Routes API request to backend:1337
9. Backend → Processes request, queries PostgreSQL, returns JSON
10. Response → Flows back through gateway to browser
```

**Request Flow Example: Admin accessing backend API**

```
1. Admin → https://strapi.gharsa.ly/api/trees
2. Load Balancer → Forwards to main-gateway:80
3. Nginx Gateway → Matches server_name "strapi.gharsa.ly"
4. Nginx Gateway → Adds X-Forwarded-Proto: https header
5. Nginx Gateway → Proxies to backend:1337
6. Backend → Receives request with proxy headers, trusts HTTPS
7. Backend → Generates secure cookies, processes request
8. Response → Returns with Set-Cookie header (secure flag set)
```

### 5.4 Health Check Integration

**Backend Health Check**:
- Runs every 30 seconds
- Uses Node.js to check `/api` endpoint
- Container marked unhealthy after 3 consecutive failures
- Docker Compose can restart unhealthy containers

**Frontend Health Checks**:
- Verify Nginx is serving content
- Simple availability check

**Gateway Health Check**:
- Ensures Nginx is responding
- Critical for Load Balancer integration

---

## 6. Environment Configuration

### 6.1 Environment Variable Management

**Source**: `.env` file in project root (not committed to version control)

**Backend Environment Variables**:

**Application Configuration**:
- `NODE_ENV=production` - Enables production optimizations
- `HOST=0.0.0.0` - Binds to all interfaces (required for Docker)
- `PORT=1337` - Strapi listening port

**Security Keys** (Required):
- `APP_KEYS` - Array of encryption keys for Strapi
- `API_TOKEN_SALT` - Salt for API token generation
- `ADMIN_JWT_SECRET` - Secret for admin JWT tokens
- `TRANSFER_TOKEN_SALT` - Salt for transfer tokens
- `JWT_SECRET` - Secret for user JWT tokens

**Database Configuration**:
- `DATABASE_CLIENT=postgres` - Database type
- `DATABASE_HOST` - External PostgreSQL hostname
- `DATABASE_PORT` - PostgreSQL port (default: 5432)
- `DATABASE_NAME` - Database name
- `DATABASE_USERNAME` - Database user
- `DATABASE_PASSWORD` - Database password
- `DATABASE_SSL` - SSL connection flag (true/false)

**Frontend Build Arguments**:
- `VITE_API_URL` - Backend API URL (injected at build time)
- Default: `https://strapi.gharsa.ly`
- Used during Vite build process to embed API endpoint

### 6.2 Development vs Production

**Current Configuration**: Production-oriented

**Development Considerations**:
- No hot-reload configured (would require volume mounts for source code)
- No development database container (uses external PostgreSQL)
- Environment variables must be set manually

**Production Optimizations**:
- Multi-stage builds reduce image sizes
- Production dependencies only in final images
- Health checks ensure service availability
- Restart policies prevent downtime
- Persistent volumes for data retention

**Missing Development Features** (not implemented):
- Source code volume mounts for live editing
- Development database container
- Hot module replacement (HMR)
- Debug port exposure

### 6.3 Secrets Management

**Current Approach**: Environment variables in `.env` file

**Security Considerations**:
- `.env` file should not be committed to version control
- `.dockerignore` excludes `.env` files from build context
- Secrets passed at runtime via environment variables

**Recommended Improvements**:
- Use Docker secrets (Docker Swarm mode)
- Integrate with secrets management services (AWS Secrets Manager, HashiCorp Vault)
- Use CI/CD pipeline secrets injection
- Rotate keys regularly

---

## 7. Scalability & Production Readiness

### 7.1 Current Scalability

**Horizontal Scaling Capability**:

**Frontend Services**:
- Stateless design enables easy horizontal scaling
- Multiple containers can run behind load balancer
- Nginx upstream blocks support multiple servers:
  ```nginx
  upstream frontend-view {
      server frontend-view:80;
      server frontend-view-2:80;  # Future addition
  }
  ```

**Backend Service**:
- Strapi can run multiple instances
- Requires shared session storage or stateless JWT
- Database connection pooling handles multiple connections
- File uploads require shared storage (NFS, S3, etc.)

**Gateway**:
- Can run multiple Nginx instances
- Requires shared configuration
- Load balancer distributes traffic

### 7.2 Potential Bottlenecks

**Identified Bottlenecks**:

1. **Single Backend Instance**
   - Risk: High traffic can overwhelm single container
   - Solution: Scale backend horizontally, use shared file storage

2. **Database Connection**
   - Risk: External PostgreSQL may become bottleneck
   - Solution: Connection pooling, read replicas, caching layer

3. **File Storage**
   - Risk: Local volume doesn't scale across hosts
   - Solution: Migrate to object storage (S3, MinIO) or NFS

4. **Nginx Gateway**
   - Risk: Single point of failure
   - Solution: Multiple gateway instances with Load Balancer

5. **Build-Time API URL**
   - Risk: Frontend rebuild required to change API endpoint
   - Solution: Use runtime configuration or environment-based routing

### 7.3 Recommended Improvements

#### 7.3.1 Load Balancing

**Current State**: Single instance per service

**Improvements**:
- Add multiple backend instances with health checks
- Implement Nginx load balancing with round-robin or least-connections
- Use sticky sessions if required (not needed for stateless JWT)

**Example Nginx Configuration**:
```nginx
upstream backend {
    least_conn;
    server backend:1337;
    server backend-2:1337;
    server backend-3:1337;
}
```

#### 7.3.2 CI/CD Pipeline

**Current State**: Manual deployment

**Recommended Setup**:
- **Source Control**: Git repository (GitHub, GitLab, Bitbucket)
- **Build Pipeline**: 
  - Trigger on push to main branch
  - Build Docker images
  - Run tests
  - Push to container registry
- **Deployment Pipeline**:
  - Pull images from registry
  - Deploy to staging environment
  - Run smoke tests
  - Deploy to production (blue-green or rolling update)

**Tools**: GitHub Actions, GitLab CI, Jenkins, CircleCI

#### 7.3.3 Secrets Management

**Current State**: `.env` file

**Improvements**:
- **Docker Secrets** (Swarm mode): Encrypted at rest, mounted as files
- **External Services**: AWS Secrets Manager, Azure Key Vault, HashiCorp Vault
- **CI/CD Integration**: Inject secrets during deployment
- **Rotation**: Automated key rotation policies

#### 7.3.4 Logging

**Current State**: Container logs only

**Improvements**:
- **Centralized Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Log Aggregation**: Fluentd, Fluent Bit
- **Structured Logging**: JSON format for easier parsing
- **Log Retention**: Configurable retention policies
- **Monitoring**: Log-based alerting (errors, performance issues)

**Docker Compose Addition**:
```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

#### 7.3.5 Monitoring

**Current State**: Basic health checks

**Improvements**:
- **Metrics Collection**: Prometheus + Grafana
- **Application Monitoring**: New Relic, Datadog, AppDynamics
- **Infrastructure Monitoring**: cAdvisor for container metrics
- **Uptime Monitoring**: External monitoring services
- **Alerting**: PagerDuty, Opsgenie integration

**Key Metrics to Monitor**:
- Container CPU/Memory usage
- Request latency and error rates
- Database connection pool usage
- Disk space (for uploads volume)
- Network throughput

#### 7.3.6 High Availability

**Current State**: Single instance deployment

**Improvements**:
- **Multiple Availability Zones**: Deploy across data centers
- **Database Replication**: Master-slave or master-master setup
- **Backup Strategy**: Automated database backups
- **Disaster Recovery**: Documented recovery procedures
- **Failover Mechanisms**: Automatic failover for critical services

#### 7.3.7 Performance Optimization

**Caching Strategy**:
- **CDN Integration**: CloudFlare, AWS CloudFront for static assets
- **Application Caching**: Redis for session storage and API responses
- **Database Query Caching**: Strapi query result caching
- **Nginx Caching**: Proxy cache for API responses

**Resource Limits**:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

#### 7.3.8 Security Enhancements

**Current Security Measures**:
- Non-root user execution (Alpine images)
- Read-only volume mounts where possible
- Environment variable-based secrets

**Additional Recommendations**:
- **Image Scanning**: Scan Docker images for vulnerabilities (Trivy, Clair)
- **Network Policies**: Restrict container-to-container communication
- **WAF Integration**: Web Application Firewall at Load Balancer
- **Rate Limiting**: Nginx rate limiting for API endpoints
- **SSL/TLS**: Enforce HTTPS, HSTS headers
- **Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options

---

## 8. Summary

### 8.1 Technical Architecture Summary

The Gharsa application is a **containerized microservices architecture** deployed using Docker Compose. The system consists of:

- **1 Backend Service**: Strapi v5 CMS running on Node.js, serving REST APIs on port 1337
- **2 Frontend Services**: React/Vite SPAs served via Nginx, each in separate containers
- **1 Gateway Service**: Nginx reverse proxy routing traffic based on subdomain

All services communicate through an isolated Docker bridge network (`gharsa-network`), with only the gateway exposing port 80 to external traffic. The backend connects to an external PostgreSQL database, and file uploads are persisted in a Docker named volume.

### 8.2 Deployment Process

**Build Phase**:
1. Multi-stage Dockerfiles build optimized production images
2. Frontend builds inject API URL at build time via `VITE_API_URL` argument
3. Backend builds compile Strapi admin panel in builder stage

**Deployment Phase**:
1. Docker Compose orchestrates service startup
2. Network and volumes are created automatically
3. Health checks ensure services are ready before marking healthy
4. Gateway starts last, depending on other services

**Runtime**:
- External Load Balancer forwards HTTPS traffic to gateway (port 80)
- Gateway routes based on `Host` header to appropriate service
- Frontend containers serve static files
- Backend processes API requests and serves dynamic content

### 8.3 Key Technical Decisions

1. **Subdomain-Based Routing**: Enables clean separation of public, admin, and API endpoints
2. **Multi-Stage Builds**: Reduces image sizes and improves security
3. **Nginx Gateway**: Single entry point simplifies security and routing
4. **External Database**: Separates data persistence from application containers
5. **Persistent Volumes**: Ensures file uploads survive container recreation
6. **Health Checks**: Enables automatic recovery and orchestration integration

### 8.4 Deployment Recommendations

**For Production Deployment**:

1. **Set Environment Variables**: Configure all required secrets in `.env` file
2. **Build Images**: Run `docker-compose build` to create optimized images
3. **Start Services**: Run `docker-compose up -d` for detached deployment
4. **Verify Health**: Check `docker-compose ps` to ensure all services are healthy
5. **Monitor Logs**: Use `docker-compose logs -f` to monitor startup and runtime logs
6. **Configure Load Balancer**: Point JPAAS Load Balancer to host port 80
7. **Set DNS Records**: Configure DNS to point subdomains to Load Balancer

**Scaling Considerations**:
- Frontend services can scale horizontally without changes
- Backend scaling requires shared file storage solution
- Database should be scaled independently (read replicas, connection pooling)
- Gateway can be replicated behind Load Balancer

**Production Readiness Checklist**:
- ✅ Containerized architecture
- ✅ Health checks implemented
- ✅ Persistent storage for uploads
- ✅ Environment-based configuration
- ⚠️ Add centralized logging
- ⚠️ Implement monitoring and alerting
- ⚠️ Set up CI/CD pipeline
- ⚠️ Configure secrets management
- ⚠️ Implement backup strategy
- ⚠️ Add security scanning

---

## Appendix: File Structure Reference

```
gharsa/
├── docker-compose.yml          # Service orchestration
├── nginx.conf                  # Gateway routing configuration
├── .dockerignore               # Build context exclusions
├── .env                        # Environment variables (not in repo)
├── backend/
│   ├── Dockerfile             # Multi-stage Strapi build
│   ├── config/
│   │   └── server.js          # Server config (proxy: true)
│   └── ...
├── frontend-view/
│   ├── Dockerfile             # Multi-stage React build
│   └── ...
└── frontend-admin/
    ├── Dockerfile             # Multi-stage React build
    └── ...
```

---

**Report Generated**: Technical analysis of Gharsa application deployment architecture
**Target Audience**: DevOps Engineers, Backend Engineers, Infrastructure Teams
**Focus**: Deployment, Infrastructure, Container Orchestration

