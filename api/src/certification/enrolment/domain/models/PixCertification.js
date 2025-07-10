export class PixCertification {
  constructor({ pixScore, status, isRejectedForFraud }) {
    /**
     * @param {Object} props
     * @param {number} props.pixScore
     * @param {string} props.status
     * @param {boolean} props.isRejectedForFraud
     *    */
    this.pixScore = pixScore;
    this.status = status;
    this.isRejectedForFraud = isRejectedForFraud;
  }
}
