module.exports = {
  branches: [
    'main',
    {
      name: 'master',
      prerelease: true,
    },
    {
      name: 'next',
      prerelease: true,
    },
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    [
      '@semantic-release/github',
      {
        assets: [{ path: './dist/**/*', label: 'Package' }],
      },
    ],
    '@semantic-release/git',
  ],
};
