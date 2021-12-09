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

    const octokit = github.getOctokit(inputs.token);
    const repository: string = process.env.GITHUB_REPOSITORY as string;
    const [owner, repo] = repository.split("/");

    const workflows = await octokit.actions.listRepoWorkflows({ owner, repo });
    const workflowId = workflows.data.workflows.find(
      (w) => w.name === inputs.workflow
    )?.id;

    if (!workflowId) {
      core.setFailed(`No workflow exists with the name "${inputs.workflow}"`);
      return;
    } else {
      const foundWorkflow = await octokit.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflowId,
        status: "success",
        branch: inputs.branch
      });
      /*.then((res) => {
          const lastSuccessCommitHash =
            res.data.workflow_runs.length > 0
              ? res.data.workflow_runs[0].head_commit?.id
              : "";
          core.setOutput("commit_hash", lastSuccessCommitHash);
        })
        .catch((e) => {
          core.setFailed(e.message);
        });*/
      const lastSuccessCommitHash =
        foundWorkflow.data.workflow_runs.length > 0
          ? foundWorkflow.data.workflow_runs[0].head_commit?.id
          : "";
      core.info(`Discovered last successfull commit: ${lastSuccessCommitHash}`);
      core.setOutput("commit_hash", lastSuccessCommitHash);
    }
  } catch (e) {
    core.setFailed(e.message);
  }
}

run();
