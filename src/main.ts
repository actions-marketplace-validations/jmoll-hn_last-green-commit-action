import * as core from '@actions/core'
import * as github from "@actions/github";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let repoShas: string[] | undefined;

/*const verifyCommit =  async (sha: string): Promise<boolean> => {
    if (!repoShas) {
        try {
            const cmd = `git log --format=format:%H`;
            core.info(`Getting list of SHAs in repo via command "${cmd}"`);

            const { stdout } = await execAsync(cmd);

            repoShas = stdout.trim().split('\n');
        } catch (e) {
            repoShas = [];
            core.warning(`Error while attempting to get list of SHAs: ${e.message}`);

            return false;
        }
    }

    core.info(`Looking for SHA ${sha} in repo SHAs`);

    return repoShas.includes(sha);
}*/

async function run(): Promise<void> {
    try {
        const inputs = {
            token: core.getInput("token"),
            //branch: core.getInput("branch"),
            workflow: core.getInput("workflow"),
            //verify: core.getInput('verify')
        };

        const octokit = github.getOctokit(inputs.token);
        const repository: string = process.env.GITHUB_REPOSITORY as string;
        const [owner, repo] = repository.split("/");

        const workflows = await octokit.actions.listRepoWorkflows({ owner, repo });
        const workflowId = workflows.data.workflows.find(w => w.name === inputs.workflow)?.id;

        if (!workflowId) {
            core.setFailed(`No workflow exists with the name "${inputs.workflow}"`);
            return;
        } else {
            core.info(`Discovered workflowId for search: ${workflowId}`);
            core.setOutput("workflow_id", workflowId);
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}

run();