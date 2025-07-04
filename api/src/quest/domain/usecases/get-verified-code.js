import { NotFoundError } from '../../../shared/domain/errors.js';
import { VerifiedCode } from '../models/VerifiedCode.js';

export const getVerifiedCode = async ({ code, campaignRepository, questRepository }) => {
  try {
    const campaign = await campaignRepository.getByCode({ code });
    return new VerifiedCode({ code: campaign.code, courseTypes: [{ type: 'campaign' }] });
  } catch (error) {
    if ((!error) instanceof NotFoundError) {
      throw error;
    }
  }
  const quest = await questRepository.getByCode({ code });
  return new VerifiedCode({ code: quest.code, courseTypes: [{ type: 'combined-course' }] });
};
