import omit from 'lodash/omit.js';

import { DomainTransaction } from '../../../shared/domain/DomainTransaction.js';
import { Feedback } from '../../domain/models/Feedback.js';

export const save = async function (feedback) {
  const dataToInsert = omit(feedback, ['id']);

  const trx = DomainTransaction.getConnection();

  const result = await trx('feedbacks').insert(dataToInsert).returning('*');

  return new Feedback(result[0]);
};
