# Judge0 Setup Guide for Chofesh.ai

Judge0 is a free, open-source code execution engine that powers the Research Mode's code execution capabilities. This guide covers both self-hosted and cloud-based setup options.

---

## Overview

**Judge0** provides sandboxed code execution for 60+ programming languages including Python, JavaScript, Java, C++, Go, Rust, and more. It's used by major platforms for competitive programming, e-learning, and AI code execution.

**Key Features:**
- ✅ 100% Free and Open Source (MIT License)
- ✅ 60+ Programming Languages
- ✅ Sandboxed Execution (Secure)
- ✅ Time and Memory Limits
- ✅ Battle-tested by Major Companies
- ✅ No API Limits (Self-hosted)

---

## Option 1: Self-Hosted (Recommended - Unlimited & Free)

Self-hosting Judge0 gives you unlimited code executions at no cost. It's straightforward to set up with Docker.

### Requirements

- Docker 20.10+ and Docker Compose 1.29+
- Linux server (Ubuntu 20.04+ recommended)
- Minimum: 1GB RAM, 1 CPU core, 10GB disk
- Recommended: 2GB RAM, 2 CPU cores, 20GB disk

### Quick Start

**1. Install Docker and Docker Compose**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
```

**2. Clone Judge0 Repository**

```bash
cd /opt
sudo git clone https://github.com/judge0/judge0.git
cd judge0
```

**3. Start Judge0**

```bash
# Use the production configuration
sudo docker-compose -f docker-compose.yml up -d
```

This will start Judge0 on port 2358.

**4. Verify Installation**

```bash
# Check if Judge0 is running
curl http://localhost:2358/languages

# You should see a JSON array of supported languages
```

**5. Configure Chofesh.ai**

Add to your `.env` file:

```bash
# Judge0 Self-Hosted
JUDGE0_API_URL=http://localhost:2358

# If Judge0 is on a different server:
# JUDGE0_API_URL=http://your-server-ip:2358
```

**6. Restart Chofesh.ai**

```bash
pnpm build
pm2 restart chofesh-ai
```

### Production Deployment

For production, you should:

**1. Use HTTPS with Nginx Reverse Proxy**

```nginx
server {
    listen 443 ssl;
    server_name judge0.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/judge0.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/judge0.yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:2358;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**2. Configure Firewall**

```bash
# Allow only from your Chofesh.ai server
sudo ufw allow from YOUR_CHOFESH_SERVER_IP to any port 2358
```

**3. Set Resource Limits**

Edit `docker-compose.yml`:

```yaml
services:
  server:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

**4. Enable Monitoring**

```bash
# Check Judge0 logs
sudo docker-compose logs -f server

# Check resource usage
sudo docker stats
```

---

## Option 2: Free Cloud Hosting

If you don't want to manage infrastructure, you can use free cloud services to host Judge0.

### Oracle Cloud Free Tier (Recommended)

Oracle Cloud offers a generous free tier that's perfect for Judge0:

- 2 AMD-based VMs (1/8 OCPU, 1GB RAM each)
- 4 Arm-based VMs (4 cores, 24GB RAM total)
- 200GB block storage
- **Always free** (not a trial)

**Setup Steps:**

1. Sign up at https://www.oracle.com/cloud/free/
2. Create a VM instance (Ubuntu 20.04)
3. Follow the self-hosted setup steps above
4. Configure firewall rules in Oracle Cloud Console
5. Use the public IP in your `JUDGE0_API_URL`

### AWS Free Tier

AWS offers 12 months free:

- t2.micro instance (1 vCPU, 1GB RAM)
- 30GB storage
- 750 hours/month

**Setup Steps:**

1. Sign up at https://aws.amazon.com/free/
2. Launch EC2 instance (Ubuntu 20.04, t2.micro)
3. Follow the self-hosted setup steps above
4. Configure security groups to allow port 2358
5. Use the public IP in your `JUDGE0_API_URL`

---

## Option 3: RapidAPI (50 Free Executions/Day)

If you prefer a managed service with no setup, use RapidAPI's free tier.

**Setup Steps:**

1. Sign up at https://rapidapi.com/
2. Subscribe to Judge0 CE: https://rapidapi.com/judge0-official/api/judge0-ce
3. Select the **BASIC** plan (Free - 50 requests/day)
4. Copy your RapidAPI key
5. Add to `.env`:

```bash
# Judge0 via RapidAPI (Free: 50 submissions/day)
RAPIDAPI_KEY=your_rapidapi_key_here

# DO NOT set JUDGE0_API_URL - it will auto-use RapidAPI
```

**Limitations:**
- 50 submissions per day (resets daily)
- Shared infrastructure (may be slower)
- Requires internet connection

**Upgrade Options:**
- Pro: $44.99/month (2,000 submissions/day)
- Ultra: $89.99/month (5,000 submissions/day)
- Mega: $169.99/month (10,000 submissions/day)

---

## Supported Languages

Judge0 supports 60+ languages. Here are the most popular:

| Language | Version | Language ID |
|----------|---------|-------------|
| Python 3 | 3.8.1 | 71 |
| JavaScript (Node.js) | 12.14.0 | 63 |
| Java | OpenJDK 13.0.1 | 62 |
| C++ | GCC 9.2.0 | 54 |
| C | GCC 9.2.0 | 50 |
| Go | 1.13.5 | 60 |
| Rust | 1.40.0 | 73 |
| Ruby | 2.7.0 | 72 |
| PHP | 7.4.1 | 68 |
| TypeScript | 3.7.4 | 74 |
| Swift | 5.2.3 | 83 |
| Kotlin | 1.3.70 | 78 |
| Bash | 5.0.0 | 46 |
| R | 4.0.0 | 80 |
| SQL (SQLite) | 3.27.2 | 82 |

Full list: https://ce.judge0.com/languages

---

## Security Considerations

Judge0 uses multiple layers of security:

**1. Sandboxing**
- Each submission runs in an isolated container
- No access to host filesystem or network
- Limited system calls

**2. Resource Limits**
- CPU time limits (default: 5 seconds)
- Memory limits (default: 128MB)
- Disk space limits
- Process limits

**3. Network Isolation**
- No outbound network access by default
- Prevents data exfiltration
- Blocks malicious downloads

**4. User Separation**
- Each submission runs as a unique user
- Prevents interference between submissions

**Best Practices:**
- Keep Judge0 updated: `docker-compose pull && docker-compose up -d`
- Monitor resource usage
- Set appropriate time and memory limits
- Use firewall rules to restrict access
- Enable HTTPS for production

---

## Troubleshooting

### Judge0 not starting

```bash
# Check Docker logs
sudo docker-compose logs server

# Common issues:
# - Port 2358 already in use
# - Insufficient memory
# - Docker not running
```

### Code execution fails

```bash
# Check if Judge0 is accessible
curl http://localhost:2358/languages

# Check available languages
curl http://localhost:2358/languages | jq

# Test with a simple submission
curl -X POST http://localhost:2358/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello World\")",
    "language_id": 71,
    "stdin": ""
  }'
```

### High memory usage

```bash
# Limit concurrent submissions in docker-compose.yml
environment:
  - MAX_QUEUE_SIZE=10
  - MAX_WORKERS=2
```

### Slow execution

```bash
# Check system resources
htop

# Increase CPU/memory limits in docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 4G
```

---

## Monitoring and Maintenance

### Health Checks

```bash
# Check Judge0 status
curl http://localhost:2358/about

# Check system info
curl http://localhost:2358/system_info
```

### Logs

```bash
# View real-time logs
sudo docker-compose logs -f server

# View last 100 lines
sudo docker-compose logs --tail=100 server
```

### Updates

```bash
# Update Judge0 to latest version
cd /opt/judge0
sudo docker-compose pull
sudo docker-compose up -d
```

### Backups

Judge0 is stateless - no backups needed. Just keep your `docker-compose.yml` configuration.

---

## Cost Comparison

| Option | Setup Time | Monthly Cost | Executions | Maintenance |
|--------|------------|--------------|------------|-------------|
| **Self-Hosted (Oracle Free)** | 30 min | $0 | Unlimited | Low |
| **Self-Hosted (AWS Free)** | 30 min | $0 (12 months) | Unlimited | Low |
| **Self-Hosted (VPS)** | 30 min | $5-10 | Unlimited | Low |
| **RapidAPI Free** | 5 min | $0 | 50/day | None |
| **RapidAPI Pro** | 5 min | $45 | 2,000/day | None |
| **E2B (Alternative)** | 10 min | $0 (100/month) | 100/month | None |

**Recommendation:** Self-host on Oracle Cloud Free Tier for unlimited executions at $0/month.

---

## Environment Variables Reference

```bash
# Option 1: Self-Hosted Judge0
JUDGE0_API_URL=http://localhost:2358
# Or: JUDGE0_API_URL=https://judge0.yourdomain.com

# Option 2: RapidAPI (Free: 50/day)
RAPIDAPI_KEY=your_rapidapi_key_here
# Leave JUDGE0_API_URL unset to use RapidAPI

# Optional: Configure limits
JUDGE0_TIME_LIMIT=5          # seconds
JUDGE0_MEMORY_LIMIT=128000   # KB (128MB)
```

---

## Additional Resources

- **Judge0 Official Website:** https://judge0.com/
- **Judge0 GitHub:** https://github.com/judge0/judge0
- **Judge0 Documentation:** https://ce.judge0.com/
- **Judge0 Status Page:** https://status.judge0.com/
- **RapidAPI Judge0:** https://rapidapi.com/judge0-official/api/judge0-ce
- **Community Support:** https://github.com/judge0/judge0/discussions

---

## Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review Judge0 logs: `docker-compose logs server`
3. Visit Judge0 GitHub issues: https://github.com/judge0/judge0/issues
4. Join Judge0 Discord: https://discord.gg/judge0

---

**Last Updated:** January 13, 2026  
**Chofesh.ai Version:** 1.0.0
