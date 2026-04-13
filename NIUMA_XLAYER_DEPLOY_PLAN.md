# NIUMA Swap (Uniswap V2/V3 UI Fork) — XLayer Secure Deployment Plan

## Goal
Build and operate a **NIUMA-branded swap frontend** based on Uniswap open-source interface, focused on XLayer (chainId 196), with production-grade security controls.

> Note: No system can guarantee "absolute security". This plan targets practical maximum security with layered controls, monitoring, and fast rollback.

## Product Scope (MVP -> Champion)
1. XLayer-first swap UX (V2/V3 routing via Uniswap interface paths)
2. Multi-language (zh/en/es)
3. Wallet risk hints before swap confirmation
4. Operational hardening (WAF, CSP, signed releases, Sentry, rollback)

## Architecture
- Frontend: Uniswap interface fork (`apps/web`)
- Hosting: Reverse proxy + static web container
- TLS: Cloudflare Full Strict + origin cert
- Runtime config: Environment-based, no secrets in client bundle
- Monitoring: uptime + error tracking + immutable release tags

## Security Baseline
1. **Supply-chain lock**
   - Pin to a release tag from upstream
   - Lock dependency versions (`bun.lock`)
   - Enable Dependabot/Renovate + weekly updates
2. **Build integrity**
   - CI build in clean container
   - Store build artifact SHA256
   - Sign release tags
3. **Web hardening**
   - Strict CSP
   - HSTS + X-Frame-Options + Referrer-Policy
   - Disable inline script except hashed/nonce blocks
4. **Infra hardening**
   - Non-root containers
   - Minimal firewall inbound 80/443 only
   - Fail2ban + log rotation + auto security patching
5. **Operational safety**
   - Blue/green deployment
   - One-command rollback
   - Incident runbook + secret rotation procedure

## Required External Inputs (to go live)
- Domain name (e.g. `swap.niuma.io`)
- VPS/VM SSH access (or cloud account)
- TLS mode decision (Cloudflare recommended)

## Immediate Next Engineering Tasks
- [ ] Create `niuma` branch from current fork
- [ ] Apply NIUMA branding pack (name/logo/colors)
- [ ] Force XLayer as default network in web app
- [ ] Disable unsupported chains from navigation UI
- [ ] Add deployment pipeline (`build -> scan -> deploy -> smoke test`)
- [ ] Publish release candidate `v0.1.0-niuma`
