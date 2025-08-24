const response = (success, data = null, message = '', meta = null) => {
  return {
    success,
    data,
    message,
    meta,
    timestamp: new Date().toISOString()
  };
};

module.exports = { response };