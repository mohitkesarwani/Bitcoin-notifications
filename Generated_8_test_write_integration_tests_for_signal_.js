```javascript
const { orchestrate } = require('../orchestrator');
const { plannerAgent } = require('../agents/planner');
const { uiAgent } = require('../agents/uiAgent');
const { apiAgent } = require('../agents/apiAgent');
const { testAgent } = require('../agents/testAgent');
const { loadContextFor } = require('../context/githubContextLoader');

// Mock necessary modules
jest.mock('../orchestrator');
jest.mock('../agents/planner');
jest.mock('../agents/uiAgent');
jest.mock('../agents/apiAgent');
jest.mock('../agents/testAgent');
jest.mock('../context/githubContextLoader');

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the return values of the agents
    plannerAgent.mockResolvedValue([
      { component: 'Backend', summary: 'Create API endpoint', description: 'Implement the API endpoint' },
      { component: 'Frontend', summary: 'Update UI', description: 'Update the UI' },
      { component: 'Testing', summary: 'Create tests', description: 'Write unit tests' },
    ]);

    uiAgent.mockResolvedValue('<div>Mock UI Component</div>');
    apiAgent.mockResolvedValue('// Mock API Endpoint');
    testAgent.mockResolvedValue('// Mock Test Code');

    loadContextFor.mockImplementation(component => {
      if (component === 'Backend') {
        return 'Mock Backend Context';
      } else if (component === 'Frontend') {
        return 'Mock Frontend Context';
      } else if (component === 'Testing') {
        return 'Mock Testing Context';
      } else {
        return 'Mock Default Context';
      }
    });
  });

  it('should orchestrate a Jira story and generate files', async () => {
    // Mock Jira Input
    const jiraInput = {
      issueKey: 'TEST-123',
      summary: 'Implement Feature',
      description: 'Implement a new feature',
      labels: []
    };

    // Call orchestrate
    const result = await orchestrate(jiraInput);

    // Assertions
    expect(plannerAgent).toHaveBeenCalledWith(jiraInput);
    expect(uiAgent).toHaveBeenCalledTimes(1);
    expect(apiAgent).toHaveBeenCalledTimes(1);
    expect(testAgent).toHaveBeenCalledTimes(1);

    expect(result.message).toContain('3 files generated for TEST-123');
    expect(result.files.length).toBe(3);
  });

  it('should handle errors gracefully', async () => {
    // Mock Jira Input
    const jiraInput = {
      issueKey: 'TEST-456',
      summary: 'Implement Feature',
      description: 'Implement a new feature',
      labels: []
    };

    // Mock plannerAgent to throw an error
    plannerAgent.mockRejectedValue(new Error('Planner failed'));

    // Call orchestrate and expect it to throw an error
    await expect(orchestrate(jiraInput)).rejects.toThrow('Planner failed');
  });

  it('should skip unsupported components', async () => {
    // Mock Jira Input
    const jiraInput = {
      issueKey: 'TEST-789',
      summary: 'Implement Feature',
      description: 'Implement a new feature',
      labels: []
    };

    // Mock plannerAgent to return an unsupported component
    plannerAgent.mockResolvedValue([
      { component: 'Database', summary: 'Update DB', description: 'Update the database' }
    ]);

    // Call orchestrate
    const result = await orchestrate(jiraInput);

    // Assertions
    expect(plannerAgent).toHaveBeenCalledWith(jiraInput);
    expect(uiAgent).not.toHaveBeenCalled();
    expect(apiAgent).not.toHaveBeenCalled();
    expect(testAgent).not.toHaveBeenCalled();

    expect(result.message).toContain('0 files generated for TEST-789');
    expect(result.files.length).toBe(0);
  });

  it('should retry agent calls', async () => {
    // Mock Jira Input
    const jiraInput = {
      issueKey: 'TEST-000',
      summary: 'Implement Feature',
      description: 'Implement a new feature',
      labels: []
    };

    const uiAgentMock = jest.fn();
    uiAgentMock.mockRejectedValueOnce(new Error('UI Agent failed on first try'))
      .mockRejectedValueOnce(new Error('UI Agent failed on second try'))
      .mockResolvedValue('<div>Mock UI Component</div>');

    uiAgent.mockImplementation(uiAgentMock);


    // Call orchestrate
    const result = await orchestrate(jiraInput);

    expect(uiAgentMock).toHaveBeenCalledTimes(3);
    expect(result.message).toContain('3 files generated for TEST-000');
    expect(result.files.length).toBe(3);

  });
});
```