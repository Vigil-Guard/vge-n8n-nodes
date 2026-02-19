import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import type { NodeOptions, StreamDirection, VgeResponse } from './types';

const MAX_TEXT_LENGTH = 100_000;

function validateBaseUrl(url: string): string {
  const trimmed = url.replace(/\/$/, '');
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Base URL must use HTTP or HTTPS protocol');
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    throw new Error('Invalid base URL format');
  }
}

function sanitizeErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Request failed';
  }
  const msg = error.message;
  if (/password|secret|key=|token=|auth|at\s+\w+\s+\(|\/.*\/.*\//i.test(msg)) {
    return 'Request failed - check credentials and API availability';
  }
  return msg.slice(0, 200);
}

function selectGuardedText(response: VgeResponse, originalText: string): string {
  if (response.outputText) return response.outputText;
  if (response.redactedText) return response.redactedText;
  if (response.decision === 'BLOCKED') {
    return response.blockMessage ?? response.decisionReason ?? '[BLOCKED] Security policy violation';
  }
  if (response.decision === 'SANITIZED' && response.sanitizedText) {
    return response.sanitizedText;
  }
  return originalText;
}

export class VgeAidr implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'VGE AIDR',
    name: 'vgeAidr',
    icon: 'file:vge.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["streamDirection"] === "input" ? "Guard Input" : "Guard Output"}}',
    description: 'AI Detection & Response - LLM security gateway',
    defaults: {
      name: 'VGE AIDR',
    },
    credentials: [
      {
        name: 'vgeApi',
        required: true,
      },
    ],
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Stream Direction',
        name: 'streamDirection',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Input (Before LLM)',
            value: 'input',
            description: 'Guard user prompts before sending to LLM',
          },
          {
            name: 'Output (After LLM)',
            value: 'output',
            description: 'Guard LLM responses before returning to user',
          },
        ],
        default: 'input',
        required: true,
        description: 'Where in the pipeline this guard is placed',
      },
      {
        displayName: 'Text',
        name: 'text',
        type: 'string',
        typeOptions: {
          rows: 4,
        },
        default: '={{ $json.chatInput }}',
        required: true,
        description: 'The text to analyze (prompt for input, response for output)',
      },
      {
        displayName: 'Original Prompt',
        name: 'originalPrompt',
        type: 'string',
        typeOptions: {
          rows: 2,
        },
        default: '',
        displayOptions: {
          show: {
            streamDirection: ['output'],
          },
        },
        description: 'Original user prompt (helps detect context manipulation in output)',
      },
      {
        displayName: 'Passthrough Fields',
        name: 'passthroughFields',
        type: 'string',
        default: 'sessionId,action',
        description: 'Comma-separated field names to pass through unchanged to output',
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Timeout (ms)',
            name: 'timeout',
            type: 'number',
            default: 5000,
            description: 'Request timeout in milliseconds',
          },
          {
            displayName: 'Fail Open',
            name: 'failOpen',
            type: 'boolean',
            default: true,
            description: 'Whether to continue with original text on error instead of failing',
          },
          {
            displayName: 'Include Full Response',
            name: 'includeFullResponse',
            type: 'boolean',
            default: false,
            description: 'Whether to include complete VGE response in output (branches, scores, etc.)',
          },
          {
            displayName: 'Custom Metadata',
            name: 'metadata',
            type: 'json',
            default: '{}',
            description: 'Additional metadata to send with the request',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const guardedItems: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const guardedItem = await processItem.call(this, itemIndex, items[itemIndex]);
        guardedItems.push(guardedItem);
      } catch (error) {
        const options = this.getNodeParameter('options', itemIndex, {}) as NodeOptions;
        const failOpen = options.failOpen !== false;

        if (failOpen) {
          const text = this.getNodeParameter('text', itemIndex, '') as string;
          guardedItems.push({
            json: {
              ...items[itemIndex].json,
              guardedText: text ?? '',
              vgError: sanitizeErrorMessage(error),
              vgFailOpen: true,
              vgDecision: 'ALLOWED',
            },
            pairedItem: { item: itemIndex },
          });
        } else {
          throw new NodeOperationError(
            this.getNode(),
            sanitizeErrorMessage(error),
            { itemIndex }
          );
        }
      }
    }

    return [guardedItems];
  }
}

async function processItem(
  this: IExecuteFunctions,
  itemIndex: number,
  item: INodeExecutionData
): Promise<INodeExecutionData> {
  const streamDirection = this.getNodeParameter('streamDirection', itemIndex) as StreamDirection;
  const text = this.getNodeParameter('text', itemIndex) as string;
  const passthroughFieldsStr = this.getNodeParameter('passthroughFields', itemIndex) as string;
  const options = this.getNodeParameter('options', itemIndex, {}) as NodeOptions;

  const passthroughFields = passthroughFieldsStr
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);

  const passthroughData: IDataObject = {};
  for (const field of passthroughFields) {
    if (item.json[field] !== undefined) {
      passthroughData[field] = item.json[field];
    }
  }

  if (!text || text.trim() === '') {
    return {
      json: {
        ...passthroughData,
        guardedText: '',
        vgDecision: 'ALLOWED',
        vgSkipped: true,
      },
      pairedItem: { item: itemIndex },
    };
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`);
  }

  const endpoint = streamDirection === 'input' ? '/v1/guard/input' : '/v1/guard/output';

  let requestBody: Record<string, unknown>;
  if (streamDirection === 'input') {
    requestBody = {
      prompt: text,
      mode: 'full',
    };
  } else {
    const originalPrompt = this.getNodeParameter('originalPrompt', itemIndex, '') as string;
    requestBody = {
      output: text,
      mode: 'full',
      ...(originalPrompt && { originalPrompt }),
    };
  }

  if (options.metadata) {
    if (typeof options.metadata === 'string') {
      try {
        requestBody.metadata = JSON.parse(options.metadata);
      } catch {
        // Ignore invalid JSON
      }
    } else {
      requestBody.metadata = options.metadata;
    }
  }

  const credentials = await this.getCredentials('vgeApi');
  const baseUrl = validateBaseUrl(credentials.baseUrl as string);
  const skipSslVerification = credentials.skipSslVerification === true;

  const response = (await this.helpers.httpRequest({
    method: 'POST',
    url: `${baseUrl}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${credentials.apiKey}`,
    },
    body: requestBody,
    json: true,
    timeout: options.timeout ?? 5000,
    skipSslCertificateValidation: skipSslVerification,
  })) as VgeResponse;

  const guardedText = selectGuardedText(response, text);

  const outputData: IDataObject = {
    ...passthroughData,
    guardedText,
    vgDecision: response.decision,
    vgScore: response.score,
    vgThreatLevel: response.threatLevel,
    vgCategories: response.categories,
    vgRequestId: response.requestId,
    vgLatencyMs: response.latencyMs,
  };

  if (response.decision === 'SANITIZED') {
    outputData.vgOriginalText = text;
    if (response.redactedText) {
      outputData.vgRedactedText = response.redactedText;
    }
    if (response.sanitizedText) {
      outputData.vgSanitizedText = response.sanitizedText;
    }
  }

  if (response.decision === 'BLOCKED') {
    outputData.vgBlockMessage = response.blockMessage;
    outputData.vgOriginalText = text;
  }

  if (options.includeFullResponse) {
    outputData.vgFullResponse = response;
  }

  return { json: outputData, pairedItem: { item: itemIndex } };
}
