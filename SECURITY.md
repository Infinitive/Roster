# Security Policy

## Overview

ROSTER is a local-first personal media registry and collection-management application.

Security and privacy are important design considerations because ROSTER may contain information about a user's personal media collection, local files, filenames, metadata, notes, collection organization, and other user-created data.

This document explains which versions are supported, what kinds of security issues should be reported, how to report them safely, and what information should not be disclosed publicly.

---

## Supported Versions

ROSTER is currently maintained as a continuously developed application rather than as a series of long-term-supported releases.

At this time, security fixes are generally targeted at:

| Version                             | Supported |
| ----------------------------------- | --------- |
| Current `main` branch               | Yes       |
| Current GitHub Pages deployment     | Yes       |
| Older commits / historical versions | No        |

Because ROSTER is a personal project and development may move quickly, users should generally use the current published version rather than relying on an older commit or deployment.

---

## What Is Considered a Security Vulnerability?

Security issues include, but are not limited to:

### Application security

* Cross-site scripting (XSS)
* Unsafe handling or rendering of user-controlled content
* Code execution caused by malicious imported data
* Unsafe HTML, Markdown, URL, or media handling
* Authentication or authorization bypasses, if applicable
* Security-sensitive state manipulation
* Unexpected execution of attacker-controlled JavaScript

### Data security and privacy

* Unexpected transmission of locally stored collection data
* Exposure of private collection information
* Insecure import or export handling
* Unauthorized access to IndexedDB or other application data through application vulnerabilities
* Accidental exposure of user data through URLs, logs, analytics, or browser storage
* Sensitive information appearing in generated reports or diagnostics without the user's intent

### API and credential security

ROSTER may optionally use external AI/API services.

Security issues involving:

* API keys
* accidental credential exposure
* credentials appearing in client-side bundles
* credentials being written to logs
* unauthorized API requests
* unintended transmission of user data to external services

should be treated as security-sensitive and reported privately.

**Never include an API key, access token, password, private export, or other secret in a public GitHub issue.**

### Dependency and supply-chain security

Please report credible vulnerabilities involving:

* npm/Bun dependencies
* GitHub Actions
* build tooling
* dependency confusion
* malicious dependency behavior
* compromised packages
* unsafe workflow configuration
* compromised build or deployment processes

### GitHub Actions and repository security

Issues involving GitHub Actions, workflows, permissions, deployment credentials, repository secrets, or other repository automation should also be reported privately when exploitation could affect the repository or users.

---

## How to Report a Vulnerability

### Preferred method: GitHub Private Vulnerability Reporting

If GitHub's **Private Vulnerability Reporting** feature is enabled for this repository, please use it to submit security vulnerabilities.

Private reporting is strongly preferred because it allows the issue to be investigated without immediately exposing an exploitable vulnerability to the public.

### If Private Vulnerability Reporting Is Unavailable

If private reporting is temporarily unavailable, do **not** publish exploit details in a public issue.

Instead, contact the repository maintainer through a private GitHub communication channel and indicate that the message concerns a security vulnerability.

If you are unsure whether an issue is security-sensitive, treat it as security-sensitive and report it privately.

---

## What to Include in a Security Report

A useful security report should contain as much of the following as is safe to provide:

1. A clear description of the vulnerability.
2. The affected ROSTER version, commit, or deployment.
3. The affected component or feature.
4. Steps required to reproduce the issue.
5. The expected behavior.
6. The actual behavior.
7. The security impact.
8. Whether exploitation requires user interaction.
9. Whether exploitation requires a specially crafted import, file, URL, or other input.
10. A minimal proof of concept when appropriate.
11. Any suggested mitigation or fix, if known.

Please avoid including real personal collection data when a synthetic example can demonstrate the issue.

---

## Sensitive Information

Do not include any of the following in a public issue or discussion:

* API keys
* passwords
* authentication tokens
* private GitHub credentials
* private collection exports
* personal media filenames when unnecessary
* private notes
* private URLs
* personally identifying information
* proprietary information
* browser storage dumps containing personal data

If sensitive information is accidentally disclosed publicly, remove it immediately and notify the maintainer if the information could still be accessible through Git history, caches, logs, or other locations.

Simply editing or deleting a GitHub comment may not be sufficient to remove a secret that has already been exposed.

---

## Responsible Disclosure

Security researchers are encouraged to allow reasonable time for investigation and remediation before publicly disclosing a vulnerability.

When a report is received, the maintainer may:

1. Confirm receipt when practical.
2. Investigate and reproduce the issue.
3. Determine the affected versions and scope.
4. Develop and test a fix or mitigation.
5. Release the fix when appropriate.
6. Coordinate public disclosure when appropriate.

The exact timeline may vary depending on the severity and complexity of the issue.

---

## Researcher Safety

Good-faith security research is welcome.

Please avoid:

* accessing another person's private data;
* destroying or modifying another person's data;
* intentionally disrupting GitHub Pages or repository availability;
* excessive automated requests;
* attacks against third-party infrastructure;
* social engineering;
* phishing;
* credential theft;
* denial-of-service activity;
* persistence mechanisms;
* deploying malware;
* testing against accounts, devices, or data that you do not own or have explicit permission to test.

When demonstrating an issue, use synthetic or disposable data whenever possible.

---

## Scope

### In scope

The following are generally within the scope of this security policy:

* ROSTER application source code
* ROSTER's client-side data handling
* ROSTER import/export functionality
* ROSTER's local storage and IndexedDB handling
* ROSTER's optional API integrations
* ROSTER's build process
* ROSTER's GitHub Actions workflows
* ROSTER's GitHub Pages deployment configuration
* Dependency and supply-chain issues affecting ROSTER
* Security-sensitive behavior caused by maliciously crafted input

### Generally out of scope

The following are generally not considered security vulnerabilities in ROSTER itself:

* Feature requests
* Visual/UI bugs without a security impact
* Accessibility issues without a security impact
* Incorrect media metadata
* Taxonomy or categorization disagreements
* Normal application behavior that requires the user to intentionally provide data
* Vulnerabilities in unrelated third-party websites or services
* Availability problems caused by GitHub, GitHub Pages, browsers, or other infrastructure outside ROSTER's control
* Copyright or licensing disputes concerning a user's media collection
* Security problems requiring physical access to a user's unlocked device
* Issues caused solely by an unsupported or obsolete browser

Third-party vulnerabilities may still be relevant if ROSTER introduces a meaningful additional security risk by incorporating the affected component.

---

## Local-First Privacy Model

ROSTER is designed around a local-first architecture.

Users should nevertheless understand that local-first does not mean that every operation is guaranteed to remain entirely on the user's device.

In particular:

* Data stored locally should be treated as the user's responsibility to protect.
* Exported collection files should be protected like other personal files.
* Optional external integrations may transmit information that the user explicitly sends to those services.
* API credentials should never be embedded in source code or committed to the repository.
* Users should review what information is being submitted to external services before using optional integrations.

Users should maintain their own backups of important collection data.

---

## API Keys and Secrets

Never commit secrets to the repository.

This includes:

* API keys
* access tokens
* private credentials
* passwords
* private certificates
* authentication cookies
* private service credentials

Use local environment configuration or GitHub-provided secret mechanisms where appropriate.

If a secret is accidentally committed:

1. Treat it as compromised.
2. Revoke or rotate it immediately.
3. Remove it from the repository as appropriate.
4. Check whether it exists in Git history.
5. Do not assume that deleting the current file makes the secret inaccessible.

---

## Security Updates

Security fixes may be released as ordinary commits, dependency updates, configuration changes, or application releases depending on the nature of the issue.

Where practical, important security fixes will be documented through GitHub's normal repository mechanisms.

Automated dependency and code scanning may also identify issues before they are reported manually.

---

## Acknowledgements

Security researchers who responsibly report valid vulnerabilities may be acknowledged publicly when appropriate and when they consent to being credited.

No researcher is required to accept public attribution.

---

## Questions

For ordinary bugs, feature requests, or product questions, please use the repository's normal GitHub issue mechanisms.

For potential security vulnerabilities, use the private reporting process described above whenever available.
