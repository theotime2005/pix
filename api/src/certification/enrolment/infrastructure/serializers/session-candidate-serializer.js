import { Serializer } from 'jsonapi-serializer';

const serialize = function (enrolledCandidates) {
  return new Serializer('certification-candidate', {
    transform: function (enrolledCandidate) {
      const candidateSubscription = enrolledCandidate.findComplementarySubscriptionInfo();
      const complementaryCertification = candidateSubscription
        ? { id: candidateSubscription.complementaryCertificationId }
        : null;

      return {
        ...enrolledCandidate,
        complementaryCertification,
      };
    },
    attributes: ['firstName', 'lastName', 'birthdate', 'subscriptions'],
    subscriptions: {
      include: true,
      ref: 'id',
      attributes: ['complementaryCertificationId', 'type'],
    },
  }).serialize(enrolledCandidates);
};

export { serialize };
