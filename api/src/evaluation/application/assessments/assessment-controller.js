import { usecases as devcompUsecases } from '../../../devcomp/domain/usecases/index.js';
import { usecases } from '../../../prescription/campaign-participation/domain/usecases/index.js';
import { usecases as profileUsecases } from '../../../profile/domain/usecases/index.js';
import { usecases as questUsecases } from '../../../quest/domain/usecases/index.js';
import { config } from '../../../shared/config.js';
import { DomainTransaction } from '../../../shared/domain/DomainTransaction.js';
import * as llmChatSerializer from '../../../shared/infrastructure/serializers/llm-chat-serializer.js';
import { extractLocaleFromRequest } from '../../../shared/infrastructure/utils/request-response-utils.js';
import { evaluationUsecases } from '../../domain/usecases/index.js';

const completeAssessment = async function (request, h, dependencies = { profileUsecases, questUsecases }) {
  const assessmentId = request.params.id;
  const locale = extractLocaleFromRequest(request);

  await DomainTransaction.execute(async () => {
    const assessment = await evaluationUsecases.completeAssessment({ assessmentId, locale });
    const userId = assessment.userId;
    await evaluationUsecases.handleBadgeAcquisition({ assessment });
    await evaluationUsecases.handleStageAcquisition({ assessment });

    if (assessment.userId && config.featureToggles.isQuestEnabled) {
      await questUsecases.rewardUser({ userId: assessment.userId });
    }

    await devcompUsecases.handleTrainingRecommendation({ assessment, locale });

    await usecases.shareCampaignResult({
      userId,
      campaignParticipationId: assessment.campaignParticipationId,
    });

    const questResults = await dependencies.questUsecases.getQuestResultsForCampaignParticipation({
      userId,
      campaignParticipationId: assessment.campaignParticipationId,
    });

    const lastResult = questResults.at(-1);
    const profileRewardId = lastResult?.profileRewardId;

    if (profileRewardId) {
      await dependencies.profileUsecases.shareProfileReward({
        userId,
        profileRewardId,
        campaignParticipationId: assessment.campaignParticipationId,
      });
    }
  });

  return null;
};

const startEmbedLlmChat = async function (request, h, { usecases } = { usecases: evaluationUsecases }) {
  const { configId } = request.payload;
  const userId = request.auth.credentials.userId;
  const assessmentId = request.params.assessmentId;
  const startedChatDTO = await usecases.startEmbedLlmChat({ configId, userId, assessmentId });
  return h.response(llmChatSerializer.serialize(startedChatDTO)).code(201);
};

const promptToLLMChat = async function (request, h, { usecases } = { usecases: evaluationUsecases }) {
  const { assessmentId, chatId } = request.params;
  const { prompt } = request.payload;
  const userId = request.auth.credentials.userId;
  const llmResponse = await usecases.promptToLLMChat({ assessmentId, chatId, userId, prompt });
  return h.response(llmResponse).type('text/event-stream').code(201);
};

const assessmentController = {
  completeAssessment,
  promptToLLMChat,
  startEmbedLlmChat,
};

export { assessmentController };
