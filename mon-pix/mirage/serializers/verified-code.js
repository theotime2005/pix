import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  links(verifiedCode) {
    return {
      campaign: {
        related: `/api/campaigns?filter[code]=${verifiedCode.id}`,
      },
    };
  },

  // Serializer JSON:API attend une fonction "relationships" pour gérer les relations
  relationships: ['courseTypes'],

  serialize(snapshot, options) {
    const json = this._super(snapshot, options);

    // Assure-toi que courseTypes est un tableau de références { id, type }
    if (snapshot.hasMany('courseTypes')) {
      const courseTypes = snapshot.hasMany('courseTypes');

      json.data.relationships = json.data.relationships || {};
      json.data.relationships.courseTypes = {
        data: courseTypes.map((rel) => ({
          id: rel.id,
          type: rel.modelName, // polymorphisme = type dynamique
        })),
      };
    }

    return json;
  },
});
