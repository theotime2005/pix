/**
 * @typedef {import ('../../../shared/domain/models/ComplementaryCertificationKeys.js').ComplementaryCertificationKeys} ComplementaryCertificationKeys
 * @typedef {import ('./index.js').ConsolidatedFrameworkRepository} ConsolidatedFrameworkRepository
 */

/**
 * @param {Object} params
 * @param {ComplementaryCertificationKeys} params.complementaryCertificationKey
 * @param {ConsolidatedFrameworkRepository} params.consolidatedFrameworkRepository
 */
export const getCurrentConsolidatedFramework = async ({
  complementaryCertificationKey,
  consolidatedFrameworkRepository,
  learningContentRepository,
}) => {
  const currentConsolidatedFramework =
    await consolidatedFrameworkRepository.getCurrentFrameworkByComplementaryCertificationKey({
      complementaryCertificationKey,
    });

  const frameworkAreas = await learningContentRepository.getConsolidatedFrameworkLearningContentByChallengeIds({
    challengeIds: currentConsolidatedFramework.challenges.map(({ challengeId }) => challengeId),
  });

  return { ...currentConsolidatedFramework, areas: frameworkAreas };
};
