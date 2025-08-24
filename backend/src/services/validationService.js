const { ethers } = require('ethers');

class ValidationService {
  isValidAddress(address) {
    try {
      ethers.getAddress(address);
      return true;
    } catch {
      return false;
    }
  }

  isValidAmount(amount) {
    return !isNaN(amount) && amount > 0;
  }

  validatePurchaseRequest(data) {
    const errors = [];
    
    if (!this.isValidAddress(data.userAddress)) {
      errors.push('Invalid user address');
    }
    
    if (!this.isValidAmount(data.amount)) {
      errors.push('Invalid amount');
    }
    
    return errors;
  }
}

module.exports = new ValidationService();