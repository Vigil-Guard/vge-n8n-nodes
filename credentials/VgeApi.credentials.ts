import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class VgeApi implements ICredentialType {
  name = 'vgeApi';
  displayName = 'VGE API';
  documentationUrl = 'https://vigilguard.ai';
  icon = 'file:vge.svg' as const;

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'Your Vigil Guard Enterprise API key (vg_live_... or vg_test_...)',
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://api.vigilguard',
      required: true,
      description: 'VGE API base URL (change for self-hosted deployments)',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.baseUrl}}',
      url: '/health',
      method: 'GET',
      skipSslCertificateValidation: true,
    },
  };
}
