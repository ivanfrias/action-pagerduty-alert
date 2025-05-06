import core, { debug } from '@actions/core';
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

  console.debug("Executing 'action-pagerduty-alert' action with following arguments:");
  console.debug("pagerduty-dedup-key: ", pagerDutyDedupKey);
  console.debug("runbook-url: ", runbookUrl);
  console.debug("resolve: ", resolve);
  console.debug("severity: ", severity);
  console.debug("owner: ", owner);
  console.debug("repo: ", repo);
  console.debug("workflow-id: ", workflowId);
  console.debug("branch: ", branch);
  console.debug("failed-executions-threshold: ", failedExecutionsThreshold);
  console.log("\n");

  if (!resolve) {
    if (failedExecutionsThreshold) {
      const lastExecutions = await queryGitHubWorkflowsStatus(owner, repo, workflowId, failedExecutionsThreshold, ghToken, branch);
  
      if (lastExecutions) {
        failedExecutionsCount = lastExecutions.filter(exec =>  exec.status == 'completed' & exec.conclusion == 'failure').length;
      } else {
        throw new Error("Couldn't query GitHub history!");
      }
  
    } else {
      console.info("Failed Executions Threshold not defined, skipping GitHub history verifications...");
    }
  }

  if (resolve || (failedExecutionsCount != null && failedExecutionsThreshold != null && failedExecutionsCount == failedExecutionsThreshold) || !failedExecutionsThreshold) {
      const alert = prepareAlert(pagerDutyintegrationKey, pagerDutyDedupKey, runbookUrl, resolve, severity);
      await sendAlert(alert);
  }

} catch (error) {
  core.setFailed(error.message);
}
