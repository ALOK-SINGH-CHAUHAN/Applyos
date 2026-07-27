/**
 * Focused unit tests for:
 * 1. toMetadataValue — sanitizes userMetadata values for the session-create validator
 * 2. attributionHeaders (via api.ts) — always sends x-bb-client; conditionally x-bb-install-id
 * 3. remoteStagehandOptions — always includes browse_cli + cli_version; includes install_id only when resolved
 */
export {};
