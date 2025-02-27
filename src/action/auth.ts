import * as core from '@actions/core'
import crypto from 'crypto';
import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/core';
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';
import { OctokitApi } from '../types/auth.js';
import { BaseRepo, Repo } from '../types/repo.js';
import { request } from "@octokit/request"

export async function authGithubApp(inp: {baseRepoData: BaseRepo}): Promise<{octokit: OctokitApi, repoData: Repo}> {
    const { owner, repo, branch, url } = inp.baseRepoData;
    let apiUrl = core.getInput('url');
    if (apiUrl === 'auto') {
        apiUrl = url.replace('https://', 'https://api.');
    }

    const appId = core.getInput('appID', { required: true });
    const appPrivateKey = core.getInput('appPrivateKey', { required: true });
    const privateKey = crypto.createPrivateKey(appPrivateKey).export({type: 'pkcs8', format: 'pem'}).toString();

    const app = createAppAuth({
        appId: parseInt(appId),
        privateKey,
        request: request.defaults({
            baseUrl: apiUrl
        }),
    });

    const auth = await app({ type: 'app' });
    const RestOctokit = Octokit.plugin(restEndpointMethods);
    const appOctokit = new RestOctokit({ auth: auth.token, baseUrl: apiUrl });

    const installationID = await appOctokit.rest.apps.getRepoInstallation({ owner, repo }).then(response => response.data.id);
    const token = await appOctokit.rest.apps.createInstallationAccessToken({ installation_id: installationID }).then(response => response.data.token);

    const octokit = new RestOctokit({ auth: token, baseUrl: apiUrl });

    const defaultBranch = await octokit.rest.repos.get({ owner, repo }).then(response => response.data.default_branch);
    const lastCommit = core.getInput('lastCommit') === 'auto' ? process.env.GITHUB_SHA! : core.getInput('lastCommit');

    console.log(`Successfully authenticated as GitHub app`);
    return { octokit, repoData: { owner, repo, branch, defaultBranch, url, lastCommit } };
}