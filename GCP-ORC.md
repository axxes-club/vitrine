# Vitrine with the ORC collection renderer

Both `vitrine.axxes.app` and `vitrine.axxes.club` serve the original premium Vitrine landing page, including Collector ($99/month) and Collector Pro ($199/month). `/register` creates a real email/password account and records the selected membership request. `/sign-in` opens `/orc`, the Vitrine-branded collection desk. `/orc/viewing-room` applies the same membership and plan gates before presenting the collection renderer. Reyes-Veray uses `orc.axxes.app`.

Registration does not grant another customer's collection seat or start a subscription. Membership activation remains the existing human-assisted flow; no payment checkout is configured. Direct collection seats retain their subscription requirements. AXXES entry-organization seats grant only the pinned Reyes-Veray collection, preserving the strongest direct/team role and existing internal subscription exemption. An unpaid collection still offers the collection switcher so customers can reach another collection they are authorized to open.

Each main push runs separate secured production workflows for `vitrine` and `vitrine-app`, plus isolated `vitrine-v2` staging. Each builds with its own existing secret configuration, scans runtime layers, and releases an immutable digest with readiness, traffic guard, and rollback. All runtime configurations retain the reconciled Cloud SQL primary and existing private gallery authorization. Cookie prefix defaults to the existing `better-auth`; `AUTH_COOKIE_PREFIX` can isolate configured domains without changing legacy clients. Registration creates an account and membership request only, without any collection seat, subscription, or administrative grant.


Build with `cloudbuild-orc.yaml`: Linux Node 24 tests and production compilation, runtime-image credential scan, then Artifact Registry push. Deploy the verified digest to both domain services with their respective secrets. Services scale to zero with maximum two instances; existing Cloud SQL and load balancer are reused.

Eight access regression cases run in the Linux image build. Live HTTP checks in `tests/product-entry.test.mjs` require `VITRINE_TEST_ORIGIN`; optional `VITRINE_TEST_IP` bypasses local DNS caching while preserving hostname TLS validation. Browser verification covers both landing pages, registration, membership-request retry, plan persistence, unauthenticated request rejection, cross-domain password login, cookie isolation, and authorized viewing-room access using a temporary account removed afterward.

