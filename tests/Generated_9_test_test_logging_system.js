const { app } = require('../index');
const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

jest.mock('../orchestrator', () => ({
  orchestrate: jest.fn(),
}));

const { orchestrate } = require('../orchestrator');

describe('Webhook Endpoint', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should log a message upon receiving a Jira story', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const jiraId = `JIRA-${uuidv4()}`;
    const mockJiraInput = {
      issueKey: jiraId,
      summary: 'Test Jira Story',
      description: 'This is a test description.',
    };

    await request(app).post('/api/langgraph/start').send({ issue: mockJiraInput }).expect(200);

    expect(consoleSpy).toHaveBeenCalledWith(` Received Jira story: ${jiraId} - Test Jira Story`);
    expect(orchestrate).toHaveBeenCalledWith(mockJiraInput);
  });

  it('should handle errors during orchestration and respond with 500', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error');
    const errorMessage = 'Orchestration failed!';
    orchestrate.mockRejectedValue(new Error(errorMessage));

    await request(app)
      .post('/api/langgraph/start')
      .send({ issue: { summary: 'Test' } })
      .expect(500)
      .then((response) => {
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe(errorMessage);
        expect(consoleErrorSpy).toHaveBeenCalledWith(' LangGraph orchestration failed:', expect.any(Error));
      });
  });

  it('should gracefully handle missing Jira data and log appropriately', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    await request(app).post('/api/langgraph/start').send({}).expect(200);
    expect(consoleSpy).toHaveBeenCalledWith(` Received Jira story: NO-KEY - No summary provided`);
  });

  it('should log successful processing of a Jira story', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const mockOutput = { message: 'Success!', files: ['file1.js'] };
    orchestrate.mockResolvedValue(mockOutput);

    await request(app)
      .post('/api/langgraph/start')
      .send({ issue: { summary: 'Test' } })
      .expect(200);

    expect(consoleSpy).toHaveBeenCalledWith(' Agent successfully processed the story');
  });

  it('should return a success message with generated files when orchestration is successful', async () => {
    const mockOutput = { message: 'Files generated successfully', files: ['file1.js', 'file2.js'] };
    orchestrate.mockResolvedValue(mockOutput);

    const response = await request(app)
      .post('/api/langgraph/start')
      .send({ issue: { summary: 'Test' } });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.output).toEqual(mockOutput);
  });
});

describe('Error Handling', () => {
  it('should handle uncaught exceptions', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error');
    const mockError = new Error('Uncaught exception!');
    process.emit('uncaughtException', mockError);
    expect(consoleErrorSpy).toHaveBeenCalledWith(' Uncaught Exception:', mockError);
  });

  it('should handle unhandled promise rejections', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error');
    const mockReason = new Error('Unhandled rejection!');
    process.emit('unhandledRejection', mockReason);
    expect(consoleErrorSpy).toHaveBeenCalledWith(' Unhandled Promise Rejection:', mockReason);
  });
});
