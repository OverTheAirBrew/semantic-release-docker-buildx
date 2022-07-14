import { expect } from 'chai';
import * as fs from 'fs';
import { Context } from 'semantic-release';
import * as sinon from 'sinon';
import { Docker } from '../src/lib/docker';
import { IPluginConfig } from '../src/lib/plugin-config';
import SemanticError = require('@semantic-release/error');

const baseConfig: IPluginConfig = {
  dockerImage: 'testing',
  platforms: ['linux', 'darwin'],
};

describe('docker', () => {
  let testContext: Context;

  let loggerLogSpy: sinon.SinonStub;
  let loggerErrorSpy: sinon.SinonStub;

  before(() => {
    loggerLogSpy = sinon.stub().returns(null);
    loggerErrorSpy = sinon.stub().returns(null);

    testContext = {
      logger: {
        log: loggerLogSpy,
        error: loggerErrorSpy,
      },
      env: {
        DOCKER_USERNAME: 'testing',
        DOCKER_PASSWORD: 'testing',
      },
    };
  });

  describe('checkDockerFileExists', () => {
    it("should error if the docker path doesn't exist", async () => {
      sinon.stub(fs, 'existsSync').returns(false);

      try {
        const docker = new Docker(baseConfig, testContext);
        await docker.checkDockerFileExists();
      } catch (err) {
        expect(err).to.be.instanceOf(SemanticError);
        expect(err.message).to.eq('Dockerfile not found');
      }
    });
  });
});
