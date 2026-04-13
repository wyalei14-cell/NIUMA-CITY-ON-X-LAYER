# GitHub Hosting (GitHub Pages)

## Important security action first
Your GitHub token was exposed in chat. **Revoke it immediately** and create a new one.

- GitHub -> Settings -> Developer settings -> Personal access tokens -> revoke leaked token
- Create a new fine-grained token (minimal permissions)

## Deployment mode used
This repo includes `.github/workflows/deploy-pages.yml` to deploy the NIUMA branch to GitHub Pages.

## One-time setup (GitHub UI)
1. Push branch `niuma-xlayer-hardening` to your repo.
2. Repository -> Settings -> Pages:
   - Source: **GitHub Actions**
3. Repository -> Settings -> Actions -> General:
   - Workflow permissions: **Read and write permissions**

## Trigger deployment
- Push any commit to `niuma-xlayer-hardening`, or
- Run workflow manually from Actions tab.

## Output URL
GitHub Pages URL format:
`https://<your-username>.github.io/<repo-name>/`

## Notes
- This is static hosting and suitable for frontend only.
- Do not store API secrets in frontend env; browser-exposed values are public.
