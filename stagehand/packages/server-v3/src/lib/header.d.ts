import type { FastifyRequest } from "fastify";
import { z } from "zod/v4";
export declare const dangerouslyGetHeader: (request: FastifyRequest, header: string) => string;
export declare const getOptionalHeader: (request: FastifyRequest, header: string) => string | undefined;
declare const requestModelConfigSchema: z.ZodObject<{
    model: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
        modelName: z.ZodString;
        apiKey: z.ZodOptional<z.ZodString>;
        baseURL: z.ZodOptional<z.ZodString>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        provider: z.ZodLiteral<"vertex">;
        auth: z.ZodObject<{
            type: z.ZodLiteral<"googleServiceAccount">;
            credentials: z.ZodObject<{
                type: z.ZodOptional<z.ZodLiteral<"service_account">>;
                project_id: z.ZodOptional<z.ZodString>;
                private_key_id: z.ZodOptional<z.ZodString>;
                private_key: z.ZodString;
                client_email: z.ZodString;
                client_id: z.ZodOptional<z.ZodString>;
                auth_uri: z.ZodOptional<z.ZodURL>;
                token_uri: z.ZodOptional<z.ZodURL>;
                auth_provider_x509_cert_url: z.ZodOptional<z.ZodURL>;
                client_x509_cert_url: z.ZodOptional<z.ZodURL>;
                universe_domain: z.ZodOptional<z.ZodString>;
            }, z.core.$strict>;
            scopes: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
            projectId: z.ZodOptional<z.ZodString>;
            universeDomain: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        providerOptions: z.ZodObject<{
            vertex: z.ZodObject<{
                project: z.ZodString;
                location: z.ZodString;
                baseURL: z.ZodOptional<z.ZodString>;
                headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            }, z.core.$strict>;
        }, z.core.$strict>;
    }, z.core.$strict>, z.ZodUnion<readonly [z.ZodObject<{
        baseURL: z.ZodOptional<z.ZodString>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        modelName: z.ZodString;
        provider: z.ZodLiteral<"azure">;
        providerOptions: z.ZodObject<{
            azure: z.ZodObject<{
                resourceName: z.ZodOptional<z.ZodString>;
                baseURL: z.ZodOptional<z.ZodString>;
                apiVersion: z.ZodOptional<z.ZodString>;
                useDeploymentBasedUrls: z.ZodOptional<z.ZodBoolean>;
                headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            }, z.core.$strict>;
        }, z.core.$strict>;
        auth: z.ZodObject<{
            type: z.ZodLiteral<"azureEntraId">;
            token: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strict>, z.ZodObject<{
        modelName: z.ZodString;
        apiKey: z.ZodOptional<z.ZodString>;
        baseURL: z.ZodOptional<z.ZodString>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        provider: z.ZodLiteral<"azure">;
        providerOptions: z.ZodObject<{
            azure: z.ZodObject<{
                resourceName: z.ZodOptional<z.ZodString>;
                baseURL: z.ZodOptional<z.ZodString>;
                apiVersion: z.ZodOptional<z.ZodString>;
                useDeploymentBasedUrls: z.ZodOptional<z.ZodBoolean>;
                headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            }, z.core.$strict>;
        }, z.core.$strict>;
    }, z.core.$strict>]>, z.ZodObject<{
        modelName: z.ZodString;
        apiKey: z.ZodOptional<z.ZodString>;
        baseURL: z.ZodOptional<z.ZodString>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        provider: z.ZodOptional<z.ZodEnum<{
            openai: "openai";
            anthropic: "anthropic";
            google: "google";
            microsoft: "microsoft";
            bedrock: "bedrock";
        }>>;
    }, z.core.$strict>]>>;
    modelName: z.ZodOptional<z.ZodUnion<readonly [z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>, z.ZodString]>>;
    apiKey: z.ZodOptional<z.ZodUnion<readonly [z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>, z.ZodString]>>;
}, z.core.$strict>;
export type RequestModelConfig = z.infer<typeof requestModelConfigSchema>;
type RequestModelConfigResult = {
    success: true;
    data: RequestModelConfig;
} | {
    success: false;
    error: z.ZodError;
};
/**
 * Extracts request-level model config with precedence.
 *
 * Model name:
 * 1. body.options.model.modelName or body.options.model string
 * 2. Legacy body.modelName fallback
 *
 * API key:
 * 1. body.options.model.apiKey
 * 2. x-model-api-key header
 *
 * agentConfig.model is parsed separately for Stagehand initialization. Its
 * credentials are scoped to the agent main model and must not become the
 * request-level API key fallback used by action/execution models.
 */
export declare function getRequestModelConfig(request: FastifyRequest): RequestModelConfigResult;
/**
 * Extracts the structured model config used when creating a Stagehand instance
 * for this request. This can read agentConfig.model for agentExecute startup,
 * but it does not promote agent model credentials to the request-level API key.
 */
export declare function getStagehandInitModelConfig(request: FastifyRequest, requestModelConfig?: RequestModelConfig): RequestModelConfigResult;
/**
 * Extracts the stream response value from either the request header or body.
 * Body parameter takes precedence over header.
 * Defaults to false (non-streaming) if neither is provided.
 */
export declare function shouldRespondWithSSE(request: FastifyRequest): boolean;
export {};
