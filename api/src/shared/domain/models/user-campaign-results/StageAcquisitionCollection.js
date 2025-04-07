class StageAcquisitionCollection {
  /**
   * @type {Stage[]}
   */
  #stages = [];

  /**
   * @type {Stage[]}
   */
  #acquiredStages = [];

  /**
   * @type {number}
   */
  #totalNumberOfStages;

  /**
   * @param {Stage[]} orderedStages
   * @param {StageAcquisition[]} stageAcquisitions
   */
  constructor(orderedStages, stageAcquisitions) {
    this.#totalNumberOfStages = orderedStages.length;
    this.#stages = orderedStages;
    this.#acquiredStages = orderedStages.filter(({ id }) => stageAcquisitions.find(({ stageId }) => stageId === id));
  }

  get stages() {
    return this.#stages;
  }

  /**
   * @returns {number}
   */
  get reachedStageNumber() {
    return this.#acquiredStages.length;
  }

  /**
   * @returns {number}
   */
  get totalNumberOfStages() {
    return this.#totalNumberOfStages;
  }

  /**
   * @returns {Stage}
   */
  get reachedStage() {
    return this.#acquiredStages[this.#acquiredStages.length - 1];
  }

  /**
   * @returns {boolean}
   */
  get hasStage() {
    return this.#totalNumberOfStages > 0;
  }
}

export { StageAcquisitionCollection };
