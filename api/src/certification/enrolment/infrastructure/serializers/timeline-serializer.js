import jsonapiSerializer from 'jsonapi-serializer';
const { Serializer } = jsonapiSerializer;

export const serialize = function (timeline) {
  return new Serializer('certification-candidate-timeline', {
    id: 'certificationCandidateId',
    attributes: ['events'],
  }).serialize(timeline);
};
