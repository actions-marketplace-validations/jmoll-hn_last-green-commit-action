import * as core from "@actions/core";
import * as github from "@actions/github";

async function run(): Promise<void> {
  try {
    const inputs = {
      token: core.getInput("token"),
      branch: core.getInput("branch"),
      workflow: core.getInput("workflow"),
      //verify: core.getInput('verify')
    };
    core.info(`Obtaining last successful commit for: `);
    core.info(`Branch name: ${inputs.branch}`);
    core.info(`Workflow: ${inputs.workflow}`);
    const octokit = github.getOctokit(inputs.token);
    const repository: string = process.env.GITHUB_REPOSITORY as string;
    const [owner, repo] = repository.split("/");

    const itemsPerPage = 100;
    let workflows = await octokit.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: inputs.workflow,
      branch: inputs.branch,
      status: "success",
      per_page: itemsPerPage,
    });
    const allWorkflows: typeof workflows.data.workflow_runs = [];
    for (let j = 0; j < workflows.data.workflow_runs.length; j++) {
      allWorkflows.push(workflows.data.workflow_runs[j]);
    }
    const numOfPages = Math.ceil(workflows.data.total_count / itemsPerPage);
    for (let i = 0; i < numOfPages - 1; i++) {
      workflows = await octokit.rest.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: inputs.workflow,
        branch: inputs.branch,
        status: "success",
        per_page: itemsPerPage,
        page: i + 2,
      });
      for (let j = 0; j < workflows.data.workflow_runs.length; j++) {
        allWorkflows.push(workflows.data.workflow_runs[j]);
      }
    }
    const lastSuccessCommitHash = allWorkflows[0].head_commit?.id ?? "";
    core.info(`Discovered last successfull commit: ${lastSuccessCommitHash}`);
    core.setOutput("commit_hash", lastSuccessCommitHash);
  } catch (e) {
    core.setFailed(e.message);
  }
}

run();
