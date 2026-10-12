# Security Policy

## Reporting a vulnerability

**Do not open a public issue, discussion, or pull request for a security
problem.** A public report tells an attacker what they need to know before a fix
exists.

Report privately through GitHub's security advisory form for this repository
("Security" → "Report a vulnerability"), or by email to the maintainers listed in
the repository's `package.json` metadata once that address is published.

Include:

- What the vulnerability is, and what an attacker gains.
- The affected package and version.
- The smallest reproduction you have — a component, a config, or a snippet.
- What you already tried, so we do not repeat it.

## Response window

| Stage | Target |
|---|---|
| Acknowledgement | 3 business days |
| Triage and severity assessment | 10 business days |
| Fix released for critical and high issues | 30 days from triage |
| Fix released for medium and low issues | Next scheduled release |

Severity follows the CVSS v3.1 base score. A component that renders unescaped
consumer input, or a registry path that escapes its destination, is treated as
high without further discussion.

## Supported versions

Security fixes land on the newest minor of the current major, and on the
previous minor until the next major ships. We do not backport to `0.x` patch
releases older than the most recent one.

| Version | Supported |
|---|---|
| `1.x` (current) | Yes |
| Previous minor | Yes |
| Anything older | No |

## What we consider in scope

- The packages published under the `@santaka-ui` scope.
- The CLI's registry handling: path traversal, checksum bypass, and code
  execution from registry content.
- Token and theme generation, where a crafted input could produce invalid CSS.
- The component stylesheet, where a crafted value could break out of a rule.

## What is out of scope

- Vulnerabilities in a consumer's own application code.
- A missing label or ARIA attribute with no security consequence.
- Denial of service from intentionally heavy input that is documented as such.
- Reports against a dependency that we do not control, unless our usage makes it
  reachable — in which case we will coordinate upstream.

## Disclosure

We ask for 90 days of embargo before public disclosure, or until a fix ships if
that is sooner. We credit reporters in the release notes unless they ask us not
to.