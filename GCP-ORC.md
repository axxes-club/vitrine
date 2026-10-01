# Vitrine with the ORC collection renderer

`vitrine.axxes.app` is the Vitrine-branded signed-in product. Its desk uses the shared GCP Cloud SQL catalog. Authorized users open `/viewing-room`, which applies the existing membership and plan gates before presenting the current collection's public renderer. Reyes-Veray's renderer is `orc.axxes.app`; other collections do not inherit access to its private data or accidentally receive its viewing room.

The new `vitrine-app` service uses a dedicated Secret Manager configuration with Cloud SQL rather than Neon. It has its own `axxes.app` session cookie and Vitrine email/password sign-in against the copied AXXES accounts. The existing `vitrine.axxes.club` deployment and the other suite apps are not changed. Cross-domain Handshake SSO is intentionally not enabled for this new hostname until its callback and shared identity datastore migration are verified; no unconfigured SSO button is advertised.

Every main push runs the GCP Vitrine App production workflow using `cloudbuild-orc.yaml`. It builds with the dedicated environment, scans every runtime layer, pushes the immutable image, and releases its digest to `vitrine-app` with readiness, traffic guard, and rollback. Both Vitrine and ORC scale to zero; no new database or load balancer is needed.

Entry-organization memberships grant the pinned collection desk, preserving the strongest direct/team role and entry provenance for the existing subscription exemption. The entry organization itself is not treated as the artwork collection. Six access regression cases run inside the Linux image build.
