# 🚨 Runbooks

Step-by-step responses to production events: one page per alert, outage, restore or key rotation. This folder is read under pressure. How the machinery works is in
[deployment/](../deployment/index.md).

## Documents Index

- **[_template.md](./_template.md)**: Copy this to start a new runbook.

No runbooks yet. Add a page the first time an event needs one, and walk through it in dev at least
once before relying on it.

## Format

Every runbook has these six sections, in this order, so they're quick to scan during an incident:

| Section | Says |
| --- | --- |
| **Trigger** | What alert, symptom or request sends you here |
| **Impact** | User-visible effect while unresolved |
| **Access needed** | Systems you'll need; ask the admin for any production access ([security/production-access.md](../security/production-access.md)) |
| **Steps** | Ordered, copy-pasteable commands |
| **Verify** | The check that proves it's fixed |
| **Escalate to** | Who to contact if the steps don't fix it |
