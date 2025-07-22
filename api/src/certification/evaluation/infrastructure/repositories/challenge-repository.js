import { knex as datamartKnex } from '../../../../../datamart/knex-database-connection.js';
import { config } from '../../../../shared/config.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { Challenge } from '../../../../shared/domain/models/index.js';
import * as solutionAdapter from '../../../../shared/infrastructure/adapters/solution-adapter.js';
import { LearningContentRepository } from '../../../../shared/infrastructure/repositories/learning-content-repository.js';
import * as skillRepository from '../../../../shared/infrastructure/repositories/skill-repository.js';
import { child, SCOPES } from '../../../../shared/infrastructure/utils/logger.js';

const TABLE_NAME = 'learningcontent.challenges';

const logger = child('learningcontent:repository', { event: SCOPES.LEARNING_CONTENT });

const OBSOLETE_STATUS = 'périmé';
const VALIDATED_STATUS = 'validé';
const ARCHIVED_STATUS = 'archivé';
const OPERATIVE_STATUSES = [VALIDATED_STATUS, ARCHIVED_STATUS];

const PIX_CORE_DATAMART_SCOPE = 'COEUR';
const PIX_CORE_CHALLENGES_DATAMART_STATUS = 'VALIDATED';

export async function getMany(ids, locale) {
  const challengeDtos = await getInstance().loadMany(ids);
  challengeDtos.forEach((challengeDto, index) => {
    if (challengeDto) return;
    logger.warn({ challengeId: ids[index] }, 'Épreuve introuvable');
    throw new NotFoundError('Épreuve introuvable');
  });
  const localeChallengeDtos = locale
    ? challengeDtos.filter((challengeDto) => challengeDto.locales.includes(locale))
    : challengeDtos;
  localeChallengeDtos.sort(byId);
  const challengesDtosWithSkills = await loadChallengeDtosSkills(localeChallengeDtos);
  return challengesDtosWithSkills.map(([challengeDto, skill]) => toDomain({ challengeDto, skill }));
}

export async function findFlashCompatibleWithoutLocale({
  useObsoleteChallenges,
  fromArchivedCalibration = false,
} = {}) {
  if (fromArchivedCalibration) {
    return _findFlashCompatibleWithoutLocaleFromDatamart();
  }
  return _findFlashCompatibleWithoutLocaleFromLCMS({ useObsoleteChallenges });
}

async function _findFlashCompatibleWithoutLocaleFromLCMS({ useObsoleteChallenges } = {}) {
  const acceptedStatuses = useObsoleteChallenges ? [OBSOLETE_STATUS, ...OPERATIVE_STATUSES] : OPERATIVE_STATUSES;
  const cacheKey = `findFlashCompatibleByStatuses({ useObsoleteChallenges: ${Boolean(useObsoleteChallenges)} })`;
  const findFlashCompatibleByStatusesCallback = (knex) =>
    knex.whereIn('status', acceptedStatuses).whereNotNull('alpha').whereNotNull('delta').orderBy('id');
  const challengeDtos = await getInstance().find(cacheKey, findFlashCompatibleByStatusesCallback);
  const challengesDtosWithSkills = await loadChallengeDtosSkills(challengeDtos);
  return challengesDtosWithSkills.map(([challengeDto, skill]) => toDomain({ challengeDto, skill }));
}

async function _findFlashCompatibleWithoutLocaleFromDatamart() {
  const certificationCoreCalibration2024Id = config.v3Certification.certificationCoreCalibration2024Id;
  const datamartChallenges = await datamartKnex('data_active_calibrated_challenges')
    .join('data_calibrations', 'data_calibrations.id', certificationCoreCalibration2024Id)
    .where({ scope: PIX_CORE_DATAMART_SCOPE, status: PIX_CORE_CHALLENGES_DATAMART_STATUS });

  const challengesIds = datamartChallenges.map(({ challenge_id }) => challenge_id);
  const challengeDtos = await getInstance().getMany(challengesIds);

  const calibratedChallenges = datamartChallenges.map((datamartChallenge) => {
    const correspondingChallenge = challengeDtos.find(
      (challengeDto) => datamartChallenge.challenge_id === challengeDto.id,
    );

    correspondingChallenge.alpha = datamartChallenge.alpha;
    correspondingChallenge.delta = datamartChallenge.delta;

    return correspondingChallenge;
  });

  const challengesDtosWithSkills = await loadChallengeDtosSkills(calibratedChallenges);
  return challengesDtosWithSkills.map(([challengeDto, skill]) => toDomain({ challengeDto, skill }));
}

function byId(challenge1, challenge2) {
  return challenge1.id < challenge2.id ? -1 : 1;
}

function toDomain({ challengeDto, webComponentTagName, webComponentProps, skill, successProbabilityThreshold }) {
  const solution = solutionAdapter.fromDatasourceObject(challengeDto);
  const validator = Challenge.createValidatorForChallengeType({
    challengeType: challengeDto.type,
    solution,
  });

  if (OPERATIVE_STATUSES.includes(challengeDto.status) && !skill) {
    logger.warn({ challenge: challengeDto }, 'operative challenge has no skill');
  }

  return new Challenge({
    id: challengeDto.id,
    type: challengeDto.type,
    status: challengeDto.status,
    instruction: challengeDto.instruction,
    alternativeInstruction: challengeDto.alternativeInstruction,
    proposals: challengeDto.proposals,
    timer: challengeDto.timer,
    illustrationUrl: challengeDto.illustrationUrl,
    attachments: challengeDto.attachments ? [...challengeDto.attachments] : null,
    embedUrl: challengeDto.embedUrl,
    embedTitle: challengeDto.embedTitle,
    embedHeight: challengeDto.embedHeight,
    webComponentTagName,
    webComponentProps,
    skill,
    validator,
    competenceId: challengeDto.competenceId,
    illustrationAlt: challengeDto.illustrationAlt,
    format: challengeDto.format,
    locales: challengeDto.locales ? [...challengeDto.locales] : null,
    autoReply: challengeDto.autoReply,
    focused: challengeDto.focusable,
    discriminant: challengeDto.alpha,
    difficulty: challengeDto.delta,
    responsive: challengeDto.responsive,
    shuffled: challengeDto.shuffled,
    alternativeVersion: challengeDto.alternativeVersion,
    blindnessCompatibility: challengeDto.accessibility1,
    colorBlindnessCompatibility: challengeDto.accessibility2,
    successProbabilityThreshold,
    hasEmbedInternalValidation: challengeDto.hasEmbedInternalValidation,
    noValidationNeeded: challengeDto.noValidationNeeded,
  });
}

/** @type {LearningContentRepository} */
let instance;

function getInstance() {
  if (!instance) {
    instance = new LearningContentRepository({ tableName: TABLE_NAME });
  }
  return instance;
}

async function loadChallengeDtosSkills(challengeDtos) {
  return Promise.all(
    challengeDtos.map(async (challengeDto) => [
      challengeDto,
      challengeDto.skillId ? await skillRepository.get(challengeDto.skillId) : null,
    ]),
  );
}
