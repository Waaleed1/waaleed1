# Hi there, I'm a DevOps & Network Engineer 👋

A DevOps and Network Engineering specialist focused on building **zero-trust infrastructure**, **high-availability networks**, and **automated failover architectures**. I specialize in eliminating single points of failure (SPOF) and securing public-facing services using modern edge and mesh-networking technologies.

---

## 🛠️ Featured Infrastructure Projects

### 1. Zero-Trust Mesh Network (Headscale)
*Implemented a self-hosted, secure coordination server for personal and staging environments.*
* **Technology Stack:** Headscale, Tailscale Engine, Linux
* **Key Achievements:**
  * Configured **Strict ACL Rules** enforcing a true Zero-Trust architecture, ensuring least-privilege access across all connected nodes.
  * Isolated production, backup, and development environments while maintaining seamless, encrypted peer-to-peer connectivity.

### 2. Secure Public Ingress Gateway (Nginx Proxy Manager + Headscale)
*Designed a secure methodology to expose private internal services to the public internet without opening direct firewall ports.*
* **Technology Stack:** Nginx Proxy Manager (NPM), Headscale, Docker
* **Key Achievements:**
  * Routed public traffic securely through an edge proxy directly into the isolated Headscale mesh network.
  * Automated SSL certificate generation and management via Let's Encrypt for all internal and external subdomains.

### 3. Layered Threat Mitigation (CrowdSec Integration)
*Secured public gateways against automated malicious actors, brute-force attempts, and targeted botnets.*
* **Technology Stack:** CrowdSec, Security Engine, NPM Bouncers
* **Key Achievements:**
  * Deployed CrowdSec to analyze logs in real-time and block malicious behavior at the reverse proxy level.
  * Established a collaborative threat-intelligence layer that proactively drops traffic from known malicious IPs.

### 4. High-Availability Automated DNS Failover
*Engineered an automated disaster recovery solution to maintain 99.9% uptime for critical services.*
* **Technology Stack:** Cloudflare Workers, Cloudflare DNS API, Health Check Scripts
* **Key Achievements:**
  * Developed a serverless **Cloudflare Worker** that continuously monitors primary server health.
  * Automated dynamic DNS record switching to seamlessly reroute traffic to an active backup server during an outage, minimizing downtime.

### 5. No-SPOF Network Architecture
*Architected an infrastructure topology designed around absolute redundancy.*
* **Design Philosophy:** High Availability (HA) & Disaster Recovery
* **Key Achievements:**
  * Eliminated **Single Points of Failure (SPOF)** across computing resources, proxy layers, and network routing paths.
  * Implemented cross-datacenter / multi-node redundancy ensuring system state and availability persist during hardware or network failures.

---

## 🧰 Tech Stack & Tools

* **Networking & VPNs:** Headscale, Tailscale, Cloudflare Tunnels, WireGuard
* **Reverse Proxies & Security:** Nginx Proxy Manager, CrowdSec, Firewalls (ufw/iptables)
* **DevOps & Automation:** Cloudflare Workers, Docker, GitHub Actions, Bash Scripting
* **Infrastructure Design:** High-Availability (HA), Zero-Trust Network Architecture (ZTNA)

---
<img width="1333" height="832" alt="Untitled Diagram (3)" src="https://github.com/user-attachments/assets/715dd321-3b13-4127-92ed-4ab9af4cf02c" />

---

## 📫 How to reach me
* **LinkedIn:** [Kareem ahmed](https://www.linkedin.com/in/kareem-atteia-644661257)
* **Email:** kareem.ahmed.bahaa@gmail.com
