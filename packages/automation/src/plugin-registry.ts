import { JobPlatformPlugin } from './job-platform-plugin.interface';

export class PluginRegistry {
  private plugins = new Map<string, JobPlatformPlugin>();

  register(plugin: JobPlatformPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  get(name: string): JobPlatformPlugin | undefined {
    return this.plugins.get(name);
  }

  findForDomain(domain: string): JobPlatformPlugin | undefined {
    for (const plugin of this.plugins.values()) {
      if (plugin.domains.some((d) => domain.includes(d))) {
        return plugin;
      }
    }
    return undefined;
  }

  listAll(): JobPlatformPlugin[] {
    return Array.from(this.plugins.values());
  }
}
