import { BaseRepo } from "../types/repo.js";
import * as parse from '../util/parse.js';
import * as core from '@actions/core'

export function getRepoData(): BaseRepo {
    if(!process.env.GITHUB_REPOSITORY) {
        throw new Error("GITHUB_REPOSITORY is not defined");
    }

    if(!process.env.GITHUB_REF) {
        throw new Error("GITHUB_REF is not defined");
    }

    const branch = parse.removePrefix(process.env.GITHUB_REF, 'refs/heads/');

    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
    const url = process.env.GITHUB_SERVER_URL!

    console.log(`Using repo ${owner}/${repo} on branch ${branch} at ${url}`)
    return { owner, repo, branch, url };
}