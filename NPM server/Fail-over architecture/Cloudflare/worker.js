const CONFIG = {
  CF_API_TOKEN: "<cloudflare api token>", 
  ZONE_ID: "<cloudflare zone ID>",
  DOMAIN_FILTERS: ["<domain you want migrated during failure (should include the headscale domain)>"],
  PRIMARY_IP: "<primary server IP>",
  SECONDARY_IP: "<secondary server IP>",
  
  // ONLY monitoring the primary server now. 
  // IMPORTANT: Ensure these URLs are publicly reachable and return a 200 OK status!
  PRIMARY_HEALTH_URLS: [
    "<health monitoring domains>"
 
  ],
  TIMEOUT_MS: 5000
};

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
    
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { "User-Agent": "Cloudflare-Worker-Failover-Bot" }
    });
    
    clearTimeout(timeout);
    return response.ok; 
  } catch {
    return false; 
  }
}

// Returns true ONLY if ALL primary endpoints respond with 2xx OK
async function isPrimaryHealthy(urlsArray) {
  for (const url of urlsArray) {
    const serviceAlive = await checkUrl(url);
    if (!serviceAlive) {
      return false; // Instant fail if any single service is down
    }
  }
  return true; 
}

async function getAllDNSRecords() {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${CONFIG.ZONE_ID}/dns_records?type=A&per_page=100`,
    {
      headers: {
        "Authorization": `Bearer ${CONFIG.CF_API_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
  const data = await response.json();
  return data.result.filter(record =>
    CONFIG.DOMAIN_FILTERS.some(domain => 
      record.name.endsWith("." + domain) || record.name === domain
    )
  );
}

async function updateDNSRecord(recordId, newIP) {
  await fetch(
    `https://api.cloudflare.com/client/v4/zones/${CONFIG.ZONE_ID}/dns_records/${recordId}`,
    {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${CONFIG.CF_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content: newIP })
    }
  );
}

async function runFailover() {
  const primaryAlive = await isPrimaryHealthy(CONFIG.PRIMARY_HEALTH_URLS);
  const records = await getAllDNSRecords();

  if (records.length === 0) {
    return "No A records found under configured domains.";
  }

  const results = [];
  for (const record of records) {
    const currentIP = record.content;

    if (primaryAlive) {
      // Primary is healthy -> Should be on Primary IP
      if (currentIP !== CONFIG.PRIMARY_IP) {
        await updateDNSRecord(record.id, CONFIG.PRIMARY_IP);
        results.push(`${record.name}: Primary recovered. Switched back to ${CONFIG.PRIMARY_IP}`);
      } else {
        results.push(`${record.name}: Healthy on primary (${currentIP})`);
      }
    } else {
      // Primary is down -> Blindly force Secondary IP
      if (currentIP !== CONFIG.SECONDARY_IP) {
        await updateDNSRecord(record.id, CONFIG.SECONDARY_IP);
        results.push(`${record.name}: Primary service failed! Blindly routing to secondary ${CONFIG.SECONDARY_IP}`);
      } else {
        results.push(`${record.name}: Primary is down, already routed to secondary (${currentIP})`);
      }
    }
  }
  return results.join("\n");
}

export default {
  async scheduled(event, env, ctx) {
    const result = await runFailover();
    console.log(result);
  },
  async fetch(request, env, ctx) {
    const result = await runFailover();
    return new Response(result, { status: 200 });
  }
};
