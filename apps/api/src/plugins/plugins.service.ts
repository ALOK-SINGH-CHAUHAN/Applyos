import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PluginRegistry } from '@autoapply/automation';
import { GreenhousePlugin } from '@autoapply/plugin-greenhouse';
import { LeverPlugin } from '@autoapply/plugin-lever';
import { AshbyPlugin } from '@autoapply/plugin-ashby';
import { GuruPlugin } from '@autoapply/plugin-guru';
import { PeoplePerHourPlugin } from '@autoapply/plugin-peopleperhour';

@Injectable()
export class PluginsService {
  private registry = new PluginRegistry();

  constructor(private readonly prisma: PrismaService) {
    this.registry.register(new GreenhousePlugin());
    this.registry.register(new LeverPlugin());
    this.registry.register(new AshbyPlugin());
    this.registry.register(new GuruPlugin());
    this.registry.register(new PeoplePerHourPlugin());
  }

  async listPlugins(workspaceId: string) {
    const installed = this.registry.listAll();
    
    // Fetch configs for this workspace
    const configs = await this.prisma.pluginConfiguration.findMany({
      where: { workspaceId },
    });

    const configMap = new Map(configs.map((c) => [c.pluginName, c]));

    return installed.map((plugin) => {
      const dbConfig = configMap.get(plugin.name);
      return {
        name: plugin.name,
        domains: plugin.domains,
        capabilities: plugin.capabilities,
        enabled: dbConfig ? dbConfig.enabled : true,
        autoSubmitAllowed: dbConfig ? dbConfig.autoSubmitAllowed : false,
        hasCredentials: !!(dbConfig?.credentialsEncrypted),
        configJson: dbConfig?.configJson || {},
      };
    });
  }

  async configurePlugin(
    workspaceId: string,
    pluginName: string,
    data: {
      enabled?: boolean;
      autoSubmitAllowed?: boolean;
      configJson?: any;
      credentialsPlain?: string;
    },
    userId?: string
  ) {
    const plugin = this.registry.get(pluginName);
    if (!plugin) {
      throw new NotFoundException(`Plugin ${pluginName} not found in registry`);
    }

    // Encrypt credentials if provided (simple Base64 for clinical workspace simulation, or AES)
    let credentialsEncrypted: string | undefined = undefined;
    if (data.credentialsPlain !== undefined) {
      if (data.credentialsPlain === '') {
        credentialsEncrypted = null as any; // clear
      } else {
        credentialsEncrypted = Buffer.from(data.credentialsPlain).toString('base64');
      }
    }

    const existing = await this.prisma.pluginConfiguration.findUnique({
      where: {
        workspaceId_pluginName: {
          workspaceId,
          pluginName,
        },
      },
    });

    let configRecord;
    if (existing) {
      configRecord = await this.prisma.pluginConfiguration.update({
        where: { id: existing.id },
        data: {
          enabled: data.enabled !== undefined ? data.enabled : undefined,
          autoSubmitAllowed: data.autoSubmitAllowed !== undefined ? data.autoSubmitAllowed : undefined,
          configJson: data.configJson !== undefined ? data.configJson : undefined,
          ...(credentialsEncrypted !== undefined ? { credentialsEncrypted } : {}),
        },
      });
    } else {
      configRecord = await this.prisma.pluginConfiguration.create({
        data: {
          workspaceId,
          pluginName,
          enabled: data.enabled ?? true,
          autoSubmitAllowed: data.autoSubmitAllowed ?? false,
          configJson: data.configJson ?? {},
          credentialsEncrypted: credentialsEncrypted ?? null,
        },
      });
    }

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'PLUGIN_CONFIGURE',
          resourceType: 'plugin',
          resourceId: pluginName,
          metadataJson: {
            enabledChanged: data.enabled !== undefined,
            autoSubmitAllowedChanged: data.autoSubmitAllowed !== undefined,
            configChanged: data.configJson !== undefined,
            credentialsRotated: data.credentialsPlain !== undefined,
          },
        },
      });
    }

    return configRecord;
  }
}
