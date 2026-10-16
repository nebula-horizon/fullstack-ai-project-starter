# <Event name, e.g. "API returns 5xx after deploy">

Copy this file to `docs/runbooks/<event>.md`, fill in every section, link it from
[index.md](./index.md), and rehearse it in **dev** before relying on it.

## Trigger

<The alert name, symptom, or request that brings someone here. Include where it shows up
(alarm, dashboard, user report).>

## Impact

<What users experience while this lasts, and how urgent it is.>

## Access needed

<Which systems the responder must reach (logs, AWS console, Supabase dashboard). Nobody holds
standing production access: request a temporary grant from your administrator first
([security/production-access.md](../security/production-access.md)). Never hand production
credentials to an AI agent.>

## Steps

1. <First action, with the exact command.>
   ```bash
   <command>
   ```
2. <Next action.>

## Verify

<How to confirm it worked: the health check, metric, or query that should now look normal.>

## Escalate to

<Who to contact if the steps don't resolve it: role or team (`<team>`), and how to reach them.>
