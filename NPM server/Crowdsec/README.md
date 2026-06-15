## 🛡️ CrowdSec Security Engine Configuration (`config.yaml`)

This configuration serves as the brain of the Intrusion Prevention System (IPS). It defines how logs are acquired, how threats are stored locally, how the engine communicates with the global threat network, and how observability metrics are exposed.

---

### 🧱 Architectural Component Breakdown

#### 1. Ingress & Acquisition Layer (`crowdsec_service`)
* **`acquisition_path: /etc/crowdsec/acquis.yaml`**: This directive points the engine to the acquisition configuration. This is where CrowdSec is explicitly told which application log streams to attach to (e.g., reading the Nginx Proxy Manager access logs mounted via the Docker volume).
* **`parser_routines: 1`**: Allocates a single worker routine for parsing logs, optimized for low-resource footprint environments while maintaining line-rate analysis.

#### 2. Local & Central API Mesh (`api`)
CrowdSec separates detection (the engine) from remediation (the bouncers) via a decoupled API framework:

* **Local API (LAPI) (`listen_uri: 127.0.0.1:8081`)**: The engine hosts a local server on port `8081`. When CrowdSec detects a malicious actor in the logs, it updates LAPI. Your firewall or Nginx bouncers constantly query this local API endpoint to check if an incoming IP should be dropped.
* **Central API (CAPI) (`online_client`)**: This connects your local instance to CrowdSec's global cyber-threat intelligence network. 
  * **Asymmetric Sharing:** It securely transmits anonymized telemetry data about attackers hitting *your* network and pulls down curated global blocklists of actively verified malicious IPs, creating a proactive defense perimeter.

#### 3. Ephemeral Storage & Retention Policy (`db_config`)
* **`type: sqlite`**: Utilizes an ultra-lightweight SQLite relational database to track active alerts, metrics, and local ban decisions.
* **Aggressive Data Pruning (`flush`)**: 
  * `max_items: 5000` / `max_age: 7d`
  * **Engineering Intent:** Prevents the database from bloating and exhausting storage resources on the host system. The engine automatically purges alert logs older than 7 days or when the stack exceeds 5,000 entries.
* **`use_wal: false`**: Disables Write-Ahead Logging. This reduces disk write operations, conserving I/O bandwidth and extending storage lifecycle on solid-state drives or flash-based hosting media.

#### 4. Infrastructure Monitoring (`prometheus`)
* **`enabled: true` / `listen_port: 6060`**: Exposes a full suite of Prometheus-compatible operational metrics out of the box on port `6060`. 
* **Engineering Intent:** Allows seamless integration into visualization stacks like Grafana, providing real-time visibility into parsing performance, total blocked traffic, and engine resource saturation.

---

### 🌐 Architectural Flow Diagram



1. **Log Stream** ➔ Inested via `acquis.yaml`
2. **Parser Engine** ➔ Compares lines against HTTP/DDoS scenarios
3. **Database & LAPI** ➔ SQLite commits malicious IP ➔ Exposes endpoint to Bouncers
4. **CAPI Coordination** ➔ Syncs threat signatures out-of-band with global intelligence pools


Blocked a 1000+ Hostile-IPs in 90 days
