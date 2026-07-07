🛠️ Project Component: Headplane Orchestration Layer
This configuration manages Headplane, a modern web-based dashboard and control plane UI for Headscale (the open-source, self-hosted alternative to Tailscale's coordination server).

Instead of relying on Docker isolation, this deployment is architected natively on the host OS, leveraging direct system process controls (proc), custom agent integrations, and federated identity management via an OIDC provider (Dex + GitHub).

🏗️ Architectural Breakdown
1. Core Web Server & Security (server:)
Network Binding: Bound to 0.0.0.0:3001, routing through a reverse proxy (e.g., Nginx) to securely expose the interface on a dedicated domain via HTTPS.

Hardened Session Management: * cookie_secure: true: Restricts authentication session tokens strictly to encrypted HTTPS connections to eliminate Man-in-the-Middle (MitM) session hijacking.

cookie_max_age: 86400: Implements an aggressive 24-hour session expiration policy for unused control plane sessions.

Persistent Host Storage: Direct file-system state storage at /var/lib/headplane, avoiding container filesystem overhead and ensuring instantaneous local SQLite database commits.

2. Native Deep Integration (headscale: & integration:)
API Bridge: Interoperates locally with Headscale's HTTP control engine (http://127.0.0.1:8080) rather than the public mesh interface, reducing latency and eliminating external ingress vectors to the raw API.

Process Level Control (proc: true): Containers are explicitly disabled (docker: false, kubernetes: false). By leveraging the native proc integration, Headplane interacts directly with Headscale using OS-level signals. When DNS modifications or node changes occur via the UI, Headplane coordinates seamlessly with the host systemd daemon.

Tailnet Node Monitoring Agent: Actively utilizes the background binary executable (/usr/libexec/headplane/agent) joined natively to the private mesh network. This allows Headplane to capture real-time telemetry, OS versions, and point-to-point connection topologies using a tight 60-second local cache lifespan.

3. Enterprise Authentication Layer (oidc:)
Federated Identity: The control plane bypasses traditional static API key logins by enforcing Single Sign-On (SSO) backed by Dex acting as an identity broker.

GitHub OAuth Backend: Connects directly into GitHub's application ecosystem, locking down the coordination network behind multi-factor authentication (MFA) and GitHub identity verification.

📋 Technical Highlights
💡 Why this architecture matters:

Zero-Container Overhead: Running natively lowers performance bottlenecks, simplifies kernel networking routing tables (TUN/TAP interfaces), and streamlines direct log auditing through journalctl.

Identity-Driven Access: Securing the network topology behind an OIDC pipeline means network nodes can only be authorized by authenticated GitHub accounts, enforcing zero-trust principles at the control boundary.
