import perf_hooks from 'node:perf_hooks';

import _ from 'lodash';

import * as eventBusBuilder from '../../../../lib/infrastructure/events/EventBusBuilder.js';
import { EventDispatcher } from '../../../../lib/infrastructure/events/EventDispatcher.js';
import { EventDispatcherLogger } from '../../../../lib/infrastructure/events/EventDispatcherLogger.js';
import * as complementaryCertificationCourseResultRepository from '../../../../lib/infrastructure/repositories/complementary-certification-course-result-repository.js';
import * as complementaryCertificationScoringCriteriaRepository from '../../../../lib/infrastructure/repositories/complementary-certification-scoring-criteria-repository.js';
import * as badgeAcquisitionRepository from '../../../../src/evaluation/infrastructure/repositories/badge-acquisition-repository.js';
import * as certificationAssessmentHistoryRepository from '../../../certification/evaluation/infrastructure/repositories/certification-assessment-history-repository.js';
import * as challengeCalibrationRepository from '../../../certification/evaluation/infrastructure/repositories/challenge-calibration-repository.js';
import * as flashAlgorithmService from '../../../certification/flash-certification/domain/services/algorithm-methods/flash.js';
import * as finalizedSessionRepository from '../../../certification/session-management/infrastructure/repositories/finalized-session-repository.js';
import * as juryCertificationSummaryRepository from '../../../certification/session-management/infrastructure/repositories/jury-certification-summary-repository.js';
import * as supervisorAccessRepository from '../../../certification/session-management/infrastructure/repositories/supervisor-access-repository.js';
import * as scoringCertificationService from '../../../certification/shared/domain/services/scoring-certification-service.js';
import * as certificationAssessmentRepository from '../../../certification/shared/infrastructure/repositories/certification-assessment-repository.js';
import * as certificationCenterRepository from '../../../certification/shared/infrastructure/repositories/certification-center-repository.js';
import * as certificationCourseRepository from '../../../certification/shared/infrastructure/repositories/certification-course-repository.js';
import * as certificationIssueReportRepository from '../../../certification/shared/infrastructure/repositories/certification-issue-report-repository.js';
import * as competenceMarkRepository from '../../../certification/shared/infrastructure/repositories/competence-mark-repository.js';
import * as complementaryCertificationBadgesRepository from '../../../certification/shared/infrastructure/repositories/complementary-certification-badge-repository.js';
import * as flashAlgorithmConfigurationRepository from '../../../certification/shared/infrastructure/repositories/flash-algorithm-configuration-repository.js';
import * as authenticationMethodRepository from '../../../identity-access-management/infrastructure/repositories/authentication-method.repository.js';
import * as userRepository from '../../../identity-access-management/infrastructure/repositories/user.repository.js';
import * as campaignRepository from '../../../prescription/campaign/infrastructure/repositories/campaign-repository.js';
import * as poleEmploiSendingRepository from '../../../prescription/campaign-participation/infrastructure/repositories/pole-emploi-sending-repository.js';
import * as targetProfileRepository from '../../../prescription/target-profile/infrastructure/repositories/target-profile-repository.js';
import { config } from '../../config.js';
import { monitoringTools as MonitoringTools } from '../../infrastructure/monitoring-tools.js';
import * as answerRepository from '../../infrastructure/repositories/answer-repository.js';
import * as assessmentRepository from '../../infrastructure/repositories/assessment-repository.js';
import * as assessmentResultRepository from '../../infrastructure/repositories/assessment-result-repository.js';
import * as challengeRepository from '../../infrastructure/repositories/challenge-repository.js';
import * as competenceRepository from '../../infrastructure/repositories/competence-repository.js';
import * as knowledgeElementRepository from '../../infrastructure/repositories/knowledge-element-repository.js';
import * as organizationRepository from '../../infrastructure/repositories/organization-repository.js';
import * as skillRepository from '../../infrastructure/repositories/skill-repository.js';
import { injectDefaults } from '../../infrastructure/utils/dependency-injection.js';
import { logger } from '../../infrastructure/utils/logger.js';

const { performance } = perf_hooks;

/**
 * @typedef {certificationAssessmentRepository} CertificationAssessmentRepository
 */
const dependencies = {
  answerRepository,
  assessmentRepository,
  assessmentResultRepository,
  authenticationMethodRepository,
  badgeAcquisitionRepository,
  campaignRepository,
  certificationAssessmentHistoryRepository,
  certificationAssessmentRepository,
  certificationCenterRepository,
  challengeCalibrationRepository,
  certificationCourseRepository,
  certificationIssueReportRepository,
  challengeRepository,
  competenceMarkRepository,
  competenceRepository,
  complementaryCertificationBadgesRepository,
  complementaryCertificationCourseResultRepository,
  complementaryCertificationScoringCriteriaRepository,
  finalizedSessionRepository,
  flashAlgorithmConfigurationRepository,
  flashAlgorithmService,
  juryCertificationSummaryRepository,
  knowledgeElementRepository,
  logger,
  organizationRepository,
  poleEmploiSendingRepository,
  scoringCertificationService,
  skillRepository,
  supervisorAccessRepository,
  targetProfileRepository,
  userRepository,
};

function buildEventDispatcher(handlersStubs) {
  const eventDispatcher = new EventDispatcher(new EventDispatcherLogger(MonitoringTools, config, performance));
  const handlersToBeInjected = {};

  const handlersNames = _.map(handlersToBeInjected, (handler) => handler.name);

  if (_.some(handlersNames, (name) => _.isEmpty(name))) {
    throw new Error('All handlers must have a name. Handlers : ' + handlersNames.join(', '));
  }
  if (_.uniq(handlersNames).length !== handlersNames.length) {
    throw new Error('All handlers must have a unique name. Handlers : ' + handlersNames.join(', '));
  }

  const handlers = { ...handlersToBeInjected, ...handlersStubs };

  for (const key in handlers) {
    const inject = _.partial(injectDefaults, dependencies);
    const injectedHandler = inject(handlers[key]);
    injectedHandler.handlerName = handlers[key].name;
    for (const eventType of handlersToBeInjected[key].eventTypes) {
      eventDispatcher.subscribe(eventType, injectedHandler);
    }
  }
  return eventDispatcher;
}

const eventDispatcher = buildEventDispatcher({});
const eventBus = eventBusBuilder.build();

export { eventBus, eventDispatcher };
