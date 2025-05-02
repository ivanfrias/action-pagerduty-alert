import { Octokit } from "@octokit/core";

export default async function queryGitHubWorkflowsStatus(
    owner,
    repo,
    workflowId,
    per_page,
    ghToken,
    branch
) {
    const octokit = new Octokit({ auth: ghToken });

    try {
        const response = await octokit.request("GET /repos/{owner}/{repo}/actions/workflows/{workflowId}/runs", {
            headers: {
                authorization: "token " + ghToken
            },
            owner,
            repo,
            workflowId,
            branch,
            per_page
        });

        return response.data.workflow_runs.map((run) =>
            ({ 
                id: run.id,
                status: run.status,
                conclusion: run.conclusion,
                created_at: run.created_at,
                updated_at: run.updated_at
            })
        );

    } catch (error) {
        throw new Error("Failed to query github due to " + error);
    }
}