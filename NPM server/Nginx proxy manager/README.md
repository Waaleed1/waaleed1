## 🐳 Core Infrastructure Stack (`docker-compose.yml`)

This configuration orchestrates a self-defending, public-facing reverse proxy gateway. By leveraging a **sidecar network pattern** and **automated thread-intelligence log parsing**, this stack completely isolates internal backend infrastructure from the open internet while maintaining highly secure, authenticated public ingress.

---

### 🏗️ Architectural Flow & Component Breakdown

#### 1. Secure Mesh Bridge (`tailscale`)
Acts as the encrypted network gateway connecting this specific host to a private, zero-trust **Headscale overlay network**.
* **Kernel-Level Routing:** Utilizes elevated capabilities (`NET_ADMIN`, `SYS_MODULE`) and a virtual network TUN device (`/dev/net/tun`) to create secure, encrypted tunnels and manipulate routing tables natively.
* **Host Integration:** Configured with `network_mode: "host"` to bind the overlay network interfaces directly to the host machine for seamless routing.

#### 2. Reverse Proxy & Ingress (`app`)
Deploys **Nginx Proxy Manager (NPM)** to handle incoming web traffic and route requests to internal endpoints across the mesh network.
* **Network Namespace Sharing (`network_mode: "service:tailscale"`):** To maximize security, the proxy container bypasses standard Docker bridge isolation and attaches directly to the Tailscale container's network namespace. To the rest of the network, NPM and the VPN bridge function as a single cryptographic identity sharing the same IP.
* **Sequential Dependency:** Enforces a strict initialization order using `depends_on` to guarantee proxy services only spin up after the secure network mesh interface is fully established.

#### 3. Intrusion Prevention Engine (`crowdsec`)
Acts as a localized, real-time Intrusion Detection/Prevention System (IDS/IPS) protecting public endpoints.
* **Targeted Detection Profiles:** Loaded with specialized HTTP and Nginx security collections (`crowdsecurity/nginx`, `http-cve`) to identify bad bots, Layer 7 DDoS behavior, and automated vulnerability scanners.
* **Asynchronous Log Parsing:** Mounts NPM’s log directory as **Read-Only (`ro`)** (`./data/logs:/var/log/nginx:ro`). This allows CrowdSec to analyze access logs continuously in the background without introducing processing latency to the live proxy engine.

---

### 🛡️ Key Engineering Highlights

* **Zero-Port Exposure Blueprint:** Traditional public-facing ports remain shielded from the open host firewall. Traffic maps securely through an isolated network namespace directly into Headscale's ACL-controlled paths.
* **Decoupled Security Architecture:** The security engine processes threat intelligence completely out-of-band. If an attacker triggers a defensive rule, the system drops the threat actively at the reverse proxy layer without draining web server performance.
