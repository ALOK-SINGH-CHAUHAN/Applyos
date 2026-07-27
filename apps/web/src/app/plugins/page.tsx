'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from '../../context/AuthContext';
import { AppHeader } from '../../components/AppHeader';

interface PluginCapability {
  autoSubmit: boolean;
  loginType: 'none' | 'form' | 'oauth';
}

interface InstalledPlugin {
  name: string;
  domains: string[];
  capabilities: PluginCapability;
  enabled: boolean;
  autoSubmitAllowed: boolean;
  hasCredentials: boolean;
  configJson: Record<string, any>;
}

function PluginsMarketplace() {
  const { authHeaders, user } = useAuth();
  const [plugins, setPlugins] = useState<InstalledPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlugin, setEditingPlugin] = useState<InstalledPlugin | null>(null);
  const [credentialsText, setCredentialsText] = useState('');
  const [configJsonText, setConfigJsonText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchPlugins = async () => {
    try {
      const response = await fetch('/api/v1/plugins', {
        headers: authHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setPlugins(data);
      }
    } catch (err) {
      console.error('Error fetching plugins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, [authHeaders]);

  const handleToggleField = async (pluginName: string, field: 'enabled' | 'autoSubmitAllowed', currentValue: boolean) => {
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      alert('Insufficient permissions. Only Owner and Admin roles can configure plugins.');
      return;
    }

    try {
      const response = await fetch(`/api/v1/plugins/${pluginName}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ [field]: !currentValue }),
      });

      if (response.ok) {
        await fetchPlugins();
      } else {
        alert('Failed to update plugin configuration.');
      }
    } catch (err) {
      console.error('Error toggling plugin state:', err);
    }
  };

  const handleOpenEdit = (plugin: InstalledPlugin) => {
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      alert('Insufficient permissions. Only Owner and Admin roles can configure plugins.');
      return;
    }
    setEditingPlugin(plugin);
    setCredentialsText('');
    setConfigJsonText(JSON.stringify(plugin.configJson || {}, null, 2));
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlugin) return;

    let configJsonParsed = {};
    try {
      configJsonParsed = JSON.parse(configJsonText);
    } catch (err) {
      alert('Invalid JSON in Configuration text.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/plugins/${editingPlugin.name}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          configJson: configJsonParsed,
          ...(credentialsText ? { credentialsPlain: credentialsText } : {}),
        }),
      });

      if (response.ok) {
        await fetchPlugins();
        setEditingPlugin(null);
        alert('Plugin configuration updated successfully.');
      } else {
        alert('Failed to save configuration settings.');
      }
    } catch (err) {
      console.error('Error updating config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-drafting-gray text-ink font-sans antialiased flex flex-col">
      {/* Announcement Bar */}
      <div className="w-full bg-gradient-to-r from-[#19a05f] to-[#0d7f8c] py-2.5 px-4 text-center z-50">
        <p className="text-sm font-medium text-white">
          AutoApply Autopilot is now in public beta.{' '}
          <a href="/" className="underline underline-offset-2 hover:text-white/80 transition-colors ml-1 inline-flex items-center gap-0.5">
            Return to main site <span className="text-xs">→</span>
          </a>
        </p>
      </div>

      {/* Navigation Bar */}
      <AppHeader />

      {/* Main Console Workspace */}
      <div className="max-w-[1200px] w-full mx-auto px-6 py-12 flex-grow flex flex-col justify-start">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-heading tracking-heading font-medium text-ink leading-tight">
              Plugin Marketplace
            </h1>
            <p className="text-steel text-sm mt-2">
              Enable job platform adaptors, configure automation thresholds, and update secure target credentials.
            </p>
          </div>
          <div className="font-mono text-xs text-ash border border-hairline px-3 py-1.5 rounded-pill bg-marble w-fit select-none">
            {plugins.length} adaptors loaded
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-4 bg-marble border border-hairline rounded-card">
            <div className="w-8 h-8 border-2 border-progress border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-steel font-mono">Parsing registry adaptors...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Plugins Grid (2/3 width) */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {plugins.map((plugin) => (
                <div
                  key={plugin.name}
                  className={`rounded-card bg-marble border p-6 transition-all space-y-5 ${
                    plugin.enabled ? 'border-hairline shadow-sm' : 'border-hairline/60 bg-marble/60 opacity-75'
                  }`}
                >
                  {/* Top: Name, Status Indicator, Logo */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg text-ink capitalize truncate">
                        {plugin.name}
                      </h3>
                      <p className="text-xs text-ash mt-0.5 truncate font-mono" title={plugin.domains.join(', ')}>
                        {plugin.domains[0]}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleField(plugin.name, 'enabled', plugin.enabled)}
                      className={`px-3 py-1 rounded-pill text-[10px] font-bold font-mono tracking-wider transition-colors shrink-0 ${
                        plugin.enabled
                          ? 'bg-[#e7f6ed] text-[#19a05f] hover:bg-[#d5eedf]'
                          : 'bg-drafting-gray text-steel hover:bg-[#eaeaea]/80'
                      }`}
                    >
                      {plugin.enabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>

                  {/* Capabilities / Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 bg-drafting-gray/50 border border-hairline text-steel rounded-pill text-[10px] font-bold font-mono uppercase">
                      Login: {plugin.capabilities.loginType}
                    </span>
                    {plugin.capabilities.autoSubmit && (
                      <span className="px-2 py-0.5 bg-[#e6f8f5] text-[#0d7f8c] border border-[#0d7f8c]/20 rounded-pill text-[10px] font-bold font-mono">
                        AUTO-SUBMIT
                      </span>
                    )}
                  </div>

                  {/* Settings toggles */}
                  <div className="border-t border-hairline pt-4 space-y-3">
                    {plugin.capabilities.autoSubmit && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-steel font-medium">Autopilot Submission</span>
                        <button
                          onClick={() => handleToggleField(plugin.name, 'autoSubmitAllowed', plugin.autoSubmitAllowed)}
                          className={`w-9 h-5 rounded-pill transition-colors relative flex items-center ${
                            plugin.autoSubmitAllowed ? 'bg-ink' : 'bg-hairline'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full bg-white absolute transition-transform ${
                              plugin.autoSubmitAllowed ? 'translate-x-4.5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-steel font-medium">Credentials Profile</span>
                      <span className={`text-[10px] font-bold font-mono ${
                        plugin.hasCredentials ? 'text-[#19a05f]' : 'text-ash'
                      }`}>
                        {plugin.hasCredentials ? '✓ CONFIGURED' : '✗ EMPTY'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleOpenEdit(plugin)}
                      className="w-full text-center py-2 bg-drafting-gray/60 hover:bg-drafting-gray text-ink border border-hairline rounded-button text-xs font-semibold transition-colors"
                    >
                      Configure settings →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Config Drawer / Drawer Mock (1/3 width) */}
            <div className="bg-marble rounded-card border border-hairline p-6 shadow-lg h-fit sticky top-24">
              {editingPlugin ? (
                <form onSubmit={handleSaveConfig} className="space-y-6">
                  {/* Drawer Header */}
                  <div className="border-b border-hairline pb-4 flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-ink capitalize truncate">
                        Configure {editingPlugin.name}
                      </h2>
                      <p className="text-ash text-xs mt-1">Configure credentials and plugin arguments.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingPlugin(null)}
                      className="text-steel hover:text-ink transition-colors p-1"
                      aria-label="Close settings"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Login Credentials field */}
                  {editingPlugin.capabilities.loginType !== 'none' && (
                    <div className="space-y-2">
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-ash font-mono">
                        Secure Authentication Profile
                      </label>
                      <input
                        type="password"
                        placeholder={editingPlugin.hasCredentials ? '•••••••• (Enter new to override)' : 'Enter password or API token'}
                        value={credentialsText}
                        onChange={(e) => setCredentialsText(e.target.value)}
                        className="w-full bg-drafting-gray/30 border border-hairline rounded-button px-3 py-2 text-xs focus:outline-none focus:border-ink font-mono"
                      />
                      <p className="text-[10px] text-ash mt-1">
                        Encrypted at rest using default workspace cryptographic keys.
                      </p>
                    </div>
                  )}

                  {/* Config JSON field */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-ash font-mono">
                      Plugin configuration (JSON)
                    </label>
                    <textarea
                      rows={8}
                      value={configJsonText}
                      onChange={(e) => setConfigJsonText(e.target.value)}
                      className="w-full bg-drafting-gray/30 border border-hairline rounded-button p-3 text-xs focus:outline-none focus:border-ink font-mono"
                    />
                    <p className="text-[10px] text-ash mt-1">
                      Platform-specific arguments passed down to the Playwright runner.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full text-center py-2.5 bg-ink text-marble hover:bg-opacity-90 rounded-button text-xs font-semibold shadow transition disabled:opacity-50"
                    >
                      {isSaving ? 'Saving parameters...' : 'Save configuration'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-20 text-center text-steel select-none flex flex-col items-center justify-center">
                  <svg className="w-10 h-10 text-hairline mb-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <p className="text-sm font-medium text-ink">No plugin selected</p>
                  <p className="text-xs text-ash mt-1">Select an active adaptor card to edit configuration payloads or authentication parameters.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Clean clinical footer */}
      <footer className="bg-marble border-t border-hairline py-8 mt-12 text-center text-xs text-ash">
        <p>&copy; {new Date().getFullYear()} AutoApply. Clinical Console v1.0.0</p>
      </footer>
    </div>
  );
}

export default function PluginsPage() {
  return (
    <AuthProvider>
      <PluginsMarketplace />
    </AuthProvider>
  );
}
