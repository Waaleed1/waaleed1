🏗️ Architectural Layers & SPOF Elimination




1. The Compute Layer: Active-Passive Control Plane
Primary Server: Runs the active instances of Headscale and Headplane, processing incoming user connections and handling tailnet routing changes.

Secondary Server: Acts as a cold/warm standby. Because your software configuration files (like the Headplane config.yaml) are identically mirrored or stored natively on both machines, the secondary server is fully prepared to take over the control plane daemon processes at a moment's notice.

2. The Storage Layer: Distributed MinIO Grid
The Mechanism: Your MinIO deployment spans across both physical servers using extra_hosts to bridge the network gap.

SPOF Elimination: MinIO uses erasure coding and data striping across these nodes. When data is written to MinIO, it is automatically distributed across both machines. If the primary server crashes, the secondary server's MinIO node still holds a accessible copy of the underlying data objects.

3. The Database Sync Layer: Litestream Continuous Streaming
To ensure data doesn't have to be re-entered manually, you use a one-way asynchronous stream instead of heavy, complex database clustering.

The Primary Node (The Writer): Your active SQLite databases (used by Headscale/Headplane) live on the primary server. Litestream runs natively alongside them, acting as a lightweight shadow process. Every time a transaction occurs, Litestream captures the WAL (Write-Ahead Log) frames the exact millisecond they hit the disk.

The Pipeline: Litestream immediately ships these incremental cryptographic chunks over to your distributed MinIO storage bucket.

The Secondary Node (The Reader): On the secondary server, Litestream is configured in restore/replicate mode. It constantly monitors the MinIO bucket. The moment it detects a new WAL frame from the primary server, it pulls it down and applies it to the secondary server's local SQLite file.

🔄 The Failover Event: What Happens When Primary Dies?
If your Primary Server experiences a catastrophic hardware failure, your automated or manual failover protocol triggers the following sequence:

Traffic Rerouting: Your upstream reverse proxy/DNS router shifts its backend target from the Primary IP to the Secondary IP.

Database Promotion: Because Litestream was constantly streaming WAL frames to MinIO and applying them to the secondary node, the secondary server’s SQLite database is already up-to-date right up to the last second before the crash.

Zero Data Re-entry: When Headscale and Headplane initialize on the secondary server, they read the local replica database. To the end-user, the system resumes seamlessly—all machine keys, users, OIDC sessions, and network configurations are perfectly preserved.

💡 Why This Design is Elegant:

No Distributed Locking Overhead: Standard database clustering (like Raft or Galera) requires heavy network overhead and complex consensus algorithms. By choosing a single-writer approach with Litestream, you avoid split-brain scenarios entirely.

