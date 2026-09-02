<p align="center">
  <a href="https://agents.idexal.com">
    <img src="apps/web/public/logo.png" alt="idexla Agents" width="100" />
  </a>
</p>

# Security Policy — idexla Agents AI Web UI

## Supported Versions

| Version | Supported |
|---------|-----------|
| `master` / latest `0.1.x-alpha` | ✅ |
| Older tags / pre-release | ⚠️ best-effort |

We are in **developer preview** (see [SAFETY.md](SAFETY.md)). There will be breaking changes. Always run the latest `master` or latest tagged release for security fixes.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, report privately:

- ✉️ Email: [security@idexal.com](mailto:security@idexal.com) *(or [info@idexal.com](mailto:info@idexal.com) if unavailable)*
- Subject: `[SECURITY] idexla Agents — brief summary`
- Include: description, impact, repro steps or PoC, affected version/commit, and any suggested mitigation.

We will:

1. Acknowledge within **48 hours**.
2. Triage and keep you updated on progress.
3. Credit you in the advisory if you wish, once fixed.

If you have a GitHub Security Advisory draft, you may also use **GitHub Private Vulnerability Reporting**: `Security` → `Report a vulnerability` on [github.com/idexal/agents](https://github.com/idexal/agents).

## Scope & Expectations

This project can execute model-generated code, load third-party plugins, and access network/processes/files you grant it. See [SAFETY.md](SAFETY.md):

- Run with **least privilege** and in disposable / containerized environments when handling untrusted workloads.
- Sandboxing and approvals reduce but do not guarantee isolation.
- Review plugins, configs, and proposed commands before approving.

We treat seriously any vulnerability that allows unintended privilege escalation, data exfiltration beyond granted scope, or bypass of approval/sandbox controls.

## Disclosure

We aim to publish advisories and fixed releases promptly after a fix is verified. We follow coordinated disclosure — please give us reasonable time to remediate before public disclosure.

---

<p align="center">
  <strong>idexla Agents AI Web UI</strong> — Free OpenSource, Forever<br>
  Security is a community effort. Thank you for helping keep everyone safe.<br>
  Built with ❤️ by <a href="https://idexal.com">Idexal</a>
</p>
