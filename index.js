import core from '@actions/core';
import sendAlert from './lib/send-alert.js';
import prepareAlert from './lib/prepare-alert.js';
import queryGitHubWorkflowsStatus from './lib/check-github-history.js';

try {
  const pagerDutyintegrationKey = core.getInput('pagerduty-integration-key'); // Required
  const pagerDutyDedupKey = core.getInput('pagerduty-dedup-key'); // Optional
  const runbookUrl = core.getInput('runbook-url'); // Optional
  const resolve = core.getInput('resolve'); // Optional
  const severity = core.getInput('severity'); // Optional
  const owner = core.getInput('owner'); // Required
  const repo = core.getInput('repo'); // Required
  const workflowId = core.getInput('workflow-id'); // Required
  const branch = core.getInput('branch'); // Required
  const failedExecutionsThreshold = core.getInput('failed-executions-threshold'); // Optional

  const ghToken = process.env.GITHUB_TOKEN;

  var failedExecutionsCount;

  if (failedExecutionsThreshold) {
    const lastExecutions = await queryGitHubWorkflowsStatus(owner, repo, workflowId, failedExecutionsThreshold, ghToken, branch);
    failedExecutionsCount = lastExecutions.filter(exec =>  exec.status == 'completed' & exec.conclusion == 'failure').length;
  }

  if ((failedExecutionsCount != null && failedExecutionsThreshold != null && failedExecutionsCount == failedExecutionsThreshold) || !failedExecutionsThreshold) {
      const alert = prepareAlert(pagerDutyintegrationKey, pagerDutyDedupKey, runbookUrl, resolve, severity);
      await sendAlert(alert);
  }

} catch (error) {
  core.setFailed(error.message);
}
