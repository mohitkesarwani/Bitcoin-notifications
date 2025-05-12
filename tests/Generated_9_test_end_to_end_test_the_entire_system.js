const { orchestrate } = require('../orchestrator');

describe('End-to-End System Flow', () => {
  it('should successfully process a Jira story and generate files', async () => {
    const mockJiraInput = {
      issueKey: 'TEST-123',
      summary: 'Test Story: End-to-End Flow',
      description: 'Perform end-to-end tests to verify the entire system flow.',
      labels: [],
    };

    const result = await orchestrate(mockJiraInput);
    expect(result).toBeDefined();
    expect(result.message).toContain('files generated');
    expect(result.files).toBeInstanceOf(Array);
    //Further assertions can be made on the contents of generatedFiles if needed.  This would require mocking the file system and agents.

    //Check for specific file generation - adapt paths as needed.
    expect(result.files.some((file) => file.includes('Generated_1_test_end_to_end_flow'))).toBeTruthy();
  }, 15000); // Increased timeout for potentially long-running E2E tests

  it('should handle empty Jira input gracefully', async () => {
    const mockJiraInput = {
      issueKey: '',
      summary: '',
      description: '',
      labels: [],
    };

    const result = await orchestrate(mockJiraInput);
    expect(result).toBeDefined();
    expect(result.message).toContain('files generated'); //Expect 0 files, but the message should still be returned.
    expect(result.files).toBeInstanceOf(Array);
    expect(result.files.length).toBe(0); //Expect no files generated
  });

  it('should handle errors during orchestration', async () => {
    // Mocking a failure scenario - requires mocking plannerAgent or other agents
    const mockPlannerAgent = jest.fn(() => {
      throw new Error('Planner agent failed');
    });
    const originalPlannerAgent = plannerAgent;
    jest.mock('../agents/planner', () => ({ plannerAgent: mockPlannerAgent }));

    try {
      const result = await orchestrate({
        issueKey: 'TEST-456',
        summary: 'Failing Test',
        description: 'this should fail',
        labels: [],
      });
      fail('Expected orchestration to fail'); //this should never be reached if test works.
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toContain('Planner agent failed');
    } finally {
      jest.unmock('../agents/planner'); //unmock to prevent unintended consequences
      plannerAgent = originalPlannerAgent; //restore to original function.
    }
  });

  //Add more tests to simulate different market conditions, if applicable.  This would involve mocking the environment or dependencies responsible for market condition simulation within the system under test.  For example, mocking responses from external APIs which provide market data.
});
