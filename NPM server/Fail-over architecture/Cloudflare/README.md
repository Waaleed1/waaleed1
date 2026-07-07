# High-Availability Mesh Topology & Serverless Failover Infrastructure

A highly resilient, production-grade self-hosted infrastructure architecture designed to eliminate single points of failure (SPOF) across compute, data storage, and network routing boundaries. 

This deployment features native host orchestration, secure federated Single Sign-On (SSO), highly available object storage, continuous database log-streaming replication, and edge-computed automated global traffic management.

---

## 🏗️ Architectural Topology

[ Incoming Traffic ]
                            |
            [ Cloudflare Serverless Engine ]
          (Runs Edge-Driven Worker Monitoring)
                 /                           \
     (Active Path)                           (Failover Path)
           /                                           \
[ PRIMARY SERVER ]                               [ SECONDARY SERVER ]
- Headscale / Headplane (Active)                 - Headscale / Headplane (Standby)
- MinIO Distributed Node 1                       - MinIO Distributed Node 2
- Local SQLite App DB (Source)                   - Local SQLite App DB (Replica Target)
       |                                                 ^
       +---(Litestream WAL Stream)---> [ MinIO Cluster ]-+

## ⚙️ Core Subsystem Breakdowns

### 1. Control Plane & Orchestration Layer (`Headplane & Headscale`)
Rather than abstracting the network layer through Docker network bridges, the control plane runs **natively on the host system** to streamline raw access to system interfaces and minimize performance latency.

* **Native System Integration (`proc`):** Headplane interacts directly with Headscale using OS-level signals and process handles managed under systemd. DNS modifications or node updates committed via the dashboard instantly trigger local daemons without container communication overhead.
* **Hardened Security Boundaries:** All authentication cookie sessions are pinned to HTTPS (`cookie_secure: true`) and expire aggressively on a 24-hour cycle (`cookie_max_age: 86400`) to completely eliminate session-hijacking vectors.
* **Mesh Telemetry Agent:** A host-level agent executable binary processes localized node data, populating dashboard topologies utilizing a tight 60-second local cache timeline to prevent API thrashing.

### 2. Federated Authentication & Identity Broker (`Dex OIDC`)
Identity management is completely decoupled from the core coordination applications by deploying **Dex** as an OIDC (OpenID Connect) identity provider mapping directly to upstream GitHub developer endpoints.

* **Abstracted Identity:** Utilizing Dex as a middleman creates an architectural layer where authentication mechanisms are entirely decoupled. Migrating from GitHub OAuth to enterprise protocols (like Google Workspace, Keycloak, or Authelia) requires editing *only* the Dex backend configuration; the target application layer stays completely untouched.
* **Network Hardening:** The internal authentication web container binds explicitly to `127.0.0.1:5556`. It is completely hidden from public ingress, forcing all authentication handshakes to transit via an upstream reverse proxy terminating TLS.
* **Persistent State Management:** User authentication tracking, active sessions, and verification secrets are logged to a localized high-speed database engine at `/var/lib/dex/dex.db`.

### 3. Distributed Resilient Data & Replication (`MinIO & Litestream`)
Stateful data preservation relies on combining an Active-Passive database runtime topology with high-availability distributed object storage to avoid the complex network overhead of heavy multi-writer database clusters.

* **Distributed MinIO Engine:** MinIO containers running across both physical primary and secondary servers pool their local storage fields into a unified object repository using local `/etc/hosts` injections (`extra_hosts`). Data segments are dynamically striped and backed by erasure coding, allowing one host to go entirely dark without inducing data loss.
* **Litestream Continuous Synchronization:** SQLite databases on the primary server are monitored by native Litestream daemons. The exact millisecond data hits the disk, Litestream captures the **Write-Ahead Log (WAL) frames** asynchronously and streams them directly into the distributed MinIO bucket. 
* **Passive Replica Mirroring:** The standby secondary node executes Litestream in restore-replication mode, pulling downstream WAL updates from MinIO to keep the cold standby database constantly synchronized with zero manual entry requirements.

---

## 🛰️ Global Edge Failover Engine (`Cloudflare Worker`)

The global traffic redirection engine is completely decentralized from the local hosting facility. It runs serverlessly on Cloudflare’s global edge nodes, executing via a cron trigger to continuously evaluate system health and execute automated DNS routing failovers.

### Traffic State Management Matrix

| System Health State | Current Active Record | Executed API Request | Consequent Network State |
| :--- | :--- | :--- | :--- |
| **Primary Online** | Secondary Server IP | `PATCH` to Primary IP | **Automated Failback:** Re-routes production traffic back to the primary node upon recovery. |
| **Primary Online** | Primary Server IP | No Action | **Steady State:** Core operations running optimally on the main server. |
| **Primary Outage** | Primary Server IP | `PATCH` to Secondary IP | **Failover Event:** Instantly reroutes global DNS targets to the standby server. |
| **Primary Outage** | Secondary Server IP | No Action | **Degraded Mode:** Maintaining infrastructure availability on the secondary backup server. |

### Monitoring Engineering Design
1. **Zero-Tolerance Probing:** The edge handler loops over an array of health check endpoints. If *any single endpoint* stalls past 5000ms or drops an HTTP status outside a `2xx OK` range, an instant system failover is initialized. This captures application stack crashes even if the bare-metal server responds to basic ping packets.
2. **Asynchronous Lifeline Gates:** Leverages a native JavaScript `AbortController` framework to kill hanging network requests, ensuring unresponsive nodes are categorized as immediate outages rather than blocking execution stacks.
3. **Zero-Inertia Propagation:** Because the worker modifies resource properties directly on Cloudflare’s authoritative nameservers via targeted `PATCH` calls to the v4 API, routing changes propagate across the global edge network almost instantly, safely bypassing traditional client-side DNS caching bottlenecks.
