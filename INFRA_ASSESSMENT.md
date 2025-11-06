# Infra Thinking & Assessment

**Goal:** Transform Sandstone from prototype to production-grade collaborative document editing service

---

## 1. Architecture & Infrastructure

### Compute
```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│   CDN       │──────│  Load Balancer   │──────│  App Tier   │
│ (Cloudflare)│      │  (AWS ALB/NLB)   │      │  (ECS/K8s)  │
└─────────────┘      └──────────────────┘      └─────────────┘
                              │                        │
                              │                 ┌──────┴──────┐
                              │                 │   Worker    │
                              │                 │   Queue     │
                              │                 │  (SQS/RMQ)  │
                              │                 └─────────────┘
                              ▼
                     ┌──────────────────┐
                     │   PostgreSQL     │
                     │   (RDS/Supabase) │
                     └──────────────────┘
```

**Trade-offs:**
- **SQLite → PostgreSQL**: Required for multi-writer concurrency (>10 simultaneous editors)
- **Container orchestration**: ECS (simpler, AWS-native) vs K8s (complex, portable)
  - **Recommendation**: Start with ECS Fargate (serverless containers), migrate to K8s if multi-cloud needed

### Storage & Caching

**Hybrid Strategy:** Redis (hot cache) → PostgreSQL (source of truth) → S3 (large content) → Elasticsearch (search) → MongoDB (historical audit logs)

---

#### 1. Redis Caching Layer

**Purpose:** In-memory cache for frequently accessed documents and metadata

**Impact:**
- Sub-millisecond reads vs tens of milliseconds from database
- Major reduction in database load
- Fast page loads at scale

**Use cases:**
- Active documents (short TTL)
- Document metadata and ETags (longer TTL)
- Published versions (cache indefinitely - immutable)
- Session management and rate limiting

**Trade-offs:** Fast but adds cache invalidation complexity and potential stale data

**Implement when:** High concurrent users or slow database queries

---

#### 2. Elasticsearch for Search

**Current problem:** Linear scan through all documents - slow and doesn't scale

**Impact:**
- Dramatically faster search (milliseconds vs seconds)
- Advanced features: typo tolerance, relevance ranking, highlighted results
- Scales to millions of documents with consistent fast latency

**Trade-offs:** Faster but adds eventual consistency and operational complexity

**Implement when:** Thousands of documents or search is critical feature

**Simpler alternative:** PostgreSQL Full-Text Search with GIN indexes
- Good enough for smaller document collections
- Built-in, no extra infrastructure
- Less feature-rich than Elasticsearch

---

#### 3. MongoDB for Change Log Archive

**Problem:** Audit trail grows infinitely, slowing PostgreSQL queries at scale

**Solution:** Keep recent changes in PostgreSQL, archive older changes to MongoDB

**Impact:**
- Keep PostgreSQL fast (only recent data)
- Cheaper storage for historical data
- Automatic TTL-based cleanup and long-term retention

**Trade-offs:** Faster and cheaper but requires querying two systems

**Implement when:** Change table becomes very large or queries slow down significantly

---

#### 4. S3/Object Storage for Large Documents

**Problem:** Large documents are expensive and slow in PostgreSQL

**Solution:** Store metadata in PostgreSQL, content in S3 (with compression)

**Impact:**
- Significantly cheaper storage
- CDN integration for fast global access
- Unlimited scalability with automatic lifecycle policies

**Trade-offs:** Much cheaper but slightly higher latency and more complex architecture

**Implement when:** Documents become large or storage costs become significant

---

#### 5. Document Chunking (For Very Large Documents)

**Problem:** Very large documents cause slow loading and high memory usage

**Solution:** Split documents into chunks, load only visible portions

**Impact:**
- Much faster initial load (load visible chunks vs entire document)
- Progressive loading with parallel chunk fetching
- Save only modified chunks

**Trade-offs:** Much faster but significantly more complex - requires virtual scrolling editor (Monaco/CodeMirror) instead of simple textarea

**Implement when:** Documents become very large (multiple megabytes)

**Skip if:** Documents stay reasonably sized (current architecture works fine)

---

#### 6. Operational Transform / CRDT (Real-Time Collaboration)

**Current:** Last-write-wins with ETag conflicts

**With OT/CRDT:** Conflict-free concurrent editing where multiple users can edit simultaneously (Google Docs style)

**Impact:**
- True real-time collaboration with automatic conflict resolution
- Offline editing with sync when reconnected
- Better UX for simultaneous editors

**Trade-offs:** Great UX but very high complexity (months of dev) and requires complete rewrite of change system plus WebSocket infrastructure

**Implement when:** Real-time collaboration is core feature or many simultaneous editors per document

**Skip if:** Current ETag approach works fine for async editing (most use cases)

---

### Implementation Roadmap

| Phase | Optimizations | Timeline | When to Implement |
|-------|--------------|----------|-------------------|
| **Phase 1** | PostgreSQL + Redis + S3 | Near-term | Growing users or larger documents |
| **Phase 2** | + Elasticsearch + MongoDB | Mid-term | Many documents or need advanced search |
| **Phase 3** | + Document chunking | Long-term | Very large documents |
| **Phase 4** | + OT/CRDT | Long-term | Real-time collab required |

**Quick decision guide:**
- Small scale, small docs → Current architecture ✅
- Growing user base → Phase 1 (PostgreSQL + Redis)
- Large document collection or need search → Phase 2 (+ Elasticsearch)
- Very large documents → Phase 3 (+ Chunking)
- Google Docs-style editing → Phase 4 (+ OT/CRDT)

---

## 2. CI/CD & Deployment

### Pipeline
```bash
PR → [Lint + Tests] → Preview Deploy
       ↓
Main → [Build + Tests] → Staging → Production
```

### Rollout Strategy
- **Blue-Green Deployment**: Zero-downtime switches with fast rollback
- **Database migrations**: Backward-compatible only (expand → contract pattern)
- **Canary releases**: Gradual rollout for high-risk changes

### Tools
- **CI/CD**: GitHub Actions + AWS CodeDeploy
- **Infrastructure**: Terraform (versioned, auditable)

---

## 3. Security & Compliance

### Authentication & Authorization
- **SSO/OAuth2**: Auth0 or AWS Cognito with JWT tokens
- **MFA**: Required for privileged operations
- **RBAC**: Viewer, editor, and publisher roles

### Data Protection
- **Encryption at rest**: AES-256 with managed keys and regular rotation
- **Encryption in transit**: TLS 1.3 enforced
- **Secrets**: Automatic rotation via Secrets Manager

### Compliance
- **Data residency**: Region-locked deployments for GDPR
- **Right to delete**: User data purge endpoint
- **Audit logs**: Long-term retention for compliance
- **Access controls**: Least-privilege with MFA for production
- **SOC2**: Engage auditor well before launch

---

## 4. Scalability & Resilience

### Auto-scaling
- **App tier**: CPU-based scaling with minimum and maximum instance limits
- **Database**: Read replicas scale based on connection pool utilization

### Performance Targets
- **Document operations**: Sub-second for typical operations
- **Search**: Fast response times with appropriate indexing
- **Change batching**: Adaptive based on user typing patterns

### Resilience
- **Circuit breaker**: Stop requests to failing dependencies with graceful fallback
- **Rate limiting**: Per-user and global request limits
- **Backpressure**: Queue operations during high load, drop oldest if needed
- **Multi-AZ**: Deploy across availability zones for high availability
- **Chaos testing**: Regular failure injection to validate resilience

---

## 5. Monitoring & Observability

### Metrics
**Golden Signals:**
- Latency (p50, p95, p99)
- Traffic and throughput
- Error rates
- Resource saturation

**Alert Levels:**
- Critical: Page on-call for high error rates or severe latency
- Warning: Create tickets for resource saturation
- Info: Log for investigation

### Logging
- **Structured JSON**: Consistent format with trace IDs
- **Retention**: Hot storage for recent logs, cold storage for long-term
- **Sampling**: All errors, subset of successful operations

### Tracing
- Distributed tracing for critical paths
- Smart sampling (all slow requests, subset of fast)

### Dashboards
- Business metrics (user activity, document operations)
- Operational health (service status, deployment frequency)
- Cost tracking

---

## 6. Operations & Cost

### Cost Management
**Infrastructure costs** scale with:
- Compute (app servers, workers)
- Database (RDS with replicas)
- Cache (Redis/ElastiCache)
- Storage (S3 for documents)
- Data transfer (CDN)

**Optimization strategies:**
- Reserved instances for predictable workloads
- Spot instances for non-critical workers
- Intelligent tiering for storage
- Right-sizing based on metrics
- Budget alerts for cost overruns

### Multi-Region Strategy
**Initial**: Single region with cross-region backups and disaster recovery runbook

**Future**: Active-active multi-region when scale or compliance demands
- Increases infrastructure and data transfer costs significantly
- Required for global scale or data residency requirements

### Right-Sizing
- Regular review of resource utilization
- Scale down underutilized resources
- Consolidate low-traffic services
- Annual reserved instance optimization

### On-Call & Incident Response
- Rotation schedule with primary/secondary coverage
- Automated runbooks for common issues
- Blameless postmortems with action tracking
