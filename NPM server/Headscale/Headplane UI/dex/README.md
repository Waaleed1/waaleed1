🔐 Identity Provider Layer: Dex OIDC Identity Broker

This configuration deploys Dex as a lightweight, federated identity layer running natively on the host system. It bridges the Headplane dashboard with GitHub’s OAuth2 API, enabling secure Single Sign-On (SSO) for managing the private tailnet.

[ Headplane ]  --(OIDC Protocol)-->  [ Dex (Port 5556) ]  --(OAuth2)-->  [ GitHub API ]
🏗️ Architectural Breakdown

1. Core Provider & Storage (issuer: & storage:)
Issuer URL: The public-facing domain where Dex listens for OIDC requests. Headplane sends users here when they click "Login".

Persistent State (sqlite3): State management (active user sessions, authentication codes, tokens) is stored locally in a lightweight SQLite database at /var/lib/dex/dex.db. Running natively on the host filesystem ensures near-zero read/write latency.

2. Local Networking (web:)
Host Binding: Bound strictly to 127.0.0.1:5556. By locking Dex to localhost, it is entirely shielded from direct public internet exposure. An upstream reverse proxy handles external TLS termination before passing the traffic securely down to this port.

3. Client Registration (staticClients:)
This block establishes a trusted relationship between Dex and Headplane.

Client ID & Secret: Cryptographic credentials generated for Headplane. Headplane passes these to Dex to prove it is an authorized application requesting user identity data.

Redirect URIs: A security strict-matching list. After Dex successfully authenticates a user, it will only send them back to this specific Headplane callback URL, completely preventing open-redirect phishing vulnerabilities.

4. Federated Identity Connector (connectors:)
This block links Dex to GitHub.

GitHub Connector: Configures GitHub as the upstream identity source.

GitHub Credentials (clientID/clientSecret): The application keys generated inside the GitHub Developer Settings panel.

OAuth Callback (redirectURI): The specific endpoint where GitHub returns the user after they successfully authorize via their GitHub account. Dex captures this response, translates it into an official OIDC token, and hands it off to Headplane.

💡 Key Design Choices Explained:

Decoupled Architecture: Using Dex instead of direct GitHub OAuth means the authentication backend is entirely abstracted. If you ever want to switch from GitHub to Google Workspace, Authelia, or a self-hosted Keycloak instance, you only update Dex. Headplane's configuration remains completely untouched.

Hardened Local Boundary: Binding the web server directly to 127.0.0.1 ensures that identity routing is fully managed behind your internal reverse proxy, adhering to defense-in-depth networking standards.
