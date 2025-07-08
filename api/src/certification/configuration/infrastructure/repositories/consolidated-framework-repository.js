/**
 * @typedef {import ('../../../shared/domain/models/ComplementaryCertificationKeys.js').ComplementaryCertificationKeys} ComplementaryCertificationKeys
 */
import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { CertificationFrameworksChallenge } from '../../domain/models/CertificationFrameworksChallenge.js';
import { ConsolidatedFramework } from '../../domain/models/ConsolidatedFramework.js';

export async function create({ complementaryCertificationKey, challenges, version }) {
  const knexConn = DomainTransaction.getConnection();

  const challengesDTO = challenges.map((challenge) => ({
    complementaryCertificationKey,
    challengeId: challenge.id,
    version,
  }));

  await knexConn('certification-frameworks-challenges').insert(challengesDTO);
}

export async function getCurrentFrameworkByComplementaryCertificationKey({ complementaryCertificationKey }) {
  const knexConn = DomainTransaction.getConnection();

  const currentFrameworkChallengesDTO = await knexConn('certification-frameworks-challenges')
    .select('discriminant', 'difficulty', 'challengeId', 'version', 'calibrationId', 'complementaryCertificationKey')
    .where({
      version: knexConn('certification-frameworks-challenges').select('version').orderBy('version', 'desc').first(),
      complementaryCertificationKey,
    })
    .select('*');

  // add test
  if (currentFrameworkChallengesDTO.length === 0) {
    throw new NotFoundError(`There is no framework for complementary ${complementaryCertificationKey}`);
  }

  return _toDomain({ certificationFrameworksChallengesDTO: currentFrameworkChallengesDTO });
}

/**
 * @param {Object} params
 * @param {String} params.version
 * @param {ComplementaryCertificationKeys} params.complementaryCertificationKey
 * @returns {Promise<ConsolidatedFramework>}
 * @throws {NotFoundError}
 */
export async function getByVersionAndComplementaryKey({ version, complementaryCertificationKey }) {
  const knexConn = DomainTransaction.getConnection();

  const certificationFrameworksChallengesDTO = await knexConn('certification-frameworks-challenges')
    .select('discriminant', 'difficulty', 'challengeId', 'version', 'complementaryCertificationKey')
    .where({
      complementaryCertificationKey,
      version,
    })
    .orderBy('challengeId');

  if (certificationFrameworksChallengesDTO.length === 0) {
    throw new NotFoundError('Consolidated framework does not exist');
  }

  return _toDomain({ certificationFrameworksChallengesDTO });
}

/**
 * @param {ConsolidatedFramework} consolidatedFramework
 * @returns {Promise<void>}
 */
export async function save(consolidatedFramework) {
  const knexConn = DomainTransaction.getConnection();

  for (const { discriminant, difficulty, challengeId } of consolidatedFramework.challenges) {
    await knexConn('certification-frameworks-challenges')
      .update({
        discriminant,
        difficulty,
        calibrationId: consolidatedFramework.calibrationId,
      })
      .where({
        complementaryCertificationKey: consolidatedFramework.complementaryCertificationKey,
        version: consolidatedFramework.version,
        challengeId,
      });
  }
}

function _toDomain({ certificationFrameworksChallengesDTO }) {
  const { complementaryCertificationKey, version, calibrationId } = certificationFrameworksChallengesDTO[0];

  return new ConsolidatedFramework({
    complementaryCertificationKey,
    version,
    calibrationId,
    challenges: certificationFrameworksChallengesDTO.map(
      (challenge) => new CertificationFrameworksChallenge(challenge),
    ),
  });
}
