<p align="center">
  <a href="https://agents.idexal.com">
    <img src="apps/web/public/logo.png" alt="idexla Agents" width="120" />
  </a>
</p>

# Contributing to idexla Agents AI Web UI

English | [中文](CONTRIBUTING.zh.md)

Thank you for wanting to contribute to **idexla Agents AI Web UI — Free OpenSource**! 💖

This project is **100% free, MIT licensed, and community-driven to stay free forever**. Every contribution — code, docs, translations, plugins, bug reports, or sponsorship — helps keep it free for everyone.

---

## 💝 Why Contribute?

- Keep a world-class AI-powered IDE **free for students, indie hackers, and enterprises alike**.
- Build on an **everything-is-a-plugin (Cordis)** architecture — your plugin is a first-class citizen.
- Get featured: great plugins, guides, and contributions are highlighted at [agents.idexal.com](https://agents.idexal.com) and in release notes.

---

## 🚀 Quick Start for Contributors

```sh
git clone https://github.com/idexal/agents.git
cd agents
pnpm install
pnpm run build
pnpm dsh web
```

- Node: `^22.19.0 || >=24.0.0`, `pnpm@11.7.0`
- Docs: [docs/development.md](docs/development.md) + [docs/architecture.md](docs/architecture.md)
- Agent workflows: [AGENTS.md](AGENTS.md)

Run checks before pushing (see [.agents/skills/dsh-pre-push-checks/SKILL.md](.agents/skills/dsh-pre-push-checks/SKILL.md)):

```sh
pnpm run typecheck
pnpm run lint
pnpm run test
```

---

## 🤝 Ways to Contribute (All Valued Equally)

### 1. Code & Docs
- Fix bugs, add features, improve docs/translations, add tests.
- For non-trivial changes include an **Agent Note** in the same PR (see [.agents/notes/README.md](.agents/notes/README.md)).

### 2. Ecosystem — Plugins
- Create a plugin and add the `idexal-plugin` topic to your GitHub repo for discoverability.
- Write a blog post / how-to guide / video about idexla Agents — we’ll feature it.

### 3. Community Help
- Answer questions in [GitHub Discussions](https://github.com/idexal/agents/discussions).
- Upvote and triage issues — we allocate resources by signal.

### 4. Financial Support (Keeps it Free)
- ⭐ Star this repo
- 💖 Sponsor via [GitHub Sponsors](https://github.com/sponsors/idexal) — see [.github/FUNDING.yml](.github/FUNDING.yml) & [SUPPORT.md](SUPPORT.md)
- 📣 Share with your team / socials

---

## 📝 Pull Request Process

1. **Search** existing issues/discussions first; link the PR to an issue (`Fixes #NN` or `Related to #NN`).
2. Keep PRs focused; split independent changes.
3. Follow conventions in [AGENTS.md](AGENTS.md) and run relevant checks locally — **don’t** reflexively run the full suite; CI owns exhaustive coverage.
4. Ensure `pnpm run build` and affected tests pass; update snapshots if you change model/user-visible output (`pnpm run test:snapshot` etc.).
5. Update docs/README/JSDoc alongside code changes. Docs without code and code without docs are incomplete.
6. Be responsive to review feedback; we use the “receive review” discipline (see [.agents/skills/receiving-code-review/SKILL.md](.agents/skills/receiving-code-review/SKILL.md)).

By contributing you agree your contributions are licensed under the project’s [MIT License](LICENSE).

---

## 🐛 Reporting Bugs & 💡 Ideas

- **Bugs:** Use the Bug template — one-line result + repro/expected/environment/acceptance.
- **Features/Ideas:** Use Feature/Idea/Research templates or Discussions. Clear problem + proposed UX wins.

Security issues → see [SECURITY.md](SECURITY.md) (private disclosure, not public issues).

---

## 🌍 Community Standards

- Be kind, constructive, and inclusive.
- Read and follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
- English is the primary working language; Chinese docs are maintained in parallel where indicated.

---

## 💬 Getting Help

- **Docs:** [agents.idexal.com](https://agents.idexal.com)
- **Discussions:** [github.com/idexal/agents/discussions](https://github.com/idexal/agents/discussions)
- **Issues:** [github.com/idexal/agents/issues](https://github.com/idexal/agents/issues)
- **Email:** [team@idexal.com](mailto:team@idexal.com) / [info@idexal.com](mailto:info@idexal.com)
- **Funding & sponsorship:** [SUPPORT.md](SUPPORT.md)

---

## 👥 About Idexal

**Idexal** is an open-source, AI-powered IDE that competes with the best proprietary solutions — accessible to every developer on every platform. We don’t believe official packages are inherently more important than community ones. Consider this repo an idea, a showcase, and inspiration — not a mandate.

Leadership: **Zakariae Lahbabi** — Founder, CEO & Lead Developer  
[zakariaelahbabi.com](https://zakariaelahbabi.com) • [idexal.com](https://idexal.com) • [@idexal](https://github.com/idexal)

We’ve already seen exciting community projects — keep them coming. Tell us what you want to build.

---

<p align="center">
  <strong>idexla Agents AI Web UI</strong> — Free OpenSource, Forever<br>
  Built with ❤️ by <a href="https://idexal.com">Idexal</a> • <em>Every star, sponsor, and PR keeps it free.</em>
</p>
