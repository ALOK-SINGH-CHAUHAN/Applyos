import { PluginRegistry } from '@autoapply/automation';
import { GreenhousePlugin } from '@autoapply/plugin-greenhouse';
import { LeverPlugin } from '@autoapply/plugin-lever';
import { AshbyPlugin } from '@autoapply/plugin-ashby';
import { GuruPlugin } from '@autoapply/plugin-guru';
import { PeoplePerHourPlugin } from '@autoapply/plugin-peopleperhour';

export const pluginRegistry = new PluginRegistry();
pluginRegistry.register(new GreenhousePlugin());
pluginRegistry.register(new LeverPlugin());
pluginRegistry.register(new AshbyPlugin());
pluginRegistry.register(new GuruPlugin());
pluginRegistry.register(new PeoplePerHourPlugin());
