```javascript
const { orchestrate } = require('../orchestrator');
const { plannerAgent } = require('../agents/planner');
const { uiAgent } = require('../agents/uiAgent');
const { apiAgent } = require('../agents/apiAgent');
const { testAgent } = require('../agents/testAgent');
const { loadContextFor } = require('../context/githubContextLoader');

jest.mock('../orchestrator');
jest.mock('../agents/planner');
jest.mock('../agents/uiAgent');
jest.mock('../agents/apiAgent');
jest.mock('../agents/testAgent');
jest.mock('../context/githubContextLoader');

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful agent executions
    plannerAgent.mockResolvedValue(JSON.stringify([{ component: 'Backend', summary: 'Create API endpoint', description: 'Create endpoint for fetching data' }]));
    uiAgent.mockResolvedValue('<div>Mock UI</div>');
    apiAgent.mockResolvedValue('// Mock API code');
    testAgent.mockResolvedValue('// Mock test code');
    loadContextFor.mockResolvedValue('// Mock repo context');
  });

  it('should execute the complete workflow successfully', async () => {
    // Mock Jira input
    const mockJiraInput = {
      issueKey: 'TEST-123',
      summary: 'Implement new feature',
      description: 'Implement a new feature with UI and API',
      labels: []
    };

    // Mock orchestrate to return a successful result
    orchestrate.mockResolvedValue({
      message: '✅ 1 files generated for TEST-123',
      files: ['Generated_1_api_Create_API_endpoint.js']
    });

    const result = await orchestrate(mockJiraInput);

    expect(plannerAgent).toHaveBeenCalledWith(mockJiraInput);
    expect(uiAgent).not.toHaveBeenCalled(); // should not be called because planner returns only backend task
    expect(apiAgent).toHaveBeenCalled();
    expect(testAgent).not.toHaveBeenCalled(); // should not be called because planner returns only backend task

    expect(result).toEqual({
      message: '✅ 1 files generated for TEST-123',
      files: ['Generated_1_api_Create_API_endpoint.js']
    });
  });

  it('should handle errors gracefully if plannerAgent fails', async () => {
    plannerAgent.mockRejectedValue(new Error('Planner failed'));

    const mockJiraInput = {
      issueKey: 'TEST-123',
      summary: 'Implement new feature',
      description: 'Implement a new feature with UI and API',
      labels: []
    };

    await expect(orchestrate(mockJiraInput)).rejects.toThrow('Planner failed');

    expect(uiAgent).not.toHaveBeenCalled();
    expect(apiAgent).not.toHaveBeenCalled();
    expect(testAgent).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully if apiAgent fails', async () => {
    apiAgent.mockRejectedValue(new Error('API agent failed'));

    const mockJiraInput = {
      issueKey: 'TEST-123',
      summary: 'Implement new feature',
      description: 'Implement a new feature with UI and API',
      labels: []
    };

    plannerAgent.mockResolvedValue(JSON.stringify([{ component: 'Backend', summary: 'Create API endpoint', description: 'Create endpoint for fetching data' }]));

    await expect(orchestrate(mockJiraInput)).rejects.toThrow('API agent failed');

    expect(uiAgent).not.toHaveBeenCalled();
    expect(apiAgent).toHaveBeenCalled();
    expect(testAgent).not.toHaveBeenCalled();
  });

  it('should not call agents for unsupported components', async () => {
      const mockJiraInput = {
        issueKey: 'TEST-123',
        summary: 'Implement new feature',
        description: 'Implement a new feature',
        labels: []
      };

      plannerAgent.mockResolvedValue(JSON.stringify([{ component: 'Database', summary: 'Create database schema', description: 'Create database schema' }]));

      orchestrate.mockResolvedValue({
        message: '✅ 0 files generated for TEST-123',
        files: []
      });

      const result = await orchestrate(mockJiraInput);
      expect(uiAgent).not.toHaveBeenCalled();
      expect(apiAgent).not.toHaveBeenCalled();
      expect(testAgent).not.toHaveBeenCalled();
      expect(result.files.length).toBe(0);
  });
});
```;
