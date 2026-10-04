# Skynet — Contabo deployment

## 1. Install Docker

On the Contabo VPS (Ubuntu/Debian), run:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo systemctl enable --now docker
```

## 2. Clone Skynet

```bash
cd /opt
sudo git clone https://github.com/skynetmedia7/Skynet-Appz.git skynet
cd /opt/skynet
sudo cp .env.example .env
sudo nano .env
```

Set:
- TMDB_API_KEY = the existing TMDB key
- BASE_URL = http://158.220.86.53:10000 for the first test

Do not commit .env to GitHub.

## 3. Start

```bash
sudo docker compose up -d --build
sudo docker compose ps
sudo docker compose logs -f --tail=100
```

## 4. Test

Open:
- http://158.220.86.53:10000/health
- http://158.220.86.53:10000/app-v3
- http://158.220.86.53:10000/manifest.json

## 5. Production HTTPS

For Stremio production use, point a domain/subdomain at 158.220.86.53, then put Nginx/Caddy in front of the container and set BASE_URL to the HTTPS domain. The Render URL remains the fallback until the final DNS cutover.
