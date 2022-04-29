import {PullRequestConfig, ReleaseConfig} from '@angular/dev-infra-private/ng-dev';

/** Configuration for the `ng-dev release` command, defined here for use by the merge config. */
export const release: ReleaseConfig = {
  representativeNpmPackage: '@angular/language-server',
  npmPackages: [{name: '@angular/language-server'}],
  buildPackages: async () => [],
};


/**
 * Configuration for the merge tool in `ng-dev`. This sets up the labels which
 * are respected by the merge script (e.g. the target labels).
 */
export const merge: PullRequestConfig = {
  // By default, the merge script merges locally with `git cherry-pick` and autosquash.
  // This has the downside of pull requests showing up as `Closed` instead of `Merged`.
  // In the components repository, since we don't use fixup or squash commits, we can
  // use the Github API merge strategy. That way we ensure that PRs show up as `Merged`.
  githubApiMerge: {
    default: 'squash',
    labels: [
      {pattern: 'preserve commits', method: 'rebase'},
    ],
  },
  mergeReadyLabel: 'action: merge',
  commitMessageFixupLabel: 'commit message fixup'
};
