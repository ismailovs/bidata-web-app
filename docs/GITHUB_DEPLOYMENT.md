# GitHub Actions → Hetzner

Status: prepared, not configured on the server or in GitHub Secrets, and not end-to-end deployed. It requires owner setup below. Direct SSH from the chat workspace is unavailable. No reverse tunnel or chat-access SSH credential is used.

## What happens

When enabled, a push/merge to `main` runs application tests and deployment-helper tests, then a GitHub-hosted runner connects over SSH as `bidata-deploy`. Manual `workflow_dispatch` also works after the workflow exists on the default `main` branch. Feature branches and pull requests cannot deploy. Set repository protections to require PR review/checks for `main` if desired; this workflow does not create branch-protection settings.

The SSH key is forced to `deploy <full SHA>`, with forwarding, PTY and arbitrary commands disabled. The root-owned installer accepts only the fixed repository's current `main` commit, downloads that immutable archive, and updates only `server.mjs`, `package.json`, `public/` and `data/sample-tenders.json`. It never executes repository code as root. It preserves the existing `.env`, SQLite files, live feed, service definition, Node runtime, Nginx, certificates and payment configuration.

The installer backs up the previous code under `/var/lib/bidata-deploy/backups`, stops the service briefly during the file update, restarts and checks the loopback API. On install/start/health failure, it attempts to restore and restart the old code. This is code rollback only; no database schema rollback is implemented. Review schema changes separately. Backups are not automatically deleted; monitor disk use.

A final workflow step checks the public HTTPS API. A public TLS/DNS failure marks the run failed but does not roll back a locally healthy app. Complete HTTPS setup before enabling deployment. GitHub-hosted runners must reach TCP 22; don't disable firewall protections wholesale. If external SSH is blocked, diagnose the specific route/firewall rule.

## 1. One-time setup on Hetzner

Use the existing root terminal. Review the bootstrap and helpers in this branch, then:

```bash
git -C /tmp/bidata-deploy pull --ff-only origin feat/bidata-pwa
bash /tmp/bidata-deploy/scripts/setup-github-deploy.sh
```

The setup checks the existing app service, creates a dedicated `bidata-deploy` user and restricted SSH key, installs root-owned deployment helpers and one narrowly scoped sudo rule. It does not change the app or its settings. It refuses to overwrite a prior setup. Confirm your SSH daemon supports Ed25519/public-key auth and authorized-key `restrict` (Ubuntu's supported OpenSSH does).

The script prints the **public** server host-key line and the path to the **private** deployment key. The public host key comes directly from `/etc/ssh/ssh_host_ed25519_key.pub`, not an unauthenticated network scan. Never paste the private key into chat, commits, issues or logs.

## 2. GitHub environment and secrets

Repository: `ismailovs/bidata-web-app` → Settings → Environments → New environment → name **hetzner**.

Restrict deployment branches to `main`. Configure a required reviewer if you want an approval before each deployment; otherwise a reviewed merge is the release trigger.

Create these environment secrets:

| Secret | Value |
| --- | --- |
| `HETZNER_SSH_KEY` | Contents of `/root/.ssh/bidata-actions`, the dedicated private deployment key |
| `HETZNER_KNOWN_HOSTS` | Public host-key line printed by setup, starting `188.245.246.102 ssh-ed25519` |

To copy the private key, view it **only in your own trusted terminal**, then paste directly into the GitHub secret field. Do not share the terminal output here. An SSH private key remains sensitive even though its allowed server command is restricted.

Under Settings → Secrets and variables → Actions → Variables, create repository variable **BIDATA_DEPLOY_ENABLED** with value **true** only after server setup, the environment secrets, and HTTPS are ready. Leave unset during setup; deployment jobs will skip. This connector cannot set environment secrets or variables for you.

## 3. First deployment

The app/workflow currently lives in PR #1. Merge the reviewed PR into `main` when ready; the workflow cannot be manually dispatched from the Actions UI until its file exists on the default branch. With deployment enabled, that merge starts validation/deployment. If it was merged before setup, use Actions → Deploy Bidata to Hetzner → Run workflow → main after setup. If GitHub pauses workflows created by an app, explicitly enable the workflow in Actions.

Check the run's logs for the deployed full SHA and successful health check. Verify `https://app.bidata.uz/api/config`, sign-in and the changed interface. Payment mode is whatever the existing server `.env` specifies; this workflow does not turn on charges. Future reviewed merges to main follow the same process. The chat can edit/merge through its GitHub tools when authorized; workflow-dispatch support depends on the connector, so the Actions UI is the guaranteed manual trigger.

## Revocation and maintenance

Remove `/var/lib/bidata-deployer/.ssh/authorized_keys` to revoke the key. Remove/rotate GitHub's `HETZNER_SSH_KEY`, set BIDATA_DEPLOY_ENABLED=false, and remove the sudo rule/account after confirming no deployment is active. Keep private material protected under `/root/.ssh` and handle its disposal securely after copying/rotation.

To update root-owned deployment helpers in future, review changes and install them manually through the owner terminal. App deployment deliberately cannot update its own privileged helper or Nginx. Keep bootstrap files available for audit. Rotate host keys only through a verified owner session, then update HETZNER_KNOWN_HOSTS; strict host checks must stay enabled.
