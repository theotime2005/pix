import dayjs from 'dayjs';

import { getNewAcquiredStages } from '../../../../evaluation/domain/services/stages/get-new-acquired-stages-service.js';
import {
  MAX_MASTERY_RATE,
  MINIMUM_DELAY_IN_DAYS_BEFORE_IMPROVING,
  MINIMUM_DELAY_IN_DAYS_BEFORE_RETRYING,
} from '../../constants.js';
import { CampaignParticipationStatuses, CampaignTypes } from '../../models/index.js';
import { BadgeResult } from './BadgeResult.js';
import { CompetenceResult } from './CompetenceResult.js';

class AssessmentResult {
  constructor({
    participationResults,
    isCampaignMultipleSendings,
    isOrganizationLearnerActive,
    isTargetProfileResetAllowed,
    isCampaignArchived,
    isCampaignDeleted,
    campaignType,
    competences,
    reachedStage,
    badgeResultsDTO,
    stages,
  }) {
    const { knowledgeElements, sharedAt, assessmentCreatedAt } = participationResults;

    this.id = participationResults.campaignParticipationId;
    this.isCompleted = participationResults.isCompleted;
    this.isShared = participationResults.status === CampaignParticipationStatuses.SHARED;
    this.participantExternalId = participationResults.participantExternalId;
    this.totalSkillsCount = competences.flatMap(({ targetedSkillIds }) => targetedSkillIds).length;
    this.testedSkillsCount = knowledgeElements.length;
    this.validatedSkillsCount = knowledgeElements.filter(({ isValidated }) => isValidated).length;
    this.masteryRate = this._computeMasteryRate(
      participationResults.masteryRate,
      this.isShared,
      this.totalSkillsCount,
      this.validatedSkillsCount,
    );

    this.competenceResults = competences.map(({ competence, area, targetedSkillIds }) => {
      const competenceKnowledgeElements = knowledgeElements.filter(({ skillId }) => targetedSkillIds.includes(skillId));
      const validatedSkillsCountForCompetence = competenceKnowledgeElements.filter(
        ({ isValidated }) => isValidated,
      ).length;
      const masteryPercentage = Math.round((validatedSkillsCountForCompetence / targetedSkillIds.length) * 100);
      let reachedStage;
      if (stages && stages.length > 0) {
        const acquiredStages = getNewAcquiredStages(stages, validatedSkillsCountForCompetence, masteryPercentage);
        reachedStage = acquiredStages.length;
      }

      return _buildCompetenceResult({
        competence,
        area,
        targetedSkillIds,
        competenceKnowledgeElements,
        reachedStage,
        masteryPercentage,
      });
    });

    this.badgeResults = badgeResultsDTO.map((badge) => new BadgeResult(badge, participationResults.acquiredBadgeIds));
    this.reachedStage = reachedStage;
    this.canImprove = this._computeCanImprove(knowledgeElements, assessmentCreatedAt, this.isShared, campaignType);
    this.isDisabled = this._computeIsDisabled(isCampaignArchived, isCampaignDeleted, participationResults.isDeleted);
    this.canRetry = this.#computeCanRetry({
      isCampaignMultipleSendings,
      sharedAt,
      isOrganizationLearnerActive,
      campaignType,
    });
    this.canRetrySoon = this.#computeCanRetrySoon({
      isCampaignMultipleSendings,
      isOrganizationLearnerActive,
      campaignType,
    });
    this.canReset = this._computeCanReset({
      isTargetProfileResetAllowed,
      isCampaignMultipleSendings,
      isOrganizationLearnerActive,
      isDisabled: this.isDisabled,
      sharedAt,
      isShared: this.isShared,
      campaignType,
    });
    this.sharedAt = sharedAt;
    this.remainingSecondsBeforeRetrying = this._computeRemaingSecondsBeforeRetrying();
  }

  _computeRemaingSecondsBeforeRetrying() {
    if (!this.sharedAt) {
      return null;
    }
    const remainingSecondsBeforeRetrying = dayjs(this.sharedAt)
      .add(MINIMUM_DELAY_IN_DAYS_BEFORE_RETRYING, 'days')
      .diff(Date.now(), 'seconds');

    if (remainingSecondsBeforeRetrying <= 0) {
      return null;
    }
    return remainingSecondsBeforeRetrying;
  }

  _computeMasteryRate(masteryRate, isShared, totalSkillsCount, validatedSkillsCount) {
    if (isShared) {
      return masteryRate;
    } else if (totalSkillsCount > 0) {
      const rate = (validatedSkillsCount / totalSkillsCount).toPrecision(2);
      return parseFloat(rate);
    } else {
      return 0;
    }
  }

  _computeCanImprove(knowledgeElements, assessmentCreatedAt, isShared, campaignType) {
    if (campaignType === CampaignTypes.EXAM) {
      return false;
    }
    const isImprovementPossible =
      knowledgeElements.filter((knowledgeElement) => {
        const isOldEnoughToBeImproved =
          dayjs(assessmentCreatedAt).diff(knowledgeElement.createdAt, 'days', true) >=
          MINIMUM_DELAY_IN_DAYS_BEFORE_IMPROVING;
        return knowledgeElement.isInvalidated && isOldEnoughToBeImproved;
      }).length > 0;
    return isImprovementPossible && !isShared;
  }

  #computeCanRetrySoon({ isCampaignMultipleSendings, isOrganizationLearnerActive, campaignType }) {
    return (
      isOrganizationLearnerActive &&
      !this.isDisabled &&
      isCampaignMultipleSendings &&
      this.isShared &&
      (this.masteryRate < MAX_MASTERY_RATE || campaignType === CampaignTypes.EXAM)
    );
  }

  #computeCanRetry({ isCampaignMultipleSendings, sharedAt, isOrganizationLearnerActive, campaignType }) {
    return (
      this.#computeCanRetrySoon({ isCampaignMultipleSendings, isOrganizationLearnerActive, campaignType }) &&
      this._timeBeforeRetryingPassed(sharedAt)
    );
  }

  _computeCanReset({
    campaignType,
    isTargetProfileResetAllowed,
    isOrganizationLearnerActive,
    isCampaignMultipleSendings,
    isDisabled,
    isShared,
    sharedAt,
  }) {
    if (campaignType !== CampaignTypes.ASSESSMENT) {
      return false;
    }

    return (
      isShared &&
      isTargetProfileResetAllowed &&
      isOrganizationLearnerActive &&
      isCampaignMultipleSendings &&
      !isDisabled &&
      this._timeBeforeRetryingPassed(sharedAt)
    );
  }

  _computeIsDisabled(isCampaignArchived, isCampaignDeleted, isParticipationDeleted) {
    return isCampaignArchived || isCampaignDeleted || isParticipationDeleted;
  }

  _timeBeforeRetryingPassed(sharedAt) {
    return sharedAt && dayjs().diff(sharedAt, 'days', true) >= MINIMUM_DELAY_IN_DAYS_BEFORE_RETRYING;
  }
}

function _buildCompetenceResult({
  competence,
  area,
  targetedSkillIds,
  competenceKnowledgeElements,
  reachedStage,
  masteryPercentage,
}) {
  return new CompetenceResult({
    competence,
    area,
    totalSkillsCount: targetedSkillIds.length,
    knowledgeElements: competenceKnowledgeElements,
    reachedStage,
    masteryPercentage,
  });
}

export { AssessmentResult };
